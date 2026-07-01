import api from '../../../core/network/axios';

/**
 * Obtiene la lista completa de categorías de la carrera.
 * @returns {Promise<Array>} Lista de categorías.
 */
export async function getCategories() {
  const response = await api.get('/api/categories');
  return response.data.data;
}
