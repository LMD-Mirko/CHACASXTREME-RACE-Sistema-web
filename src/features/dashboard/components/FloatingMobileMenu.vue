<template>
  <div
    class="floating-menu-container"
    :class="{ 'floating-menu-container--hidden': isKeyboardOpen }"
  >
    <nav class="floating-menu-bar">
      <template v-for="item in menuItems" :key="item.name">
        <button
          v-if="item.action === 'chat'"
          type="button"
          class="menu-item"
          :class="{ 'menu-item--active': panelOpen }"
          @click="togglePanel"
        >
          <span class="material-icons menu-icon">forum</span>
          <span class="menu-label">{{ item.label }}</span>
          <span v-if="hasUnread && !panelOpen" class="chat-badge">
            {{ unreadLabel }}
          </span>
        </button>

        <router-link
          v-else-if="!item.disabled"
          :to="item.path"
          class="menu-item"
          active-class="menu-item--active"
        >
          <span class="material-icons menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </router-link>

        <button
          v-else
          type="button"
          class="menu-item menu-item--disabled"
          @click="showComingSoonAlert(item.label)"
        >
          <span class="material-icons menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
          <span class="soon-badge">Soon</span>
        </button>
      </template>
    </nav>

    <Transition name="fade">
      <div v-if="toastMessage" class="toast-overlay">
        <div class="toast-box">
          <span class="material-icons toast-icon">hourglass_empty</span>
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuth } from '../../login/hooks/useAuth';
import { useStaffChat } from '../composables/useStaffChat';

const { currentUser } = useAuth();
const { unreadLabel, hasUnread, panelOpen, togglePanel } = useStaffChat();
const toastMessage = ref('');
const isKeyboardOpen = ref(false);
let toastTimeout = null;
let initialHeight = window.innerHeight;

function handleFocusIn(e) {
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    if (target.closest?.('.staff-chat-panel')) return;
    isKeyboardOpen.value = true;
  }
}

function handleFocusOut() {
  setTimeout(() => {
    const activeEl = document.activeElement;
    if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')) {
      isKeyboardOpen.value = false;
    }
  }, 100);
}

function handleResize() {
  if (window.innerHeight < initialHeight - 120) {
    if (document.activeElement?.closest?.('.staff-chat-panel')) {
      isKeyboardOpen.value = false;
      return;
    }
    isKeyboardOpen.value = true;
  } else if (
    document.activeElement?.tagName !== 'INPUT'
    && document.activeElement?.tagName !== 'TEXTAREA'
  ) {
    isKeyboardOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener('focusin', handleFocusIn);
  window.addEventListener('focusout', handleFocusOut);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('focusin', handleFocusIn);
  window.removeEventListener('focusout', handleFocusOut);
  window.removeEventListener('resize', handleResize);
  if (toastTimeout) clearTimeout(toastTimeout);
});

const role = computed(() => currentUser.value?.role?.toUpperCase() || '');

const menuItems = computed(() => {
  const chat = { name: 'chat', action: 'chat', icon: 'forum', label: 'Chat' };
  const allItems = {
    partida: { name: 'partida', path: '/dashboard/partida', icon: 'flag', label: 'Partida' },
    categorias: { name: 'categorias', path: '/dashboard/categorias-explorer', icon: 'grid_view', label: 'Categorías' },
    competidores: { name: 'competidores', path: '/dashboard/competidores', icon: 'group', label: 'Corredores' },
    camarografos: { name: 'camarografos', path: '/dashboard/camarografos', icon: 'photo_camera', label: 'Cámaras' },
    posicion: { name: 'posicion', path: '/dashboard/posicion', icon: 'sports_score', label: 'Posición' },
    configuracion: { name: 'configuracion', path: '/dashboard/configuracion', icon: 'settings', label: 'Config' },
    checkpoint: { name: 'checkpoint', path: '/dashboard/checkpoint', icon: 'location_on', label: 'Checkpoint' },
    meta: { name: 'meta', path: '/dashboard/meta', icon: 'emoji_events', label: 'Meta' },
    confirmacion: { name: 'confirmacion', path: '/dashboard/confirmacion', icon: 'assignment_turned_in', label: 'Confirmar' },
  };

  if (role.value === 'PARTIDA') {
    return [allItems.partida, allItems.categorias, allItems.competidores, chat, allItems.posicion];
  }
  if (role.value === 'INTERMEDIO') {
    return [allItems.checkpoint, allItems.categorias, allItems.competidores, chat, allItems.posicion];
  }
  if (role.value === 'META') {
    return [allItems.meta, allItems.confirmacion, allItems.categorias, chat, allItems.posicion];
  }
  if (role.value === 'ADMIN') {
    return [
      allItems.competidores,
      allItems.checkpoint,
      chat,
      allItems.posicion,
      allItems.configuracion,
    ];
  }

  return [
    allItems.competidores,
    chat,
    allItems.posicion,
    allItems.configuracion,
  ];
});

function showComingSoonAlert(label) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessage.value = `¡Módulo de ${label} próximamente en desarrollo!`;
  toastTimeout = setTimeout(() => {
    toastMessage.value = '';
  }, 2500);
}
</script>

<style scoped>
.floating-menu-container {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: min(90%, calc(100% - 24px));
  max-width: 480px;
  z-index: 999;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
  box-sizing: border-box;
}

.floating-menu-container--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 100px) scale(0.95);
}

.floating-menu-bar {
  pointer-events: auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--color-floating-menu-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-floating-menu-border);
  border-radius: 24px;
  padding: 10px 10px;
  box-shadow: var(--color-floating-menu-shadow);
}

.menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 10px;
  padding: 8px 0;
  cursor: pointer;
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;
}

.menu-icon {
  font-size: 22px;
  transition: transform 0.2s ease, color 0.2s ease;
}

.menu-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.menu-item:hover:not(.menu-item--disabled) {
  color: var(--color-primary);
}

.menu-item:active:not(.menu-item--disabled) .menu-icon {
  transform: scale(0.85);
}

.menu-item--active {
  color: var(--color-primary) !important;
}

.menu-item--active .menu-icon {
  transform: translateY(-2px) scale(1.1);
  text-shadow: 0 2px 10px rgba(255, 94, 0, 0.2);
}

.menu-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-badge {
  position: absolute;
  top: 2px;
  right: 50%;
  transform: translateX(110%);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #e11d48;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  display: grid;
  place-items: center;
  line-height: 1;
  animation: chat-badge-pop 0.35s ease;
}

@keyframes chat-badge-pop {
  from {
    transform: translateX(110%) scale(0.4);
    opacity: 0;
  }
  to {
    transform: translateX(110%) scale(1);
    opacity: 1;
  }
}

.soon-badge {
  position: absolute;
  top: 2px;
  right: 50%;
  transform: translateX(110%);
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 7px;
  font-weight: 900;
  padding: 1px 4px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.toast-overlay {
  position: fixed;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  left: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  justify-content: center;
  pointer-events: none;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.toast-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-text-primary);
  color: var(--color-background);
  padding: 10px 16px;
  border-radius: 14px;
  box-shadow: var(--shadow-premium);
  max-width: 100%;
  width: fit-content;
  white-space: normal;
  word-break: break-word;
  pointer-events: auto;
}

.toast-icon {
  font-size: 18px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.toast-text {
  font-size: 12px;
  font-weight: 700;
}

@keyframes slideUp {
  from {
    transform: translateY(15px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
