import { ref, computed } from 'vue';
import api from '../../../core/network/axios.js';

const UNREAD_KEY = 'staff_chat_unread';
const LAST_SEEN_KEY = 'staff_chat_last_seen_id';

const messages = ref([]);
const unread = ref(Math.max(0, Number(localStorage.getItem(UNREAD_KEY) || 0) || 0));
const panelOpen = ref(false);
const loadingHistory = ref(false);
const sending = ref(false);
const error = ref('');
const latestIncoming = ref(null);
let channelBound = false;
let historyLoaded = false;
let wsHooked = false;

function persistUnread(n) {
  unread.value = Math.max(0, n);
  localStorage.setItem(UNREAD_KEY, String(unread.value));
}

function bumpUnread() {
  persistUnread(unread.value + 1);
}

function clearUnread() {
  persistUnread(0);
  const last = messages.value[messages.value.length - 1];
  if (last?.id) {
    localStorage.setItem(LAST_SEEN_KEY, String(last.id));
  }
}

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

function playChatPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur, vol = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.02);
    };
    // Dos tonos cortos tipo aviso staff
    beep(880, 0, 0.12, 0.11);
    beep(1175, 0.14, 0.16, 0.1);
  } catch {
    /* ignore */
  }
}

/** Vibración tipo WhatsApp (solo móviles que lo soporten). */
function vibratePhone() {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate([90, 50, 90, 50, 140]);
  } catch {
    /* ignore — iOS Safari no soporta vibrate */
  }
}

function myUserId() {
  return Number(localStorage.getItem('user_id') || 0);
}

function onIncoming(payload) {
  const msg = payload?.id ? payload : null;
  if (!msg) return;
  const existed = messages.value.some((m) => m.id === msg.id);
  upsertMessage(msg);
  if (existed) return;

  // toOthers en backend; por si acaso no contamos los propios
  if (myUserId() && Number(msg.user?.id) === myUserId()) return;

  if (panelOpen.value) {
    clearUnread();
    return;
  }

  bumpUnread();
  latestIncoming.value = msg;
  playChatPing();
  vibratePhone();
  window.dispatchEvent(new CustomEvent('staff-chat-message', { detail: msg }));
}

export function useStaffChat() {
  const hasUnread = computed(() => unread.value > 0);
  const unreadLabel = computed(() => (unread.value > 99 ? '99+' : String(unread.value)));

  async function loadHistory() {
    if (loadingHistory.value) return;
    loadingHistory.value = true;
    error.value = '';
    try {
      const res = await api.get('/api/staff-chat', { params: { limit: 80 } });
      const list = res.data?.data || [];
      messages.value = list;
      historyLoaded = true;

      // Si hay mensajes nuevos desde la última vez vista y el panel está cerrado, alinear badge
      if (!panelOpen.value) {
        const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
        if (lastSeen > 0) {
          const fresh = list.filter(
            (m) => Number(m.id) > lastSeen && Number(m.user?.id) !== myUserId()
          ).length;
          if (fresh > unread.value) persistUnread(fresh);
        }
      }
    } catch (e) {
      error.value = e.friendlyMessage || e.message || 'No se pudo cargar el chat.';
    } finally {
      loadingHistory.value = false;
    }
  }

  function ensureStaffChatChannel() {
    if (!window.Echo) return false;
    if (!wsHooked) {
      wsHooked = true;
      window.addEventListener('ws-connected', () => {
        // Reintentar auth privada tras reconexión
        if (!channelBound) ensureStaffChatChannel();
      });
    }
    if (channelBound) return true;
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
    latestIncoming.value = null;
    clearUnread();
    ensureStaffChatChannel();
    if (!historyLoaded || messages.value.length === 0) {
      await loadHistory();
    }
    clearUnread();
  }

  function closePanel() {
    panelOpen.value = false;
    clearUnread();
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
      if (msg) {
        upsertMessage(msg);
        if (panelOpen.value) clearUnread();
      }
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
    unreadLabel,
    hasUnread,
    panelOpen,
    loadingHistory,
    sending,
    error,
    latestIncoming,
    ensureStaffChatChannel,
    loadHistory,
    openPanel,
    closePanel,
    togglePanel,
    sendMessage,
  };
}
