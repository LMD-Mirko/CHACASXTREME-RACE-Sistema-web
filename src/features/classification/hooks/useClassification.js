import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import api from '../../../core/network/axios';
import '../../../core/network/echo';

export function useClassification() {
  const activeCompetition = ref(null);
  const classifications = ref([]);
  const categories = ref([]);
  const activeCategoryId = ref('all');
  const searchQuery = ref('');
  const isLoading = ref(false);
  const errorMessage = ref(null);
  const isOnline = ref(true);

  // Load categories for filter pills
  async function loadCategories() {
    try {
      const response = await api.get('/api/categories');
      categories.value = response.data.data;
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  }

  // Load active competition
  async function loadActiveCompetition() {
    try {
      const response = await api.get('/api/competitions/active');
      activeCompetition.value = response.data.data;
    } catch (err) {
      errorMessage.value = 'No se encontró una competencia activa.';
    }
  }

  // Load classifications from backend
  async function loadClassifications() {
    if (!activeCompetition.value) return;

    isLoading.value = true;
    errorMessage.value = null;

    try {
      const response = await api.get(`/api/competitions/${activeCompetition.value.id}/classifications`, {
        params: {
          category_id: activeCategoryId.value
        }
      });
      classifications.value = response.data.classifications;
    } catch (err) {
      errorMessage.value = 'Error al cargar la tabla de posiciones.';
    } finally {
      isLoading.value = false;
    }
  }

  // Filtered classifications based on text search query
  const filteredClassifications = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return classifications.value;

    return classifications.value.filter(c => 
      c.plate_number.toString().includes(query) ||
      c.full_name.toLowerCase().includes(query) ||
      (c.club_team && c.club_team.toLowerCase().includes(query)) ||
      (c.origin && c.origin.toLowerCase().includes(query))
    );
  });

  // Echo Listener handler
  function setupWebSocketListener() {
    if (!window.Echo) return;

    // Connect and listen to the public channel (e.g. competition channel or generic race updates)
    window.Echo.channel('competition-channel')
      .listen('.RiderEstimatedArrival', () => {
        loadClassifications();
      })
      .listen('.RiderFinished', () => {
        loadClassifications();
      })
      .listen('.CorrectionsApplied', () => {
        loadClassifications();
      })
      .listen('.CompetitionPhaseChanged', (e) => {
        if (activeCompetition.value) {
          activeCompetition.value.current_phase = e.phase;
        }
        loadClassifications();
      });
  }

  function cleanupWebSocketListener() {
    if (!window.Echo) return;
    window.Echo.leaveChannel('competition-channel');
  }

  onMounted(async () => {
    await loadActiveCompetition();
    await loadCategories();
    await loadClassifications();
    setupWebSocketListener();
  });

  onBeforeUnmount(() => {
    cleanupWebSocketListener();
  });

  return {
    activeCompetition,
    classifications,
    categories,
    activeCategoryId,
    searchQuery,
    isLoading,
    errorMessage,
    isOnline,
    filteredClassifications,
    loadClassifications
  };
}
