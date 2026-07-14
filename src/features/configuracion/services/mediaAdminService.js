import api from '../../../core/network/axios';

function toFormData(fields, fileKey, file) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    fd.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  });
  if (file) fd.append(fileKey, file);
  return fd;
}

// ─── Auspiciadores ───────────────────────────────────────────────────────────
export async function listSponsorsAdmin() {
  const { data } = await api.get('/api/admin/sponsors');
  return data.data || [];
}

export async function createSponsor(payload, logoFile) {
  const fd = toFormData(payload, 'logo_file', logoFile);
  const { data } = await api.post('/api/sponsors', fd);
  return data.data;
}

export async function updateSponsor(id, payload, logoFile = null) {
  const fd = toFormData(payload, 'logo_file', logoFile);
  fd.append('_method', 'PUT');
  const { data } = await api.post(`/api/sponsors/${id}`, fd);
  return data.data;
}

export async function deleteSponsor(id) {
  const { data } = await api.delete(`/api/sponsors/${id}`);
  return data;
}

// ─── Galería marketing ───────────────────────────────────────────────────────
export async function listGalleryTypes() {
  const { data } = await api.get('/api/gallery-types');
  return data.data || [];
}

export async function listGalleryAdmin() {
  const { data } = await api.get('/api/gallery');
  return data.data || [];
}

export async function createGalleryItem(payload, imageFile) {
  const fd = toFormData(payload, 'image_file', imageFile);
  const { data } = await api.post('/api/gallery', fd);
  return data.data;
}

export async function updateGalleryItem(id, payload, imageFile = null) {
  const fd = toFormData(payload, 'image_file', imageFile);
  fd.append('_method', 'PUT');
  const { data } = await api.post(`/api/gallery/${id}`, fd);
  return data.data;
}

export async function deleteGalleryItem(id) {
  const { data } = await api.delete(`/api/gallery/${id}`);
  return data;
}

// ─── Media carrera Edición 4 (ZIP) ───────────────────────────────────────────
export async function fetchEdition4MediaStats() {
  const { data } = await api.get('/api/admin/edition4-media/stats');
  return data.data || {};
}

export async function downloadEdition4MediaZip(payload) {
  const response = await api.post('/api/admin/edition4-media/download', payload, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] || '';
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || `edicion4-media-${Date.now()}.zip`;

  const blob = new Blob([response.data], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
