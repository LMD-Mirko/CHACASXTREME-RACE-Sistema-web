<template>
  <div 
    class="floating-menu-container"
    :class="{ 'floating-menu-container--hidden': isKeyboardOpen }"
  >
    <nav class="floating-menu-bar">
      <template v-for="item in menuItems" :key="item.name">
        <!-- Item Normal -->
        <router-link
          v-if="!item.disabled"
          :to="item.path"
          class="menu-item"
          active-class="menu-item--active"
        >
          <span class="material-icons menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </router-link>

        <!-- Item Deshabilitado / Próximamente -->
        <button
          v-else
          @click="showComingSoonAlert(item.label)"
          class="menu-item menu-item--disabled"
          type="button"
        >
          <span class="material-icons menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
          <span class="soon-badge">Soon</span>
        </button>
      </template>
    </nav>

    <!-- Modal/Toast flotante de Próximamente -->
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

const { currentUser } = useAuth();
const toastMessage = ref('');
const isKeyboardOpen = ref(false);
let toastTimeout = null;
let initialHeight = window.innerHeight;

// Detectar teclado abierto mediante foco en inputs
function handleFocusIn(e) {
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    isKeyboardOpen.value = true;
  }
}

function handleFocusOut() {
  // Pequeño timeout para evitar rebotes visuales rápidos
  setTimeout(() => {
    const activeEl = document.activeElement;
    if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')) {
      isKeyboardOpen.value = false;
    }
  }, 100);
}

// Respaldo para detectar si el viewport cambia de tamaño (característico de Android al abrir teclado)
function handleResize() {
  if (window.innerHeight < initialHeight - 120) {
    isKeyboardOpen.value = true;
  } else {
    // Si regresa a tamaño completo
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      isKeyboardOpen.value = false;
    }
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
  const allItems = {
    partida: { name: 'partida', path: '/dashboard/partida', icon: 'flag', label: 'Partida' },
    categorias: { name: 'categorias', path: '/dashboard/categorias-explorer', icon: 'grid_view', label: 'Categorías' },
    competidores: { name: 'competidores', path: '/dashboard/competidores', icon: 'group', label: 'Corredores' },
    camarografos: { name: 'camarografos', path: '/dashboard/camarografos', icon: 'photo_camera', label: 'Cámaras' },
    posicion: { name: 'posicion', path: '/dashboard/posicion', icon: 'sports_score', label: 'Posición' },
    configuracion: { name: 'configuracion', path: '/dashboard/configuracion', icon: 'settings', label: 'Config' },
    checkpoint: { name: 'checkpoint', path: '/dashboard/checkpoint', icon: 'location_on', label: 'Checkpoint' },
    meta: { name: 'meta', path: '/dashboard/meta', icon: 'emoji_events', label: 'Meta' },
    confirmacion: { name: 'confirmacion', path: '/dashboard/confirmacion', icon: 'assignment_turned_in', label: 'Confirmar' }
  };

  if (role.value === 'PARTIDA') {
    return [allItems.partida, allItems.categorias, allItems.competidores, allItems.posicion];
  } else if (role.value === 'INTERMEDIO') {
    return [allItems.checkpoint, allItems.categorias, allItems.competidores, allItems.posicion];
  } else if (role.value === 'META') {
    return [allItems.meta, allItems.confirmacion, allItems.categorias, allItems.posicion];
  } else if (role.value === 'ADMIN') {
    // Teléfono: gestión + checkpoint (para probar mesa Intermedio). Laptop: sidebar completo.
    return [
      allItems.competidores,
      allItems.checkpoint,
      allItems.camarografos,
      allItems.posicion,
      allItems.configuracion,
    ];
  }

  return [
    allItems.competidores,
    allItems.camarografos,
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
/* Contenedor flotante en la parte inferior */
.floating-menu-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 420px;
  z-index: 999;
  pointer-events: none; /* Deja pasar clicks fuera del menú */
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

/* Ocultar el menú deslizándose hacia abajo cuando el teclado está abierto */
.floating-menu-container--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 100px) scale(0.95);
}

/* Barra con efecto glassmorphic ultra premium */
.floating-menu-bar {
  pointer-events: auto; /* Habilita clicks dentro de la barra */
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--color-floating-menu-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-floating-menu-border);
  border-radius: 24px;
  padding: 10px 14px;
  box-shadow: var(--color-floating-menu-shadow);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Botones / Enlaces del menú */
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
  transition: color 0.2s ease;
}

/* Hover e interacciones */
.menu-item:hover:not(.menu-item--disabled) {
  color: var(--color-primary);
}

.menu-item:active:not(.menu-item--disabled) .menu-icon {
  transform: scale(0.85);
}

/* Estado Activo (Ruta actual) */
.menu-item--active {
  color: var(--color-primary) !important;
}

.menu-item--active .menu-icon {
  transform: translateY(-2px) scale(1.1);
  text-shadow: 0 2px 10px rgba(255, 94, 0, 0.2);
}

/* Item deshabilitado */
.menu-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  box-shadow: 0 2px 4px rgba(255, 94, 0, 0.2);
}

/* Toast/Alerts */
.toast-overlay {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
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
  white-space: nowrap;
}

.toast-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.toast-text {
  font-size: 12px;
  font-weight: 700;
}

/* Keyframes */
@keyframes slideUp {
  from {
    transform: translate(-50%, 15px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
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
