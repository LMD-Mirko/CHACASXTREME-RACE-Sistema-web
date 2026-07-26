# DOCUMENTO 2: GUÍA DE ESTILO GLOBAL Y COMPONENTES ADAPTATIVOS (SDD-002)

Este documento define las reglas de estandarización visual, la paleta de colores inmutable basada en variables de CSS, la herencia tipográfica y la lógica de mutación de componentes en el frontend de Chacas Xtreme Race.

## 1. Centralización Estética (Variables CSS)

Queda prohibida la declaración de colores hexadecimales de forma aislada en las hojas de estilo o componentes. Todo elemento visual debe heredar las variables CSS centralizadas en el archivo global `src/style.css`.

La paleta está optimizada para entornos de alta luminosidad en exteriores (cerro de Chacas), implementando una interfaz oscura mate para mitigar reflejos, así como una interfaz clara con tonalidades crema cálidas para evitar fondos blancos puros.

### 1.1. Tabla de Variables CSS globales

```css
/* core/theme/style.css */
:root {
  /* Colores Base de Marca */
  --color-primary: #FF5E00;      /* Naranja Vibrante */
  --color-secondary: #FBBF24;    /* Amarillo Dorado */
  --color-accent-red: #E11D48;   /* Rojo de la 'X' de ChacasXtreme */
  --color-error: #EF4444;        /* Alerta médica DNF */

  /* Tema Claro (Warm Cream) */
  --color-background: #FFF8F5;   /* Blanco tirando a naranja */
  --color-surface: #FFF0EA;      /* Contenedores crema cálidos */
  --color-text-primary: #111827; /* Texto carbón oscuro */
  --color-text-secondary: #6B7280; /* Subtítulos gris medio */
  
  --font-family: 'Poppins', sans-serif;
}

/* Tema Oscuro (Fondo 100% Negro) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #000000;
    --color-surface: #0F0F0F;
    --color-text-primary: #FFFFFF;
    --color-text-secondary: #A0A0A0;
  }
}

/* O mediante clase .dark toggle activa */
.dark-theme {
  --color-background: #000000;
  --color-surface: #0F0F0F;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A0A0A0;
}
```

### 1.2. Iconografía
Para garantizar la uniformidad, se utilizará exclusivamente la fuente de iconos nativa de Material Design:
`<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">`

---

## 2. Reglas de Diseño Adaptativo y Breakpoints

> ⚠️ **Ver documento completo:** [sdd_005_responsive_design_standards.md](./sdd_005_responsive_design_standards.md) para el tratado completo de las 5 reglas de diseño Mobile-First del proyecto.

### 2.1. Puntos de Quiebre (CSS Media Queries) — Estándar Mobile-First

El CSS **base sin prefijos** define siempre el comportamiento en **celular**. Los breakpoints son exclusivamente **ascendentes** (`min-width`):

| Nombre       | Condición CSS          | Dispositivo objetivo              |
|-------------|------------------------|-----------------------------------|
| **Base**    | (sin query)            | Celulares del staff (< 600px)     |
| **Tablet**  | `min-width: 600px`     | Tablets de coordinación           |
| **Desktop** | `min-width: 1024px`    | Laptops de cronometraje           |
| **Wide**    | `min-width: 1440px`    | Monitores de sala de control      |

```css
/* ✅ CORRECTO — Mobile-First: base en móvil, se expande hacia arriba */
.componente {
  /* Estilo base → Celular */
}
@media (min-width: 1024px) {
  .componente {
    /* Expansión → Desktop */
  }
}
```

### 2.2. Componentes Camaleónicos en la Web

*   **Campos de Texto (Inputs):**
    *   **Base (Móvil):** Altura mínima `48px`, `font-size: 16px` (evita zoom automático en iOS).
    *   **Desktop** `@media (min-width: 1024px)`: Altura compacta `40px`, `font-size: 14px`.
*   **Selectores (Selects):**
    *   **Base (Móvil):** Bottom-sheet emergente desde la base con filas táctiles de `min-height: 52px`.
    *   **Desktop:** Selector nativo `<select>` o dropdown compacto.
*   **Cuadros de Diálogo (Modales):**
    *   **Base (Móvil):** Bottom-sheet de `100%` ancho, botones masivos de `56px`.
    *   **Desktop:** Modal flotante centrado con `max-width: 480px`.
*   **Listados vs Tablas:**
    *   **Base (Móvil):** Cards verticales apiladas. Número de placa en tamaño grande, nombre truncado con `text-overflow: ellipsis`.
    *   **Desktop:** `<table>` horizontal multi-columna.
