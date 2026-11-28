// "Onde me acompanhar": modelo dos links (sem JSX, testável com node --test).
// Instagram, YouTube e LinkedIn sempre aparecem. Spotify e Facebook só aparecem com URL válida
// (config/marca.json). Facebook é só ponte para o perfil/página: nenhuma publicação automática.
const INSTAGRAM_OFICIAL = 'https://instagram.com/doutor.antoniofelipe.smental';

function httpsDe(url, dominio) {
  const u = String(url || '').trim();
  const re = new RegExp('^https://(www\\.)?' + dominio.replace(/\./g, '\\.') + '/[^\\s"<>]+$');
  return re.test(u) ? u : null;
}

function itemOndeMeAcompanhar({ id, rotulo, href }) {
  return { id, rotulo, href, ariaLabel: `${rotulo}, abre em nova aba` };
}

function itensOndeMeAcompanhar(cfg = {}) {
  const itens = [
    itemOndeMeAcompanhar({ id: 'instagram', rotulo: 'Instagram', href: INSTAGRAM_OFICIAL }),
  ];
  const yt = httpsDe(cfg.YOUTUBE_CANAL_URL, 'youtube.com');
  if (yt) itens.push(itemOndeMeAcompanhar({ id: 'youtube', rotulo: 'YouTube', href: yt }));
  const li = httpsDe(cfg.LINKEDIN_HREF, 'linkedin.com');
  if (li) itens.push(itemOndeMeAcompanhar({ id: 'linkedin', rotulo: 'LinkedIn', href: li }));
  const sp = cfg.SPOTIFY_SHOW_URL && /^https:\/\/open\.spotify\.com\/[^\s"<>]+$/.test(cfg.SPOTIFY_SHOW_URL) ? cfg.SPOTIFY_SHOW_URL : null;
  if (sp) itens.push(itemOndeMeAcompanhar({ id: 'spotify', rotulo: 'Spotify', href: sp }));
  const fb = httpsDe(cfg.FACEBOOK_URL, 'facebook.com');
  if (fb) itens.push(itemOndeMeAcompanhar({ id: 'facebook', rotulo: 'Facebook', href: fb }));
  return itens;
}

module.exports = { itensOndeMeAcompanhar, INSTAGRAM_OFICIAL };
