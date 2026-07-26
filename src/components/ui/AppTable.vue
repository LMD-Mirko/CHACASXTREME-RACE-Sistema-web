<template>
  <div class="app-table-container">
    <!-- Vista de Escritorio: Tabla tradicional -->
    <div class="desktop-table-view">
      <table class="app-table">
        <thead>
          <tr>
            <th 
              v-for="h in headers" 
              :key="h.key" 
              :class="h.alignClass"
            >
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="item.id || index" class="table-row">
            <td 
              v-for="h in headers" 
              :key="h.key" 
              :class="h.alignClass"
            >
              <slot :name="`cell-${h.key}`" :item="item" :index="index">
                {{ item[h.key] }}
              </slot>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td :colspan="headers.length" class="empty-cell">
              <slot name="empty">No se encontraron registros.</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Vista de Móvil: Tarjetas -->
    <div class="mobile-cards-view">
      <div v-for="(item, index) in items" :key="item.id || index" class="mobile-card-wrapper">
        <slot name="card" :item="item" :index="index">
          <!-- Tarjeta por defecto si no se pasa slot -->
          <div class="default-mobile-card">
            <div v-for="h in headers" :key="h.key" class="card-field">
              <span class="card-label">{{ h.label }}:</span>
              <span class="card-value">{{ item[h.key] }}</span>
            </div>
          </div>
        </slot>
      </div>
      <div v-if="items.length === 0" class="empty-state">
        <slot name="empty">No se encontraron registros.</slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true
  },
  headers: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.app-table-container {
  width: 100%;
}

.desktop-table-view {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-premium);
}

.app-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13.5px;
}

th {
  background: rgba(255, 94, 0, 0.02);
  color: var(--color-text-secondary);
  font-weight: 600;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

td {
  padding: 14px 20px;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: rgba(255, 94, 0, 0.02);
}

.table-row:last-child td {
  border-bottom: none;
}

.text-right {
  text-align: right;
}

.empty-cell {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

/* Cambio responsivo de visualizaciones */
.mobile-cards-view {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.desktop-table-view {
  display: none;
}

@media (min-width: 1024px) {
  .mobile-cards-view {
    display: none;
  }
  .desktop-table-view {
    display: block;
  }
}

/* Estilos de tarjeta por defecto (en caso de no recibir slot) */
.default-mobile-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-field {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.card-label {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.card-value {
  color: var(--color-text-primary);
}
</style>
