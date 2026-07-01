import api from '../../../core/network/axios';

/**
 * Registra un tiempo ciego en la cola de meta.
 * @param {Object} data - Datos del tiempo capturado.
 * @param {number} data.competition_id - ID de la competencia.
 * @param {string} data.blind_timestamp - Marca de tiempo formateada.
 * @returns {Promise<Object>} Datos del elemento creado en la cola.
 */
export async function freezeTime(data) {
  const response = await api.post('/api/finish-time-queue', data);
  return response.data.data;
}

/**
 * Obtiene los tiempos ciegos de la cola de meta.
 * @param {Object} [params] - Parámetros de filtro.
 * @param {string} [params.status='pendiente'] - Estado de la cola ('pendiente', 'assigned', 'annulled').
 * @param {number} [params.limit=50] - Límite de elementos a retornar.
 * @returns {Promise<Array>} Lista de marcas en cola.
 */
export async function getQueue(params = {}) {
  const response = await api.get('/api/finish-time-queue', { params });
  return response.data.data;
}

/**
 * Asigna una placa a un tiempo ciego específico en la cola de meta.
 * @param {number} queueId - ID del registro en la cola.
 * @param {number} plateNumber - Número de placa del corredor.
 * @returns {Promise<Object>} Datos de la asignación.
 */
export async function assignPlate(queueId, plateNumber) {
  const response = await api.post(`/api/finish-time-queue/${queueId}/assign`, {
    plate_number: plateNumber
  });
  return response.data.data;
}

/**
 * Anula una marca de tiempo ciega.
 * @param {number} queueId - ID del registro en la cola.
 * @returns {Promise<Object>} Respuesta de la anulación.
 */
export async function annulTime(queueId) {
  const response = await api.post(`/api/finish-time-queue/${queueId}/annul`);
  return response.data.data;
}

/**
 * Anula en masa todas las marcas de tiempo ciegas pendientes de la competencia activa.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function clearAllPendingTimes() {
  const response = await api.post('/api/finish-time-queue/clear-pending');
  return response.data;
}

/**
 * Busca un piloto en carrera por número de placa.
 * @param {number|string} plateNumber - Número de placa.
 * @returns {Promise<Object>} Datos del competidor.
 */
export async function getInRaceRiderByPlate(plateNumber) {
  const response = await api.get('/api/riders/search-in-race', {
    params: { plate_number: plateNumber }
  });
  return response.data;
}
