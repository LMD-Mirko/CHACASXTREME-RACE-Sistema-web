# DOCUMENTO 1: ARQUITECTURA DE SOFTWARE Y REPARTO DE RESPONSABILIDADES (SDD-001)

Este documento establece la distribución estructural del código fuente y la delimitación de responsabilidades dentro de la aplicación web desarrollada en Vue 3 para Chacas Xtreme Race.

## 1. Patrón de Arquitectura: Features Modulares de Composición

El proyecto se organiza bajo un enfoque modular web orientado a **Features (Funcionalidades)**. Cada módulo funcional relevante se encapsula en su propio subdirectorio en `src/features/`, dividiéndose rígidamente en cuatro sub-capas (views, hooks, services, components). Esto garantiza el desacoplamiento total de los módulos operativos de campo y facilita el mantenimiento sin efectos secundarios.

## 2. Árbol Estricto de Directorios (src/)

```
src/
│
├── assets/                       # Recursos estáticos globales (imágenes, logos)
│
├── core/                         # Capa de Infraestructura Global (Inmutable)
│   ├── theme/                    # Estilos CSS y variables de color globales (style.css)
│   └── network/                  # Cliente HTTP (Axios centralizado con interceptores)
│
├── features/                     # Carpetas de Funcionalidades (Modulares)
│   │
│   ├── login/                    # Ejemplo de estructura de Feature
│   │   ├── services/             # Servicios API (Llamadas de red puras con Axios)
│   │   │   └── authService.js
│   │   ├── hooks/                # Service Hooks / Composables de estado y reactividad
│   │   │   └── useAuth.js
│   │   ├── views/                # Single File Components principales (Páginas)
│   │   │   └── LoginView.vue
│   │   └── components/           # Sub-componentes visuales atómicos (Menores a 150 líneas)
│   │       ├── ThemeToggle.vue
│   │       ├── BrandingPanel.vue
│   │       └── LoginForm.vue
│   │
│   ├── partida/                  # Rampa de Largada
│   ├── intermedio/               # Checkpoint de Ruta
│   ├── meta/                     # Cronometraje en Meta
│   └── competidores/             # CRUD de Competidores
│
├── router/                       # Enrutador de la Aplicación
│   └── index.js                  # Definición de rutas y Guards de navegación por rol
│
└── App.vue
```

---

## 3. Delimitación Estricta de Responsabilidades por Capa

### 3.1. Servicios (`services/`)
Contiene funciones puras encargadas de realizar llamadas HTTP a la API REST del backend usando la instancia central de Axios. **No pueden importar reactividad de Vue (`ref`, `reactive`) ni modificar estados de UI.** Su única responsabilidad es realizar la petición, retornar el JSON del backend o propagar el error.

### 3.2. Hooks (`hooks/`)
Composables de Vue (Composition API) que actúan como "Service Hooks". Consumen los servicios correspondientes y controlan las variables de estado reactivo. Exponen el estado (`ref`, `computed`) y las funciones desencadenadoras que la UI consumirá de forma reactiva.

### 3.3. Componentes (`components/`)
Sub-componentes visuales Single File Component (SFC) de Vue extraídos para garantizar que ningún archivo supere las **150 líneas de código**. No poseen lógica de ruteo y se limitan a pintar secciones específicas de la interfaz gráfica a través de props y emits.

### 3.4. Vistas (`views/`)
El componente SFC principal de la página (ej. `LoginView.vue`). Actúa como distribuidor, carga y organiza los sub-componentes atómicos de la carpeta `components/`, enlazándolos con el Service Hook (`hook`) de la funcionalidad correspondiente.
