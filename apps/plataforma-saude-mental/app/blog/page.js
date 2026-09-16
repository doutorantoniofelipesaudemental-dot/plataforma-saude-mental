import Link from 'next/link';
import { EIXOS } from '@/content/blog/eixos';
import { ARTIGOS_VOL2 } from '@/src/content/artigos';
import CartaoArtigoAnimado from '../CartaoArtigoAnimado';

export const metadata = {
  title: 'Blog',
  description:
    'Artigos do Dr. Antônio Felipe organizados pelos 12 eixos da Matriz Editorial de Saúde Mental: APS, Pronto Atendimento, cuidadores, escola, dependências, perinatal e mais.',
};

async function carregarGrupos() {
  const grupos = await Promise.all(
    EIXOS.map(async ({ eixo, slug: slugVol1 }) => {
      const vol2Item = ARTIGOS_VOL2.find((a) => a.eixo === eixo);

      const { metadata: metaVol1 } = await import(`@/content/blog/${slugVol1}.mdx`);
      const vol1 = { volume: 1, slug: slugVol1, href: `/blog/${slugVol1}`, ...metaVol1 };

      let vol2 = null;
      if (vol2Item) {
        const { metadata: metaVol2 } = await import(`@/src/content/artigos/${vol2Item.slug}.mdx`);
        vol2 = { volume: 2, slug: vol2Item.slug, href: `/artigos/${vol2Item.slug}`, ...metaVol2 };
      }

      return { eixo, pilarEixo: metaVol1.pilarEixo, vol1, vol2 };
    })
  );
  return grupos.sort((a, b) => a.eixo - b.eixo);
}

export default async function BlogIndexPage() {
  const grupos = await carregarGrupos();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-8">
      <div className="mb-12 max-w-2xl">
        <h1 className="font-serif text-4xl font-bold text-verde-escuro">Blog</h1>
        <p className="mt-3 text-lg leading-relaxed text-tinta-media">
          Organizado pelos 12 eixos da Matriz Editorial — cada eixo reúne o
          artigo do Vol. 1 e do Vol. 2.{' '}
          <Link href="/artigos" className="font-semibold text-verde hover:text-verde-escuro">
            Ver também o acervo do site anterior →
          </Link>
        </p>
      </div>

      <div className="space-y-10">
        {grupos.map((grupo) => (
          <section key={grupo.eixo}>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-verde-claro/25 px-3 py-1 text-xs font-bold text-verde-escuro">
                Eixo {String(grupo.eixo).padStart(2, '0')}
              </span>
              <h2 className="text-sm font-semibold text-tinta-media">{grupo.pilarEixo}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CartaoArtigoAnimado
                href={grupo.vol1.href}
                badge={`Vol. ${grupo.vol1.volume}`}
                titulo={grupo.vol1.titulo}
                resumo={grupo.vol1.resumo}
                capa={`/images/artigos/${grupo.vol1.slug}.jpg`}
              />
              {grupo.vol2 && (
                <CartaoArtigoAnimado
                  href={grupo.vol2.href}
                  badge={`Vol. ${grupo.vol2.volume}`}
                  titulo={grupo.vol2.titulo}
                  resumo={grupo.vol2.resumo}
                  capa={`/images/artigos/${grupo.vol2.slug}.jpg`}
                />
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
