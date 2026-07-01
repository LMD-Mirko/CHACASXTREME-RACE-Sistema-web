<template>
  <div 
    :data-tooltip="content" 
    :data-tooltip-align="align" 
    class="app-tooltip"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  content: {
    type: String,
    required: true
  },
  align: {
    type: String,
    default: 'center' // center or right
  }
});
</script>

<style scoped>
.app-tooltip {
  display: inline-flex;
}
</style>
