'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Card de artigo reutilizado em /blog, /artigos e na Landing Page.
// Entrada ao rolar (whileInView, once: true — Regra 6/8 do CLAUDE.md, nunca
// reanima ao voltar) + hover com leve zoom (scale-105) e elevacao via
// sombra colorida (Regra 9 "genjutsu" — sombra com cor, nunca preto puro).
export default function CartaoArtigoAnimado({ href, badge, titulo, resumo, capa }) {
  const reduzMovimento = useReducedMotion();

  const entrada = reduzMovimento
    ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        transition: { type: 'spring', stiffness: 300, damping: 30 },
      };

  const hover = reduzMovimento
    ? {}
    : {
        whileHover: {
          scale: 1.05,
          y: -4,
          boxShadow: '0 24px 48px -16px rgba(13,51,48,0.28)',
          transition: { duration: 0.2, ease: 'easeOut' },
        },
      };

  return (
    <motion.div
      {...entrada}
      {...hover}
      viewport={{ once: true, amount: 0.2 }}
      className="h-full rounded-2xl"
    >
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-tinta-media/15 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
      >
        <div className="relative aspect-[1200/630] w-full overflow-hidden bg-verde-escuro">
          <Image
            src={capa}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="mb-2 w-fit rounded-full bg-verde-claro/25 px-2.5 py-0.5 text-[11px] font-bold text-verde-escuro">
            {badge}
          </span>
          <h3 className="font-serif text-base font-bold leading-snug text-verde-escuro">
            {titulo}
          </h3>
          {resumo && (
            <p className="mt-2 flex-1 text-sm leading-relaxed text-tinta-media">{resumo}</p>
          )}
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-verde">
            Ler artigo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
