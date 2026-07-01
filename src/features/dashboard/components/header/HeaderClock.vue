<template>
  <!-- Reloj y fecha en vivo (oculto en móvil por defecto, visible en desktop) -->
  <div class="clock-block">
    <span class="clock-time">{{ timeString }}</span>
    <span class="clock-date">{{ dateString }}</span>
  </div>
</template>

<script setup>
import { useLiveClock } from '../../hooks/useLiveClock';

const { timeString, dateString } = useLiveClock();
</script>

<style scoped>
.clock-block {
  display: none; /* Oculto en móvil por regla SDD-005 R1 */
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  user-select: none;
}

.clock-time {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums; /* Evita que los caracteres vibren al cambiar */
  letter-spacing: 0.8px;
  line-height: 1;
}

.clock-date {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Mostrar a partir de pantallas de escritorio */
@media (min-width: 1024px) {
  .clock-block {
    display: flex;
  }
}
</style>
