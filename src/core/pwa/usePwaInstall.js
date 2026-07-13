import { computed, onMounted, onUnmounted, ref } from 'vue'

const DISMISS_KEY = 'pwa_install_dismissed_at'
const DISMISS_MS = 1000 * 60 * 60 * 12 // 12h — staff lo vuelve a ver si no instaló

const isStandalone = ref(false)
const deferredPrompt = ref(null)
const canNativeInstall = ref(false)
const isIos = ref(false)
const isIosSafari = ref(false)
const isAndroid = ref(false)
const dismissed = ref(false)

function detectStandalone() {
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = window.navigator.standalone === true
  const androidTwa = document.referrer.startsWith('android-app://')
  return displayStandalone || iosStandalone || androidTwa
}

function detectIos() {
  const ua = navigator.userAgent || ''
  const classic = /iPad|iPhone|iPod/.test(ua)
  const ipadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return classic || ipadOs
}

function detectIosSafari() {
  if (!detectIos()) return false
  const ua = navigator.userAgent || ''
  // Chrome / Firefox / Edge / Opera en iOS no permiten “Agregar a inicio” como Safari
  const foreign = /CriOS|FxiOS|OPiOS|EdgiOS|DuckDuckGo|mercury/i.test(ua)
  return !foreign
}

function detectAndroid() {
  return /Android/i.test(navigator.userAgent || '')
}

function readDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const ts = Number(raw)
  if (Number.isNaN(ts)) return false
  return Date.now() - ts < DISMISS_MS
}

function syncDetection() {
  isStandalone.value = detectStandalone()
  isIos.value = detectIos()
  isIosSafari.value = detectIosSafari()
  isAndroid.value = detectAndroid()
  dismissed.value = readDismissed()
}

// Estado inicial sin esperar al mount (evita flash del banner)
if (typeof window !== 'undefined') {
  syncDetection()
}

function onBeforeInstallPrompt(event) {
  event.preventDefault()
  deferredPrompt.value = event
  canNativeInstall.value = true
}

function onAppInstalled() {
  deferredPrompt.value = null
  canNativeInstall.value = false
  isStandalone.value = true
  localStorage.removeItem(DISMISS_KEY)
}

/**
 * Detecta si el staff está en PWA o navegador y expone el flujo de instalación.
 * iOS: guía Share → Agregar a pantalla de inicio (Safari).
 * Android/Chrome: botón nativo vía beforeinstallprompt.
 */
export function usePwaInstall() {
  const needsInstall = computed(() => !isStandalone.value)

  const shouldShowPrompt = computed(() => {
    if (isStandalone.value || dismissed.value) return false
    // Solo en móvil / tablet táctil — no molestar en desktop de oficina
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const narrow = window.matchMedia('(max-width: 1024px)').matches
    return coarse || narrow || isIos.value || isAndroid.value
  })

  const platform = computed(() => {
    if (isIos.value) return 'ios'
    if (isAndroid.value || canNativeInstall.value) return 'android'
    return 'other'
  })

  function dismiss() {
    dismissed.value = true
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  async function promptNativeInstall() {
    if (!deferredPrompt.value) return false
    const promptEvent = deferredPrompt.value
    deferredPrompt.value = null
    canNativeInstall.value = false
    promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === 'accepted') {
      isStandalone.value = true
      localStorage.removeItem(DISMISS_KEY)
      return true
    }
    return false
  }

  function refresh() {
    syncDetection()
  }

  onMounted(() => {
    refresh()
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  })

  return {
    isStandalone,
    needsInstall,
    shouldShowPrompt,
    platform,
    isIos,
    isIosSafari,
    isAndroid,
    canNativeInstall,
    dismiss,
    promptNativeInstall,
    refresh,
  }
}
