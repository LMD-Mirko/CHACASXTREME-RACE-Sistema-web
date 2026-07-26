import api from '../../../core/network/axios';

/**
 * Envía una petición de inicio de sesión al backend de Laravel.
 */
export async function loginRequest(username, password) {
  const response = await api.post('/api/login', {
    username,
    password,
  });
  return response.data;
}

/**
 * Envía una petición de cierre de sesión al backend de Laravel.
 */
export async function logoutRequest() {
  await api.post('/api/logout');
}

