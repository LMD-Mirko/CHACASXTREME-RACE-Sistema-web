import { ref, reactive, watch } from 'vue';
import { getRiders, createRider, updateRider, updateRiderStatus, retireRider, revertRetireRider, deleteRider } from '../services/riderService';
import { getCategories } from '../services/categoryService';

// Estado reactivo global único (Singleton) para compartir entre el Header y la Vista
const riders = ref([]);
const categories = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

const filters = reactive({
  search: '',
  category_id: '',
});

export function useRiders() {

  // Carga corredores aplicando filtros actuales
  async function fetchRiders() {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      const activeFilters = {};
      if (filters.search.trim()) activeFilters.search = filters.search.trim();
      if (filters.category_id) activeFilters.category_id = filters.category_id;
      
      riders.value = await getRiders(activeFilters);
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al obtener la lista de competidores.';
    } finally {
      isLoading.value = false;
    }
  }

  // Carga categorías para el selector
  async function fetchCategories() {
    try {
      categories.value = await getCategories();
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  // Registra o edita un piloto
  async function saveRiderData(riderId, formData) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      if (riderId) {
        await updateRider(riderId, formData);
      } else {
        await createRider(formData);
      }
      await fetchRiders();
      return true;
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al guardar los datos del competidor.';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Cambia el estado del piloto
  async function updateStatus(riderId, status) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      await updateRiderStatus(riderId, status);
      await fetchRiders();
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al actualizar el estado.';
    } finally {
      isLoading.value = false;
    }
  }

  // Declara retiro (DNF)
  async function handleRetire(riderId, checkpointName) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      await retireRider(riderId, checkpointName);
      await fetchRiders();
      return true;
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al registrar el retiro del corredor.';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Revierte el retiro
  async function handleRevertRetire(riderId) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      await revertRetireRider(riderId);
      await fetchRiders();
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al revertir el retiro del corredor.';
    } finally {
      isLoading.value = false;
    }
  }

  // Elimina un piloto del sistema
  async function removeRider(riderId) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      await deleteRider(riderId);
      await fetchRiders();
      return true;
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al eliminar el competidor.';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Recarga reactivamente cuando los filtros cambian (con debounce simple o inmediato)
  watch(
    () => [filters.search, filters.category_id],
    () => {
      fetchRiders();
    }
  );

  return {
    riders,
    categories,
    isLoading,
    errorMessage,
    filters,
    fetchRiders,
    fetchCategories,
    saveRiderData,
    updateStatus,
    handleRetire,
    handleRevertRetire,
    removeRider,
  };
}
