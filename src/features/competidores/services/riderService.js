import api from '../../../core/network/axios';

/**
 * Obtiene el listado de pilotos filtrados opcionalmente por búsqueda o categoría.
 * @param {Object} params - Filtros opcionales.
 * @param {string} [params.search] - Nombre, DNI, apodo o placa del piloto.
 * @param {number|string} [params.category_id] - ID de la categoría.
 * @returns {Promise<Array>} Lista de pilotos.
 */
export async function getRiders(params = {}) {
  const response = await api.get('/api/riders', { params });
  return response.data.data;
}

/**
 * Registra un nuevo piloto en el sistema.
 * @param {FormData} formData - Datos del piloto e imagen adjunta.
 * @returns {Promise<Object>} Datos del piloto creado.
 */
export async function createRider(formData) {
  const response = await api.post('/api/riders', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}

/**
 * Actualiza los datos de un piloto existente.
 * Usamos FormData con _method: 'PUT' para compatibilidad con subida de archivos en Laravel.
 * @param {number|string} id - ID del piloto.
 * @param {FormData} formData - Datos del piloto actualizados.
 * @returns {Promise<Object>} Datos del piloto modificado.
 */
export async function updateRider(id, formData) {
  // Laravel requiere _method = 'PUT' en peticiones POST multipart/form-data
  if (formData instanceof FormData && !formData.has('_method')) {
    formData.append('_method', 'PUT');
  }
  const response = await api.post(`/api/riders/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}

/**
 * Cambia manualmente el estado de carrera de un piloto.
 * @param {number|string} id - ID del piloto.
 * @param {string} status - Nuevo estado de carrera.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function updateRiderStatus(id, status) {
  const response = await api.post(`/api/riders/${id}/status`, { status });
  return response.data.data;
}

/**
 * Declara el retiro de carrera de un piloto (DNF).
 * @param {number|string} id - ID del piloto.
 * @param {string} checkpointName - Nombre del punto de control donde se retira.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function retireRider(id, checkpointName) {
  const response = await api.post(`/api/riders/${id}/retire`, {
    checkpoint_name: checkpointName,
  });
  return response.data.data;
}

/**
 * Revierte el estado de retiro (DNF) de un piloto.
 * @param {number|string} id - ID del piloto.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function revertRetireRider(id) {
  const response = await api.post(`/api/riders/${id}/revert-retire`);
  return response.data.data;
}

/**
 * Elimina un piloto del sistema.
 * @param {number|string} id - ID del piloto.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function deleteRider(id) {
  const response = await api.delete(`/api/riders/${id}`);
  return response.data;
}
