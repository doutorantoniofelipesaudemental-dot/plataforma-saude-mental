import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Componentes globais disponiveis em todo arquivo .mdx (obrigatorio para
// @next/mdx funcionar com o App Router). Espelha o vocabulario ja usado nos
// artigos HTML existentes do blog (lead-para, callout, refs-note em
// backend/seed-artigos.js) — mesma voz, mesma estrutura, so trocando HTML
// bruto por componentes MDX reutilizaveis.

function Lead({ children }) {
  return (
    <p className="text-xl font-medium leading-relaxed text-tinta-media">
      {children}
    </p>
  );
}

function Callout({ titulo, children }) {
  return (
    <div className="not-prose my-8 rounded-2xl border border-dourado/30 bg-areia p-5">
      {titulo && (
        <p className="mb-2 text-sm font-bold text-verde-escuro">{titulo}</p>
      )}
      <div className="text-sm leading-relaxed text-tinta-media">{children}</div>
    </div>
  );
}

// Disclaimer de compliance — Regra 10 do CLAUDE.md: nenhum artigo promete
// cura, resultado garantido ou diagnostico a distancia. `emergencia` liga a
// linha do CVV 188 para eixos que tratam risco de crise/suicidio.
function RefsNote({ emergencia, children }) {
  return (
    <div className="not-prose mt-10 border-t border-tinta-media/15 pt-6 text-xs leading-relaxed text-tinta-media/80">
      {emergencia && (
        <p className="mb-2 font-semibold text-rose-700">
          Em caso de risco imediato à vida, ligue 188 (CVV, 24h, gratuito) ou
          procure o pronto-socorro mais próximo.
        </p>
      )}
      <p>
        {children ||
          'Este conteúdo tem finalidade educativa e não substitui avaliação médica ou psicológica individualizada.'}
      </p>
    </div>
  );
}

// CTA embutido no corpo do artigo, apontando pra ferramenta clinica
// (/ferramentas) — distinto do CTA de "agendar consulta" que ja vive no
// wrapper de pagina: este fala com quem le em contexto profissional
// (escalas, texto pronto pro prontuario), nao com quem busca atendimento.
function CallToTool() {
  return (
    <div className="not-prose my-8 rounded-2xl border border-verde/25 bg-verde-claro/10 p-5">
      <p className="mb-3 text-sm leading-relaxed text-tinta-media">
        Profissional de saúde? A ferramenta clínica reúne escalas validadas,
        diário do paciente e texto pronto para o prontuário.
      </p>
      <Link
        href="/ferramentas"
        className="inline-flex items-center gap-2 rounded-xl bg-verde-escuro px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-verde"
      >
        Abrir ferramenta clínica
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

const components = {
  Lead,
  Callout,
  RefsNote,
  CallToTool,
};

export function useMDXComponents(existing) {
  return {
    ...existing,
    ...components,
  };
}
