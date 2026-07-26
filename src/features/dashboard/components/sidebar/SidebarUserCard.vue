<template>
  <div class="sidebar-footer">
    <!-- Botón de logout deportivo y destructivo -->
    <button class="btn-logout" @click="handleLogout">
      <span class="material-icons">logout</span>
      <span class="logout-text">Cerrar Sesión</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth } from '../../../login/hooks/useAuth';

const router = useRouter();
const { logout } = useAuth();

// Cierra la sesión y redirige al panel de login
const handleLogout = async () => {
  await logout();
  router.push('/login');
};
</script>

<style scoped>
.sidebar-footer {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.05);
}

:global(.dark-theme) .sidebar-footer {
  background: rgba(255, 255, 255, 0.01);
}

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px; /* SDD-005 R3 */
  background: transparent;
  border: 1.5px solid rgba(239, 68, 68, 0.25);
  color: var(--color-error);
  border-radius: 12px;
  font-family: var(--font-family);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: manipulation;
  width: 100%;
}

.btn-logout:hover {
  background: var(--color-error);
  color: white;
  border-color: var(--color-error);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
  transform: translateY(-1px);
}
</style>
