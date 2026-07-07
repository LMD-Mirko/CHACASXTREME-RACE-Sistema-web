import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bucks-chair-provincial-paul.trycloudflare.com/',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones para inyectar dinámicamente el Token API de Sanctum
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores globales de manera limpia
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Ocurrió un error inesperado de comunicación.';

    if (error.response) {
      const { status, data } = error.response;
      if (data && data.message) {
        message = data.message;
      } else {
        message = `Error del servidor (${status}).`;
      }

      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
      }
    } else if (error.request) {
      message = 'No se pudo conectar con el servidor. Verifica que tu backend esté corriendo y en la misma red.';
    }

    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export default api;
