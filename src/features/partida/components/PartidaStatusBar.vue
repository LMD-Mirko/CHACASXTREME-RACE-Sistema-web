<template>
  <div class="status-indicator-wrapper" ref="statusRef">
    <div
      class="status-indicator-bar"
      :class="[statusBgClass, { 'status-bar--hoverable': riders.length > 0 }]"
      @click="toggleTooltip"
      aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <div class="status-pulse-dot" :class="statusPulseClass"></div>
      <div class="status-info-text">
        <span class="status-info-main">{{ activeCategoryName }}</span>
        <span class="status-info-divider">|</span>
        <span class="status-info-sub">{{ statusMessage }}</span>
      </div>
      <span v-if="riders.length > 0" class="material-icons expand-icon">
        {{ isOpen ? 'expand_less' : 'expand_more' }}
      </span>
    </div>

    <!-- Dropdown Tooltip Premium -->
    <Transition name="slide-fade">
      <div v-if="isOpen && riders.length > 0" class="status-tooltip-card">
        <div class="tooltip-header">
          <span class="material-icons header-icon">groups</span>
          <h4>Competidores ({{ riders.length }} total)</h4>
        </div>

        <div class="tooltip-body">
          <template v-if="raceState === 'idle' || raceState === 'counting'">
            <div class="status-group" v-if="presentRiders.length > 0">
              <div class="group-title text-success">
                <span class="dot bg-success"></span> Presentes ({{ presentRiders.length }})
              </div>
              <div class="riders-badges">
                <span v-for="r in presentRiders" :key="r.id" class="rider-badge badge-success">
                  #{{ r.plate_number }} <span class="badge-name">{{ shortName(r.full_name) }}</span>
                </span>
              </div>
            </div>

            <div class="status-group" v-if="missingRiders.length > 0">
              <div class="group-title text-warning">
                <span class="dot bg-warning"></span> Ausentes ({{ missingRiders.length }})
              </div>
              <div class="riders-badges">
                <span v-for="r in missingRiders" :key="r.id" class="rider-badge badge-warning">
                  #{{ r.plate_number }} <span class="badge-name">{{ shortName(r.full_name) }}</span>
                </span>
              </div>
            </div>
          </template>

          <template v-else-if="raceState === 'active'">
            <div class="status-group" v-if="racingRiders.length > 0">
              <div class="group-title text-primary">
                <span class="dot bg-primary pulse-dot-mini"></span> En Pista ({{ racingRiders.length }})
              </div>
              <div class="riders-badges">
                <span v-for="r in racingRiders" :key="r.id" class="rider-badge badge-primary">
                  #{{ r.plate_number }} <span class="badge-name">{{ shortName(r.full_name) }}</span>
                </span>
              </div>
            </div>
          </template>

          <div class="status-group" v-if="dnsList.length > 0">
            <div class="group-title text-error">
              <span class="dot bg-error"></span> DNS / No Partió ({{ dnsList.length }})
            </div>
            <div class="riders-badges">
              <span v-for="r in dnsList" :key="r.id" class="rider-badge badge-error">
                #{{ r.plate_number }} <span class="badge-name">{{ shortName(r.full_name) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  activeCategoryName: { type: String, required: true },
  statusMessage: { type: String, required: true },
  raceState: { type: String, required: true },
  riders: { type: Array, default: () => [] },
  presentRiderIds: { type: Object, default: () => new Set() }
});

const isOpen = ref(false);
const statusRef = ref(null);

const toggleTooltip = () => { if (props.riders.length > 0) isOpen.value = !isOpen.value; };
const presentRiders = computed(() => props.riders.filter(r => r.race_status !== 'DNS' && props.presentRiderIds.has(r.id)));
const missingRiders = computed(() => props.riders.filter(r => r.race_status !== 'DNS' && !props.presentRiderIds.has(r.id)));
const dnsList = computed(() => props.riders.filter(r => r.race_status === 'DNS'));
const racingRiders = computed(() => props.riders.filter(r => r.race_status === 'en_carrera'));

function shortName(name) {
  if (!name) return '';
  const p = name.split(' ');
  return p.length > 1 ? `${p[0]} ${p[1][0]}.` : name;
}

const statusBgClass = computed(() => props.raceState === 'active' ? 'status-bar--active' : (props.raceState === 'counting' ? 'status-bar--counting' : 'status-bar--idle'));
const statusPulseClass = computed(() => props.raceState === 'active' ? 'pulse--active' : (props.raceState === 'counting' ? 'pulse--counting' : 'pulse--idle'));
const handleOutsideClick = (e) => { if (statusRef.value && !statusRef.value.contains(e.target)) isOpen.value = false; };

onMounted(() => document.addEventListener('click', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick));
</script>

<style scoped>
.status-indicator-wrapper {
  position: relative;
  width: 100%;
}
.status-indicator-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}
.status-bar--hoverable { cursor: pointer; }
.status-bar--hoverable:hover { filter: brightness(1.05); }
.status-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-info-text {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.status-info-main { color: var(--color-text-primary); font-weight: 700; }
.status-info-divider { color: var(--color-border); }
.status-info-sub { color: var(--color-text-secondary); }
.expand-icon { font-size: 18px; color: var(--color-text-secondary); }

.status-bar--idle { background: rgba(0, 0, 0, 0.02); border: 1px solid var(--color-border); }
.dark-theme .status-bar--idle { background: rgba(255, 255, 255, 0.02); }
.pulse--idle { background: var(--color-text-secondary); animation: pulse-neutral 2s infinite ease-in-out; }

.status-bar--counting { background: rgba(251, 191, 36, 0.08); border: 1px dashed var(--color-secondary); }
.pulse--counting { background: var(--color-secondary); animation: pulse-warn 1s infinite ease-in-out; }

.status-bar--active { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); }
.pulse--active { background: var(--color-success); animation: pulse-success 1s infinite ease-in-out; }

.status-tooltip-card {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 94, 0, 0.15);
  border-radius: 14px;
  padding: 16px;
  z-index: 1200;
  box-shadow: 0 10px 45px rgba(255, 94, 0, 0.08), 0 4px 15px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dark-theme .status-tooltip-card {
  background: rgba(15, 15, 15, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-premium), 0 10px 40px rgba(0, 0, 0, 0.35);
}
.tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}
.dark-theme .tooltip-header { border-bottom-color: rgba(255, 255, 255, 0.08); }
.header-icon { font-size: 18px; color: var(--color-primary); }
.tooltip-header h4 { font-size: 13px; font-weight: 700; color: var(--color-text-primary); text-transform: uppercase; margin: 0; }
.dark-theme .tooltip-header h4 { color: #FFFFFF; }
.tooltip-body { display: flex; flex-direction: column; gap: 12px; max-height: 220px; overflow-y: auto; }
.status-group { display: flex; flex-direction: column; gap: 6px; }
.group-title { font-size: 11px; font-weight: 800; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

.text-success { color: var(--color-success); }
.bg-success { background: var(--color-success); }
.text-warning { color: var(--color-secondary); }
.dark-theme .text-warning { color: var(--color-secondary); }
.bg-warning { background: var(--color-secondary); }
.text-error { color: var(--color-error); }
.bg-error { background: var(--color-error); }
.text-primary { color: var(--color-primary); }
.bg-primary { background: var(--color-primary); }

.riders-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.rider-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid rgba(0, 0, 0, 0.03);
}
.dark-theme .rider-badge { border: 1px solid rgba(255, 255, 255, 0.05); }
.badge-success { background: rgba(16, 185, 129, 0.1); color: var(--color-success); }
.badge-warning { background: rgba(251, 191, 36, 0.12); color: var(--status-pre-registered-color); }
.dark-theme .badge-warning { background: rgba(251, 191, 36, 0.15); color: var(--color-secondary); }
.badge-error { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
.badge-primary { background: rgba(255, 94, 0, 0.1); color: var(--color-primary); }
.badge-name { font-weight: 500; opacity: 0.8; }
.pulse-dot-mini { animation: pulse-mini-anim 1s infinite alternate ease-in-out; }

@keyframes pulse-mini-anim { from { opacity: 0.4; } to { opacity: 1; } }
@keyframes pulse-neutral { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.3); opacity: 0.1; } }
@keyframes pulse-warn {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(251, 191, 36, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
}
@keyframes pulse-success {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
