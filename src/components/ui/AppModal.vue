<template>
  <Transition name="modal-fade">
    <Teleport to="body" v-if="isOpen">
      <div class="modal-overlay" @click.self="$emit('close')">
        <div 
          class="modal-container"
          :class="{ 'modal-container--allow-overflow': allowOverflow }"
          :style="{ '--modal-max-width': maxWidth }"
        >
          <!-- Encabezado -->
          <div class="modal-header">
            <slot name="header">
              <h2>{{ title }}</h2>
            </slot>
            <button class="btn-close" @click="$emit('close')" aria-label="Cerrar modal">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Cuerpo del modal -->
          <div class="modal-body" :class="{ 'modal-body--allow-overflow': allowOverflow }">
            <slot />
          </div>

          <!-- Pie de página (Opcional) -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Teleport>
  </Transition>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: '680px'
  },
  allowOverflow: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: flex-end; /* Bottom sheet por defecto en móviles */
  justify-content: center;
  padding: 0;
}

.modal-container {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 100%;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.25);
  animation: slideUpMobile 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.modal-container--allow-overflow {
  overflow: visible;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
}

.modal-header h2 {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
}

.modal-body--allow-overflow {
  overflow: visible;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--color-surface);
}

/* Transiciones del modal overlay */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes slideUpMobile {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes slideUpDesktop {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* === DESKTOP (min-width: 600px) === */
@media (min-width: 600px) {
  .modal-overlay {
    align-items: center;
    padding: 20px;
  }

  .modal-container {
    border-radius: 20px;
    max-width: var(--modal-max-width);
    max-height: 90dvh;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    animation: slideUpDesktop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}
</style>
