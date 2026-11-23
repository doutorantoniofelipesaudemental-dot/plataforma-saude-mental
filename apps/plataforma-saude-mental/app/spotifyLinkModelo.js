// Modelo do link do Spotify (sem JSX, testável com node --test). Sem URL: null (nada é renderizado).
// Rótulo só em texto ("Ouça no Spotify"): sem logotipo, até o kit oficial de marca ser baixado e registrado.
function propsSpotify(url) {
  const u = String(url || '').trim();
  if (!/^https:\/\/open\.spotify\.com\/[^\s"<>]+$/.test(u)) return null;
  return {
    href: u,
    rotulo: 'Ouça no Spotify',
    ariaLabel: 'Ouça no Spotify, abre em nova aba',
  };
}

module.exports = { propsSpotify };
