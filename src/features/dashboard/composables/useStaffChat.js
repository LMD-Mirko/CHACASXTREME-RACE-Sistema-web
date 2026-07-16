import { ref, computed } from 'vue';
import api from '../../core/network/axios.js';

const messages = ref([]);
const unread = ref(0);
const panelOpen = ref(false);
const loadingHistory = ref(false);
const sending = ref(false);
const error = ref('');
const toast = ref('');
let toastTimer = null;
let channelBound = false;
let historyLoaded = false;

function upsertMessage(msg) {
  if (!msg?.id) return;
  const idx = messages.value.findIndex((m) => m.id === msg.id);
  if (idx !== -1) {
    messages.value[idx] = msg;
    return;
  }
  messages.value.push(msg);
  messages.value.sort((a, b) => a.id - b.id);
  if (messages.value.length > 150) {
    messages.value = messages.value.slice(-120);
  }
}

function showToast(text) {
  toast.value = text;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = '';
  }, 3200);
}

function playSoftPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    /* ignore */
  }
}

function onIncoming(payload) {
  const msg = payload?.id ? payload : null;
  if (!msg) return;
  const existed = messages.value.some((m) => m.id === msg.id);
  upsertMessage(msg);
  if (existed) return;

  // No toast/badge si soy yo (por si el broadcast llega sin toOthers)
  const myId = Number(localStorage.getItem('user_id') || 0);
  if (myId && Number(msg.user?.id) === myId) return;

  if (panelOpen.value) return;

  unread.value += 1;
  const who = msg.user?.name || 'Staff';
  const preview = String(msg.body || '').slice(0, 80);
  showToast(`${who}: ${preview}`);
  playSoftPing();
}

export function useStaffChat() {
  const hasUnread = computed(() => unread.value > 0);

  async function loadHistory() {
    if (loadingHistory.value) return;
    loadingHistory.value = true;
    error.value = '';
    try {
      const res = await api.get('/api/staff-chat', { params: { limit: 80 } });
      const list = res.data?.data || [];
      messages.value = list;
      historyLoaded = true;
    } catch (e) {
      error.value = e.friendlyMessage || e.message || 'No se pudo cargar el chat.';
    } finally {
      loadingHistory.value = false;
    }
  }

  function ensureStaffChatChannel() {
    if (!window.Echo || channelBound) return !!channelBound;
    try {
      const ch = window.Echo.private('staff.chat');
      ch.listen('.StaffChatMessageSent', onIncoming);
      channelBound = true;
      return true;
    } catch (e) {
      console.warn('[staff-chat] subscribe failed', e);
      return false;
    }
  }

  async function openPanel() {
    panelOpen.value = true;
    unread.value = 0;
    toast.value = '';
    ensureStaffChatChannel();
    if (!historyLoaded || messages.value.length === 0) {
      await loadHistory();
    }
  }

  function closePanel() {
    panelOpen.value = false;
  }

  function togglePanel() {
    if (panelOpen.value) closePanel();
    else openPanel();
  }

  async function sendMessage(raw) {
    const body = String(raw || '').trim();
    if (!body || sending.value) return null;
    if (body.length > 500) {
      error.value = 'Máximo 500 caracteres.';
      return null;
    }
    sending.value = true;
    error.value = '';
    try {
      const res = await api.post('/api/staff-chat', { body });
      const msg = res.data?.data;
      if (msg) upsertMessage(msg);
      return msg;
    } catch (e) {
      error.value = e.friendlyMessage || e.response?.data?.message || e.message || 'No se pudo enviar.';
      return null;
    } finally {
      sending.value = false;
    }
  }

  return {
    messages,
    unread,
    hasUnread,
    panelOpen,
    loadingHistory,
    sending,
    error,
    toast,
    ensureStaffChatChannel,
    loadHistory,
    openPanel,
    closePanel,
    togglePanel,
    sendMessage,
  };
}
