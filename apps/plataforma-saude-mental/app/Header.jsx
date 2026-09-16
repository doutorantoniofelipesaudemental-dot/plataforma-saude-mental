'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Menu, X } from 'lucide-react';

// Espelha a navegacao do site anterior (public/index.html: Sobre,
// Atendimento, Como funciona, Artigos, Duvidas) com os rotulos pedidos —
// Inicio, Sobre, Servicos/Mentoria, Blog, Ferramentas — e o link novo pra
// ferramenta clinica, que o site anterior nao tinha.
const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#servicos', label: 'Serviços/Mentoria' },
  { href: '/blog', label: 'Blog' },
  { href: '/ferramentas', label: 'Ferramentas' },
];

const EMAIL_CONTATO = 'doutor.antoniofelipe.saudemental@gmail.com';

export default function Header() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-tinta-media/10 bg-areia/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setAberto(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-verde-escuro">
            <Brain className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-serif text-sm font-bold text-verde-escuro">Dr. Antônio Felipe</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-tinta-media transition-colors hover:text-verde-escuro focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href={`mailto:${EMAIL_CONTATO}`}
          className="hidden items-center rounded-lg bg-verde-escuro px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-verde focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado md:inline-flex"
        >
          Agendar consulta
        </a>

        <button
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-verde-escuro focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado md:hidden"
        >
          {aberto ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {aberto && (
          <motion.nav
            aria-label="Principal (móvel)"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
            className="overflow-hidden border-t border-tinta-media/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setAberto(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-tinta-media hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={`mailto:${EMAIL_CONTATO}`}
                className="mt-2 rounded-lg bg-verde-escuro px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                Agendar consulta
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
