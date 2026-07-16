<template>
  <button
    v-if="isDesktop"
    type="button"
    class="staff-chat-fab"
    :class="{ 'staff-chat-fab--open': panelOpen }"
    :aria-label="panelOpen ? 'Cerrar chat staff' : 'Abrir chat staff'"
    :title="panelOpen ? 'Cerrar chat' : 'Chat en caliente'"
    @click="togglePanel"
  >
    <span class="material-icons">{{ panelOpen ? 'close' : 'forum' }}</span>
    <span v-if="hasUnread && !panelOpen" class="staff-chat-fab__badge">
      {{ unreadLabel }}
    </span>
  </button>
</template>

<script setup>
import { useMediaQuery } from '@vueuse/core';
import { useStaffChat } from '../composables/useStaffChat';

const isDesktop = useMediaQuery('(min-width: 1024px)');
const { unreadLabel, hasUnread, panelOpen, togglePanel } = useStaffChat();
</script>

<style scoped>
/* Solo PC: icono discreto esquina inferior derecha */
.staff-chat-fab {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 88;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #25d366;
  color: #fff;
  box-shadow: 0 8px 22px rgba(37, 211, 102, 0.35);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.staff-chat-fab:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 10px 26px rgba(37, 211, 102, 0.45);
}

.staff-chat-fab--open {
  background: #2a2a2a;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.staff-chat-fab .material-icons {
  font-size: 24px;
}

.staff-chat-fab__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #e11d48;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
  border: 2px solid var(--color-background, #0a0a0a);
  line-height: 1;
  animation: chat-badge-pop 0.35s ease;
}

@keyframes chat-badge-pop {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
