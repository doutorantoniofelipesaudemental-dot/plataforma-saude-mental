'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Heart, Activity, GraduationCap, Briefcase, ArrowRight, BookOpen,
  CheckCircle2, AtSign, Wind, Moon, Users, RefreshCw,
} from 'lucide-react';
import CartaoArtigoAnimado from './CartaoArtigoAnimado';

// Conteudo real da secao "Sobre" de public/index.html (site anterior) —
// nao existe apresentacao institucional separada nos arquivos do usuario;
// esta e a fonte institucional legitima ja publicada. Credenciais no texto
// exato fornecido para esta atualizacao.
const CREDENCIAIS = [
  'CRM-BA: 41322 · RQE: 26638',
  'Pós-graduado em Medicina do Trabalho, Psiquiatria, Saúde Mental, Atenção Psicossocial e Neuropsicologia',
  'Consultoria e Mentoria em Saúde Mental',
];

// "Situacoes que acompanhamos" — mesmo conteudo de public/index.html,
// secao Atendimento, sem reescrita. Vira a secao Servicos/Mentoria aqui.
const SERVICOS = [
  {
    icone: Wind,
    titulo: 'Ansiedade e pânico',
    texto: 'Preocupação constante, crises de pânico, ansiedade social, sintomas físicos sem causa clínica e o ciclo de evitação que vai encolhendo a rotina.',
  },
  {
    icone: Heart,
    titulo: 'Depressão e humor',
    texto: 'Tristeza persistente, perda de prazer, cansaço que o descanso não resolve, irritabilidade, oscilações de humor e alterações de apetite e sono.',
  },
  {
    icone: Moon,
    titulo: 'Sono',
    texto: 'Insônia, sono não reparador, despertares de madrugada, inversão do ritmo e dependência de medicação para dormir.',
  },
  {
    icone: Briefcase,
    titulo: 'Estresse e burnout',
    texto: 'Esgotamento profissional, sobrecarga crônica, dificuldade de desligar do trabalho e queda de desempenho acompanhada de culpa.',
  },
  {
    icone: Users,
    titulo: 'Relacionamentos e luto',
    texto: 'Conflitos familiares e conjugais, dificuldade de estabelecer limites, perdas recentes e processos de luto que não se acomodam.',
  },
  {
    icone: RefreshCw,
    titulo: 'Revisão de tratamento',
    texto: 'Segunda opinião, ajuste de medicação em uso, efeitos colaterais incômodos e retomada de tratamentos interrompidos.',
  },
];

const MODULOS = [
  {
    icone: Heart,
    titulo: 'Diário & Pacientes',
    texto: 'Registro emocional diário e exercício de respiração guiada 4-7-8.',
  },
  {
    icone: Activity,
    titulo: 'Escalas Clínicas (PA/APS)',
    texto: 'PHQ-9, GAD-7 e triagem de risco de suicídio, com texto pronto para o prontuário.',
  },
  {
    icone: GraduationCap,
    titulo: 'SNAP-IV (Escolar)',
    texto: 'Rastreio de desatenção e hiperatividade para avaliação em TDAH.',
  },
  {
    icone: Briefcase,
    titulo: 'Burnout (Ocupacional)',
    texto: 'Rastreio de exaustão, despersonalização e eficácia profissional.',
  },
];

const EIXOS_DESTAQUE = [
  { eixo: 1, slug: 'panico-ou-infarto-diagnostico-diferencial', titulo: 'Crise de pânico ou infarto?' },
  { eixo: 8, slug: 'vicio-em-apostas-bets-sinais-de-alerta', titulo: 'Vício em apostas online (bets)' },
  { eixo: 10, slug: 'esquecimento-normal-ou-alzheimer', titulo: 'Esquecimento normal ou Alzheimer?' },
];

// Regra 3/8 do CLAUDE.md: springs naturais (stiffness 300 / damping 30),
// stagger de 0.06-0.12s entre itens, texto revela uma vez (once: true) —
// nunca reanima ao rolar de volta. prefers-reduced-motion troca deslocamento
// por opacidade curta, nunca remove o feedback por completo.
const SPRING = { type: 'spring', stiffness: 300, damping: 30 };

function useVariantes() {
  const reduzMovimento = useReducedMotion();

  if (reduzMovimento) {
    return {
      container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
      item: {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.12 } },
      },
    };
  }

  return {
    container: {
      hidden: {},
      show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
    },
    item: {
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: SPRING },
    },
  };
}

export default function LandingContent() {
  const { container, item } = useVariantes();

  return (
    <main className="flex flex-1 flex-col bg-areia text-tinta">
      {/* Hero — anima na entrada da pagina, nao no scroll (esta acima da dobra) */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-16 pt-20 sm:px-8"
      >
        <motion.p variants={item} className="text-sm font-medium text-verde">
          Consultas online e presenciais
        </motion.p>

        <motion.h1
          variants={item}
          className="max-w-2xl font-serif text-4xl font-bold leading-tight text-verde-escuro sm:text-5xl"
        >
          Plataforma Integrada de Saúde Mental
        </motion.h1>

        <motion.p variants={item} className="max-w-2xl text-lg leading-relaxed text-tinta-media">
          Ferramentas clínicas de apoio para Atenção Primária, Pronto
          Atendimento Psiquiátrico, Saúde Ocupacional e contexto escolar —
          registro do paciente, escalas validadas e texto pronto para o
          prontuário.
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap gap-3">
          <Link
            href="/ferramentas"
            className="inline-flex items-center gap-2 rounded-xl bg-verde-escuro px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-verde focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
          >
            Abrir ferramenta clínica
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-tinta-media/20 bg-white px-6 py-3.5 text-sm font-semibold text-verde-escuro transition-colors hover:border-verde/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Ler o blog
          </Link>
        </motion.div>
      </motion.section>

      {/* Sobre o Medico — revela ao rolar ate a secao, uma unica vez */}
      <motion.section
        id="sobre"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="scroll-mt-16 border-y border-tinta-media/10 bg-white"
      >
        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-10 px-6 py-16 sm:px-8 md:grid-cols-[minmax(0,260px)_1fr] md:gap-12">
          <motion.div variants={item}>
            {/* Placa oficial — imagem institucional real, nao um placeholder
                desenhado. 150x150 nativo: exibida perto do tamanho original
                para nao borrar por upscaling. */}
            <div className="mb-4 w-fit overflow-hidden rounded-2xl border border-dourado/40 shadow-sm">
              <Image
                src="/images/dr-antonio-felipe.jpg"
                alt="Placa oficial — Dr. Antônio Felipe"
                width={150}
                height={150}
                className="h-[150px] w-[150px] object-cover"
                priority
              />
            </div>
            <h2 className="font-serif text-xl font-bold text-verde-escuro">Dr. Antônio Felipe</h2>
            <p className="mt-1 text-sm text-tinta-media">
              Médico Especialista em MFC (Medicina de Família e Comunidade)
            </p>

            <ul className="mt-5 space-y-2.5">
              {CREDENCIAIS.map((credencial) => (
                <li key={credencial} className="flex items-start gap-2 text-sm text-tinta-media">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-verde" aria-hidden="true" />
                  <span>{credencial}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://instagram.com/doutor.antoniofelipe.smental"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-tinta-media/20 px-4 py-2 text-xs font-semibold text-verde-escuro transition-colors hover:border-verde/40"
            >
              <AtSign className="h-3.5 w-3.5" aria-hidden="true" />
              @doutor.antoniofelipe.smental
            </a>
          </motion.div>

          <motion.blockquote
            variants={item}
            className="border-l-2 border-dourado pl-6 font-serif text-xl leading-relaxed text-verde-escuro sm:text-2xl"
          >
            "Atuo diretamente no Pronto Atendimento Psiquiátrico, onde lido com o que há de
            mais urgente em saúde mental, e na Atenção Primária à Saúde, onde o cuidado se
            constrói ao longo do tempo, em vínculo com pacientes e famílias. Essa dupla
            vivência me permite enxergar a saúde mental como um sistema contínuo, o que
            sustenta meu trabalho de Mentoria e Consultoria em Saúde Mental."
          </motion.blockquote>
        </div>
      </motion.section>

      {/* Servicos/Mentoria — "Situacoes que acompanhamos" do site anterior,
          texto original preservado, sem reescrita. */}
      <motion.section
        id="servicos"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="scroll-mt-16 bg-areia"
      >
        <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-8">
          <motion.div variants={item} className="mb-8 max-w-2xl">
            <p className="mb-2 text-sm font-medium text-verde">Serviços &amp; Mentoria</p>
            <h2 className="font-serif text-2xl font-bold text-verde-escuro">Situações que acompanhamos</h2>
            <p className="mt-2 text-sm leading-relaxed text-tinta-media">
              A avaliação é sempre individual. Esta lista serve para você reconhecer o
              que está vivendo — não para se autodiagnosticar.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICOS.map(({ icone: Icone, titulo, texto }) => (
              <motion.div
                key={titulo}
                variants={item}
                whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                className="rounded-2xl border border-tinta-media/15 bg-white p-5"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <Icone className="h-5 w-5 text-verde" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-verde-escuro">{titulo}</h3>
                </div>
                <p className="text-sm leading-relaxed text-tinta-media">{texto}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Modulos — revela ao rolar ate a secao, uma unica vez */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto w-full max-w-4xl px-6 pb-16 sm:px-8"
      >
        <motion.h2 variants={item} className="mb-6 font-serif text-2xl font-bold text-verde-escuro">
          Quatro módulos, um só lugar
        </motion.h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MODULOS.map(({ icone: Icone, titulo, texto }) => (
            <motion.div
              key={titulo}
              variants={item}
              whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
              className="rounded-2xl border border-tinta-media/15 bg-white p-5"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <Icone className="h-5 w-5 text-verde" aria-hidden="true" />
                <h3 className="text-sm font-bold text-verde-escuro">{titulo}</h3>
              </div>
              <p className="text-sm leading-relaxed text-tinta-media">{texto}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Blog em destaque — revela ao rolar */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto w-full max-w-4xl px-6 pb-20 sm:px-8"
      >
        <motion.div variants={item} className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-bold text-verde-escuro">Do blog</h2>
          <Link href="/blog" className="text-sm font-semibold text-verde hover:text-verde-escuro">
            Ver todos os 12 artigos →
          </Link>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {EIXOS_DESTAQUE.map(({ eixo, slug, titulo }) => (
            <CartaoArtigoAnimado
              key={slug}
              href={`/blog/${slug}`}
              badge={`Eixo ${String(eixo).padStart(2, '0')}`}
              titulo={titulo}
              capa={`/images/artigos/${slug}.jpg`}
            />
          ))}
        </div>
      </motion.section>

      {/* CTA de fechamento */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={SPRING}
        className="border-t border-tinta-media/10 bg-verde-escuro"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-start gap-4 px-6 py-16 sm:px-8">
          <h2 className="font-serif text-2xl font-bold text-white">
            Pronto para agendar sua consulta?
          </h2>
          <p className="max-w-xl text-slate-300">
            Atendimento em Atenção Primária, Pronto Atendimento Psiquiátrico e
            saúde ocupacional — presencial ou telemedicina.
          </p>
          <a
            href={`mailto:${'doutor.antoniofelipe.saudemental@gmail.com'}`}
            className="inline-flex items-center gap-2 rounded-xl bg-dourado px-6 py-3.5 text-sm font-semibold text-verde-escuro transition-colors hover:bg-white"
          >
            Agendar consulta
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </motion.section>
    </main>
  );
}
