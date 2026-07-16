<template>
  <div class="login-container fade-in">
    <!-- Botón de Alternancia de Tema -->
    <ThemeToggle />

    <!-- Panel Izquierdo de Marca (Solo Escritorio) -->
    <BrandingPanel />

    <!-- Panel Derecho del Formulario -->
    <div class="form-panel">
      <LoginForm />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle.vue';
import BrandingPanel from '../components/BrandingPanel.vue';
import LoginForm from '../components/LoginForm.vue';

const { restoreSession } = useAuth();

onMounted(() => {
  restoreSession();
});
</script>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  max-width: 100%;
  position: relative;
  background-color: var(--color-background);
  overflow-x: hidden;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  box-sizing: border-box;
}
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 100%;
}

/* Ajustes responsivos para pantallas móviles */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
  }
  .form-panel {
    background-color: var(--color-background);
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 32px 24px;
  }
}
</style>

