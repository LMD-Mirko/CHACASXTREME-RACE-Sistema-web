# DOCUMENTO 3: ESTÁNDARES DE CODIFICACIÓN ENTERPRISE Y CLEAN CODE (SDD-003)

Este documento fija las reglas de control de calidad del código, inmutabilidad, límites de longitud de archivos y estándares de composición en Vue 3 para Chacas Xtreme Race.

## 1. Métricas de Longitud Estrictas (Límites de Líneas)

Para forzar el desacoplamiento y evitar la creación de ficheros de componente densos (God Components), se aplicarán las siguientes restricciones de volumen:
*   **Límite de Fichero Componente (`.vue`):** Máximo 250 líneas de código por archivo Single File Component (SFC). Si un componente supera este umbral, el desarrollador está obligado a fragmentar la interfaz y extraer los sub-componentes atómicos hacia la carpeta local `/components/`.
*   **Límite de Métodos y Funciones:** Máximo 40 líneas de código por función. Cada método debe cumplir una única función aislada de forma limpia.
*   **Límite Horizontal:** Máximo 80 caracteres por línea para facilitar la lectura vertical.

---

## 2. Sintaxis Oficial: SFC con `<script setup>` y Composition API

Se prohíbe el uso de la sintaxis antigua de Options API (`data()`, `methods`, `computed:`). Todos los componentes nuevos deben utilizar el enfoque de Composition API estructurado en un solo bloque con `<script setup>`:

```vue
<!-- Plantilla de Componente de Ejemplo -->
<template>
  <div class="rider-card">
    <h3>{{ rider.fullName }}</h3>
    <p>Estado: {{ rider.raceStatus }}</p>
    <button @click="updateStatus">Actualizar</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Definición de Props inmutables
const props = defineProps({
  rider: {
    type: Object,
    required: true
  }
});

// Definición de Emits
const emit = defineEmits(['update']);

// Lógica de Negocio
const updateStatus = () => {
  const updatedRider = { ...props.rider, raceStatus: 'llego' };
  emit('update', updatedRider);
};
</script>

<style scoped>
.rider-card {
  background-color: var(--color-surface);
  border-radius: 10px;
  padding: 16px;
}
</style>
```

---

## 3. Inmutabilidad y Flujo de Datos Unidireccional
*   **Props de lectura:** Las propiedades (`props`) recibidas por un componente son de solo lectura y no se pueden mutar directamente en el hijo.
*   **Mutaciones mediante Clones:** Si se requiere mutar un estado local, se debe clonar el objeto utilizando desestructuración `{ ...objeto }` o `structuredClone(objeto)` antes de emitir los cambios al componente padre o guardar en el Service Hook.

---

## 4. Idioma de los Comentarios en el Código Fuente
*   **Comentarios en Español:** A partir de ahora, todos los comentarios y justificaciones técnicas en el código fuente (comentarios de bloque, comentarios inline, documentación de funciones JSDoc) deben ser escritos estrictamente en español.

