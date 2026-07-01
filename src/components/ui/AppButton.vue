<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="app-btn"
    :class="[
      `app-btn--${variant}`,
      {
        'app-btn--loading': loading,
        'app-btn--icon-only': icon && !$slots.default
      }
    ]"
    v-bind="$attrs"
  >
    <span v-if="loading" class="material-icons rotating-btn-icon">sync</span>
    <span v-else-if="icon" class="material-icons btn-icon">{{ icon }}</span>
    <span v-if="$slots.default" class="btn-text">
      <slot />
    </span>
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'button'
  },
  variant: {
    type: String,
    default: 'primary' // primary, secondary, danger, success, icon-action
  },
  disabled: Boolean,
  loading: Boolean,
  icon: String
});
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  font-family: var(--font-family);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  outline: none;
  touch-action: manipulation;
  white-space: nowrap;
}

/* Tamaños adaptativos (Touch Height) */
@media (max-width: 599px) {
  .app-btn:not(.app-btn--icon-only) {
    min-height: 48px;
    padding: 0 20px;
    font-size: 14.5px;
  }
}
@media (min-width: 600px) {
  .app-btn:not(.app-btn--icon-only) {
    min-height: 44px;
    padding: 0 18px;
    font-size: 14px;
  }
}

.app-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Variante Primary */
.app-btn--primary {
  background: var(--color-primary);
  color: #FFFFFF;
  border: none;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.15);
}

.app-btn--primary:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 16px rgba(255, 94, 0, 0.25);
  filter: brightness(1.05);
}

.app-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Variante Secondary */
.app-btn--secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.app-btn--secondary:hover:not(:disabled) {
  background: var(--color-border);
  color: var(--color-text-primary);
}

/* Variante Danger */
.app-btn--danger {
  background: var(--color-error);
  color: #FFFFFF;
  border: none;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.app-btn--danger:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.25);
  filter: brightness(1.05);
}

.app-btn--danger:active:not(:disabled) {
  transform: translateY(0);
}

/* Variante Success */
.app-btn--success {
  background: var(--color-success);
  color: #FFFFFF;
  border: none;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
}

.app-btn--success:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.25);
  filter: brightness(1.05);
}

.app-btn--success:active:not(:disabled) {
  transform: translateY(0);
}

/* Variante Icon-Action (para las celdas de acciones) */
.app-btn--icon-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
}

.app-btn--icon-action:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

/* Iconos */
.btn-icon {
  font-size: 18px;
  display: inline-flex;
}

.rotating-btn-icon {
  font-size: 18px;
  animation: spin 1s linear infinite;
  display: inline-flex;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
