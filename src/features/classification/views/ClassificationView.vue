<template>
  <div class="classification-container fade-in">
    <!-- Fila Superior: Info de Competencia y Estado -->
    <div class="header-section">
      <div class="title-block">
        <span class="material-icons title-icon">sports_score</span>
        <div>
          <h2>Clasificación en Vivo</h2>
          <p class="subtitle">{{ activeCompetition?.name || 'Cargando Competencia...' }}</p>
        </div>
      </div>
      
      <!-- Badges de Fase Activa -->
      <div class="phase-badge-wrapper" v-if="activeCompetition">
        <span class="phase-badge" :class="activeCompetition.current_phase">
          FASE {{ activeCompetition.current_phase === 'practica' ? 'PRUEBA' : 'FINAL' }}
        </span>
        <span class="live-dot-indicator">
          <span class="dot"></span>
          EN VIVO
        </span>
      </div>
    </div>

    <!-- Filtros de Categorías (Pills Premium) -->
    <div class="filters-card">
      <label class="section-label">Filtrar por Categoría</label>
      <div class="categories-scrollbar">
        <div class="pills-container">
          <button
            class="pill-btn"
            :class="{ 'pill-btn--active': activeCategoryId === 'all' }"
            @click="setCategory('all')"
          >
            <span class="material-icons pill-icon-btn">analytics</span>
            General (Avalancha)
          </button>
          
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="pill-btn"
            :class="{ 'pill-btn--active': activeCategoryId === cat.id }"
            @click="setCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Barra de Búsqueda de Competidor -->
    <div class="search-card">
      <div class="search-input-box">
        <span class="material-icons search-icon">search</span>
        <input
          type="text"
          placeholder="Buscar por placa, nombre o club..."
          v-model="searchQuery"
          class="search-input"
        />
        <button
          v-if="searchQuery"
          class="clear-search-btn"
          @click="searchQuery = ''"
        >
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>

    <!-- TABLA DE CLASIFICACIÓN (ESCRITORIO / LAPTOP) -->
    <div class="table-card desktop-only">
      <div v-if="isLoading" class="table-loading-state">
        <span class="material-icons loading-spin">sync</span>
        <p>Cargando posiciones en tiempo real...</p>
      </div>

      <div v-else-if="filteredClassifications.length > 0" class="table-wrapper">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th class="col-pos">POS</th>
              <th class="col-plate">PLACA</th>
              <th class="col-rider">PILOTO</th>
              <th class="col-club">CLUB / PROCEDENCIA</th>
              <th class="col-cat" v-if="activeCategoryId === 'all'">CATEGORÍA</th>
              <th class="col-status">ESTADO</th>
              <th class="col-time">PARTIDA</th>
              <th class="col-check">P. CONTROL</th>
              <th class="col-time">META</th>
              <th class="col-net">TIEMPO NETO</th>
              <th class="col-gap">GAP (DIF)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rider in filteredClassifications"
              :key="rider.id"
              :class="{ 
                'row-podium-1': rider.position === 1,
                'row-podium-2': rider.position === 2,
                'row-podium-3': rider.position === 3,
                'row-dnf': rider.status === 'DNF',
                'row-dns': rider.status === 'DNS'
              }"
            >
              <!-- Puesto -->
              <td class="col-pos text-center font-bold">
                <span 
                  v-if="rider.position !== '—'" 
                  class="position-badge"
                  :class="'pos-' + rider.position"
                >
                  {{ rider.position }}º
                </span>
                <span v-else-if="rider.status === 'EN RUTA'" class="empty-pos text-primary" data-tooltip="En Pista">
                  <span class="material-icons pos-racing-icon">directions_bike</span>
                </span>
                <span v-else-if="rider.status === 'DNF'" class="empty-pos text-dnf" data-tooltip="Retirado">
                  DNF
                </span>
                <span v-else-if="rider.status === 'DNS'" class="empty-pos text-dns" data-tooltip="No inició">
                  DNS
                </span>
                <span v-else class="empty-pos">—</span>
              </td>

              <!-- Placa -->
              <td class="col-plate text-center font-extrabold plate-col-text">
                #{{ rider.plate_number }}
              </td>

              <!-- Piloto -->
              <td class="col-rider font-bold">
                {{ rider.full_name }}
              </td>

              <!-- Club/Procedencia -->
              <td class="col-club text-muted">
                {{ rider.club_team || rider.origin || '—' }}
              </td>

              <!-- Categoría -->
              <td class="col-cat font-semibold" v-if="activeCategoryId === 'all'">
                {{ rider.category_name }}
              </td>

              <!-- Estado -->
              <td class="col-status">
                <span class="status-pill" :class="statusClass(rider.status)">
                  {{ rider.status }}
                </span>
              </td>

              <!-- Partida -->
              <td class="col-time text-mono">
                {{ rider.start_time || '—' }}
              </td>

              <!-- Paso Intermedio -->
              <td class="col-check text-center">
                <span 
                  class="check-badge" 
                  :class="rider.intermediate_passed ? 'check-passed' : 'check-missed'"
                  :data-tooltip="rider.intermediate_time ? 'Paso: ' + rider.intermediate_time : 'Sin Registro'"
                >
                  <span class="material-icons check-icon">
                    {{ rider.intermediate_passed ? 'done' : 'close' }}
                  </span>
                  <span class="check-txt">{{ rider.intermediate_passed ? 'SÍ' : 'NO' }}</span>
                </span>
              </td>

              <!-- Meta -->
              <td class="col-time text-mono">
                {{ rider.meta_time || '—' }}
              </td>

              <!-- Tiempo Neto -->
              <td class="col-net text-mono font-extrabold text-primary">
                <span v-if="rider.status === 'EN RUTA'" class="pulsing-time">EN RUTA...</span>
                <span v-else-if="rider.status === 'DNF'" class="text-dnf-time">RETIRADO</span>
                <span v-else-if="rider.status === 'DNS'" class="text-dns-time">NO INICIÓ</span>
                <span v-else>{{ rider.time_formatted }}</span>
              </td>

              <!-- Gap -->
              <td class="col-gap text-mono font-semibold" :class="{ 'text-success': rider.gap !== 'Líder' && rider.gap !== '—' }">
                {{ rider.gap }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-table-state">
        <span class="material-icons">motorcycle</span>
        <p>No se encontraron competidores registrados para esta clasificación.</p>
      </div>
    </div>

    <!-- TARJETAS DE CLASIFICACIÓN (MÓVIL / TABLET) -->
    <div class="mobile-only mobile-list-container">
      <div v-if="isLoading" class="mobile-loading-state">
        <span class="material-icons loading-spin">sync</span>
        <p>Cargando posiciones en tiempo real...</p>
      </div>

      <div v-else-if="filteredClassifications.length > 0" class="mobile-cards-grid">
        <div
          v-for="rider in filteredClassifications"
          :key="rider.id"
          class="mobile-leaderboard-card"
          :class="{
            'card-podium-1': rider.position === 1,
            'card-podium-2': rider.position === 2,
            'card-podium-3': rider.position === 3,
            'card-dnf': rider.status === 'DNF',
            'card-dns': rider.status === 'DNS'
          }"
        >
          <!-- Fila Superior: Posición + Placa + Estado -->
          <div class="card-header">
            <div class="card-left-badge">
              <span 
                v-if="rider.position !== '—'" 
                class="mobile-pos-badge"
                :class="'pos-' + rider.position"
              >
                {{ rider.position }}º
              </span>
              <span class="mobile-plate-badge">#{{ rider.plate_number }}</span>
            </div>
            <span class="status-pill status-pill--small" :class="statusClass(rider.status)">
              {{ rider.status }}
            </span>
          </div>

          <!-- Información del Corredor -->
          <div class="card-body">
            <h4 class="card-rider-name">{{ rider.full_name }}</h4>
            <div class="card-rider-meta">
              <span class="card-category">{{ rider.category_name }}</span>
              <span v-if="rider.club_team || rider.origin" class="card-team">
                <span class="material-icons">flag</span>
                {{ rider.club_team || rider.origin }}
              </span>
            </div>
          </div>

          <!-- Tiempos e Intermedio -->
          <div class="card-footer">
            <div class="footer-time-box">
              <span class="footer-lbl">TIEMPO NETO</span>
              <span v-if="rider.status === 'EN RUTA'" class="footer-val text-mono font-bold pulsing-time">EN RUTA...</span>
              <span v-else-if="rider.status === 'DNF'" class="footer-val text-mono font-bold text-dnf-time">RETIRADO</span>
              <span v-else-if="rider.status === 'DNS'" class="footer-val text-mono font-bold text-dns-time">NO INICIÓ</span>
              <span v-else class="footer-val text-primary text-mono font-extrabold">{{ rider.time_formatted }}</span>
            </div>
            <div class="footer-time-box">
              <span class="footer-lbl">DIF (GAP)</span>
              <span class="footer-val text-mono font-semibold" :class="{ 'text-success': rider.gap !== 'Líder' && rider.gap !== '—' }">
                {{ rider.gap }}
              </span>
            </div>
            <div class="footer-time-box text-center">
              <span class="footer-lbl">P. CONTROL</span>
              <span 
                class="check-badge check-badge--small" 
                :class="rider.intermediate_passed ? 'check-passed' : 'check-missed'"
              >
                <span class="material-icons">
                  {{ rider.intermediate_passed ? 'done' : 'close' }}
                </span>
                <span>{{ rider.intermediate_passed ? 'SÍ' : 'NO' }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-table-state">
        <span class="material-icons">motorcycle</span>
        <p>No se encontraron competidores para esta clasificación.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useClassification } from '../hooks/useClassification';

const {
  activeCompetition,
  categories,
  activeCategoryId,
  searchQuery,
  isLoading,
  filteredClassifications,
  loadClassifications
} = useClassification();

function setCategory(id) {
  activeCategoryId.value = id;
  loadClassifications();
}

function statusClass(status) {
  switch (status) {
    case 'LLEGÓ': return 'status-arrived';
    case 'EN RUTA': return 'status-racing';
    case 'DNF': return 'status-dnf';
    case 'DNS': return 'status-dns';
    default: return 'status-pending';
  }
}
</script>

<style scoped>
.classification-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.title-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: var(--color-primary);
}

.header-section h2 {
  font-size: 20px;
  font-weight: 900;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: 0.5px;
}

.subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 2px 0 0 0;
}

.phase-badge-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.phase-badge {
  font-family: var(--font-headings);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-badge.practica {
  background: rgba(30, 144, 255, 0.08);
  color: #1E90FF;
  border: 1px solid rgba(30, 144, 255, 0.2);
}

.phase-badge.final {
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
  border: 1px solid rgba(255, 94, 0, 0.2);
}

.live-dot-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 4px 10px;
  border-radius: 8px;
}

.live-dot-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px #10B981;
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

/* Category Filters Card */
.filters-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 16px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 10px;
  font-weight: 750;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.categories-scrollbar {
  overflow-x: auto;
  padding-bottom: 4px;
}

.categories-scrollbar::-webkit-scrollbar {
  height: 4px;
}

.pills-container {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.pill-btn {
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
  font-size: 12.5px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s ease;
}

.pill-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pill-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF !important;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.15);
}

.pill-icon-btn {
  font-size: 16px;
}

/* Search bar card */
.search-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px;
  box-shadow: var(--shadow-premium);
}

.search-input-box {
  display: flex;
  align-items: center;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  height: 46px;
  padding: 0 14px;
  position: relative;
}

.search-icon {
  color: var(--color-text-secondary);
  margin-right: 10px;
  font-size: 20px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.clear-search-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

/* TABLE VIEW (DESKTOP) */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 16px;
  box-shadow: var(--shadow-premium);
}

.table-wrapper {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.leaderboard-table th {
  padding: 14px 12px;
  font-family: var(--font-headings);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--color-border);
}

.leaderboard-table td {
  padding: 14px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

/* Rows hover effect */
.leaderboard-table tbody tr {
  transition: background-color 0.2s ease;
}

.leaderboard-table tbody tr:hover {
  background: rgba(255, 94, 0, 0.015);
}

:global(.dark-theme) .leaderboard-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.01);
}

/* Column sizes & text styles */
.col-pos { width: 60px; }
.col-plate { width: 80px; }
.col-status { width: 100px; }
.col-time { width: 90px; }
.col-check { width: 110px; }
.col-net { width: 110px; }
.col-gap { width: 90px; }

.text-center { text-align: center; }
.text-mono { font-family: 'Space Grotesk', monospace; font-size: 14px !important; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-extrabold { font-weight: 800; }
.text-primary { color: var(--color-primary) !important; }
.text-success { color: #10B981 !important; }
.text-muted { color: var(--color-text-secondary); }

.plate-col-text {
  color: var(--color-primary);
  font-size: 14px;
}

/* Badges and pills */
.position-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 900;
}

.position-badge.pos-1 {
  background: rgba(251, 191, 36, 0.15);
  color: #D97706;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.position-badge.pos-2 {
  background: rgba(156, 163, 175, 0.15);
  color: #4B5563;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

:global(.dark-theme) .position-badge.pos-2 {
  color: #D1D5DB;
}

.position-badge.pos-3 {
  background: rgba(217, 119, 6, 0.15);
  color: #B45309;
  border: 1px solid rgba(217, 119, 6, 0.3);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  font-size: 9px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.status-pill--small {
  font-size: 8px;
}

.status-arrived {
  background: rgba(16, 185, 129, 0.08);
  color: #10B981;
}

.status-racing {
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
}

.status-dnf {
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
}

.status-dns {
  background: rgba(148, 163, 184, 0.08);
  color: #64748B;
}

.status-pending {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-secondary);
}

/* Check badge */
.check-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}

.check-badge--small {
  font-size: 8.5px;
}

.check-passed {
  background: rgba(16, 185, 129, 0.08);
  color: #10B981;
}

.check-missed {
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
}

.check-icon {
  font-size: 12px;
}

.row-podium-1 { background: rgba(251, 191, 36, 0.015); }
.row-podium-2 { background: rgba(156, 163, 175, 0.008); }
.row-podium-3 { background: rgba(217, 119, 6, 0.008); }
.row-dnf { opacity: 0.65; background: rgba(239, 68, 68, 0.005); }
.row-dns { opacity: 0.55; }

/* States */
.table-loading-state,
.mobile-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: var(--color-text-secondary);
  gap: 12px;
}

.loading-spin {
  font-size: 32px;
  animation: spin 1s linear infinite;
  color: var(--color-primary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  gap: 10px;
}

.empty-table-state span {
  font-size: 40px;
}

.empty-table-state p {
  font-size: 13px;
  font-weight: 600;
}

/* MOBILE VIEW CARD LIST */
.mobile-only {
  display: none;
}

.mobile-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-leaderboard-card {
  position: relative;
  background-color: var(--color-surface);
  background-image: 
    linear-gradient(90deg, var(--color-surface) 72%, rgba(255, 94, 0, 0.04) 100%),
    url('../../../assets/flame-fire-border-frame-silhouette-template-illustration-clipart-vector-removebg-preview.png');
  background-position: right top;
  background-repeat: no-repeat;
  background-size: auto 55%;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 14px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden; /* Evitar desborde del fondo de llamas */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-left-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-pos-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.mobile-pos-badge.pos-1 { background: rgba(251, 191, 36, 0.15); color: #D97706; }
.mobile-pos-badge.pos-2 { background: rgba(156, 163, 175, 0.15); color: #4B5563; }
.mobile-pos-badge.pos-3 { background: rgba(217, 119, 6, 0.15); color: #B45309; }

.mobile-plate-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 900;
  font-size: 15px;
  color: var(--color-primary);
}

/* Card Body */
.card-rider-name {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  margin: 0;
}

.card-rider-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.card-category {
  font-size: 8.5px;
  font-weight: 800;
  text-transform: uppercase;
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.card-team {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.card-team span {
  font-size: 11px;
  opacity: 0.6;
}

/* Card Footer */
.card-footer {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
  gap: 6px;
}

.footer-time-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.footer-lbl {
  font-size: 8px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.footer-val {
  font-size: 12.5px;
}

/* Card custom podium styles */
.card-podium-1 {
  border-left: 4px solid #FBBF24;
  background-image: 
    linear-gradient(90deg, var(--color-surface) 72%, rgba(251, 191, 36, 0.09) 100%),
    url('../../../assets/flame-fire-border-frame-silhouette-template-illustration-clipart-vector-removebg-preview.png') !important;
  background-position: right top !important;
  background-size: auto 55% !important;
}
.card-podium-2 {
  border-left: 4px solid #9CA3AF;
  background-image: 
    linear-gradient(90deg, var(--color-surface) 72%, rgba(156, 163, 175, 0.07) 100%),
    url('../../../assets/flame-fire-border-frame-silhouette-template-illustration-clipart-vector-removebg-preview.png') !important;
  background-position: right top !important;
  background-size: auto 55% !important;
}
.card-podium-3 {
  border-left: 4px solid #F59E0B;
  background-image: 
    linear-gradient(90deg, var(--color-surface) 72%, rgba(217, 119, 6, 0.07) 100%),
    url('../../../assets/flame-fire-border-frame-silhouette-template-illustration-clipart-vector-removebg-preview.png') !important;
  background-position: right top !important;
  background-size: auto 55% !important;
}
.card-dnf { opacity: 0.7; }
.card-dns { opacity: 0.6; }

/* Animación y estilos de estado en vivo */
.pulsing-time {
  color: var(--color-primary) !important;
  font-weight: 800;
  animation: pulse-opacity 1.5s infinite;
}

@keyframes pulse-opacity {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.text-dnf-time {
  color: #EF4444 !important;
  font-weight: 750;
  font-size: 12.5px;
}

.text-dns-time {
  color: #64748B !important;
  font-weight: 600;
  font-size: 12px;
}

.pos-racing-icon {
  font-size: 16px;
  animation: bounce-cycle 1.2s infinite;
}

@keyframes bounce-cycle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.empty-pos {
  font-size: 11px;
  font-weight: 800;
}

.text-dnf {
  color: #EF4444;
}

.text-dns {
  color: #64748B;
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 1023px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: block !important;
  }
}
</style>
