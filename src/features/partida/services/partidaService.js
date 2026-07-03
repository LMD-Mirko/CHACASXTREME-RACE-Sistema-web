import api from '../../../core/network/axios';

/**
 * Obtiene la competencia actualmente activa.
 * @returns {Promise<Object>} Datos de la competencia activa.
 */
export async function getActiveCompetition() {
  const response = await api.get('/api/competitions/active');
  return response.data.data;
}

/**
 * Obtiene el listado de categorías oficiales.
 * @returns {Promise<Array>} Lista de categorías.
 */
export async function getCategories() {
  const response = await api.get('/api/categories');
  return response.data.data;
}

/**
 * Obtiene la lista de pilotos filtrada por categoría.
 * @param {number|string} categoryId - ID de la categoría a filtrar.
 * @returns {Promise<Array>} Lista de pilotos.
 */
export async function getRidersByCategory(categoryId) {
  const params = {};
  if (categoryId) {
    params.category_id = categoryId;
  }
  const response = await api.get('/api/riders', { params });
  return response.data.data;
}

/**
 * Registra el inicio masivo (Avalancha) para una categoría y fase específicas.
 * @param {Object} data - Datos de la largada.
 * @param {number|string} data.competition_id - ID de la competencia.
 * @param {number|string} data.category_id - ID de la categoría.
 * @param {string} data.phase - Fase activa ('practica' o 'final').
 * @returns {Promise<Object>} Datos del tiempo de inicio registrado.
 */
export async function triggerCategoryStart(data) {
  const response = await api.post('/api/category-starts/trigger', data);
  return response.data.data;
}

/**
 * Revierte la largada de una categoría (Botón de pánico).
 * Devuelve a los corredores 'en_carrera' al estado 'pre_inscrito'.
 * @param {Object} data - Datos del reinicio.
 * @param {number|string} data.competition_id - ID de la competencia.
 * @param {number|string} data.category_id - ID de la categoría.
 * @param {string} data.phase - Fase activa ('practica' o 'final').
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function resetCategoryStart(data) {
  const response = await api.post('/api/category-starts/reset', data);
  return response.data;
}

/**
 * Cierra la rampa de partida para una categoría.
 * @param {Object} data - Datos del cierre.
 * @param {number|string} data.category_id - ID de la categoría.
 * @param {string} data.phase - Fase activa.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function closeDeparture(data) {
  const response = await api.post('/api/category-starts/close', data);
  return response.data;
}

/**
 * Actualiza el estado de carrera de un piloto individualmente (ej: DNS).
 * @param {number|string} riderId - ID del piloto.
 * @param {string} status - Nuevo estado de carrera ('DNS', 'pre_inscrito', etc.).
 * @returns {Promise<Object>} Datos del piloto actualizados.
 */
export async function updateRiderStatus(riderId, status) {
  const response = await api.post(`/api/riders/${riderId}/status`, { status });
  return response.data.data;
}
