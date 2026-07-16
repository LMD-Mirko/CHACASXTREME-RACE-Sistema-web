<template>
  <!-- Contenedor raíz del dashboard -->
  <div class="dashboard-root">
    
    <!-- Alerta Flotante Global (Pase de Lista) -->
    <Transition name="alert-slide">
      <div v-if="rollCallAlert" class="roll-call-toast-container">
        <div class="roll-call-toast" :class="{ 'roll-call-toast--sender': isRollCallSender }">
          <div class="toast-indicator" :class="{ 'toast-indicator--sender': isRollCallSender }"></div>
          <span class="material-icons toast-bell-icon" :class="{ 'toast-bell-icon--sender': isRollCallSender }">
            {{ isRollCallSender ? 'check_circle' : 'sensors' }}
          </span>
          <div class="toast-body-content">
            <span class="toast-header-lbl" :class="{ 'toast-header-lbl--sender': isRollCallSender }">
              {{ isRollCallSender ? 'Aviso Confirmado' : 'Largada en Preparación' }}
            </span>
            <p class="toast-message-txt">{{ rollCallAlert }}</p>
          </div>
          <button class="toast-close-btn" @click="rollCallAlert = ''">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Aviso ADMIN en móvil: menú reducido a gestión -->
    <div v-if="isAdmin && isMobile && showAdminMobileHint" class="admin-mobile-hint fade-in">
      <span class="material-icons">phone_android</span>
      <p>En el celular solo ves Competidores, Camarógrafos, Posición y Configuración. En laptop tienes el menú completo.</p>
      <button type="button" class="hint-dismiss" @click="showAdminMobileHint = false">OK</button>
    </div>

    <!-- Sidebar lateral (desktop) -->
    <AppSidebar
      v-if="!isMobile"
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
    />

    <!-- Columna principal: header + contenido -->
    <div class="dashboard-main" :class="{ 'dashboard-main--mobile': isMobile }">
      <AppHeader
        :show-hamburger="!isMobile"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />

      <main class="dashboard-content" :class="{ 'dashboard-content--mobile': isMobile }">
        <router-view />
      </main>

      <FloatingMobileMenu v-if="isMobile" />
    </div>
    
    <!-- Centro de Notificaciones en Tiempo Real Global -->
    <RealTimeNotificationCenter />

    <!-- Chat en caliente staff (WS privado) -->
    <StaffChatFab />
    <StaffChatPanel />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMediaQuery } from '@vueuse/core';
import { useAuth } from '../../login/hooks/useAuth';
import AppSidebar from '../components/AppSidebar.vue';
import AppHeader from '../components/AppHeader.vue';
import FloatingMobileMenu from '../components/FloatingMobileMenu.vue';
import StaffChatFab from '../components/StaffChatFab.vue';
import StaffChatPanel from '../components/StaffChatPanel.vue';
import RealTimeNotificationCenter from '../../../components/common/RealTimeNotificationCenter.vue';
import api from '../../../core/network/axios';
import { syncServerClock } from '../../../core/time/raceTime';
import { useStaffChat } from '../composables/useStaffChat';

const ADMIN_MOBILE_ALLOWED = ['competidores', 'checkpoint', 'camarografos', 'posicion', 'configuracion'];

const isSidebarOpen = ref(false);
const isMobile = useMediaQuery('(max-width: 1023px)');
const route = useRoute();
const router = useRouter();
const { currentUser, logout } = useAuth();
const { ensureStaffChatChannel } = useStaffChat();
const showAdminMobileHint = ref(true);

const rollCallAlert = ref('');
const isRollCallSender = ref(false);
let alertTimeout = null;
let mountainChannel = null;
let clockSyncInterval = null;

const isAdmin = computed(() => {
  return currentUser.value?.role?.toUpperCase() === 'ADMIN';
});

watch(
  [isMobile, isAdmin, () => route.name],
  ([mobile, admin, routeName]) => {
    if (!mobile || !admin || !routeName || routeName === 'dashboard') return;
    if (!ADMIN_MOBILE_ALLOWED.includes(routeName)) {
      router.replace('/dashboard/competidores');
    }
  },
  { immediate: true },
);

async function handleLogout() {
  await logout();
  window.location.reload();
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Note 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.15);

    // Note 2
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6
      gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.3);
    }, 120);
  } catch (e) {
    console.error('Error playing notification sound:', e);
  }
}

onMounted(() => {
  console.log('[DashboardView] Mounted. Current user:', currentUser.value);

  syncServerClock(api);
  clockSyncInterval = setInterval(() => syncServerClock(api), 5 * 60 * 1000);

  // Canal privado del chat (Bearer ya va en Echo)
  ensureStaffChatChannel();

  const onRollCallStarted = (ev) => {
    const e = ev.detail || {};
    const role = currentUser.value?.role?.toUpperCase();
    isRollCallSender.value = (role === 'PARTIDA');

    let cleanMsg = e.message
      ? e.message.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
      : '';
    cleanMsg = cleanMsg.trim().replace(/^📢\s*/, '');

    if (isRollCallSender.value) {
      rollCallAlert.value = 'Se notificó al personal en meta e intermedio.';
    } else {
      rollCallAlert.value = cleanMsg || 'Juez de Partida pasando lista. Prepárense en sus puestos.';
      playNotificationSound();
    }

    if (alertTimeout) clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      rollCallAlert.value = '';
    }, 15000);
  };

  window.addEventListener('roll-call-started', onRollCallStarted);
  mountainChannel = { off: () => window.removeEventListener('roll-call-started', onRollCallStarted) };
});

onBeforeUnmount(() => {
  if (alertTimeout) clearTimeout(alertTimeout);
  if (clockSyncInterval) clearInterval(clockSyncInterval);
  if (mountainChannel?.off) mountainChannel.off();
});
</script>

<style scoped>
/* === BASE: MÓVIL — layout de columna única === */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-background);
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

/* Margen adicional en móvil para evitar tapado por la barra flotante */
.dashboard-main--mobile {
  position: relative;
  width: 100%;
}

/* Área de contenido con scroll propio */
.dashboard-content {
  flex: 1;
  min-height: 0;
  padding: 20px 16px;
  overflow-y: auto;
}

.dashboard-content--mobile {
  padding-bottom: 96px; /* Espacio extra para el menú flotante bottom */
}

/* === Aviso ADMIN en móvil (no bloquea) === */
.admin-mobile-hint {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 94, 0, 0.12);
  border-bottom: 1px solid rgba(255, 94, 0, 0.35);
  color: var(--color-text-primary);
  font-size: 13px;
}

.admin-mobile-hint .material-icons {
  color: var(--color-primary);
  font-size: 20px;
}

.admin-mobile-hint p {
  flex: 1;
  margin: 0;
  line-height: 1.35;
}

.hint-dismiss {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-radius: 8px;
  padding: 4px 10px;
  font-weight: 700;
  cursor: pointer;
}

.user-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.btn-logout-blocker {
  height: 48px;
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font-size: 13.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout-blocker:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* === DESKTOP (min-width: 1024px): layout de dos columnas === */
@media (min-width: 1024px) {
  .dashboard-root {
    height: 100vh;
    overflow: hidden;
  }
  .dashboard-content {
    padding: 28px 32px;
  }
}

/* Alerta Flotante Global Minimalista y Profesional */
.roll-call-toast-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  width: 90%;
  max-width: 440px;
  pointer-events: none;
}

.roll-call-toast {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.4),
    0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.toast-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #FF5E00; /* Naranja Chacas oficial */
  box-shadow: 0 0 8px rgba(255, 94, 0, 0.5);
}

.toast-bell-icon {
  color: #FF5E00;
  font-size: 24px;
  animation: beacon-ping 1.5s infinite alternate ease-in-out;
}

.toast-body-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  text-align: left;
}

.toast-header-lbl {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: #FF5E00;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.toast-message-txt {
  font-size: 13.5px;
  font-weight: 600;
  color: #E2E8F0;
  line-height: 1.4;
  margin: 0;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.toast-close-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #FFFFFF;
}

/* Estilos para el emisor de la alerta (Partida) */
.roll-call-toast--sender {
  border-color: rgba(16, 185, 129, 0.2) !important;
}

.toast-indicator--sender {
  background: #10B981 !important;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5) !important;
}

.toast-bell-icon--sender {
  color: #10B981 !important;
  animation: none !important;
}

.toast-header-lbl--sender {
  color: #10B981 !important;
}

/* Transiciones */
.alert-slide-enter-active {
  animation: slide-in-top 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.alert-slide-leave-active {
  animation: slide-out-top 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slide-in-top {
  from {
    transform: translateY(-40px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes slide-out-top {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
}

@keyframes beacon-ping {
  from { transform: scale(0.95); opacity: 0.8; }
  to { transform: scale(1.05); opacity: 1; }
}
</style>


