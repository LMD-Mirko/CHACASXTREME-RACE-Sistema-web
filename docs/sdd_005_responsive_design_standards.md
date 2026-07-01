# DOCUMENTO 5: ESTÁNDARES DE DISEÑO RESPONSIVO Y MOBILE-FIRST (SDD-005)

Este documento formaliza las **5 reglas de diseño inquebrantables** que gobiernan la construcción de cada componente, vista y layout del sistema Chacas Xtreme Race. El cumplimiento de estas reglas no es opcional; es parte de la definición de "terminado" para cualquier tarea de UI.

---

## Regla 1: Filosofía "Mobile-First" Estricta

> **Contexto:** El staff de campo opera desde teléfonos en el cerro de Chacas, bajo condiciones de poca batería, red 3G/4G inestable y sol directo.

El CSS base **sin media queries** define siempre el comportamiento en **pantalla móvil**. Los breakpoints solo expanden y reorganizan, nunca contraen.

### Implementación en Código

```css
/* ✅ CORRECTO: Mobile-First con min-width */
.nav-item {
  /* Estilos base → Móvil */
  padding: 14px 16px;
  font-size: 14px;
}

@media (min-width: 1024px) {
  /* Expansión hacia escritorio */
  .nav-item {
    padding: 10px 16px;
    font-size: 13px;
  }
}

/* ❌ PROHIBIDO: Desktop-First con max-width en estructuras principales */
@media (max-width: 1024px) {
  .nav-item {
    /* Esto obliga al motor a re-parsear en móvil */
  }
}
```

### Breakpoints Oficiales del Proyecto

| Nombre       | Condición CSS          | Dispositivo objetivo          |
|-------------|------------------------|-------------------------------|
| **Base**    | (sin query)            | Celulares del staff (< 600px) |
| **Tablet**  | `min-width: 600px`     | Tablets de coordinación       |
| **Desktop** | `min-width: 1024px`    | Laptops de cronometraje       |
| **Wide**    | `min-width: 1440px`    | Monitores de sala de control  |

> **Regla de rendimiento:** Los navegadores móviles no procesan las reglas dentro de `@media (min-width: 1024px)` ya que esa condición no se cumple. Esto **reduce el trabajo del renderizador** en el dispositivo con menor potencia.

---

## Regla 2: Dimensionamiento Fluido y Prevención de Desbordamientos

> **Contexto:** La interfaz debe verse correctamente en celulares de 320px, tablets de 768px y monitores de 2560px.

### Prohibiciones Absolutas

- **❌ Prohibido:** anchos fijos (`width: 450px`) en contenedores estructurales de datos.
- **❌ Prohibido:** alturas fijas en tarjetas que contengan datos variables del backend.

### Reglas Obligatorias

```css
/* ✅ Anchos elásticos con límite máximo centrado */
.card-piloto {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

/* ✅ Grid fluido de columnas elásticas */
.riders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ✅ Truncado semántico de texto variable de DB */
.piloto-nombre {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
```

> **Regla de texto:** Cualquier campo que almacene datos variables del backend (nombres de competidores, categorías, marcas de tiempo) **debe implementar truncado con `text-overflow: ellipsis`** para evitar que el texto rompa el layout en pantallas estrechas.

---

## Regla 3: Ergonomía y Diseño de Zonas Táctiles Activas

> **Contexto:** El personal de cronometraje opera con los dedos, bajo presión de tiempo, posiblemente con guantes o en movimiento.

### Métricas Obligatorias de Toque (Touch Targets)

| Tipo de Elemento         | Altura Mínima | Referencia          |
|--------------------------|---------------|---------------------|
| Botones de acción rápida | **56px**      | Material Design M3  |
| Inputs de formulario     | **48px**      | Apple HIG           |
| Ítems de navegación      | **48px**      | WCAG 2.5.5 (AAA)    |
| Filas de selección/lista | **52px**      | Material Design M3  |

```css
/* ✅ Zona táctil correcta para botón de acción rápida */
.btn-accion {
  min-height: 56px;
  padding: 0 24px;
  user-select: none; /* ← Inhibición de selección involuntaria */
}

/* ✅ Input táctil correcto */
.manka-input {
  height: 48px;
  font-size: 16px; /* 16px evita el zoom automático en iOS */
}
```

### Inhibición de Selección Involuntaria

Todos los **botones de acción rápida**, **filas de lista interactiva** y **controles de captura de marcas** deben aplicar `user-select: none` para evitar que una pulsación rápida o repetida active la selección de texto nativa del navegador móvil.

```css
.btn-marcar, .rider-row, .btn-captura {
  user-select: none;
  -webkit-tap-highlight-color: transparent; /* Elimina el flash azul en iOS */
  touch-action: manipulation; /* Deshabilita el doble-tap zoom en Android */
}
```

---

## Regla 4: Mutación de Componentes por Jerarquía de Control

> Los componentes no se encogen. **Cambian de forma** según el contexto de uso.

### Tabla de Mutaciones Obligatorias

| Componente      | En Desktop                              | En Móvil (< 600px)                          |
|-----------------|-----------------------------------------|---------------------------------------------|
| **Tabla datos** | `<table>` horizontal multi-columna      | Grid de `<cards>` verticales apiladas       |
| **Modal**       | Cuadro flotante centrado `max-w: 480px` | Bottom-sheet de ancho 100%, altura flexible |
| **Select**      | Dropdown nativo `<select>`              | Bottom-sheet con filas táctiles de 52px     |
| **Sidebar**     | Visible permanente, fijo lateral        | Overlay deslizante desde la izquierda       |
| **Header**      | Fijo horizontal con datos completos     | Compacto con menú hamburguesa               |

### Implementación del Patrón de Mutación en Vue 3

```vue
<script setup>
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';

// Detección reactiva del tipo de dispositivo
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 600);
</script>

<template>
  <!-- ✅ Mutación de tabla a cards en móvil -->
  <table v-if="!isMobile">...</table>
  <div v-else class="riders-cards">...</div>
</template>
```

> **Nota:** Se usa `@vueuse/core` (ya incluido en `package.json`) para la detección reactiva del viewport, evitando listeners manuales de `resize`.

---

## Regla 5: Inyección Dinámica de Clases de Estado

> Los estilos visuales deben ser **reactivos al estado de la base de datos**. Un cambio de estado en el backend debe reflejarse visualmente sin modificar el template.

### Catálogo de Estados Centralizado

Todos los módulos que muestren el estado de un competidor **deben importar y usar** el mapa de estilos centralizado:

```js
// src/core/constants/riderStatusStyles.js

/**
 * Catálogo centralizado de estilos por estado del competidor.
 * Permite que el cambio de diseño de un estado impacte toda la UI automáticamente.
 */
export const RIDER_STATUS_STYLES = {
  en_carrera: {
    label: 'En Carrera',
    icon: 'directions_run',
    colorClass: 'status--racing',
    badgeColor: '#FF5E00',
  },
  llego: {
    label: 'Llegó',
    icon: 'check_circle',
    colorClass: 'status--finished',
    badgeColor: '#10B981',
  },
  DNF: {
    label: 'DNF',
    icon: 'cancel',
    colorClass: 'status--dnf',
    badgeColor: '#EF4444',
  },
  DNS: {
    label: 'DNS',
    icon: 'remove_circle',
    colorClass: 'status--dns',
    badgeColor: '#6B7280',
  },
};
```

### Uso en Componentes

```vue
<script setup>
import { computed } from 'vue';
import { RIDER_STATUS_STYLES } from '@/core/constants/riderStatusStyles';

const props = defineProps({ rider: Object });

// Obtener el estilo correspondiente al estado del backend
const statusStyle = computed(
  () => RIDER_STATUS_STYLES[props.rider.status] ?? RIDER_STATUS_STYLES['DNS']
);
</script>

<template>
  <!-- ✅ La clase de color se hereda del catálogo, no se codifica aquí -->
  <div class="rider-card" :class="statusStyle.colorClass">
    <span class="material-icons">{{ statusStyle.icon }}</span>
    <span class="status-label">{{ statusStyle.label }}</span>
  </div>
</template>
```

---

## Resumen de Verificación (Checklist Pre-Merge)

Antes de considerar cualquier componente "terminado", el desarrollador debe verificar:

- [ ] ✅ Los estilos base son Mobile-First (sin `max-width` en la base).
- [ ] ✅ No existe ningún ancho fijo en contenedores de datos.
- [ ] ✅ Los textos variables tienen `text-overflow: ellipsis`.
- [ ] ✅ Todos los elementos clickables tienen `min-height: 48px`.
- [ ] ✅ Los botones de acción rápida tienen `user-select: none` y `touch-action: manipulation`.
- [ ] ✅ Los modales mutan a bottom-sheets en móvil.
- [ ] ✅ Las tablas mutan a cards en pantallas < 600px.
- [ ] ✅ Los estados visuales se heredan del catálogo `RIDER_STATUS_STYLES`.
