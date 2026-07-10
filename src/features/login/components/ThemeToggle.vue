<template>
  <button @click="toggleTheme" class="theme-toggle-btn" aria-label="Cambiar tema">
    <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isDark = ref(true); // Controla el estado del tema oscuro

onMounted(() => {
  // Verificar si hay una preferencia guardada en localStorage o la clase en el body
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
    if (isDark.value) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  } else {
    const hasDarkClass = document.body.classList.contains('dark-theme');
    isDark.value = hasDarkClass;
  }
});

// Cambia el tema actual entre claro y oscuro agregando/removiendo la clase global y guardando en localStorage
const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
};
</script>

<style scoped>
.theme-toggle-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.theme-toggle-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
