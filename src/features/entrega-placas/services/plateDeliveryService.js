import api from '../../../core/network/axios';

/**
 * Competidores con número de placa asignado.
 * @param {Object} params
 * @param {string} [params.search]
 * @param {boolean|string} [params.plate_delivered]
 */
export async function getRidersWithPlate(params = {}) {
  const response = await api.get('/api/riders', {
    params: {
      has_plate: 1,
      ...params,
    },
  });
  return response.data.data || [];
}

/**
 * Marca o desmarca entrega física de placa.
 * @param {number|string} id
 * @param {boolean} delivered
 */
export async function setPlateDelivered(id, delivered) {
  const response = await api.patch(`/api/riders/${id}/plate-delivery`, {
    delivered: Boolean(delivered),
  });
  return response.data.data;
}
