/**
 * Motor de escaneo QR de alto rendimiento.
 * Preferencia: BarcodeDetector nativo (Chrome/Android/Safari moderno).
 * Fallback: html5-qrcode con BarcodeDetector experimental.
 */

import { Html5Qrcode } from 'html5-qrcode';
import { normalizePlateQrPayload, looksLikePlateQr } from './plateQrNormalize.js';

const NATIVE = typeof window !== 'undefined' && 'BarcodeDetector' in window;

/**
 * @typedef {object} EngineCallbacks
 * @property {(payload: string, meta: { engine: string, votes: number }) => void} onPayload
 * @property {(info: { engine: string, torch: boolean, zoom: boolean }) => void} [onReady]
 * @property {(err: Error) => void} [onError]
 */

export class AdvancedQrEngine {
  /**
   * @param {HTMLElement} mountEl
   * @param {EngineCallbacks} cbs
   */
  constructor(mountEl, cbs) {
    this.mountEl = mountEl;
    this.cbs = cbs;
    this.video = null;
    this.stream = null;
    this.track = null;
    this.detector = null;
    this.html5 = null;
    this.raf = 0;
    this.timer = 0;
    this.running = false;
    this.paused = false;
    this.engine = NATIVE ? 'native' : 'compat';
    this.torchOn = false;
    this.hasTorch = false;
    this.hasZoom = false;
    this.voteMap = new Map(); // payload → { count, lastAt }
    this.emitCool = new Map(); // payload → untilMs
    this.lastEmitAt = 0;
  }

  async start() {
    this.running = true;
    if (NATIVE) {
      try {
        await this.#startNative();
        this.cbs.onReady?.({
          engine: 'native',
          torch: this.hasTorch,
          zoom: this.hasZoom,
        });
        return;
      } catch (e) {
        await this.#cleanupNative();
        // cae a compat
      }
    }
    await this.#startCompat();
    this.cbs.onReady?.({
      engine: 'compat',
      torch: this.hasTorch,
      zoom: this.hasZoom,
    });
  }

  async pause() {
    this.paused = true;
    if (this.html5) {
      try { await this.html5.pause(true); } catch { /* */ }
    }
  }

  async resume() {
    this.paused = false;
    if (this.html5) {
      try { await this.html5.resume(); } catch { /* */ }
    }
  }

  async setTorch(on) {
    if (!this.track || !this.hasTorch) return false;
    try {
      await this.track.applyConstraints({ advanced: [{ torch: !!on }] });
      this.torchOn = !!on;
      return true;
    } catch {
      return false;
    }
  }

  async toggleTorch() {
    return this.setTorch(!this.torchOn);
  }

  /** Zoom suave 1–3 si el dispositivo lo permite. */
  async setZoom(factor) {
    if (!this.track || !this.hasZoom) return false;
    try {
      const caps = this.track.getCapabilities?.() || {};
      const min = caps.zoom?.min ?? 1;
      const max = caps.zoom?.max ?? 1;
      const z = Math.min(max, Math.max(min, factor));
      await this.track.applyConstraints({ advanced: [{ zoom: z }] });
      return true;
    } catch {
      return false;
    }
  }

  async stop() {
    this.running = false;
    this.paused = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.timer) clearTimeout(this.timer);
    this.raf = 0;
    this.timer = 0;
    await this.#cleanupNative();
    if (this.html5) {
      try {
        const st = this.html5.getState?.();
        if (st === 2 || st === 3) await this.html5.stop();
        await this.html5.clear();
      } catch { /* */ }
      this.html5 = null;
    }
    this.mountEl.innerHTML = '';
  }

  async #startNative() {
    this.mountEl.innerHTML = '';
    this.video = document.createElement('video');
    this.video.setAttribute('playsinline', 'true');
    this.video.setAttribute('muted', 'true');
    this.video.muted = true;
    this.video.autoplay = true;
    this.video.className = 'aqr-video';
    this.mountEl.appendChild(this.video);

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 30 },
      },
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.track = this.stream.getVideoTracks()[0] || null;
    await this.#tuneTrack();
    this.video.srcObject = this.stream;
    await this.video.play();

    this.detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    this.engine = 'native';
    this.#nativeLoop();
  }

  async #tuneTrack() {
    if (!this.track) return;
    const caps = this.track.getCapabilities?.() || {};
    this.hasTorch = !!caps.torch;
    this.hasZoom = !!(caps.zoom && caps.zoom.max > caps.zoom.min);

    const advanced = [];
    if (caps.focusMode?.includes?.('continuous')) {
      advanced.push({ focusMode: 'continuous' });
    }
    if (caps.exposureMode?.includes?.('continuous')) {
      advanced.push({ exposureMode: 'continuous' });
    }
    if (caps.whiteBalanceMode?.includes?.('continuous')) {
      advanced.push({ whiteBalanceMode: 'continuous' });
    }
    if (this.hasZoom && caps.zoom) {
      // leve acercamiento inicial ayuda stickers ~4cm
      const mid = Math.min(caps.zoom.max, Math.max(caps.zoom.min, (caps.zoom.min + 1.4)));
      advanced.push({ zoom: mid });
    }
    if (advanced.length) {
      try {
        await this.track.applyConstraints({ advanced });
      } catch { /* algunos WebView ignoran advanced */ }
    }
  }

  #nativeLoop = async () => {
    if (!this.running) return;
    if (!this.paused && this.video && this.video.readyState >= 2) {
      try {
        const codes = await this.detector.detect(this.video);
        if (codes?.length) {
          for (const code of codes) {
            const raw = code.rawValue || code.rawData || '';
            this.#acceptRaw(raw);
          }
        }
      } catch { /* frame perdido = ok */ }
    }
    // ~28 fps sin saturar CPU
    this.timer = window.setTimeout(() => {
      this.raf = requestAnimationFrame(this.#nativeLoop);
    }, 36);
  };

  async #startCompat() {
    this.mountEl.innerHTML = '';
    const id = `aqr-h5-${Math.random().toString(36).slice(2, 8)}`;
    const box = document.createElement('div');
    box.id = id;
    box.className = 'aqr-h5';
    this.mountEl.appendChild(box);

    this.html5 = new Html5Qrcode(id, {
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    });

    const cameras = await Html5Qrcode.getCameras().catch(() => []);
    const back = cameras.find((c) => /back|rear|environment|trasera|背面/i.test(c.label))
      || cameras[cameras.length - 1]
      || cameras[0];

    const config = {
      fps: 28,
      qrbox: (w, h) => {
        const side = Math.floor(Math.min(w, h) * 0.78);
        return { width: side, height: side };
      },
      aspectRatio: 1.333,
      disableFlip: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      videoConstraints: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
    };

    const cam = back?.id || { facingMode: 'environment' };
    await this.html5.start(
      cam,
      config,
      (text) => this.#acceptRaw(text),
      () => {},
    );
    this.engine = 'compat';

    // Intentar recuperar track del video interno para torch
    try {
      const vid = this.mountEl.querySelector('video');
      const stream = vid?.srcObject;
      this.track = stream?.getVideoTracks?.()?.[0] || null;
      await this.#tuneTrack();
    } catch { /* */ }
  }

  async #cleanupNative() {
    if (this.video) {
      try { this.video.pause(); } catch { /* */ }
      this.video.srcObject = null;
      this.video.remove();
      this.video = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.track = null;
    this.detector = null;
  }

  /**
   * Filtro CXR4 + consenso rápido.
   * Motor nativo: 1 lectura válida basta (BarcodeDetector es fiable).
   * Compat: 2 lecturas en <320ms para evitar fantasmas.
   */
  #acceptRaw(raw) {
    if (this.paused || !this.running) return;
    if (!looksLikePlateQr(raw)) return;
    const payload = normalizePlateQrPayload(raw);
    if (!payload) return;

    const t = Date.now();
    const coolUntil = this.emitCool.get(payload) || 0;
    if (t < coolUntil) return;

    if (this.engine === 'native') {
      this.emitCool.set(payload, t + 700);
      this.cbs.onPayload(payload, { engine: this.engine, votes: 1 });
      return;
    }

    const prev = this.voteMap.get(payload);
    if (!prev || t - prev.lastAt > 320) {
      this.voteMap.set(payload, { count: 1, lastAt: t });
      return;
    }
    prev.count += 1;
    prev.lastAt = t;
    if (prev.count < 2) return;

    this.voteMap.delete(payload);
    this.emitCool.set(payload, t + 700);
    this.cbs.onPayload(payload, { engine: this.engine, votes: prev.count });
  }
}

export function supportsNativeBarcode() {
  return NATIVE;
}
