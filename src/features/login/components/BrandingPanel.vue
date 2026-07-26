<template>
  <div class="branding-panel">
    <div class="branding-overlay"></div>
    <div class="branding-content">
      <img src="../../../assets/logo.png" alt="Chacas Xtreme Logo" class="brand-logo" />
      <p class="brand-subtitle">Plataforma Oficial de Control y Cronometraje</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.branding-panel {
  flex: 1.2;
  position: relative;
  background-color: #0c0908;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.branding-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255, 94, 0, 0.15) 0%, transparent 70%);
}
.branding-content {
  position: relative;
  z-index: 2;
  text-align: center;
}
.brand-logo {
  height: 160px;
  margin-bottom: 24px;
  filter: drop-shadow(0 0 15px rgba(255, 94, 0, 0.4));
}
.brand-title {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #ffffff;
}
.brand-subtitle {
  font-size: 14px;
  color: #a0a0a0;
  margin-top: 8px;
}

/* Ocultar panel en dispositivos móviles */
@media (max-width: 1024px) {
  .branding-panel {
    display: none;
  }
}
</style>

