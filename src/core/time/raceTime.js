/**
 * Utilidades de tiempo de carrera.
 * Convención: las marcas naive (sin zona) son hora de pared en Perú (America/Lima, UTC-5).
 * Nunca se debe forzar 'Z' (UTC) sobre un string naive — eso desfasaba ~5h en deploy.
 */

export const RACE_TIMEZONE = 'America/Lima'
/** Perú no usa horario de verano */
export const RACE_UTC_OFFSET = '-05:00'

/** Offset ms: server_time - device_time (positivo si el server va adelantado) */
let serverOffsetMs = 0
let lastSyncAt = 0

export function getServerOffsetMs() {
  return serverOffsetMs
}

/**
 * Alinea el reloj del dispositivo con /api/server-time.
 * Usar al montar el dashboard (y periódicamente).
 */
export async function syncServerClock(fetcher) {
  const t0 = Date.now()
  let data
  try {
    const res = typeof fetcher === 'function'
      ? await fetcher()
      : await fetcher.get('/api/server-time')
    data = res?.data?.data || res?.data || res
  } catch (err) {
    // No tumbar la UI si el backend aún no tiene la ruta o está reiniciando
    if (import.meta.env.DEV) {
      console.warn('[raceTime] Reloj: sync omitido (API no disponible todavía).')
    }
    return false
  }
  const t1 = Date.now()
  const rtt = Math.max(0, t1 - t0)
  const serverMs = typeof data?.unix_ms === 'number'
    ? data.unix_ms
    : parseRaceTimeToEpoch(data?.server_time)
  if (serverMs == null || Number.isNaN(serverMs)) return false

  // Descarte offsets absurdos (> 2h) por reloj de servidor mal configurado
  const tentative = serverMs - (t0 + rtt / 2)
  if (Math.abs(tentative) > 2 * 60 * 60 * 1000) {
    console.warn('[raceTime] Offset absurdo ignorado:', tentative)
    return false
  }

  serverOffsetMs = tentative
  lastSyncAt = Date.now()
  if (import.meta.env.DEV) {
    console.info('[raceTime] Reloj sincronizado. offset_ms=', Math.round(serverOffsetMs), 'rtt=', rtt)
  }
  return true
}

function nowAligned(date = new Date()) {
  if (!(date instanceof Date)) date = new Date(date)
  return new Date(date.getTime() + serverOffsetMs)
}

/**
 * Hora actual alineada al servidor, formato API: Y-m-d H:i:s.v
 */
export function formatDeviceRaceTime(date = new Date()) {
  const d = nowAligned(date)
  const pad = (n, size = 2) => String(n).padStart(size, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.` +
    `${pad(d.getMilliseconds(), 3)}`
  )
}

/**
 * Convierte cualquier marca de carrera a epoch ms (instante absoluto).
 */
export function parseRaceTimeToEpoch(timeStr) {
  if (timeStr == null || timeStr === '') return null

  if (timeStr instanceof Date) {
    const ms = timeStr.getTime()
    return Number.isNaN(ms) ? null : ms
  }

  let s = String(timeStr).trim()
  if (!s) return null

  if (/^\d{4}-\d{2}-\d{2} /.test(s)) {
    s = s.replace(' ', 'T')
  }

  s = s.replace(/(\.\d{3})\d+/, '$1')

  const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s)
  if (!hasTz) {
    s = `${s}${RACE_UTC_OFFSET}`
  }

  const ms = Date.parse(s)
  return Number.isNaN(ms) ? null : ms
}

export function formatRaceClock(timeStr) {
  const ms = parseRaceTimeToEpoch(timeStr)
  if (ms == null) return '—'

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: RACE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ms))

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('hour')}:${get('minute')}:${get('second')}`
}

export function formatRaceClockMs(timeStr) {
  const ms = parseRaceTimeToEpoch(timeStr)
  if (ms == null) return '—'
  const frac = String(ms % 1000).padStart(3, '0')
  return `${formatRaceClock(timeStr)}.${frac}`
}

export function formatTimeOnly(timeStr) {
  return formatRaceClock(timeStr)
}

export function formatTimeStr(timeStr) {
  return formatRaceClock(timeStr)
}

export function getLastClockSyncAt() {
  return lastSyncAt
}
