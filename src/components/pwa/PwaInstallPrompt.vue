<template>
  <!-- Banner inferior: visible si no está instalada -->
  <Teleport to="body">
    <Transition name="pwa-slide">
      <div
        v-if="shouldShowPrompt && !guideOpen"
        class="pwa-banner"
        :class="{ 'pwa-banner--above-dock': aboveMobileDock }"
        role="dialog"
        aria-label="Instalar aplicación"
      >
        <div class="pwa-banner__icon" aria-hidden="true">
          <span class="material-icons">install_mobile</span>
        </div>
        <div class="pwa-banner__text">
          <strong>Instala la app</strong>
          <span>Mejor en pantalla completa para el día de carrera</span>
        </div>
        <button type="button" class="pwa-banner__cta" @click="openGuide">
          {{ platform === 'android' && canNativeInstall ? 'Instalar' : 'Cómo' }}
        </button>
        <button
          type="button"
          class="pwa-banner__close"
          aria-label="Cerrar"
          @click="dismiss"
        >
          <span class="material-icons">close</span>
        </button>
      </div>
    </Transition>
  </Teleport>

  <!-- Guía completa (iOS es el foco) -->
  <AppModal
    :is-open="guideOpen"
    title="Instalar Chacas Xtreme"
    max-width="420px"
    @close="guideOpen = false"
  >
    <!-- iOS: no está en Safari -->
    <div v-if="platform === 'ios' && !isIosSafari" class="pwa-guide">
      <div class="pwa-guide__alert">
        <span class="material-icons">warning_amber</span>
        <div>
          <strong>Abre esta página en Safari</strong>
          <p>
            En iPhone/iPad solo Safari puede agregar la app a la pantalla de inicio.
            Chrome u otros navegadores no lo permiten.
          </p>
        </div>
      </div>
      <ol class="pwa-guide__steps">
        <li>
          <span class="step-num">1</span>
          <div>
            <strong>Toca el menú</strong>
            <p>Los tres puntos o el ícono de compartir del navegador actual.</p>
          </div>
        </li>
        <li>
          <span class="step-num">2</span>
          <div>
            <strong>Elige “Abrir en Safari”</strong>
            <p>Si no aparece, copia el link y pégalo en Safari.</p>
          </div>
        </li>
        <li>
          <span class="step-num">3</span>
          <div>
            <strong>Vuelve aquí en Safari</strong>
            <p>Te mostraremos los pasos finales para instalar.</p>
          </div>
        </li>
      </ol>
    </div>

    <!-- iOS Safari: pasos reales -->
    <div v-else-if="platform === 'ios'" class="pwa-guide">
      <p class="pwa-guide__lead">
        En 3 toques queda como app. Así el staff la abre sin barra del navegador.
      </p>

      <ol class="pwa-guide__steps pwa-guide__steps--ios">
        <li>
          <span class="step-num">1</span>
          <div class="step-body">
            <strong>Toca Compartir</strong>
            <p>El ícono de abajo en Safari (cuadrado con flecha hacia arriba).</p>
            <div class="ios-share-demo" aria-hidden="true">
              <svg class="ios-share-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v11M8 7l4-4 4 4"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </svg>
              <span>Compartir</span>
            </div>
          </div>
        </li>
        <li>
          <span class="step-num">2</span>
          <div class="step-body">
            <strong>Desliza y elige</strong>
            <p>
              Baja en el menú hasta
              <em>“Agregar a pantalla de inicio”</em>
              (o “Add to Home Screen”).
            </p>
            <div class="ios-menu-chip" aria-hidden="true">
              <span class="material-icons">add_box</span>
              Agregar a pantalla de inicio
            </div>
          </div>
        </li>
        <li>
          <span class="step-num">3</span>
          <div class="step-body">
            <strong>Confirma “Agregar”</strong>
            <p>
              Aparecerá el ícono
              <em>ChacasXtreme</em>
              en tu inicio. Ábrelo desde ahí.
            </p>
          </div>
        </li>
      </ol>
    </div>

    <!-- Android con prompt nativo -->
    <div v-else-if="platform === 'android' && canNativeInstall" class="pwa-guide">
      <p class="pwa-guide__lead">
        Un toque y queda instalada en tu teléfono, como cualquier app.
      </p>
      <AppButton variant="primary" icon="download" @click="onAndroidInstall">
        Instalar ahora
      </AppButton>
    </div>

    <!-- Android / otros sin prompt: guía manual -->
    <div v-else class="pwa-guide">
      <p class="pwa-guide__lead">
        Agrega esta web a la pantalla de inicio para usarla como app.
      </p>
      <ol class="pwa-guide__steps">
        <li>
          <span class="step-num">1</span>
          <div>
            <strong>Menú del navegador</strong>
            <p>Toca los tres puntos (⋮) arriba a la derecha.</p>
          </div>
        </li>
        <li>
          <span class="step-num">2</span>
          <div>
            <strong>“Instalar app” o “Agregar a inicio”</strong>
            <p>El texto puede variar según Chrome / Samsung Internet.</p>
          </div>
        </li>
        <li>
          <span class="step-num">3</span>
          <div>
            <strong>Confirma</strong>
            <p>Abre el ícono desde la pantalla de inicio.</p>
          </div>
        </li>
      </ol>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="guideOpen = false">Entendido</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { usePwaInstall } from '../../core/pwa/usePwaInstall'

const AUTO_KEY = 'pwa_ios_guide_shown'
const route = useRoute()
const isMobile = useMediaQuery('(max-width: 1023px)')

const {
  shouldShowPrompt,
  platform,
  isIos,
  isIosSafari,
  canNativeInstall,
  dismiss,
  promptNativeInstall,
} = usePwaInstall()

/** En dashboard móvil el banner no debe tapar el menú flotante */
const aboveMobileDock = computed(
  () => isMobile.value && String(route.path || '').startsWith('/dashboard')
)

const guideOpen = ref(false)

function openGuide() {
  // Android con prompt nativo: instalar directo desde el banner
  if (platform.value === 'android' && canNativeInstall.value) {
    onAndroidInstall()
    return
  }
  guideOpen.value = true
}

async function onAndroidInstall() {
  const ok = await promptNativeInstall()
  if (!ok) guideOpen.value = true
  else guideOpen.value = false
}

onMounted(() => {
  // iOS: abrir la guía una vez sola al entrar (sin enseñar a mano)
  if (!shouldShowPrompt.value || !isIos.value) return
  if (sessionStorage.getItem(AUTO_KEY)) return
  sessionStorage.setItem(AUTO_KEY, '1')
  setTimeout(() => {
    if (shouldShowPrompt.value) guideOpen.value = true
  }, 900)
})
</script>

<style scoped>
.pwa-banner {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-premium), 0 12px 40px rgba(0, 0, 0, 0.35);
  color: var(--color-text-primary);
}

.pwa-banner--above-dock {
  bottom: var(--mobile-dock-clearance);
}

.pwa-banner__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 94, 0, 0.15);
  color: var(--color-primary);
}

.pwa-banner__icon .material-icons {
  font-size: 22px;
}

.pwa-banner__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pwa-banner__text strong {
  font-size: 14px;
  font-family: var(--font-headings);
  line-height: 1.2;
}

.pwa-banner__text span {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.pwa-banner__cta {
  flex-shrink: 0;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  min-height: 40px;
  font-weight: 700;
  font-size: 13px;
  font-family: var(--font-family);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  touch-action: manipulation;
}

.pwa-banner__close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.pwa-banner__close .material-icons {
  font-size: 20px;
}

.pwa-guide {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.pwa-guide__lead {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.pwa-guide__alert {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: var(--color-text-primary);
}

.pwa-guide__alert .material-icons {
  color: var(--color-secondary);
  flex-shrink: 0;
}

.pwa-guide__alert strong {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.pwa-guide__alert p {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0;
}

.pwa-guide__steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
}

.pwa-guide__steps li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  background: var(--color-primary);
  color: #fff;
}

.step-body,
.pwa-guide__steps li > div:not(.step-num) {
  flex: 1;
  min-width: 0;
}

.pwa-guide__steps strong {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
  font-family: var(--font-headings);
}

.pwa-guide__steps p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.pwa-guide__steps em {
  font-style: normal;
  color: var(--color-primary);
  font-weight: 600;
}

.ios-share-demo {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 13px;
}

.ios-share-icon {
  width: 22px;
  height: 22px;
}

.ios-menu-chip {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.ios-menu-chip .material-icons {
  font-size: 20px;
  color: var(--color-primary);
}

.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.pwa-slide-enter-from,
.pwa-slide-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

@media (min-width: 1024px) {
  .pwa-banner {
    left: auto;
    right: 24px;
    bottom: 24px;
    max-width: 420px;
  }
}
</style>
