<template>
  <div class="app-select" :class="{ 'app-select--open': isOpen }" ref="selectRef">
    <!-- Botón / campo disparador -->
    <div
      class="select-trigger"
      :class="{
        'select-trigger--open': isOpen,
        'select-trigger--disabled': disabled,
        'select-trigger--search': searchable,
      }"
      @click="onTriggerClick"
      :tabindex="searchable ? -1 : 0"
      @keydown.space.prevent="!searchable && toggleDropdown()"
      @keydown.enter.prevent="!searchable && toggleDropdown()"
      @keydown.escape="closeDropdown"
    >
      <div class="trigger-content">
        <span v-if="icon" class="material-icons trigger-icon">{{ icon }}</span>

        <input
          v-if="searchable"
          ref="searchInputRef"
          v-model="searchQuery"
          class="search-input"
          type="text"
          inputmode="search"
          autocomplete="off"
          :placeholder="selectedLabel || placeholder"
          :disabled="disabled"
          @focus="openDropdown"
          @keydown.down.prevent="highlightNext(1)"
          @keydown.up.prevent="highlightNext(-1)"
          @keydown.enter.prevent="selectHighlighted"
          @keydown.escape.prevent="closeDropdown"
        />
        <span
          v-else
          class="trigger-label"
          :class="{ 'placeholder-style': !selectedLabel }"
        >
          {{ selectedLabel || placeholder }}
        </span>
      </div>
      <span class="material-icons arrow-icon">expand_more</span>

      <!-- Selector nativo solo en móvil y sin búsqueda -->
      <select
        v-if="isMobile && !searchable"
        class="native-mobile-select"
        :value="modelValue"
        @change="onNativeChange"
        :disabled="disabled"
      >
        <option value="" disabled selected>{{ placeholder }}</option>
        <option v-for="opt in formattedOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <Transition name="slide-fade">
      <ul v-if="isOpen && !(isMobile && !searchable)" class="options-list" role="listbox">
        <li
          v-for="(opt, idx) in visibleOptions"
          :key="opt.value"
          class="option-item"
          :class="{
            'option-item--selected': String(opt.value) === String(modelValue),
            'option-item--active': idx === highlightIndex,
          }"
          @mousedown.prevent="selectOption(opt.value)"
          @mouseenter="highlightIndex = idx"
        >
          <span>{{ opt.label }}</span>
          <span
            v-if="String(opt.value) === String(modelValue)"
            class="material-icons check-icon"
          >check</span>
        </li>
        <li v-if="visibleOptions.length === 0" class="empty-option">
          {{ searchable && searchQuery.trim() ? 'Sin coincidencias' : 'Sin opciones' }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Seleccione una opción' },
  icon: String,
  disabled: Boolean,
  /** Permite escribir para filtrar por placa / nombre / label */
  searchable: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'change']);
const isOpen = ref(false);
const selectRef = ref(null);
const searchInputRef = ref(null);
const isMobile = ref(false);
const searchQuery = ref('');
const highlightIndex = ref(0);

const formattedOptions = computed(() => {
  return props.options.map((opt) => {
    if (opt && typeof opt === 'object') {
      const value = opt.value !== undefined ? opt.value : (opt.id !== undefined ? opt.id : opt);
      const label = opt.label !== undefined ? opt.label : (opt.name !== undefined ? opt.name : opt);
      const plate = opt.plate != null
        ? String(opt.plate)
        : String(label).match(/^#?\s*(\d+)/)?.[1] || '';
      const searchText = opt.searchText != null
        ? String(opt.searchText)
        : String(label);
      return {
        value,
        label: String(label),
        plate,
        searchText,
      };
    }
    return { value: opt, label: String(opt), plate: '', searchText: String(opt) };
  });
});

const selectedLabel = computed(() => {
  const active = formattedOptions.value.find(
    (opt) => String(opt.value) === String(props.modelValue),
  );
  return active ? active.label : '';
});

const visibleOptions = computed(() => {
  if (!props.searchable) return formattedOptions.value;
  const raw = String(searchQuery.value || '').trim();
  if (!raw) return formattedOptions.value;
  const q = normalize(raw);

  // Solo dígitos → filtrar por número de placa (prefijo / exacto), no por categoría.
  if (/^\d+$/.test(raw)) {
    const matches = formattedOptions.value.filter((opt) => {
      const plate = String(opt.plate || '').replace(/\D/g, '');
      return plate === raw || plate.startsWith(raw);
    });
    return matches.slice().sort((a, b) => {
      const pa = String(a.plate || '').replace(/\D/g, '');
      const pb = String(b.plate || '').replace(/\D/g, '');
      if (pa === raw && pb !== raw) return -1;
      if (pb === raw && pa !== raw) return 1;
      return Number(pa) - Number(pb);
    });
  }

  return formattedOptions.value.filter((opt) => {
    const hay = normalize(opt.searchText || opt.label);
    return hay.includes(q);
  });
});

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function openDropdown() {
  if (props.disabled) return;
  isOpen.value = true;
  highlightIndex.value = 0;
  if (props.searchable) {
    nextTick(() => searchInputRef.value?.focus());
  }
}

function closeDropdown() {
  isOpen.value = false;
  searchQuery.value = '';
  highlightIndex.value = 0;
}

function toggleDropdown() {
  if (props.disabled) return;
  if (isOpen.value) closeDropdown();
  else openDropdown();
}

function onTriggerClick() {
  if (props.disabled) return;
  if (props.searchable) {
    openDropdown();
    return;
  }
  if (!isMobile.value) toggleDropdown();
}

function selectOption(val) {
  emit('update:modelValue', val);
  emit('change', val);
  closeDropdown();
}

function selectHighlighted() {
  const opt = visibleOptions.value[highlightIndex.value];
  if (opt) selectOption(opt.value);
}

function highlightNext(dir) {
  const len = visibleOptions.value.length;
  if (!len) return;
  if (!isOpen.value) openDropdown();
  highlightIndex.value = (highlightIndex.value + dir + len) % len;
}

function onNativeChange(event) {
  const val = event.target.value;
  const match = formattedOptions.value.find((opt) => String(opt.value) === String(val));
  if (match) selectOption(match.value);
}

function checkViewport() {
  isMobile.value = window.innerWidth < 600;
}

const handleDocumentClick = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) closeDropdown();
};

watch(searchQuery, () => {
  highlightIndex.value = 0;
});

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) searchQuery.value = '';
  },
);

onMounted(() => {
  checkViewport();
  window.addEventListener('resize', checkViewport);
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkViewport);
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<style scoped>
.app-select {
  position: relative;
  width: 100%;
  user-select: none;
}

.app-select--open {
  z-index: 50;
}

.select-trigger {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text-primary);
  font-size: 15px;
  cursor: pointer;
  outline: none;
  position: relative;
}

.select-trigger:focus,
.select-trigger--open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 94, 0, 0.1);
}

.select-trigger--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-trigger--search {
  cursor: text;
}

.trigger-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.trigger-icon {
  font-size: 20px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.trigger-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 15px;
  font-family: inherit;
  padding: 0;
}

.search-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.85;
}

.placeholder-style {
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.arrow-icon {
  font-size: 20px;
  color: var(--color-text-secondary);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.select-trigger--open .arrow-icon {
  transform: rotate(180deg);
}

.native-mobile-select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

.options-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 6px 0;
  margin: 0;
  list-style: none;
  max-height: 240px;
  overflow-y: auto;
  z-index: 1100;
  box-shadow: var(--shadow-premium), 0 8px 30px rgba(0, 0, 0, 0.12);
}

.option-item {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  gap: 8px;
}

.option-item span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-item:hover,
.option-item--active {
  background: rgba(255, 94, 0, 0.05);
  color: var(--color-primary);
}

.option-item--selected {
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.03);
}

.check-icon {
  font-size: 18px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.empty-option {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
