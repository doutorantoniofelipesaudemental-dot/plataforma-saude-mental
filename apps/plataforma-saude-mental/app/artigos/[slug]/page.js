import Link from 'next/link';
import { canonicalDoTexto } from '../../slugsDominioPrincipal';
import { ArrowLeft } from 'lucide-react';
import { TODOS_ARTIGOS } from '@/src/content/artigos';
import RodapeIdentificacao from '@/app/RodapeIdentificacao';
import { AVISO_PROTOCOLOS, precisaAviso } from '@/app/avisoProtocolos';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function generateStaticParams() {
  return TODOS_ARTIGOS.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { metadata } = await import(`@/src/content/artigos/${slug}.mdx`);
  return {
    title: metadata.titulo,
    description: metadata.resumo,
    alternates: { canonical: canonicalDoTexto(slug, '/artigos/' + slug) },
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
  const { default: Artigo, metadata } = await import(`@/src/content/artigos/${slug}.mdx`);
  const info = TODOS_ARTIGOS.find((a) => a.slug === slug);
  const eDoSiteAnterior = info?.origem === 'site-anterior';
  const textoBruto = readFileSync(join(process.cwd(), 'src', 'content', 'artigos', `${slug}.mdx`), 'utf8');
  const mostrarAviso = precisaAviso({ slug, categoria: metadata.categoria, texto: textoBruto });

  return (
    <main className="flex-1">
    <article className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-8">
      <Link
        href="/artigos"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-verde hover:text-verde-escuro"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Todos os artigos
      </Link>

      <header className="mb-10">
        {info && (
          <span className="mb-3 inline-block rounded-full bg-verde-claro/25 px-3 py-1 text-xs font-bold text-verde-escuro">
            {eDoSiteAnterior
              ? `${metadata.categoria} · Site anterior`
              : `Eixo ${String(info.eixo).padStart(2, '0')} · Vol. 2 · ${metadata.pilarEixo}`}
          </span>
        )}
        <h1 className="font-serif text-3xl font-bold leading-tight text-verde-escuro sm:text-4xl">
          {metadata.titulo}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tinta-media">
          <span>{metadata.autor || 'Dr. Antônio Felipe'}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={metadata.publicadoEm}>{formatarData(metadata.publicadoEm)}</time>
          <span aria-hidden="true">·</span>
          <span>{metadata.tempoLeitura} min de leitura</span>
        </p>
      </header>

      <div className="prose prose-marca max-w-none leading-relaxed">
        <Artigo />
      </div>
      {mostrarAviso && (
        <aside className="mt-10 rounded-lg border border-tinta-media/20 bg-verde-claro/10 px-4 py-3 text-sm leading-relaxed text-tinta-media" data-aviso-protocolos>
          <p>{AVISO_PROTOCOLOS}</p>
        </aside>
      )}
      <RodapeIdentificacao />
    </article>
    </main>
  );
}
