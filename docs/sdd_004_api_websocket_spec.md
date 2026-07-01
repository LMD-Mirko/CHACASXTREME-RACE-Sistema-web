# DOCUMENTO 4: ESPECIFICACIÓN TÉCNICA DE LA API Y EVENTOS WEB_SOCKETS (SDD-004)

Este documento consolida la arquitectura de endpoints de comunicación de la API REST y el mapeo de los flujos de WebSockets a través de canales de Laravel Echo/Pusher en la aplicación Vue 3 de Chacas Xtreme Race.

---

## 1. Listado Maestro de Endpoints (API REST)

Todas las llamadas HTTP se realizan usando la instancia de Axios centralizada con la cabecera `Accept: application/json` y el token Bearer en `Authorization`.

### 1.1. Autenticación de Dispositivos (useAuth.js)
*   `POST /api/login` $\rightarrow$ Autentica y devuelve el token Sanctum junto al rol del usuario.
*   `POST /api/logout` $\rightarrow$ Invalida el token del dispositivo de forma segura.

### 1.2. Operaciones de Línea de Largada (Rol: PARTIDA)
*   `POST /api/category-starts/trigger` $\rightarrow$ Dispara la largada masiva Avalancha de una categoría, pasando los pilotos al estado `en_carrera`.
*   `POST /api/category-starts/reset` $\rightarrow$ Reabrea la largada por error y devuelve a los pilotos al estado `pre_inscrito`.
*   `POST /api/category-starts/close` $\rightarrow$ Cierra la partida de la categoría.

### 1.3. Telemetría de Checkpoints (Rol: INTERMEDIO)
*   `POST /api/checkpoint-passes` $\rightarrow$ Registra el paso de un piloto por número de placa en el checkpoint.
*   `POST /api/offline-sync` $\rightarrow$ Sincronización en lote de marcas guardadas en el navegador en IndexedDB/localStorage durante cortes de señal.
*   `POST /api/riders/{id}/retire` $\rightarrow$ Reporta retiro/accidente (DNF) de un corredor en un checkpoint.

### 1.4. Cronometraje Central y Búfer de Meta (Rol: META)
*   `POST /api/finish-time-queue` $\rightarrow$ Laptop: Congela el timestamp exacto del cruce de meta (Gatillo ciego).
*   `GET /api/finish-time-queue` $\rightarrow$ Celulares: Listado de marcas en cola en estado `pendiente` (FIFO).
*   `POST /api/finish-time-queue/{id}/assign` $\rightarrow$ Asocia un tiempo congelado con el número de placa verificado.
*   `POST /api/finish-time-queue/{id}/annul` $\rightarrow$ Descarta una marcación de tiempo inválida de la cola.
*   `POST /api/finish-time-queue/clear-pending` $\rightarrow$ Purga los tiempos en cola al final del día.

### 1.5. Administración (Rol: ADMIN)
*   `GET /api/riders` $\rightarrow$ Buscador y listado completo de pilotos registrados.
*   `POST /api/riders` $\rightarrow$ Registro de piloto (Multipart Form-Data para foto).
*   `POST /api/riders/{id}` $\rightarrow$ Actualización de piloto (Multipart Form-Data + `_method: "PUT"`).
*   `GET /api/categories` $\rightarrow$ Listado de categorías oficiales de competencia.

---

## 2. Matriz de Conexión de WebSockets (Laravel Echo)

El frontend web se suscribe a los canales en tiempo real mediante Laravel Echo y PusherJS:

```javascript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
window.Echo = new Echo({
    broadcaster: 'reverb', // Motor WebSocket nativo de Laravel 11
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
});
```

### 2.1. Canal: `race-mountain` (Logística de Ruta)
*   **Evento:** `.CategoryMangaStarted`
    *   `window.Echo.channel('race-mountain').listen('.CategoryMangaStarted', (data) => { ... })`
*   **Evento:** `.RiderIncidentReported` (Alerta DNF)
    *   `window.Echo.channel('race-mountain').listen('.RiderIncidentReported', (data) => { ... })`

### 2.2. Canal: `race-timing` (Cronometraje)
*   **Evento:** `.TimeFreezedInMeta` (Pulsador ciego en laptop)
    *   `window.Echo.channel('race-timing').listen('.TimeFreezedInMeta', (data) => { ... })`
*   **Evento:** `.RiderFinished` (Tiempo neto asignado)
    *   `window.Echo.channel('race-timing').listen('.RiderFinished', (data) => { ... })`
