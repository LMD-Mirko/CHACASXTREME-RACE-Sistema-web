/** URL de la web pública (magic links camarógrafos / Mi carrera). */
export const PUBLIC_SITE_URL = 'https://mankariders.xyz';

export function publicSiteUrl(path = '/') {
  const base = PUBLIC_SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
