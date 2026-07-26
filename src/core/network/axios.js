import axios from 'axios';
import { BACKEND_API_BASE_URL } from './backend.js';

const api = axios.create({
  baseURL: BACKEND_API_BASE_URL,
  timeout: 30000,
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
    // Dejar que el navegador ponga el boundary en multipart
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Content-Type', undefined);
      } else if (config.headers) {
        delete config.headers['Content-Type'];
      }
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
