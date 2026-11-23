import { propsSpotify } from './spotifyLinkModelo';
import { SPOTIFY_SHOW_URL } from './spotifyShow.generated';

// Link para o programa no Spotify. Sem SPOTIFY_SHOW_URL válida (config/marca.json), não renderiza nada.
// Foco visível e alvo mínimo de 44 px (CLAUDE.md, §2).
export default function SpotifyLink({ className = '' }) {
  const p = propsSpotify(SPOTIFY_SHOW_URL);
  if (!p) return null;
  return (
    <a
      href={p.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={p.ariaLabel}
      className={`inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-escuro ${className}`}
    >
      {p.rotulo}
    </a>
  );
}
