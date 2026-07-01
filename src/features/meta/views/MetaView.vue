<template>
  <div class="meta-view-root">
    <!-- LAYOUT DESKTOP/LAPTOP: Gatillo Ciego + Tabla de Auditoría Lateral (40% ancho) -->
    <div v-if="isDesktop" class="desktop-layout fade-in">
      <div class="left-panel">
        <MetaGatillo />
      </div>
      <div class="right-panel">
        <MetaQueueTable />
      </div>
    </div>

    <!-- LAYOUT MÓVIL: Cola FIFO en tarjetas + Asignación Bottom Sheet -->
    <div v-else class="mobile-layout fade-in">
      <MetaBrakingQueue @assign="openAssignSheet" />

      <!-- Bottom Sheet Modal de Asignación -->
      <MetaAssignModal
        v-if="selectedItemForAssign"
        :queue-item="selectedItemForAssign"
        @close="closeAssignSheet"
        @assigned="closeAssignSheet"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useMeta } from '../hooks/useMeta';
import MetaGatillo from '../components/desktop/MetaGatillo.vue';
import MetaQueueTable from '../components/desktop/MetaQueueTable.vue';
import MetaBrakingQueue from '../components/mobile/MetaBrakingQueue.vue';
import MetaAssignModal from '../components/mobile/MetaAssignModal.vue';

const isDesktop = ref(window.innerWidth >= 1024);
const selectedItemForAssign = ref(null);

const {
  loadInitialData,
  addQueueItemLocally,
  handleRiderFinishedEvent
} = useMeta();

let channel = null;

function checkViewport() {
  isDesktop.value = window.innerWidth >= 1024;
}

function openAssignSheet(item) {
  selectedItemForAssign.value = item;
}

function closeAssignSheet() {
  selectedItemForAssign.value = null;
}

onMounted(() => {
  loadInitialData();
  window.addEventListener('resize', checkViewport);

  // Suscripción en tiempo real a Laravel Echo / Reverb
  if (window.Echo) {
    channel = window.Echo.channel('race-timing');

    // Escucha de pulsador en meta (Laptop)
    channel.listen('.TimeFreezedInMeta', (e) => {
      addQueueItemLocally({
        id: e.queue_id,
        blind_timestamp: e.blind_timestamp,
        status: 'pendiente'
      });
    });

    // Escucha de corredor asignado
    channel.listen('.RiderFinished', (e) => {
      handleRiderFinishedEvent(e.exact_time);
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkViewport);
  if (channel && window.Echo) {
    channel.stopListening('.TimeFreezedInMeta');
    channel.stopListening('.RiderFinished');
  }
});
</script>

<style scoped>
.meta-view-root {
  height: calc(100vh - 100px);
  width: 100%;
}

/* Layout Desktop: Dos paneles (Gatillo a la izquierda, Cola a la derecha al 40%) */
.desktop-layout {
  display: flex;
  height: 100%;
  gap: 24px;
}

.left-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-premium);
}

.right-panel {
  width: 40%;
  min-width: 360px;
  max-width: 480px;
  height: 100%;
}

/* Layout Móvil: Columna simple con scroll natural */
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .meta-view-root {
    height: 100%;
  }
}
</style>
