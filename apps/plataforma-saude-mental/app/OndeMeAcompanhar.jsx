import { itensOndeMeAcompanhar } from './ondeMeAcompanharModelo';
import * as marcaApp from './spotifyShow.generated';

// Seção "Onde me acompanhar" (home do app). Links com alvo mínimo de 44 px, foco visível e abertura em nova aba.
// Spotify e Facebook só aparecem quando a URL correspondente existe em config/marca.json.
export default function OndeMeAcompanhar() {
  const itens = itensOndeMeAcompanhar(marcaApp);
  return (
    <section aria-labelledby="onde-me-acompanhar" className="mx-auto w-full max-w-4xl px-6 py-10">
      <h2 id="onde-me-acompanhar" className="font-serif text-2xl text-verde-escuro">Onde me acompanhar</h2>
      <ul className="mt-4 flex flex-wrap gap-3">
        {itens.map((i) => (
          <li key={i.id}>
            <a
              href={i.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={i.ariaLabel}
              className="inline-flex min-h-11 items-center rounded-xl border border-tinta-media/20 px-4 text-sm font-semibold text-verde-escuro transition-colors hover:border-verde/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-escuro"
            >
              {i.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
