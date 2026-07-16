<template>
  <div class="rp">
    <div class="rp-bg" aria-hidden="true" />

    <div class="rp-shell">
      <!-- HEADER -->
      <header class="rp-hero" :class="{ 'is-in': gateIn }">
        <p class="rp-brand">Chacas Xtreme Race</p>
        <h1>Bienvenido <span>rider</span></h1>
        <p class="rp-lede">
          Nos alegra tenerte en la carrera. De paso, súbenos tu foto en acción y completa lo que falte en tu ficha — se publica en la web oficial.
        </p>
      </header>

      <!-- LOADING -->
      <section v-if="bootLoading" class="rp-panel is-in" aria-live="polite">
        <div class="rp-spinner" aria-hidden="true" />
        <p class="rp-panel-title">Abriendo tu ficha…</p>
      </section>

      <!-- SUCCESS -->
      <section v-else-if="done" class="rp-panel rp-panel--success is-in">
        <div class="rp-success-icon" aria-hidden="true">✓</div>
        <h2>¡Listo!</h2>
        <p>Tu foto rider y datos ya están guardados. Gracias por completar tu ficha.</p>
        <div v-if="previewUrl" class="rp-success-photo">
          <img :src="previewUrl" alt="Tu foto rider" />
        </div>
      </section>

      <!-- GATE -->
      <form
        v-else-if="!rider"
        class="rp-panel"
        :class="{ 'is-in': gateIn }"
        @submit.prevent="unlock"
      >
        <p class="rp-step">Paso 1 de 2</p>
        <h2 class="rp-panel-title">Identifícate</h2>
        <p class="rp-panel-hint">
          Usa el mismo nombre y teléfono de emergencia de tu inscripción.
        </p>

        <label class="rp-field">
          <span>Nombre completo</span>
          <input
            v-model.trim="fullName"
            type="text"
            required
            minlength="3"
            placeholder="Como en el padrón"
            autocomplete="name"
            autocapitalize="words"
            enterkeyhint="next"
          />
        </label>

        <label class="rp-field">
          <span>Teléfono de emergencia</span>
          <input
            v-model.trim="emergencyPhone"
            type="tel"
            inputmode="tel"
            required
            minlength="6"
            placeholder="Del registro"
            autocomplete="tel"
            enterkeyhint="go"
          />
        </label>

        <p v-if="error" class="rp-error" role="alert">{{ error }}</p>

        <button class="rp-btn" type="submit" :disabled="loading">
          {{ loading ? 'Buscando…' : 'Continuar' }}
        </button>
      </form>

      <!-- FORM -->
      <form
        v-else
        class="rp-panel is-in"
        @submit.prevent="save"
      >
        <div class="rp-identity">
          <div class="rp-identity-text">
            <p class="rp-step">{{ enteredViaLink ? 'Tu enlace personal' : 'Paso 2 de 2' }}</p>
            <h2>{{ rider.full_name }}</h2>
            <p class="rp-cat">
              {{ rider.category?.name || 'Sin categoría' }}
              <template v-if="rider.plate_number"> · N° {{ rider.plate_number }}</template>
            </p>
          </div>
          <button
            v-if="!enteredViaLink"
            type="button"
            class="rp-chip"
            @click="reset"
          >
            Cambiar
          </button>
        </div>

        <!-- PHOTO (priority) -->
        <section class="rp-photo">
          <div class="rp-photo-head">
            <p class="rp-photo-label">Foto rider <em>*</em></p>
            <p class="rp-photo-badge">Obligatoria</p>
          </div>

          <button
            type="button"
            class="rp-photo-box"
            :class="{ 'has-preview': !!previewUrl }"
            @click="fileInput?.click()"
          >
            <img v-if="previewUrl" :src="previewUrl" alt="Vista previa foto rider" />
            <div v-else class="rp-photo-empty">
              <span class="rp-photo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.1l1.2-1.6A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.2.4L15.4 5h2.1A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10Z"
                    stroke="currentColor"
                    stroke-width="1.6"
                  />
                  <circle cx="12" cy="12.5" r="3.25" stroke="currentColor" stroke-width="1.6" />
                </svg>
              </span>
              <strong>Toca para subir o tomar foto</strong>
              <span>Cámara o galería</span>
            </div>
            <span v-if="previewUrl" class="rp-photo-change">Cambiar foto</span>
          </button>

          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            class="sr-only"
            @change="onPhotoChange"
          />

          <p class="rp-photo-help">
            Ideal en acción: salto, bajada o con la bici. JPG / PNG / WEBP · máx. 10MB.
          </p>
        </section>

        <!-- MISSING FIELDS -->
        <section v-if="hasAnyMissingData" class="rp-fields">
          <p class="rp-fields-title">Datos que faltan</p>

          <label v-if="needs.origin" class="rp-field">
            <span>Procedencia <em>*</em></span>
            <input
              v-model.trim="form.origin"
              type="text"
              required
              placeholder="Ciudad / distrito"
              autocapitalize="words"
              enterkeyhint="next"
            />
          </label>

          <label v-if="needs.dni" class="rp-field">
            <span>DNI / Pasaporte <em>*</em></span>
            <input
              :value="form.dni"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="12"
              required
              placeholder="Solo números"
              autocomplete="off"
              enterkeyhint="next"
              @input="onDniInput"
            />
          </label>

          <label v-if="needs.nickname" class="rp-field">
            <span>Apodo</span>
            <input
              v-model.trim="form.nickname"
              type="text"
              placeholder="Opcional"
              enterkeyhint="next"
            />
          </label>

          <label v-if="needs.club_team" class="rp-field">
            <span>Club o equipo</span>
            <input
              v-model.trim="form.club_team"
              type="text"
              placeholder="Opcional"
              enterkeyhint="next"
            />
          </label>

          <label v-if="needs.instagram" class="rp-field">
            <span>Instagram</span>
            <div class="rp-ig">
              <span>@</span>
              <input
                :value="form.instagram.replace(/^@/, '')"
                type="text"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                placeholder="usuario"
                enterkeyhint="done"
                @input="onInstagram"
              />
            </div>
          </label>

          <template v-if="needs.guardian || (rider.guardian_optional && askGuardian)">
            <label
              v-if="rider.guardian_optional && !needs.guardian"
              class="rp-check"
            >
              <input v-model="askGuardian" type="checkbox" />
              <span>Soy menor / tengo apoderado</span>
            </label>

            <div
              v-if="needs.guardian || (rider.guardian_optional && askGuardian)"
              class="rp-guardian"
            >
              <p class="rp-guardian-title">Datos del apoderado</p>
              <label class="rp-field">
                <span>Nombre del apoderado <em>*</em></span>
                <input
                  v-model.trim="form.guardian_full_name"
                  type="text"
                  required
                  autocapitalize="words"
                />
              </label>
              <label class="rp-field">
                <span>DNI del apoderado</span>
                <input
                  :value="form.guardian_dni"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="12"
                  placeholder="Solo números"
                  autocomplete="off"
                  @input="onGuardianDniInput"
                />
              </label>
              <label class="rp-field">
                <span>Teléfono del apoderado</span>
                <input v-model.trim="form.guardian_phone" type="tel" inputmode="tel" />
              </label>
            </div>
          </template>
        </section>

        <p v-else class="rp-only-photo">
          Solo falta tu foto. El resto de datos ya está cargado.
        </p>

        <p v-if="error" class="rp-error" role="alert">{{ error }}</p>

        <!-- Sticky footer CTA -->
        <div class="rp-actions">
          <button
            class="rp-btn"
            type="submit"
            :disabled="loading || !photoFile"
          >
            {{ loading ? 'Enviando…' : 'Enviar foto y datos' }}
          </button>
        </div>
      </form>

      <a class="rp-staff" href="/login">¿Eres staff? Ir al login</a>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  fetchRiderProfile,
  unlockRiderProfile,
  updateRiderProfile,
} from '../services/riderProfilePublicService';
import { storageUrl } from '../../../core/network/storageUrl';

const route = useRoute();
const gateIn = ref(false);
const bootLoading = ref(false);
const loading = ref(false);
const done = ref(false);
const error = ref('');
const rider = ref(null);
const profileToken = ref('');
const fileInput = ref(null);
const photoFile = ref(null);
const localPreview = ref('');
const enteredViaLink = ref(false);

const fullName = ref('');
const emergencyPhone = ref('');
const askGuardian = ref(false);

const form = reactive({
  origin: '',
  dni: '',
  nickname: '',
  club_team: '',
  instagram: '',
  guardian_full_name: '',
  guardian_dni: '',
  guardian_phone: '',
});

const needs = computed(() => rider.value?.needs || {
  photo: true,
  origin: false,
  dni: false,
  nickname: false,
  club_team: false,
  instagram: false,
  guardian: false,
});

const previewUrl = computed(() => localPreview.value || '');

const hasAnyMissingData = computed(() => {
  const n = needs.value;
  return n.origin || n.dni || n.nickname || n.club_team || n.instagram || n.guardian
    || (rider.value?.guardian_optional && askGuardian.value);
});

function unlockPageScroll() {
  document.documentElement.classList.add('rp-scroll-unlock');
  document.body.classList.add('rp-scroll-unlock');
}

function lockPageScrollRestore() {
  document.documentElement.classList.remove('rp-scroll-unlock');
  document.body.classList.remove('rp-scroll-unlock');
}

onMounted(async () => {
  unlockPageScroll();
  requestAnimationFrame(() => {
    gateIn.value = true;
  });

  const qToken = typeof route.query.token === 'string' ? route.query.token.trim() : '';
  if (!qToken) return;

  bootLoading.value = true;
  error.value = '';
  try {
    const body = await fetchRiderProfile(qToken);
    profileToken.value = body.profile_token || qToken;
    enteredViaLink.value = true;
    fillFromRider(body.data);
  } catch (e) {
    error.value = e.message || 'Este enlace no es válido. Usa tu nombre y teléfono abajo.';
  } finally {
    bootLoading.value = false;
  }
});

onBeforeUnmount(() => {
  lockPageScrollRestore();
});

function fillFromRider(data) {
  rider.value = data;
  form.origin = data.needs?.origin ? '' : (data.origin || '');
  form.dni = digitsOnly(data.dni || '');
  form.nickname = data.nickname || '';
  form.club_team = data.club_team || '';
  form.instagram = data.instagram || '';
  form.guardian_full_name = data.guardian_full_name || '';
  form.guardian_dni = digitsOnly(data.guardian_dni || '');
  form.guardian_phone = data.guardian_phone || '';
  askGuardian.value = Boolean(data.needs?.guardian);
  photoFile.value = null;
  if (!done.value) localPreview.value = '';
  error.value = '';
}

async function unlock() {
  error.value = '';
  loading.value = true;
  try {
    const body = await unlockRiderProfile({
      full_name: fullName.value,
      emergency_phone: emergencyPhone.value,
    });
    profileToken.value = body.profile_token;
    enteredViaLink.value = false;
    fillFromRider(body.data);
  } catch (e) {
    error.value = e.message || 'No te encontramos en el padrón.';
  } finally {
    loading.value = false;
  }
}

function onPhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  photoFile.value = file;
  localPreview.value = URL.createObjectURL(file);
  error.value = '';
}

function digitsOnly(value, maxLen = 12) {
  return String(value || '').replace(/\D+/g, '').slice(0, maxLen);
}

function onDniInput(event) {
  form.dni = digitsOnly(event.target.value);
}

function onGuardianDniInput(event) {
  form.guardian_dni = digitsOnly(event.target.value);
}

function onInstagram(event) {
  const raw = (event.target.value || '').replace(/^@/, '').trim();
  form.instagram = raw ? `@${raw}` : '';
}

async function save() {
  error.value = '';

  if (!photoFile.value) {
    error.value = 'La foto rider es obligatoria.';
    return;
  }

  loading.value = true;
  try {
    const fd = new FormData();
    fd.append('photo_file', photoFile.value);

    if (needs.value.origin) fd.append('origin', form.origin);
    if (needs.value.dni) fd.append('dni', form.dni);
    if (needs.value.nickname) fd.append('nickname', form.nickname || '');
    if (needs.value.club_team) fd.append('club_team', form.club_team || '');
    if (needs.value.instagram) fd.append('instagram', form.instagram || '');

    const showGuardian = needs.value.guardian || (rider.value.guardian_optional && askGuardian.value);
    fd.append('has_guardian', showGuardian ? '1' : '0');
    if (showGuardian) {
      fd.append('guardian_full_name', form.guardian_full_name || '');
      fd.append('guardian_dni', form.guardian_dni || '');
      fd.append('guardian_phone', form.guardian_phone || '');
    }

    const body = await updateRiderProfile(profileToken.value, fd);
    if (body.data?.photo_url) localPreview.value = storageUrl(body.data.photo_url);
    done.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    error.value = e.message || 'No se pudo enviar.';
  } finally {
    loading.value = false;
  }
}

function reset() {
  rider.value = null;
  profileToken.value = '';
  enteredViaLink.value = false;
  done.value = false;
  error.value = '';
  photoFile.value = null;
  localPreview.value = '';
}
</script>

<style scoped>
/* El dashboard en desktop bloquea body; esta página debe scrollear */
:global(html.rp-scroll-unlock),
:global(body.rp-scroll-unlock) {
  overflow: auto !important;
  overflow-x: hidden !important;
  height: auto !important;
  max-height: none !important;
  min-height: 100%;
  overscroll-behavior-y: auto;
  touch-action: pan-y;
}

.rp {
  /* Paleta Chacas (igual login / web oficial) — independiente del tema staff */
  --rp-orange: #ff5e00;
  --rp-gold: #fbbf24;
  --rp-bg: #0c0908;
  --rp-panel: #14110f;
  --rp-input: #1a1614;
  --rp-line: rgba(255, 255, 255, 0.1);
  --rp-text: #ffffff;
  --rp-muted: #a0a0a0;
  --rp-radius: 16px;
  --rp-safe-b: env(safe-area-inset-bottom, 0px);

  position: relative;
  min-height: 100dvh;
  min-height: 100svh;
  width: 100%;
  color: var(--rp-text);
  color-scheme: dark;
  font-family: var(--font-family, 'Outfit', system-ui, sans-serif);
  background-color: var(--rp-bg);
  padding:
    max(16px, env(safe-area-inset-top))
    16px
    calc(28px + var(--rp-safe-b));
  overflow: visible;
  -webkit-overflow-scrolling: touch;
  -webkit-tap-highlight-color: transparent;
}

.rp-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 100%;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% -10%, rgba(255, 94, 0, 0.15) 0%, transparent 55%),
    linear-gradient(180deg, #120e0c 0%, var(--rp-bg) 42%, #050403 100%);
}

.rp-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 440px);
  margin: 0 auto;
}

.rp-hero {
  margin-bottom: 18px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.rp-hero.is-in {
  opacity: 1;
  transform: none;
}

.rp-brand {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--rp-muted);
}

.rp-hero h1 {
  margin: 8px 0 0;
  font-family: var(--font-headings, 'Space Grotesk', sans-serif);
  font-size: clamp(2rem, 9vw, 2.55rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--rp-text);
}

.rp-hero h1 span {
  color: var(--rp-orange);
}

.rp-lede {
  margin: 12px 0 0;
  font-size: 14.5px;
  line-height: 1.45;
  color: var(--rp-muted);
}

.rp-panel {
  background: var(--rp-panel);
  border: 1px solid var(--rp-line);
  border-radius: calc(var(--rp-radius) + 2px);
  padding: 18px 16px 16px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.4s ease 60ms, transform 0.4s ease 60ms;
}

.rp-panel.is-in {
  opacity: 1;
  transform: none;
}

.rp-panel--success {
  text-align: center;
  padding: 28px 18px;
}

.rp-panel--success h2 {
  margin: 10px 0 0;
  font-size: 1.6rem;
  color: var(--rp-text);
}

.rp-panel--success p {
  margin: 8px 0 0;
  color: var(--rp-muted);
  font-size: 14.5px;
  line-height: 1.45;
}

.rp-success-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(16, 185, 129, 0.14);
  color: #10b981;
  font-size: 26px;
  font-weight: 800;
}

.rp-success-photo {
  margin: 18px auto 0;
  width: min(100%, 220px);
  aspect-ratio: 3 / 4;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 94, 0, 0.4);
}

.rp-success-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rp-spinner {
  width: 28px;
  height: 28px;
  margin: 8px auto 12px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--rp-orange);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.rp-step {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rp-orange);
}

.rp-panel-title {
  margin: 6px 0 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--rp-text);
}

.rp-panel-hint {
  margin: 8px 0 16px;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--rp-muted);
}

.rp-identity {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--rp-line);
}

.rp-identity h2 {
  margin: 6px 0 0;
  font-size: 1.2rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  word-break: break-word;
  color: var(--rp-text);
}

.rp-cat {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--rp-muted);
}

.rp-chip {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--rp-line);
  background: transparent;
  color: var(--rp-muted);
  font-size: 12px;
  font-weight: 600;
}

.rp-photo {
  margin-bottom: 16px;
}

.rp-photo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.rp-photo-label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--rp-text);
}

.rp-photo-label em,
.rp-field > span em {
  color: var(--rp-orange);
  font-style: normal;
}

.rp-photo-badge {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: var(--rp-orange);
  border-radius: 999px;
  padding: 5px 9px;
}

.rp-photo-box {
  position: relative;
  width: 100%;
  min-height: 210px;
  border-radius: 16px;
  border: 1.5px dashed rgba(255, 94, 0, 0.65);
  background: #100d0b;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, transform 0.15s ease, background 0.2s ease;
}

.rp-photo-box:active {
  transform: scale(0.99);
  background: #16110e;
}

.rp-photo-box.has-preview {
  border-style: solid;
  border-color: var(--rp-orange);
  min-height: 260px;
}

.rp-photo-box img {
  width: 100%;
  height: 260px;
  object-fit: cover;
  display: block;
}

.rp-photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 18px;
  text-align: center;
}

.rp-photo-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 94, 0, 0.14);
  color: var(--rp-orange);
}

.rp-photo-icon svg {
  width: 26px;
  height: 26px;
}

.rp-photo-empty strong {
  font-size: 15px;
  font-weight: 700;
  color: var(--rp-text);
}

.rp-photo-empty span {
  font-size: 13px;
  color: var(--rp-muted);
}

.rp-photo-change {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(12, 9, 8, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.rp-photo-help {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--rp-muted);
}

.rp-fields-title {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rp-gold);
}

.rp-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 12px;
}

.rp-field > span {
  font-size: 13px;
  font-weight: 600;
  color: var(--rp-muted);
}

.rp-field input,
.rp-ig {
  width: 100%;
  min-height: 52px;
  border-radius: 12px;
  border: 1px solid var(--rp-line);
  background: var(--rp-input);
  color: var(--rp-text);
  font-size: 16px;
  outline: none;
}

.rp-field input {
  padding: 0 14px;
}

.rp-field input::placeholder {
  color: rgba(160, 160, 160, 0.72);
}

.rp-field input:focus,
.rp-ig:focus-within {
  border-color: var(--rp-orange);
  box-shadow: 0 0 0 3px rgba(255, 94, 0, 0.2);
}

.rp-ig {
  display: flex;
  align-items: center;
  padding-left: 14px;
  gap: 2px;
  overflow: hidden;
}

.rp-ig > span {
  color: var(--rp-muted);
  font-weight: 700;
}

.rp-ig input {
  border: 0;
  background: transparent;
  min-height: 52px;
  box-shadow: none !important;
  padding-left: 2px;
  color: var(--rp-text);
}

.rp-ig input::placeholder {
  color: rgba(160, 160, 160, 0.72);
}

.rp-only-photo {
  margin: 0 0 8px;
  font-size: 13.5px;
  color: var(--rp-muted);
}

.rp-check {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  margin: 4px 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--rp-text);
}

.rp-check input {
  width: 20px;
  height: 20px;
  accent-color: var(--rp-orange);
}

.rp-guardian {
  margin: 4px 0 8px;
  padding: 14px 12px 4px;
  border-radius: 14px;
  border: 1px solid rgba(255, 94, 0, 0.28);
  background: rgba(255, 94, 0, 0.06);
}

.rp-guardian-title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rp-orange);
}

.rp-error {
  margin: 4px 0 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.28);
  color: #fca5a5;
  font-size: 13.5px;
  line-height: 1.35;
}

.rp-actions {
  position: sticky;
  bottom: calc(8px + var(--rp-safe-b));
  margin-top: 8px;
  padding-top: 8px;
  background: linear-gradient(180deg, transparent, var(--rp-panel) 28%);
}

.rp-btn {
  width: 100%;
  min-height: 54px;
  border: none;
  border-radius: 999px;
  background: var(--rp-orange);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.rp-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rp-btn:active:not(:disabled) {
  transform: scale(0.985);
  filter: brightness(1.05);
}

.rp-staff {
  display: inline-block;
  margin-top: 18px;
  color: rgba(160, 160, 160, 0.85);
  text-decoration: none;
  font-size: 12.5px;
}

.rp-staff:active {
  color: var(--rp-orange);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (min-width: 480px) {
  .rp {
    padding-top: 28px;
  }

  .rp-panel {
    padding: 22px 20px 18px;
  }
}
</style>
