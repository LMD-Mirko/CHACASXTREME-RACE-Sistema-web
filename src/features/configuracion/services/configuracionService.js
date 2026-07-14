import api from '../../../core/network/axios';

// ─── GESTIÓN DE USUARIOS (STAFF) ──────────────────────────────────────────
export async function getUsers() {
  const response = await api.get('/api/users');
  return response.data.data;
}

export async function createUser(userData) {
  const response = await api.post('/api/users', userData);
  return response.data.data;
}

export async function updateUser(id, userData) {
  const response = await api.put(`/api/users/${id}`, userData);
  return response.data.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
}

// ─── GESTIÓN DE CATEGORÍAS ───────────────────────────────────────────────
export async function getCategories() {
  const response = await api.get('/api/categories');
  return response.data.data;
}

export async function createCategory(name) {
  const response = await api.post('/api/categories', { name });
  return response.data.data;
}

export async function updateCategory(id, name) {
  const response = await api.put(`/api/categories/${id}`, { name });
  return response.data.data;
}

export async function deleteCategory(id) {
  const response = await api.delete(`/api/categories/${id}`);
  return response.data;
}

// ─── PARÁMETROS GLOBALES DE COMPETENCIA ───────────────────────────────────
export async function getActiveCompetition() {
  const response = await api.get('/api/competitions/active');
  return response.data.data;
}

export async function updateCompetitionPhase(id, phase) {
  const response = await api.post(`/api/competitions/${id}/phase`, { phase });
  return response.data.data;
}

export async function finalizeCategory(competitionId, categoryId) {
  const response = await api.post(`/api/competitions/${competitionId}/finalize-category`, {
    category_id: categoryId
  });
  return response.data.data;
}

export async function resetCompetitionResults(competitionId, scope = 'all') {
  const response = await api.post(`/api/competitions/${competitionId}/reset-results`, { scope });
  return response.data;
}

export async function prepareFinal(competitionId) {
  const response = await api.post(`/api/competitions/${competitionId}/prepare-final`);
  return response.data;
}
