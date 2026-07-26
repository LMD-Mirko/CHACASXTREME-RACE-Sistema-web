<template>
  <div class="avatar-container" v-if="currentUser">
    <!-- Círculo de avatar -->
    <div
      class="avatar-circle"
      :style="{ background: roleColor }"
      @click="toggleDropdown"
      :title="currentUser.name"
    >
      {{ userInitials }}
    </div>

    <!-- Menú desplegable interactivo -->
    <Transition name="slide-fade">
      <div v-if="isDropdownOpen" class="dropdown-menu">
        <div class="dropdown-header">
          <span class="user-name">{{ currentUser.name }}</span>
          <span class="user-email">{{ currentUser.email || currentUser.username }}</span>
        </div>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item logout-btn" @click="handleLogout">
          <span class="material-icons">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../../login/hooks/useAuth';

const router = useRouter();
const { currentUser, logout } = useAuth();
const isDropdownOpen = ref(false);

const toggleDropdown = (event) => {
  event.stopPropagation();
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

// Cerrar dropdown al hacer clic fuera del componente
onMounted(() => {
  window.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  window.removeEventListener('click', closeDropdown);
});

// Colores del círculo del avatar según rol administrativo
const ROLE_COLORS = {
  admin: '#FF5E00', director: '#FF5E00',
  partida: '#FBBF24', meta: '#10B981',
};

const roleColor = computed(
  () => ROLE_COLORS[currentUser.value?.role?.toLowerCase()] ?? '#6B7280'
);

const userInitials = computed(() => {
  const name = currentUser.value?.name ?? 'US';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
});

const handleLogout = async () => {
  await logout();
  router.push('/login');
};
</script>

<style scoped>
.avatar-container {
  position: relative;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: white;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
  flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
}

.avatar-circle:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.3);
}

/* Dropdown flotante premium — usa tokens del tema (evita nombre blanco sobre fondo blanco) */
.dropdown-menu {
  position: absolute;
  top: 48px;
  right: 0;
  width: 200px;
  max-width: min(200px, calc(100vw - 24px));
  background: var(--color-surface);
  color: var(--color-text-primary);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-premium);
  z-index: 100;
  padding: 8px;
  transform-origin: top right;
}

.dropdown-header {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.user-email {
  font-size: 10px;
  color: var(--color-text-secondary);
  word-break: break-all;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 6px 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn {
  color: var(--color-error);
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.08);
}

.dropdown-item .material-icons {
  font-size: 18px;
}

/* Transiciones fluidas */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
}
</style>
