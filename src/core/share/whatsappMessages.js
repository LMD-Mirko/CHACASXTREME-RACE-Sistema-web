/**
 * Mensajes y URLs de WhatsApp armados en el navegador
 * (los emojis van fiables vía encodeURIComponent, no por el backend).
 */

export function normalizeWaPhone(phone) {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (!digits) return null;
  if (digits.startsWith('51')) return digits;
  return `51${digits}`;
}

/** Extrae teléfono de un wa.me / api.whatsapp.com ya armado. */
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

export function buildWhatsAppUrl(phone, text) {
  const waPhone = normalizeWaPhone(phone) || phoneFromWhatsAppUrl(phone);
  if (!waPhone || !text) return null;
  // api.whatsapp.com suele preservar mejor UTF-8/emojis que wa.me en desktop
  return `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(text)}`;
}

function firstName(fullName) {
  const n = String(fullName || '').trim();
  return n.split(/\s+/)[0] || n;
}

export function dossierThanksMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'rider';
  const first = firstName(name);
  return (
    `¡Hola ${name}! 🙌🔥\n\n` +
    `¡Gracias por participar en Chacas Xtreme Race! Fue un honor tenerte en la montaña y ser parte de esta locura.\n\n` +
    `Aquí tienes tu enlace personal a *Mi carrera* 🏁 - ahí verás tus tiempos, fotos y videos del evento:\n` +
    `${url}\n\n` +
    `¡Gracias por ser parte de la familia Chacas Xtreme Race, ${first}! 🧡⛰️ Nos vemos en la próxima.`
  );
}

export function profileCompleteMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'rider';
  return (
    `¡Hola ${name}! 👋🚲\n\n` +
    `Sube tu foto rider y completa lo que falta para Chacas Xtreme Race.\n\n` +
    `Entra aquí (es tu enlace personal):\n${url}`
  );
}

export function photographerAccessMessage(fullName, url) {
  const name = String(fullName || '').trim() || 'camarógrafo';
  return (
    `¡Hola ${name}! 📸🙌\n\n` +
    `Aquí tienes tu acceso al panel de camarógrafos de Chacas Xtreme Race.\n\n` +
    `Entra aquí (enlace personal):\n${url}`
  );
}

/** Normaliza la respuesta del API a { url, whatsapp_url } con mensaje en JS. */
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
    whatsapp_url: buildWhatsAppUrl(phone, text),
  };
}
