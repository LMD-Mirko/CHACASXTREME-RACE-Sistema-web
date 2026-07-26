/**
 * Mensajes WhatsApp (sin emojis: en desktop suelen romperse al ir en la URL).
 */

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
    `¡Hola ${name}!\n\n` +
    `¡Gracias por participar en Chacas Xtreme Race! Fue un honor tenerte en la montaña.\n\n` +
    `Aquí tienes tu enlace personal a *Mi carrera* — ahí verás tus tiempos, fotos y videos del evento:\n` +
    `${url}\n\n` +
    `¡Gracias por ser parte de la familia Chacas Xtreme Race, ${first}! Nos vemos en la próxima.`
  );
}

export function profileCompleteMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'rider';
  const first = firstName(name);
  return (
    `¡Hola ${name}!\n\n` +
    `Estamos felices de tenerte en la familia Chacas Xtreme Race.\n\n` +
    `Aquí está tu enlace personal: súbenos tu foto rider, elige tu número de placa y completa lo que falte en tu ficha. Sale en la web oficial y todo el pelotón te va a reconocer en la montaña:\n` +
    `${url}\n\n` +
    `¡Nos vemos en la carrera, ${first}!`
  );
}

export function photographerAccessMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'camarógrafo';
  return (
    `¡Hola ${name}!\n\n` +
    `Bienvenido/a al equipo de media de Chacas Xtreme Race.\n\n` +
    `Aquí tienes tu acceso personal al panel de camarógrafos:\n` +
    `${url}`
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
