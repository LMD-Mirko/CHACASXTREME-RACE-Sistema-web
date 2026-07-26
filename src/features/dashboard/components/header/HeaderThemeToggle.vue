<template>
  <button
    class="theme-pill"
    :class="{ 'theme-pill--dark': isDark }"
    @click="toggleTheme"
    :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
  >
    <!-- Icono sol -->
    <span class="material-icons pill-icon pill-sun">light_mode</span>
    <!-- Burbuja deslizante -->
    <div class="pill-ball"></div>
    <!-- Icono luna -->
    <span class="material-icons pill-icon pill-moon">dark_mode</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isDark = ref(false);

onMounted(() => {
  // Inicializar estado basado en la clase del body
  isDark.value = document.body.classList.contains('dark-theme');
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.body.classList.toggle('dark-theme', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};
</script>

<style scoped>
.theme-pill {
  position: relative;
  width: 62px;
  height: 32px;
  border-radius: 16px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: manipulation;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 1023px) {
  .theme-pill {
    width: 52px;
    height: 28px;
    padding: 0 4px;
  }
  .pill-ball {
    width: 20px;
    height: 20px;
  }
  .theme-pill--dark .pill-ball {
    transform: translateX(24px);
  }
  .pill-icon {
    font-size: 12px;
  }
}

.theme-pill--dark {
  background: rgba(255, 94, 0, 0.12);
  border-color: rgba(255, 94, 0, 0.35);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.pill-icon {
  font-size: 14px;
  z-index: 2;
  transition: opacity 0.3s, color 0.3s;
}

.pill-sun {
  color: #FBBF24;
  opacity: 1;
}

.pill-moon {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

.theme-pill--dark .pill-sun {
  opacity: 0.3;
}

.theme-pill--dark .pill-moon {
  color: var(--color-primary);
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 94, 0, 0.4));
}

.pill-ball {
  position: absolute;
  left: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #FFF;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

:global(.dark-theme) .pill-ball {
  background: var(--color-primary);
}

.theme-pill--dark .pill-ball {
  transform: translateX(30px);
}

.theme-pill:hover {
  border-color: var(--color-primary);
}
</style>
