import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/** Stickers 40×40 mm, A4, máximos por hoja (5×7 = 35). */
export const STICKER_MM = 40;
export const PAGE = { w: 210, h: 297 };
export const GRID = { cols: 5, rows: 7 }; // 35 por hoja

const ORANGE = '#FF5E00';
const BLACK = '#0A0A0A';
const WHITE = '#FFFFFF';
const GOLD = '#F5C518';

/**
 * Dibuja un sticker estilo carrera en canvas (alta resolución).
 * @returns {HTMLCanvasElement}
 */
export async function renderStickerCanvas(rider, opts = {}) {
  const pxPerMm = opts.pxPerMm || 12; // ~300dpi-ish for print sharpness
  const S = Math.round(STICKER_MM * pxPerMm);
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Fondo negro
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, S, S);

  // Marco naranja exterior
  const border = Math.max(2, Math.round(S * 0.028));
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, S - border, S - border);

  // Esquinas técnicas
  const corner = Math.round(S * 0.09);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1.5, border * 0.7);
  // TL
  ctx.beginPath();
  ctx.moveTo(border * 2, border * 2 + corner);
  ctx.lineTo(border * 2, border * 2);
  ctx.lineTo(border * 2 + corner, border * 2);
  ctx.stroke();
  // TR
  ctx.beginPath();
  ctx.moveTo(S - border * 2 - corner, border * 2);
  ctx.lineTo(S - border * 2, border * 2);
  ctx.lineTo(S - border * 2, border * 2 + corner);
  ctx.stroke();
  // BL
  ctx.beginPath();
  ctx.moveTo(border * 2, S - border * 2 - corner);
  ctx.lineTo(border * 2, S - border * 2);
  ctx.lineTo(border * 2 + corner, S - border * 2);
  ctx.stroke();
  // BR
  ctx.beginPath();
  ctx.moveTo(S - border * 2 - corner, S - border * 2);
  ctx.lineTo(S - border * 2, S - border * 2);
  ctx.lineTo(S - border * 2, S - border * 2 - corner);
  ctx.stroke();

  // Header band
  const headerH = Math.round(S * 0.13);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(border, border, S - border * 2, headerH);
  ctx.fillStyle = BLACK;
  ctx.font = `900 ${Math.round(S * 0.045)}px "Space Grotesk", "Outfit", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHACAS XTREME RACE', S / 2, border + headerH / 2);

  // QR area
  const qrTop = border + headerH + Math.round(S * 0.02);
  const qrBottomPad = Math.round(S * 0.12);
  const qrSize = S - border * 2 - (qrTop - border) - qrBottomPad;
  const qrX = Math.round((S - qrSize) / 2);
  const qrY = qrTop;

  // Fondo QR blanco suave
  ctx.fillStyle = WHITE;
  roundRect(ctx, qrX, qrY, qrSize, qrSize, Math.round(S * 0.02));
  ctx.fill();

  const payload = rider.payload || rider.url;
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: qrSize,
    color: { dark: BLACK, light: WHITE },
  });

  await drawImage(ctx, qrDataUrl, qrX, qrY, qrSize, qrSize);

  // Centro: badge con número de placa (encima del QR)
  const plate = String(rider.plate_number ?? '').padStart(2, '0');
  const badge = Math.round(qrSize * 0.36);
  const bx = qrX + (qrSize - badge) / 2;
  const by = qrY + (qrSize - badge) / 2;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(S / 2 + 2, qrY + qrSize / 2 + 2, badge / 2, 0, Math.PI * 2);
  ctx.fill();

  // Disco naranja
  const grd = ctx.createRadialGradient(S / 2, qrY + qrSize / 2, 2, S / 2, qrY + qrSize / 2, badge / 2);
  grd.addColorStop(0, '#FF8A3D');
  grd.addColorStop(1, ORANGE);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(S / 2, qrY + qrSize / 2, badge / 2, 0, Math.PI * 2);
  ctx.fill();

  // Anillo negro
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = Math.max(2, S * 0.012);
  ctx.beginPath();
  ctx.arc(S / 2, qrY + qrSize / 2, badge / 2 - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();

  // Número
  ctx.fillStyle = WHITE;
  ctx.font = `900 ${Math.round(badge * 0.52)}px "Space Grotesk", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(plate, S / 2, qrY + qrSize / 2 + 1);

  // Footer
  const footY = S - border - Math.round(S * 0.055);
  ctx.fillStyle = GOLD;
  ctx.font = `700 ${Math.round(S * 0.038)}px "Outfit", sans-serif`;
  ctx.fillText('mankariders.xyz', S / 2, footY);

  // Micro etiqueta categoría (si cabe)
  if (rider.category_name) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.round(S * 0.028)}px "Outfit", sans-serif`;
    const cat = String(rider.category_name).slice(0, 18).toUpperCase();
    ctx.fillText(cat, S / 2, footY - Math.round(S * 0.045));
  }

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawImage(ctx, src, x, y, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, w, h);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Genera PDF A4 con stickers apilados 5×7 (40 mm exactos).
 * @param {Array} riders
 * @param {{ competitionName?: string, onProgress?: (n:number, total:number) => void }} [options]
 */
export async function buildPlateQrPdf(riders, options = {}) {
  const list = Array.isArray(riders) ? riders : [];
  if (!list.length) throw new Error('No hay competidores con placa.');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const { cols, rows } = GRID;
  const perPage = cols * rows;
  const marginX = (PAGE.w - cols * STICKER_MM) / 2;
  const marginY = (PAGE.h - rows * STICKER_MM) / 2;

  for (let i = 0; i < list.length; i++) {
    if (i > 0 && i % perPage === 0) pdf.addPage();

    const local = i % perPage;
    const col = local % cols;
    const row = Math.floor(local / cols);
    const x = marginX + col * STICKER_MM;
    const y = marginY + row * STICKER_MM;

    options.onProgress?.(i + 1, list.length);

    const canvas = await renderStickerCanvas(list[i]);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(dataUrl, 'JPEG', x, y, STICKER_MM, STICKER_MM);

    // Marcas de corte muy finas en esquinas del sticker
    pdf.setDrawColor(180);
    pdf.setLineWidth(0.05);
    const tick = 1.2;
    // top-left
    pdf.line(x, y, x + tick, y);
    pdf.line(x, y, x, y + tick);
    // top-right
    pdf.line(x + STICKER_MM - tick, y, x + STICKER_MM, y);
    pdf.line(x + STICKER_MM, y, x + STICKER_MM, y + tick);
    // bottom-left
    pdf.line(x, y + STICKER_MM, x + tick, y + STICKER_MM);
    pdf.line(x, y + STICKER_MM - tick, x, y + STICKER_MM);
    // bottom-right
    pdf.line(x + STICKER_MM - tick, y + STICKER_MM, x + STICKER_MM, y + STICKER_MM);
    pdf.line(x + STICKER_MM, y + STICKER_MM - tick, x + STICKER_MM, y + STICKER_MM);
  }

  const name = (options.competitionName || 'chacas-xtreme')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `placas-qr-${name}-${list.length}u.pdf`;
  pdf.save(filename);
  return { filename, count: list.length, pages: Math.ceil(list.length / perPage) };
}
