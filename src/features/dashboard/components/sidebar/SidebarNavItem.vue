<template>
  <router-link
    :to="item.path"
    class="nav-item"
    @click="$emit('click')"
  >
    <!-- Contenedor del icono con fondo dinámico -->
    <div class="icon-container">
      <span class="material-icons nav-icon">{{ item.icon }}</span>
    </div>
    
    <span class="nav-label">{{ item.label }}</span>
    
    <!-- Indicador luminoso para elemento activo -->
    <span class="nav-active-indicator"></span>
  </router-link>
</template>

<script setup>
// Props e inputs del enlace de navegación
defineProps({
  item: {
    type: Object,
    required: true
  }
});

defineEmits(['click']);
</script>

<style scoped>
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px; /* SDD-005 R3: Área interactiva móvil */
  padding: 0 16px;
  margin: 2px 0;
  border-radius: 12px;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: manipulation;
  overflow: hidden;
}

/* Efecto de fondo degradado sutil en hover */
.nav-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 94, 0, 0.06), transparent);
  opacity: 0;
  transition: opacity 0.28s ease;
  border-radius: 12px;
  z-index: 0;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  z-index: 1;
  transition: all 0.28s ease;
}

.nav-icon {
  font-size: 20px;
  transition: transform 0.28s ease;
}

.nav-label {
  position: relative;
  z-index: 1;
  letter-spacing: 0.3px;
}

/* Estilo hover */
.nav-item:hover {
  color: var(--color-primary);
  transform: translateX(4px);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

/* Estilo activo (inyectado por Vue Router) */
.nav-item.router-link-active {
  color: var(--color-primary);
  font-weight: 700;
  background: rgba(255, 94, 0, 0.08);
}

.nav-item.router-link-active .icon-container {
  background: rgba(255, 94, 0, 0.12);
  color: var(--color-primary);
}

/* Punto o indicador luminoso activo a la derecha */
.nav-active-indicator {
  position: absolute;
  right: 16px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 8px var(--color-primary);
}

.nav-item.router-link-active .nav-active-indicator {
  opacity: 1;
  transform: scale(1);
}
</style>
