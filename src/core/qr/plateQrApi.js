import api from '../network/axios';

export async function resolvePlateQr(payload) {
  const { data } = await api.post('/api/plate-qr/resolve', { payload });
  return data?.data?.rider || null;
}
