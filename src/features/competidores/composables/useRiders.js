import { ref, reactive, watch } from 'vue';
import { getRiders, createRider, updateRider, updateRiderStatus, retireRider, revertRetireRider, deleteRider, assignRiderPlate, issueRiderProfileLink, issueRiderDossierLink, markRiderProfileLinkSent, markRiderDossierLinkSent } from '../services/riderService';
import { getCategories } from '../services/categoryService';

// Estado reactivo global único (Singleton) para compartir entre el Header y la Vista
const riders = ref([]);
const categories = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

const filters = reactive({
  search: '',
  category_id: '',
  incomplete_only: false,
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
      
      let list = await getRiders(activeFilters);
      if (filters.incomplete_only) {
        list = list.filter((r) => r.profile_incomplete);
      }
      riders.value = list;
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

  // Asigna o reasigna número de placa
  async function assignPlate(riderId, plateNumber) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      await assignRiderPlate(riderId, plateNumber);
      await fetchRiders();
      return true;
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al asignar el número de placa.';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Enlace para que el piloto complete su ficha
  async function getProfileLink(riderId, regenerate = false) {
    errorMessage.value = '';
    try {
      return await issueRiderProfileLink(riderId, { regenerate });
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al generar el enlace de ficha.';
      return null;
    }
  }

  async function getDossierLink(riderId, regenerate = false) {
    errorMessage.value = '';
    try {
      return await issueRiderDossierLink(riderId, { regenerate });
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al generar el enlace de Mi carrera.';
      return null;
    }
  }

  function patchRider(riderId, fields) {
    const idx = riders.value.findIndex((r) => r.id === riderId);
    if (idx === -1) return;
    riders.value[idx] = { ...riders.value[idx], ...fields };
  }

  async function markProfileLinkSent(riderId) {
    try {
      const data = await markRiderProfileLinkSent(riderId);
      if (data?.profile_link_sent_at) {
        patchRider(riderId, { profile_link_sent_at: data.profile_link_sent_at });
      }
      return true;
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'No se pudo registrar el envío de ficha.';
      return false;
    }
  }

  async function markDossierLinkSent(riderId) {
    try {
      const data = await markRiderDossierLinkSent(riderId);
      if (data?.dossier_link_sent_at) {
        patchRider(riderId, { dossier_link_sent_at: data.dossier_link_sent_at });
      }
      return true;
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'No se pudo registrar el envío de Mi carrera.';
      return false;
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
    () => [filters.search, filters.category_id, filters.incomplete_only],
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
    assignPlate,
    getProfileLink,
    getDossierLink,
    markProfileLinkSent,
    markDossierLinkSent,
    removeRider,
  };
}
