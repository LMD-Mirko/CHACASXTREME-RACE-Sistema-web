<template>
  <div class="app-select" :class="{ 'app-select--open': isOpen }" ref="selectRef">
    <!-- Botón disparador del selector -->
    <div
      class="select-trigger"
      :class="{ 'select-trigger--open': isOpen, 'select-trigger--disabled': disabled }"
      @click="toggleDropdown"
      tabindex="0"
      @keydown.space.prevent="toggleDropdown"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.escape="isOpen = false"
    >
      <div class="trigger-content">
        <span v-if="icon" class="material-icons trigger-icon">{{ icon }}</span>
        <span class="trigger-label" :class="{ 'placeholder-style': !selectedLabel }">
          {{ selectedLabel || placeholder }}
        </span>
      </div>
      <span class="material-icons arrow-icon">expand_more</span>

      <!-- Selector Nativo Oculto para Móviles (Evita cortes de CSS y usa selector OS) -->
      <select
        v-if="isMobile"
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

    <!-- Dropdown desplegable con opciones (Solo Desktop) -->
    <Transition name="slide-fade">
      <ul v-if="isOpen && !isMobile" class="options-list">
        <li
          v-for="opt in formattedOptions"
          :key="opt.value"
          class="option-item"
          :class="{ 'option-item--selected': opt.value === modelValue }"
          @click="selectOption(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <span v-if="opt.value === modelValue" class="material-icons check-icon">check</span>
        </li>
        <li v-if="formattedOptions.length === 0" class="empty-option">Sin opciones</li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Seleccione una opción' },
  icon: String,
  disabled: Boolean,
});

const emit = defineEmits(['update:modelValue', 'change']);
const isOpen = ref(false);
const selectRef = ref(null);
const isMobile = ref(false);

const formattedOptions = computed(() => {
  return props.options.map((opt) => {
    if (opt && typeof opt === 'object') {
      const value = opt.value !== undefined ? opt.value : (opt.id !== undefined ? opt.id : opt);
      const label = opt.label !== undefined ? opt.label : (opt.name !== undefined ? opt.name : opt);
      return { value, label };
    }
    return { value: opt, label: opt };
  });
});

const selectedLabel = computed(() => {
  const active = formattedOptions.value.find((opt) => opt.value === props.modelValue);
  return active ? active.label : '';
});

function toggleDropdown() {
  if (!props.disabled && !isMobile.value) isOpen.value = !isOpen.value;
}

function selectOption(val) {
  emit('update:modelValue', val);
  emit('change', val);
  isOpen.value = false;
}

function onNativeChange(event) {
  const val = event.target.value;
  const match = formattedOptions.value.find(opt => opt.value.toString() === val.toString());
  if (match) selectOption(match.value);
}

function checkViewport() {
  isMobile.value = window.innerWidth < 600;
}

const handleDocumentClick = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) isOpen.value = false;
};

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
  z-index: 50; /* Raise stacking context when dropdown is open */
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

.trigger-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.trigger-icon {
  font-size: 20px;
  color: var(--color-text-secondary);
}

.trigger-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placeholder-style {
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.arrow-icon {
  font-size: 20px;
  color: var(--color-text-secondary);
  transition: transform 0.25s ease;
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
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.option-item:hover {
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
