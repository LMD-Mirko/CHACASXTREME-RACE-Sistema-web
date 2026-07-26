<template>
  <div
    class="rider-list-item"
    :class="{ 'rider-list-item--present': isPresent }"
    @click="$emit('togglePresence', rider)"
  >
    <!-- Izquierda: Caja con el Número de Placa -->
    <div class="rider-avatar-box" :class="{ 'rider-avatar-box--present': isPresent }">
      <span class="plate-number-display">{{ rider.plate_number }}</span>
    </div>

    <!-- Centro: Nombre Completo y Equipo/Procedencia -->
    <div class="rider-info-box">
      <h3 class="rider-full-name">{{ rider.full_name }}</h3>
      <p class="rider-team-origin">
        <span class="rider-origin">{{ rider.origin }}</span>
        <span v-if="rider.club_team" class="rider-divider">•</span>
        <span v-if="rider.club_team" class="rider-team">{{ rider.club_team }}</span>
      </p>
    </div>

    <!-- Derecha: Estado de Presencia -->
    <div class="rider-right-box">
      <span
        class="presence-status-indicator"
        :class="isPresent ? 'presence-status--ok' : 'presence-status--missing'"
      >
        → {{ isPresent ? 'Presente' : 'Ausente' }}
      </span>
    </div>

    <!-- Botón DNS (Pill Táctil con texto e icono, optimizado para móvil) -->
    <button
      class="dns-pill-btn"
      @click.stop="$emit('markDns', rider.id)"
      aria-label="Registrar DNS (No partió)"
    >
      <span class="material-icons dns-icon">block</span>
      <span class="dns-text">DNS</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  rider: {
    type: Object,
    required: true
  },
  isPresent: {
    type: Boolean,
    required: true
  }
});

defineEmits(['togglePresence', 'markDns']);
</script>

<style scoped>
.rider-list-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
  touch-action: manipulation;
  gap: 14px;
}

.rider-list-item:last-child {
  border-bottom: none;
}

.rider-list-item:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.dark-theme .rider-list-item:hover {
  background-color: rgba(255, 255, 255, 0.01);
}

.rider-list-item--present {
  background-color: rgba(16, 185, 129, 0.02);
}

/* Izquierda: Caja de placa */
.rider-avatar-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.plate-number-display {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.rider-avatar-box--present {
  background: var(--color-success) !important;
  border-color: var(--color-success) !important;
}

.rider-avatar-box--present .plate-number-display {
  color: #FFFFFF !important;
}

/* Centro: Textos */
.rider-info-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rider-full-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-team-origin {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rider-divider {
  opacity: 0.4;
}

/* Derecha: Estado de Presencia */
.rider-right-box {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.presence-status-indicator {
  font-size: 12px;
  font-weight: 600;
}

.presence-status--ok {
  color: var(--color-success);
}

.presence-status--missing {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

/* Botón DNS Pill Táctil - Optimizado con 40px de alto para móvil */
.dns-pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.08);
  color: var(--color-error);
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  touch-action: manipulation;
}

.dns-icon {
  font-size: 15px;
}

.dns-pill-btn:hover {
  background: var(--color-error);
  color: #FFFFFF;
  border-color: var(--color-error);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.dns-pill-btn:active {
  transform: scale(0.95);
}

/* === RESPONSIVO MÓVIL (< 600px): Evita squishing y mejora el UX/UI === */
@media (max-width: 600px) {
  .rider-list-item {
    flex-wrap: wrap;
    row-gap: 8px;
    column-gap: 12px;
    align-items: center;
    padding: 12px 14px;
  }

  .rider-avatar-box {
    width: 40px;
    height: 40px;
  }

  .rider-info-box {
    flex: 1;
    min-width: 140px;
  }

  .rider-right-box {
    order: 3;
    flex-basis: 100%;
    margin-left: 52px; /* Aligned with rider-info-box text start */
    margin-top: -4px;
  }

  .dns-pill-btn {
    order: 2;
    height: 40px;
    padding: 0 12px;
  }
}
</style>
