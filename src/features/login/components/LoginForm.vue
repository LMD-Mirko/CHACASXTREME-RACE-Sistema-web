<template>
  <div class="form-card">
    <!-- Encabezado de Logo para Móvil (Oculto en Escritorio) -->
    <div class="mobile-logo-header">
      <img src="../../../assets/logo.png" alt="Chacas Xtreme Logo" class="mobile-logo" />
    </div>

    <h2 class="form-title">INICIAR SESIÓN</h2>
    <p class="form-subtitle">Ingresa tus credenciales para acceder al sistema</p>

    <form @submit.prevent="submitLogin" class="login-form">
      <!-- Entrada de Usuario -->
      <div class="input-group">
        <label for="username">Usuario</label>
        <div class="input-wrapper">
          <span class="material-icons input-icon">person</span>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="Ingresa tu usuario"
            class="manka-input"
            autocomplete="username"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
          />
        </div>
      </div>

      <!-- Entrada de Contraseña -->
      <div class="input-group">
        <label for="password">Contraseña</label>
        <div class="input-wrapper">
          <span class="material-icons input-icon">lock</span>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="••••••••"
            class="manka-input manka-input--password"
            autocomplete="current-password"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
          />
          <button
            type="button"
            class="toggle-password-btn"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>
      </div>

      <div class="options-row">
        <label class="remember-checkbox-label">
          <input type="checkbox" v-model="rememberMe" class="manka-checkbox" />
          <span>Recordar usuario y contraseña</span>
        </label>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorMessage" class="error-alert fade-in">
        <span class="material-icons">error_outline</span>
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Botón de Envío -->
      <button type="submit" :disabled="isLoading" class="btn-submit">
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>INGRESAR AL SISTEMA</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../hooks/useAuth';

const router = useRouter();
const { login, errorMessage, isLoading } = useAuth();

const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);

const CRED_USER = 'saved_username';
const CRED_PASS = 'saved_password_b64';

function encodeCred(value) {
  try {
    return btoa(unescape(encodeURIComponent(value)));
  } catch {
    return '';
  }
}

function decodeCred(value) {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return '';
  }
}

onMounted(() => {
  const savedUser = localStorage.getItem(CRED_USER);
  const savedPass = localStorage.getItem(CRED_PASS);
  if (savedUser) {
    username.value = savedUser;
    rememberMe.value = true;
  }
  if (savedPass) {
    password.value = decodeCred(savedPass);
    rememberMe.value = true;
  }
});

const submitLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) return;

  const user = username.value.trim();
  const pass = password.value.trim();
  const ok = await login(user, pass);
  if (ok) {
    if (rememberMe.value) {
      localStorage.setItem(CRED_USER, user);
      localStorage.setItem(CRED_PASS, encodeCred(pass));
    } else {
      localStorage.removeItem(CRED_USER);
      localStorage.removeItem(CRED_PASS);
      localStorage.removeItem('saved_password');
    }
    const role = localStorage.getItem('user_role')?.toUpperCase();
    if (role === 'PARTIDA') {
      router.push('/dashboard/partida');
    } else if (role === 'INTERMEDIO') {
      router.push('/dashboard/checkpoint');
    } else if (role === 'META') {
      router.push('/dashboard/meta');
    } else {
      router.push('/dashboard/competidores');
    }
  }
};
</script>

<style scoped>
.form-card {
  width: 100%;
  max-width: 400px;
}
.mobile-logo-header {
  display: none;
  text-align: center;
  margin-bottom: 32px;
}
.mobile-logo {
  height: 80px;
  filter: drop-shadow(0 0 10px rgba(255, 94, 0, 0.3));
}
.mobile-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--color-primary);
  margin-top: 8px;
}
.form-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
}
.form-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 6px;
  margin-bottom: 32px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.input-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 16px;
  color: var(--color-text-secondary);
  font-size: 20px;
}
.manka-input {
  width: 100%;
  height: 50px;
  padding-left: 48px;
  padding-right: 16px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background-color: var(--color-input-bg);
  color: var(--color-text-primary);
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
}
.manka-input--password {
  padding-right: 48px;
}
.manka-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(255, 94, 0, 0.15);
}
.toggle-password-btn {
  position: absolute;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
}
.toggle-password-btn:hover {
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.08);
}
.toggle-password-btn .material-icons {
  font-size: 22px;
}
.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.remember-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}
.manka-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.error-alert {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 12px;
}
.error-alert span {
  font-size: 18px;
}
.btn-submit {
  width: 100%;
  height: 50px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-family: var(--font-family);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .mobile-logo-header {
    display: block;
  }
}
</style>
