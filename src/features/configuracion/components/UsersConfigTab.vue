<template>
  <div class="tab-pane">
    <div class="pane-header">
      <h3>Usuarios de Staff</h3>
      <AppButton icon="person_add" @click="openCreateUserModal">
        Nuevo Usuario
      </AppButton>
    </div>

    <!-- Alert Messages -->
    <div v-if="alertMessage" class="alert-banner" :class="`alert-banner--${alertType}`">
      <span class="material-icons">
        {{ alertType === 'error' ? 'error_outline' : 'check_circle_outline' }}
      </span>
      <span>{{ alertMessage }}</span>
      <button class="btn-close-alert" @click="alertMessage = ''">
        <span class="material-icons">close</span>
      </button>
    </div>

    <div v-if="loading" class="loading-spinner">
      <span class="material-icons rotating">sync</span>
      <span>Cargando usuarios...</span>
    </div>
    
    <AppTable v-else :items="users" :headers="userHeaders">
      <template #cell-role="{ item }">
        <span class="role-badge" :class="item.role?.toLowerCase()">
          {{ item.role }}
        </span>
      </template>

      <template #cell-actions="{ item }">
        <div class="actions-cell">
          <AppTooltip content="Editar usuario">
            <AppButton
              variant="icon-action"
              icon="edit"
              @click="openEditUserModal(item)"
            />
          </AppTooltip>

          <AppTooltip content="Eliminar usuario" align="right">
            <AppButton
              variant="icon-action"
              icon="delete"
              class="btn-delete"
              @click="handleDeleteUser(item)"
            />
          </AppTooltip>
        </div>
      </template>

      <template #card="{ item }">
        <div class="staff-card">
          <div class="staff-card-main">
            <span class="role-badge" :class="item.role?.toLowerCase()">
              {{ item.role }}
            </span>
            <h4 class="staff-username">@{{ item.username }}</h4>
          </div>
          <div class="staff-card-footer">
            <div class="actions-cell">
              <AppButton variant="icon-action" icon="edit" @click="openEditUserModal(item)" />
              <AppButton variant="icon-action" icon="delete" class="btn-delete" @click="handleDeleteUser(item)" />
            </div>
          </div>
        </div>
      </template>
    </AppTable>

    <UserFormModal
      :is-open="isModalOpen"
      :user="selectedUser"
      :is-saving="saving"
      @close="isModalOpen = false"
      @save="handleSaveUser"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getUsers, createUser, updateUser, deleteUser } from '../services/configuracionService';
import UserFormModal from './UserFormModal.vue';

const users = ref([]);
const loading = ref(false);
const saving = ref(false);
const isModalOpen = ref(false);
const selectedUser = ref(null);

const alertMessage = ref('');
const alertType = ref('success');

const userHeaders = [
  { key: 'username', label: 'Usuario' },
  { key: 'role', label: 'Rol Asignado' },
  { key: 'actions', label: 'Acciones', alignClass: 'text-right' },
];

function showAlert(message, type = 'success') {
  alertMessage.value = message;
  alertType.value = type;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadUsers() {
  loading.value = true;
  try {
    users.value = await getUsers();
  } catch (err) {
    showAlert(err.friendlyMessage || 'Error al cargar usuarios', 'error');
  } finally {
    loading.value = false;
  }
}

function openCreateUserModal() {
  selectedUser.value = null;
  isModalOpen.value = true;
}

function openEditUserModal(user) {
  selectedUser.value = user;
  isModalOpen.value = true;
}

async function handleSaveUser({ id, data }) {
  saving.value = true;
  try {
    if (id) {
      await updateUser(id, data);
      showAlert('Usuario actualizado con éxito');
    } else {
      await createUser(data);
      showAlert('Usuario creado con éxito');
    }
    isModalOpen.value = false;
    await loadUsers();
  } catch (err) {
    showAlert(err.friendlyMessage || 'Error al guardar usuario', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleDeleteUser(user) {
  if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.name}"?`)) {
    try {
      await deleteUser(user.id);
      showAlert('Usuario eliminado correctamente');
      await loadUsers();
    } catch (err) {
      showAlert(err.friendlyMessage || 'Error al eliminar usuario', 'error');
    }
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pane-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--color-text-secondary);
}

.rotating {
  font-size: 28px;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
  display: inline-flex;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.role-badge.admin {
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
  border: 1px solid currentColor;
}

.role-badge.partida {
  background: rgba(245, 158, 11, 0.08);
  color: #F59E0B;
  border: 1px solid currentColor;
}

.role-badge.intermedio {
  background: rgba(59, 130, 246, 0.08);
  color: #3B82F6;
  border: 1px solid currentColor;
}

.role-badge.meta {
  background: rgba(16, 185, 129, 0.08);
  color: #10B981;
  border: 1px solid currentColor;
}

.actions-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.btn-delete:hover:not(:disabled)) {
  border-color: var(--color-error) !important;
  color: var(--color-error) !important;
  background: rgba(239, 68, 68, 0.05) !important;
}

.staff-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-premium);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.staff-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.staff-card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.staff-username {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.staff-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

/* Alert Banner */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  position: relative;
  font-weight: 500;
}

.alert-banner--success {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.alert-banner--error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.btn-close-alert {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
