<template>
  <div class="dns-collapse-section">
    <button
      class="collapse-trigger"
      @click="isDnsCollapsed = !isDnsCollapsed"
    >
      <div class="collapse-trigger-title">
        <span class="material-icons text-error">dangerous</span>
        <span>Lista de Ausentes (DNS)</span>
        <span class="badge-count badge-count--dns">{{ dnsRiders.length }}</span>
      </div>
      <span class="material-icons collapse-arrow" :class="{ 'collapse-arrow--rotated': !isDnsCollapsed }">
        expand_more
      </span>
    </button>

    <Transition name="slide-collapse">
      <div v-if="!isDnsCollapsed" class="dns-list-content">
        <div v-if="dnsRiders.length > 0" class="dns-grid">
          <div
            v-for="rider in dnsRiders"
            :key="rider.id"
            class="dns-row"
          >
            <span class="dns-plate">#{{ rider.plate_number }}</span>
            <div class="dns-rider-details">
              <span class="dns-name">{{ rider.full_name }}</span>
              <span class="dns-origin">{{ rider.origin }}</span>
            </div>
            <button
              class="revert-dns-btn"
              @click="$emit('revertDns', rider.id)"
            >
              <span class="material-icons">settings_backup_restore</span>
              Revertir DNS
            </button>
          </div>
        </div>
        <div v-else class="dns-empty">
          No hay corredores ausentes registrados en esta tanda.
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  dnsRiders: {
    type: Array,
    required: true
  }
});

defineEmits(['revertDns']);

const isDnsCollapsed = ref(true);
</script>

<style scoped>
.dns-collapse-section {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  overflow: hidden;
  margin-top: 10px;
}

.collapse-trigger {
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
}

.collapse-trigger-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.text-error {
  color: var(--color-error);
}

.badge-count {
  background: rgba(239, 68, 68, 0.08);
  color: var(--color-error);
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  margin-left: 4px;
}

.collapse-arrow {
  color: var(--color-text-secondary);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.collapse-arrow--rotated {
  transform: rotate(180deg);
}

.dns-list-content {
  border-top: 1px solid var(--color-border);
  padding: 16px;
  background: var(--color-background);
}

.dns-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dns-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  gap: 10px;
}

.dns-plate {
  font-weight: 700;
  color: var(--color-error);
  font-size: 14.5px;
  background: rgba(239, 68, 68, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
}

.dns-rider-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dns-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-decoration: line-through;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dns-origin {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.revert-dns-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
}

.revert-dns-btn span {
  font-size: 16px;
}

.revert-dns-btn:hover {
  background: var(--color-border);
  border-color: var(--color-text-primary);
}

.revert-dns-btn:active {
  transform: scale(0.95);
}

.dns-empty {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 10px 0;
}

/* Transición del Colapsable */
.slide-collapse-enter-active,
.slide-collapse-leave-active {
  transition: max-height 0.3s ease-out, opacity 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-collapse-enter-from,
.slide-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
