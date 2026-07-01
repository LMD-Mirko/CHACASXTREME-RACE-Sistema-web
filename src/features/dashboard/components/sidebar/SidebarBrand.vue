<template>
  <div class="sidebar-brand">
    <div class="logo-wrapper">
      <img src="../../../../assets/logo.png" alt="Chacas Xtreme" class="brand-logo" />
    </div>
  </div>
</template>

<script setup>
// Componente de marca premium para la barra lateral - Solo logotipo
</script>

<style scoped>
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  user-select: none;
}

.logo-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Efecto de resplandor deportivo ultra-premium */
.logo-wrapper::after {
  content: '';
  position: absolute;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--color-primary);
  filter: blur(16px);
  opacity: 0.35;
  z-index: 0;
  animation: pulse-glow 3s infinite alternate ease-in-out;
}

.brand-logo {
  height: 72px; /* Logo más grande como se solicitó */
  width: auto;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 10px rgba(255, 94, 0, 0.35));
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s;
}

.sidebar-brand:hover .brand-logo {
  transform: scale(1.08) rotate(-2deg);
  filter: drop-shadow(0 6px 16px rgba(255, 94, 0, 0.7));
}

@keyframes pulse-glow {
  0% {
    transform: scale(0.9);
    opacity: 0.25;
  }
  100% {
    transform: scale(1.15);
    opacity: 0.45;
  }
}
</style>

