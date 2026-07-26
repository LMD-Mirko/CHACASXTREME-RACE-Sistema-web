import api from '../../../core/network/axios';

/**
 * Registra una marca de paso por checkpoint en vivo.
 * @param {Object} data - Datos de la marca.
 * @param {number} data.plate_number - Número de placa.
 * @param {string} data.checkpoint_name - Nombre del checkpoint.
 * @param {string} data.phase - Fase activa ('practica' o 'final').
 * @param {string} [data.exact_time] - Opcional. Marca de tiempo formateada.
 * @returns {Promise<Object>} Datos de la marca creada.
 */
export async function storeCheckpointPass(data) {
  const response = await api.post('/api/checkpoint-passes', data);
  return response.data.data;
}

/**
 * Actualiza el corredor asociado a una marca de checkpoint.
 * @param {number} passId - ID del registro de paso.
 * @param {number} plateNumber - Nuevo número de placa.
 * @returns {Promise<Object>} Datos actualizados.
 */
export async function updateCheckpointPass(passId, plateNumber) {
  const response = await api.put(`/api/checkpoint-passes/${passId}`, {
    plate_number: plateNumber
  });
  return response.data.data;
}

/**
 * Elimina una marca de checkpoint.
 * @param {number} passId - ID del registro de paso.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function deleteCheckpointPass(passId) {
  const response = await api.delete(`/api/checkpoint-passes/${passId}`);
  return response.data;
}

/**
 * Sincroniza un lote de marcas de paso capturadas offline.
 * @param {Array} syncItems - Lista de marcas capturadas offline.
 * @returns {Promise<Object>} Resultado de la sincronización.
 */
export async function offlineSync(syncItems) {
  const response = await api.post('/api/offline-sync', {
    sync_items: syncItems
  });
  return response.data;
}

/**
 * Retira a un piloto en pista (DNF).
 * @param {number} riderId - ID del piloto.
 * @param {string} checkpointName - Nombre del checkpoint de retiro.
 * @returns {Promise<Object>} Datos actualizados del piloto.
 */
export async function retireRider(riderId, checkpointName) {
  const response = await api.post(`/api/riders/${riderId}/retire`, {
    checkpoint_name: checkpointName
  });
  return response.data.data;
}

/**
 * Revierte el retiro DNF de un corredor (lo regresa a en_carrera).
 * @param {number} riderId - ID del piloto.
 * @returns {Promise<Object>} Datos del piloto.
 */
export async function revertRetireRider(riderId) {
  const response = await api.post(`/api/riders/${riderId}/revert-retire`);
  return response.data.data;
}

/**
 * Obtiene los pilotos en carrera con su información de salida y competencia.
 * @returns {Promise<Object>} Datos del evento y listado de pilotos en carrera.
 */
export async function getInRaceRiders() {
  const response = await api.get('/api/riders/in-race');
  return response.data;
}
