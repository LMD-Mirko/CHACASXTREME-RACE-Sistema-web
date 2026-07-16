<template>
  <AppModal
    :is-open="isOpen"
    title="Detalles del Competidor"
    @close="$emit('close')"
    max-width="680px"
  >
    <div v-if="rider" class="premium-detail-layout">
      <!-- Columna Izquierda: Imagen (Llenado completo) -->
      <div class="detail-photo-column">
        <img
          v-if="rider.photo_url"
          :src="resolvePhotoUrl(rider.photo_url)"
          alt="Foto del competidor"
          class="detail-rider-avatar"
        />
        <div v-else class="detail-rider-avatar-placeholder">
          {{ getInitials(rider.full_name) }}
        </div>
      </div>

      <!-- Columna Derecha: Detalles -->
      <div class="detail-info-column">
        <h3 class="detail-rider-name">{{ rider.full_name }}</h3>
        <p class="detail-rider-nickname" v-if="rider.nickname">"{{ rider.nickname }}"</p>
        
        <div class="info-divider"></div>

        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Placa:</span>
            <span class="info-value highlight-text">{{ rider.plate_number }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Categoría:</span>
            <span class="info-value">{{ rider.category?.name || 'Sin Categoría' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Procedencia:</span>
            <span class="info-value">{{ rider.origin }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">DNI / Pasaporte:</span>
            <span class="info-value">{{ rider.dni || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Club / Equipo:</span>
            <span class="info-value">{{ rider.club_team || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Contacto Emergencia:</span>
            <span class="info-value phone-text">{{ rider.emergency_phone }}</span>
          </div>
          <template v-if="rider.guardian_full_name || rider.guardian_dni || rider.guardian_phone">
            <div class="info-item">
              <span class="info-label">Apoderado:</span>
              <span class="info-value">{{ rider.guardian_full_name || '—' }}</span>
            </div>
            <div class="info-item" v-if="rider.guardian_dni">
              <span class="info-label">DNI apoderado:</span>
              <span class="info-value">{{ rider.guardian_dni }}</span>
            </div>
            <div class="info-item" v-if="rider.guardian_phone">
              <span class="info-label">Tel. apoderado:</span>
              <span class="info-value phone-text">{{ rider.guardian_phone }}</span>
            </div>
          </template>
          <div class="info-item" v-if="rider.instagram">
            <span class="info-label">Instagram:</span>
            <span class="info-value insta-text">{{ rider.instagram }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Estado:</span>
            <span class="info-value status-text" :style="{ color: statusStyle.color }">
              {{ statusStyle.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton @click="$emit('close')">Cerrar</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue';
import { getStatusStyle } from '../../../core/constants/riderStatusStyles';
import { storageUrl } from '../../../core/network/storageUrl';

const props = defineProps({
  isOpen: Boolean,
  rider: Object,
});

defineEmits(['close']);

const statusStyle = computed(() => getStatusStyle(props.rider?.race_status));

function resolvePhotoUrl(path) {
  return storageUrl(path);
}

function getInitials(name) {
  if (!name) return 'X';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
</script>

<style scoped>
/* === DISEÑO DIVIDIDO SIMPLE (MÓVIL) === */
.premium-detail-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-photo-column {
  width: 100%;
  height: 240px;
  background: var(--color-surface);
  border-radius: 16px;
  overflow: hidden;
}

.detail-rider-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-rider-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 800;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

.detail-info-column {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.detail-rider-name {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.detail-rider-nickname {
  font-size: 13.5px;
  color: var(--color-primary);
  font-style: italic;
  margin-top: 1px;
}

.info-divider {
  height: 1px;
  background: var(--color-border);
  margin: 14px 0 16px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13.5px;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 8px;
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.info-value {
  font-weight: 500;
  color: var(--color-text-primary);
}

.highlight-text {
  color: var(--color-primary);
  font-weight: 700;
}

.phone-text {
  color: var(--color-success);
  font-weight: 600;
}

.insta-text {
  color: var(--color-primary);
  font-weight: 600;
}

.status-text {
  font-weight: 700;
}

/* === DESKTOP (DIVIDIDO AL 50% SIMPLE CON MARGENES) === */
@media (min-width: 600px) {
  .premium-detail-layout {
    display: grid;
    grid-template-columns: 260px 1fr; /* Fijamos el ancho de la imagen */
    gap: 28px;
  }

  .detail-photo-column {
    height: 100%;
    min-height: 320px; /* Altura de la imagen */
  }

  .detail-info-column {
    padding: 8px 0;
    justify-content: center;
  }
}
</style>
