import Link from 'next/link';
import { TODOS_ARTIGOS } from '@/src/content/artigos';
import CartaoArtigoAnimado from '../CartaoArtigoAnimado';

export const metadata = {
  title: 'Artigos',
  description:
    'Vol. 2 dos 12 eixos da Matriz Editorial de Saúde Mental, e o acervo completo de artigos do site anterior do Dr. Antônio Felipe.',
};

async function carregarArtigos() {
  const artigos = await Promise.all(
    TODOS_ARTIGOS.map(async (item) => {
      const { metadata } = await import(`@/src/content/artigos/${item.slug}.mdx`);
      return { ...item, ...metadata };
    })
  );
  const vol2 = artigos.filter((a) => a.origem === 'vol2').sort((a, b) => a.eixo - b.eixo);
  const siteAnterior = artigos
    .filter((a) => a.origem === 'site-anterior')
    .sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm));
  return { vol2, siteAnterior };
}

export default async function ArtigosIndexPage() {
  const { vol2, siteAnterior } = await carregarArtigos();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-8">
      <div className="mb-12 max-w-2xl">
        <h1 className="font-serif text-4xl font-bold text-verde-escuro">Artigos</h1>
        <p className="mt-3 text-lg leading-relaxed text-tinta-media">
          {vol2.length + siteAnterior.length} artigos — Vol. 2 da Matriz Editorial e o acervo
          completo do site anterior.{' '}
          <Link href="/blog" className="font-semibold text-verde hover:text-verde-escuro">
            Ver o Vol. 1 →
          </Link>
        </p>
      </div>

      <section className="mb-16">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-full bg-dourado/20 px-3 py-1 text-xs font-bold text-verde-escuro">
            Volume 2
          </span>
          <h2 className="font-serif text-xl font-bold text-verde-escuro">Matriz Editorial — Vol. 2</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {vol2.map((artigo) => (
            <CartaoArtigoAnimado
              key={artigo.slug}
              href={`/artigos/${artigo.slug}`}
              badge={`Eixo ${String(artigo.eixo).padStart(2, '0')}`}
              titulo={artigo.titulo}
              resumo={artigo.resumo}
              capa={`/images/artigos/${artigo.slug}.jpg`}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="font-serif text-xl font-bold text-verde-escuro">Acervo do site anterior</h2>
          <p className="mt-1 text-sm text-tinta-media">
            {siteAnterior.length} artigos originais, migrados na íntegra do site anterior.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {siteAnterior.map((artigo) => (
            <CartaoArtigoAnimado
              key={artigo.slug}
              href={`/artigos/${artigo.slug}`}
              badge={artigo.categoria}
              titulo={artigo.titulo}
              resumo={artigo.resumo}
              capa={`/images/artigos/${artigo.slug}.jpg`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
