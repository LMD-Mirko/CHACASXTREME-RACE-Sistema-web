/**
 * Mensajes WhatsApp.
 * Escapes \u{...} (ASCII en fuente). En desktop el texto NO va en la URL:
 * WhatsApp Desktop suele convertir esos emojis en caracteres rotos.
 */

const E = {
  hands: '\u{1F64C}', // raising hands
  fire: '\u{1F525}', // fire
  flag: '\u{1F3C1}', // chequered flag
  orange: '\u{1F9E1}', // orange heart
  mountain: '\u{26F0}\u{FE0F}', // mountain
  wave: '\u{1F44B}', // wave
  bike: '\u{1F6B2}', // bicycle
  camera: '\u{1F4F8}', // camera flash
};

export function normalizeWaPhone(phone) {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (!digits) return null;
  if (digits.startsWith('51')) return digits;
  return `51${digits}`;
}

export function phoneFromWhatsAppUrl(waUrl) {
  if (!waUrl) return null;
  try {
    const u = new URL(waUrl);
    const phone = u.searchParams.get('phone') || u.pathname.replace(/^\//, '');
    const digits = String(phone || '').replace(/\D+/g, '');
    return digits || null;
  } catch {
    return null;
  }
}

function isMobileUa() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

/** En móvil incluye text; en desktop solo abre el chat (el mensaje se pega desde el clipboard). */
export function buildWhatsAppUrl(phone, text, { forceTextInUrl = false } = {}) {
  const waPhone = normalizeWaPhone(phone) || phoneFromWhatsAppUrl(phone);
  if (!waPhone) return null;
  const putText = (forceTextInUrl || isMobileUa()) && text;
  if (putText) {
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${waPhone}`;
}

function firstName(fullName) {
  const n = String(fullName || '').trim();
  return n.split(/\s+/)[0] || n;
}

export function dossierThanksMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'rider';
  const first = firstName(name);
  return (
    `¡Hola ${name}! ${E.hands}${E.fire}\n\n` +
    `¡Gracias por participar en Chacas Xtreme Race! Fue un honor tenerte en la montaña y ser parte de esta locura.\n\n` +
    `Aquí tienes tu enlace personal a *Mi carrera* ${E.flag} - ahí verás tus tiempos, fotos y videos del evento:\n` +
    `${url}\n\n` +
    `¡Gracias por ser parte de la familia Chacas Xtreme Race, ${first}! ${E.orange}${E.mountain} Nos vemos en la próxima.`
  );
}

export function profileCompleteMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'rider';
  return (
    `¡Hola ${name}! ${E.wave}${E.bike}\n\n` +
    `Sube tu foto rider y completa lo que falta para Chacas Xtreme Race.\n\n` +
    `Entra aquí (es tu enlace personal):\n${url}`
  );
}

export function photographerAccessMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'camarógrafo';
  return (
    `¡Hola ${name}! ${E.camera}${E.hands}\n\n` +
    `Aquí tienes tu acceso al panel de camarógrafos de Chacas Xtreme Race.\n\n` +
    `Entra aquí (enlace personal):\n${url}`
  );
}

/** { url, whatsapp_url, whatsapp_text, whatsapp_phone } */
export function withClientWhatsApp(data, buildText) {
  const url = data?.url || null;
  const name =
    data?.rider?.full_name ||
    data?.photographer?.full_name ||
    data?.full_name ||
    '';
  const phone =
    data?.whatsapp_phone ||
    data?.phone ||
    data?.rider?.emergency_phone ||
    data?.photographer?.phone ||
    phoneFromWhatsAppUrl(data?.whatsapp_url);

  const text = url ? buildText(name, url) : null;
  return {
    ...data,
    url,
    whatsapp_phone: normalizeWaPhone(phone),
    whatsapp_text: text,
    whatsapp_url: buildWhatsAppUrl(phone, text),
  };
}
