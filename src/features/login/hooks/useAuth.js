import { ref, computed } from 'vue';
import { loginRequest, logoutRequest } from '../services/authService';

const localToken = localStorage.getItem('auth_token');
const localRole = localStorage.getItem('user_role');

const user = ref(localToken && localRole ? {
  role: localRole,
  name: 'Staff ' + localRole.toLowerCase(),
} : null);
const token = ref(localToken);
const isLoading = ref(false);
const errorMessage = ref(null);

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);
  const currentUser = computed(() => user.value);

  const login = async (username, password) => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const data = await loginRequest(username, password);
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_role', data.data.role);
      
      token.value = data.token;
      user.value = {
        id: data.data.id,
        name: data.data.name,
        username: data.data.username,
        email: data.data.email,
        role: data.data.role,
      };
      
      return true;
    } catch (error) {
      errorMessage.value = error.friendlyMessage ?? 'Error al iniciar sesión.';
      token.value = null;
      user.value = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    try {
      await logoutRequest();
    } catch (e) {
      // Ignorar errores de red al cerrar sesión para garantizar la limpieza local
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      isLoading.value = false;
    }
  };

  const restoreSession = () => {
    const localToken = localStorage.getItem('auth_token');
    const localRole = localStorage.getItem('user_role');
    if (localToken && localRole && !user.value) {
      token.value = localToken;
      user.value = {
        role: localRole,
        name: 'Staff ' + localRole.toLowerCase(),
      };
    }
  };

  return {
    user,
    token,
    isLoading,
    errorMessage,
    isAuthenticated,
    currentUser,
    login,
    logout,
    restoreSession,
  };
}
