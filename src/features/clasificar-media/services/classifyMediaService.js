import api from '../../../core/network/axios';

/**
 * Lista media de la competencia activa (por defecto solo General).
 */
export async function listAdminRaceMedia(params = {}) {
  const { data } = await api.get('/api/admin/race-media', { params });
  return data;
}

export async function assignRaceMedia(mediaId, riderId) {
  const { data } = await api.patch(`/api/admin/race-media/${mediaId}`, {
    rider_id: riderId,
  });
  return data;
}

export async function assignRaceMediaBulk(mediaIds, riderId) {
  const { data } = await api.post('/api/admin/race-media/assign-bulk', {
    media_ids: mediaIds,
    rider_id: riderId,
  });
  return data;
}

export async function unassignRaceMedia(mediaId) {
  const { data } = await api.post(`/api/admin/race-media/${mediaId}/unassign`);
  return data;
}

export async function searchRidersForAssign(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const { data } = await api.get('/api/riders', {
    params: { search: q, has_plate: 1 },
  });
  return data.data || [];
}

/** Descarga el ORIGINAL (no el preview web). */
export async function downloadAdminRaceMediaOriginal(item) {
  const id = item?.id;
  if (!id) throw new Error('Media inválido');

  const { data } = await api.get(`/api/admin/race-media/${id}/download`, {
    responseType: 'blob',
    timeout: 600000,
  });

  const blob = data instanceof Blob ? data : new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = item.original_filename || `media-${id}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
