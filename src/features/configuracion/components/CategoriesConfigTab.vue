<template>
  <div class="tab-pane">
    <div class="pane-header">
      <h3>Categorías de Carrera</h3>
      <AppButton icon="add" @click="openCreateCategoryModal">
        Nueva Categoría
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
      <span>Cargando categorías...</span>
    </div>
    
    <AppTable v-else :items="categories" :headers="categoryHeaders">
      <template #cell-actions="{ item }">
        <div class="actions-cell">
          <AppTooltip content="Renombrar categoría">
            <AppButton
              variant="icon-action"
              icon="edit"
              @click="openEditCategoryModal(item)"
            />
          </AppTooltip>

          <AppTooltip content="Eliminar categoría" align="right">
            <AppButton
              variant="icon-action"
              icon="delete"
              class="btn-delete"
              @click="handleDeleteCategory(item)"
            />
          </AppTooltip>
        </div>
      </template>

      <template #card="{ item }">
        <div class="category-mobile-card">
          <span>{{ item.name }}</span>
          <div class="actions-cell">
            <AppButton variant="icon-action" icon="edit" @click="openEditCategoryModal(item)" />
            <AppButton variant="icon-action" icon="delete" class="btn-delete" @click="handleDeleteCategory(item)" />
          </div>
        </div>
      </template>
    </AppTable>

    <CategoryFormModal
      :is-open="isModalOpen"
      :category="selectedCategory"
      :is-saving="saving"
      @close="isModalOpen = false"
      @save="handleSaveCategory"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/configuracionService';
import CategoryFormModal from './CategoryFormModal.vue';

const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const isModalOpen = ref(false);
const selectedCategory = ref(null);

const alertMessage = ref('');
const alertType = ref('success');

const categoryHeaders = [
  { key: 'name', label: 'Nombre de la Categoría' },
  { key: 'actions', label: 'Acciones', alignClass: 'text-right' },
];

function showAlert(message, type = 'success') {
  alertMessage.value = message;
  alertType.value = type;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadCategories() {
  loading.value = true;
  try {
    categories.value = await getCategories();
  } catch (err) {
    showAlert('Error al cargar categorías', 'error');
  } finally {
    loading.value = false;
  }
}

function openCreateCategoryModal() {
  selectedCategory.value = null;
  isModalOpen.value = true;
}

function openEditCategoryModal(cat) {
  selectedCategory.value = cat;
  isModalOpen.value = true;
}

async function handleSaveCategory({ id, name }) {
  saving.value = true;
  try {
    if (id) {
      await updateCategory(id, name);
      showAlert('Categoría renombrada con éxito');
    } else {
      await createCategory(name);
      showAlert('Categoría creada con éxito');
    }
    isModalOpen.value = false;
    await loadCategories();
  } catch (err) {
    showAlert(err.friendlyMessage || 'Error al guardar categoría', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleDeleteCategory(cat) {
  if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${cat.name}"?`)) {
    try {
      await deleteCategory(cat.id);
      showAlert('Categoría eliminada correctamente');
      await loadCategories();
    } catch (err) {
      showAlert(err.friendlyMessage || 'Error al eliminar categoría', 'error');
    }
  }
}

onMounted(loadCategories);
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

.category-mobile-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-premium);
  font-weight: 600;
  color: var(--color-text-primary);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-mobile-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
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
