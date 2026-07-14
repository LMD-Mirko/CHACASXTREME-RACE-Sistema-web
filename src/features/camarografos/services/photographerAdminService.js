import api from '../../../core/network/axios.js';

export async function listPhotographers() {
  const response = await api.get('/api/admin/photographers');
  return response.data.data || [];
}

export async function createPhotographer(payload) {
  const response = await api.post('/api/admin/photographers', payload);
  return response.data.data;
}

export async function updatePhotographer(id, payload) {
  const response = await api.patch(`/api/admin/photographers/${id}`, payload);
  return response.data.data;
}

export async function issuePhotographerAccessLink(id, options = {}) {
  const response = await api.post(`/api/admin/photographers/${id}/access-link`, {
    regenerate: Boolean(options.regenerate),
  });
  return response.data.data;
}
