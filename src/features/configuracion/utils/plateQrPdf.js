import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/** Stickers 40×40 mm con gutters para corte limpio. */
export const STICKER_MM = 40;
export const GAP_MM = 3.5;
export const PAGE = { w: 210, h: 297 };
/** 4×6 = 24 por hoja (más aire, más fácil de cortar). */
export const GRID = { cols: 4, rows: 6 };

const ORANGE = '#FF5E00';
const ORANGE_SOFT = '#FF7A33';
const BLACK = '#080808';
const CHARCOAL = '#121212';
const WHITE = '#FAFAFA';
const MUTED = '#A8A29E';
const GOLD = '#E8C47C';

/**
 * Sticker premium 40×40 mm (canvas alta res).
 */
export async function renderStickerCanvas(rider, opts = {}) {
  const pxPerMm = opts.pxPerMm || 14;
  const S = Math.round(STICKER_MM * pxPerMm);
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Fondo charcoal con leve viñeta
  const bg = ctx.createRadialGradient(S * 0.5, S * 0.35, S * 0.1, S * 0.5, S * 0.55, S * 0.85);
  bg.addColorStop(0, '#161616');
  bg.addColorStop(1, BLACK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // Marco exterior fino
  const inset = Math.max(2, Math.round(S * 0.035));
  ctx.strokeStyle = 'rgba(255,94,0,0.55)';
  ctx.lineWidth = Math.max(1.25, S * 0.012);
  roundRectPath(ctx, inset, inset, S - inset * 2, S - inset * 2, Math.round(S * 0.045));
  ctx.stroke();

  // Línea interior hairline
  const inset2 = inset + Math.round(S * 0.02);
  ctx.strokeStyle = 'rgba(232,196,124,0.28)';
  ctx.lineWidth = Math.max(0.8, S * 0.006);
  roundRectPath(ctx, inset2, inset2, S - inset2 * 2, S - inset2 * 2, Math.round(S * 0.035));
  ctx.stroke();

  // Esquinas técnicas premium (cortas)
  drawCornerMarks(ctx, inset2, S, Math.round(S * 0.07), GOLD);

  // Header tipográfico (sin barra naranja gruesa)
  const headerY = inset2 + Math.round(S * 0.055);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ORANGE;
  ctx.font = `800 ${Math.round(S * 0.042)}px "Space Grotesk", "Outfit", sans-serif`;
  ctx.letterSpacing = `${S * 0.004}px`;
  ctx.fillText('CHACAS XTREME', S / 2, headerY);

  ctx.fillStyle = MUTED;
  ctx.font = `600 ${Math.round(S * 0.028)}px "Outfit", sans-serif`;
  ctx.fillText('RACE  ·  4ª EDICIÓN', S / 2, headerY + Math.round(S * 0.045));

  // Acento línea bajo encabezado
  const lineY = headerY + Math.round(S * 0.07);
  const lineW = Math.round(S * 0.28);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = Math.max(1.2, S * 0.008);
  ctx.beginPath();
  ctx.moveTo(S / 2 - lineW / 2, lineY);
  ctx.lineTo(S / 2 + lineW / 2, lineY);
  ctx.stroke();
  // punto centro
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(S / 2, lineY, Math.max(1.5, S * 0.01), 0, Math.PI * 2);
  ctx.fill();

  // Zona QR
  const qrTop = lineY + Math.round(S * 0.035);
  const footerReserve = Math.round(S * 0.13);
  const qrSize = Math.min(
    S - inset2 * 2 - Math.round(S * 0.04),
    S - qrTop - footerReserve - inset2,
  );
  const qrX = Math.round((S - qrSize) / 2);
  const qrY = qrTop;

  // Placa blanca del QR con sombra suave
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRectPath(ctx, qrX + 2, qrY + 3, qrSize, qrSize, Math.round(S * 0.03));
  ctx.fill();

  ctx.fillStyle = WHITE;
  roundRectPath(ctx, qrX, qrY, qrSize, qrSize, Math.round(S * 0.03));
  ctx.fill();

  const payload = rider.payload || rider.url;
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: qrSize,
    color: { dark: CHARCOAL, light: WHITE },
  });
  await drawImage(ctx, qrDataUrl, qrX, qrY, qrSize, qrSize);

  // Badge central de placa (premium: disco blanco + anillo naranja)
  const plate = String(rider.plate_number ?? '').padStart(2, '0');
  const badge = Math.round(qrSize * 0.34);
  const cx = S / 2;
  const cy = qrY + qrSize / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(cx + 1.5, cy + 2, badge / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(cx, cy, badge / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = Math.max(2.2, S * 0.014);
  ctx.beginPath();
  ctx.arc(cx, cy, badge / 2 - ctx.lineWidth * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(8,8,8,0.12)';
  ctx.lineWidth = Math.max(1, S * 0.005);
  ctx.beginPath();
  ctx.arc(cx, cy, badge / 2 - Math.round(S * 0.028), 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = BLACK;
  ctx.font = `900 ${Math.round(badge * 0.5)}px "Space Grotesk", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(plate, cx, cy + 1);

  // Footer
  const footBase = S - inset2 - Math.round(S * 0.055);
  if (rider.category_name) {
    ctx.fillStyle = MUTED;
    ctx.font = `600 ${Math.round(S * 0.026)}px "Outfit", sans-serif`;
    const cat = String(rider.category_name).toUpperCase().slice(0, 22);
    ctx.fillText(cat, S / 2, footBase - Math.round(S * 0.04));
  }

  ctx.fillStyle = ORANGE_SOFT;
  ctx.font = `700 ${Math.round(S * 0.036)}px "Outfit", sans-serif`;
  ctx.fillText('mankariders.xyz', S / 2, footBase);

  return canvas;
}

function drawCornerMarks(ctx, inset, S, len, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.1, S * 0.007);
  ctx.lineCap = 'square';
  const pairs = [
    [inset, inset + len, inset, inset, inset + len, inset],
    [S - inset - len, inset, S - inset, inset, S - inset, inset + len],
    [inset, S - inset - len, inset, S - inset, inset + len, S - inset],
    [S - inset - len, S - inset, S - inset, S - inset, S - inset, S - inset - len],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of pairs) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
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
 * PDF A4 prolijo: stickers 40 mm con separación GAP_MM y marcas de corte.
 */
export async function buildPlateQrPdf(riders, options = {}) {
  const list = Array.isArray(riders) ? riders : [];
  if (!list.length) throw new Error('No hay competidores con placa.');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const { cols, rows } = GRID;
  const perPage = cols * rows;
  const gap = GAP_MM;
  const blockW = cols * STICKER_MM + (cols - 1) * gap;
  const blockH = rows * STICKER_MM + (rows - 1) * gap;
  const marginX = (PAGE.w - blockW) / 2;
  const marginY = (PAGE.h - blockH) / 2;

  for (let i = 0; i < list.length; i++) {
    if (i > 0 && i % perPage === 0) pdf.addPage();

    const local = i % perPage;
    const col = local % cols;
    const row = Math.floor(local / cols);
    const x = marginX + col * (STICKER_MM + gap);
    const y = marginY + row * (STICKER_MM + gap);

    options.onProgress?.(i + 1, list.length);

    const canvas = await renderStickerCanvas(list[i]);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    pdf.addImage(dataUrl, 'JPEG', x, y, STICKER_MM, STICKER_MM);

    // Marcas de corte en el gutter (no encima del diseño)
    drawCutMarks(pdf, x, y, STICKER_MM, gap);
  }

  // Pie de página de imprenta (muy discreto, fuera de stickers)
  const pages = Math.ceil(list.length / perPage);
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(7);
    pdf.setTextColor(150);
    pdf.text(
      `Chacas Xtreme Race · Stickers 40×40 mm · Sep. ${GAP_MM} mm · Hoja ${p}/${pages}`,
      PAGE.w / 2,
      PAGE.h - 6,
      { align: 'center' },
    );
  }

  const name = (options.competitionName || 'chacas-xtreme')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `placas-qr-${name}-${list.length}u.pdf`;
  pdf.save(filename);
  return { filename, count: list.length, pages };
}

function drawCutMarks(pdf, x, y, size, gap) {
  const tick = Math.min(1.8, gap * 0.45);
  if (tick < 0.6) return;

  pdf.setDrawColor(160);
  pdf.setLineWidth(0.12);

  const marks = [
    // top edge mid-gutters towards outside
    [x, y, x - Math.min(tick, gap), y],
    [x + size, y, x + size + Math.min(tick, gap), y],
    [x, y + size, x - Math.min(tick, gap), y + size],
    [x + size, y + size, x + size + Math.min(tick, gap), y + size],
    [x, y, x, y - Math.min(tick, gap)],
    [x + size, y, x + size, y - Math.min(tick, gap)],
    [x, y + size, x, y + size + Math.min(tick, gap)],
    [x + size, y + size, x + size, y + size + Math.min(tick, gap)],
  ];

  for (const [x1, y1, x2, y2] of marks) {
    pdf.line(x1, y1, x2, y2);
  }
}
