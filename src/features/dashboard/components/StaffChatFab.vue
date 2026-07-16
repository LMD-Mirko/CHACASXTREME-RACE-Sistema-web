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
      {{ unread > 9 ? '9+' : unread }}
    </span>
  </button>
</template>

<script setup>
import { useMediaQuery } from '@vueuse/core';
import { useStaffChat } from '../composables/useStaffChat';

const isDesktop = useMediaQuery('(min-width: 1024px)');
const { unread, hasUnread, panelOpen, togglePanel } = useStaffChat();
</script>

<style scoped>
/* Solo PC: icono discreto esquina inferior derecha */
.staff-chat-fab {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 88;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 94, 0, 0.45);
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-surface, #141414) 88%, #ff5e00);
  color: #ff5e00;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.staff-chat-fab:hover {
  background: #ff5e00;
  color: #fff;
  transform: translateY(-1px);
}

.staff-chat-fab--open {
  background: #2a2a2a;
  color: #eee;
  border-color: var(--color-border, #444);
}

.staff-chat-fab .material-icons {
  font-size: 22px;
}

.staff-chat-fab__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #22a05a;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  display: grid;
  place-items: center;
  border: 2px solid var(--color-surface, #141414);
}
</style>
