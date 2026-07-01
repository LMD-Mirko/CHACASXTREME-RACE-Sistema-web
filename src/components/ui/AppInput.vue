<template>
  <div 
    class="app-input-wrapper" 
    :class="{ 
      'app-input-wrapper--has-icon': icon, 
      'app-input-wrapper--has-prefix': prefix 
    }"
  >
    <span v-if="icon" class="material-icons input-icon">{{ icon }}</span>
    <span v-if="prefix" class="input-prefix">{{ prefix }}</span>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      class="app-input"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: 'text'
  },
  placeholder: String,
  icon: String,
  prefix: String,
  required: Boolean,
  disabled: Boolean,
  id: String,
  min: [Number, String],
  max: [Number, String]
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.app-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.app-input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
}

.app-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 94, 0, 0.1);
}

.app-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Con Icono */
.app-input-wrapper--has-icon .app-input {
  padding-left: 40px;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-secondary);
  font-size: 20px;
  pointer-events: none;
  display: inline-flex;
}

/* Con Prefijo */
.app-input-wrapper--has-prefix .app-input {
  padding-left: 32px;
}

.input-prefix {
  position: absolute;
  left: 14px;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 15px;
  pointer-events: none;
  user-select: none;
}
</style>
