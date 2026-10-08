import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EIXOS } from '@/content/blog/eixos';

export function generateStaticParams() {
  return EIXOS.map(({ slug }) => ({ slug }));
}

// So os 12 artigos da matriz existem como rota — qualquer outro slug cai em
// 404 em vez de tentar compilar um import inexistente.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { metadata } = await import(`@/content/blog/${slug}.mdx`);
  return {
    title: metadata.titulo,
    description: metadata.resumo,
  };
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ArtigoPage({ params }) {
  const { slug } = await params;
  const { default: Artigo, metadata } = await import(`@/content/blog/${slug}.mdx`);
  const info = EIXOS.find((e) => e.slug === slug);

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-8">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-verde hover:text-verde-escuro"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Todos os artigos
      </Link>

      <header className="mb-10">
        {info && (
          <span className="mb-3 inline-block rounded-full bg-verde-claro/25 px-3 py-1 text-xs font-bold text-verde-escuro">
            Eixo {String(info.eixo).padStart(2, '0')} · {metadata.pilarEixo}
          </span>
        )}
        <h1 className="font-serif text-3xl font-bold leading-tight text-verde-escuro sm:text-4xl">
          {metadata.titulo}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tinta-media">
          <span>Dr. Antônio Felipe</span>
          <span aria-hidden="true">·</span>
          <time dateTime={metadata.publicadoEm}>{formatarData(metadata.publicadoEm)}</time>
          <span aria-hidden="true">·</span>
          <span>{metadata.tempoLeitura} min de leitura</span>
        </p>
      </header>

      <div className="prose prose-marca max-w-none leading-relaxed">
        <Artigo />
      </div>

      <div className="mt-12 rounded-2xl bg-verde-escuro p-6 text-white">
        <p className="mb-3 text-sm font-medium text-slate-200">
          Quer conversar sobre isso com o Dr. Antônio Felipe?
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-dourado px-5 py-2.5 text-sm font-semibold text-verde-escuro transition-colors hover:bg-white"
        >
          Agendar consulta
        </Link>
      </div>
    </article>
  );
}
