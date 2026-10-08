import Link from 'next/link';
import { ArrowRight, CheckCircle2, Stethoscope, Users, Building2, MessageCircle } from 'lucide-react';

// Landing de Mentoria. Texto de identificação e aviso de IA idênticos aos do CLAUDE.md do projeto
// (padrão completo de 5 linhas do portal e Res. CFM 2.454/2026); sem promessa de resultado.
const IDENTIFICACAO = [
  'Dr. Antonio Felipe · Médico · CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade · RQE 26638',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho.',
  'NÃO ESPECIALISTA',
];

const AVISO_CFM =
  'Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antonio Felipe (Resolução CFM 2.454/2026).';

const PUBLICOS = [
  {
    icone: Stethoscope,
    titulo: 'Profissionais e residentes',
    texto: 'Raciocínio clínico em saúde mental na prática diária: o que observar, quando agir na unidade e quando encaminhar.',
  },
  {
    icone: Building2,
    titulo: 'Empresas e RH',
    texto: 'Estrutura de cuidado com a saúde mental no trabalho, com base na Medicina do Trabalho e na NR-1.',
  },
  {
    icone: Users,
    titulo: 'Cuidadores e professores',
    texto: 'Apoio para quem cuida de outras pessoas e precisa de espaço para cuidar de si, no próprio ritmo.',
  },
];

const PASSOS = [
  { titulo: 'Conversa inicial', texto: 'Você conta o contexto e o que busca. Juntos, definimos se a mentoria é o caminho adequado.' },
  { titulo: 'Plano combinado', texto: 'Objetivos, formato e frequência dos encontros ficam claros desde o começo.' },
  { titulo: 'Encontros e acompanhamento', texto: 'Encontros com foco na sua realidade, com revisão do que funcionou e do que precisa de ajuste.' },
];

const CONTATO = 'mailto:doutor.antoniofelipe.saudemental@gmail.com?subject=Mentoria%20em%20Sa%C3%BAde%20Mental';

function BotaoMentoria({ className = '' }) {
  return (
    <a
      href={CONTATO}
      className={`inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado ${className}`}
    >
      Agendar uma mentoria
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

export default function LandingMentoria() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-8 sm:py-20">
        <p className="mb-3 text-sm font-medium text-verde">Mentoria e Consultoria em Saúde Mental</p>
        <h1 className="font-serif text-3xl font-bold leading-tight text-verde-escuro sm:text-4xl">
          Saúde mental com a visão de quem atua no Pronto Atendimento e na Atenção Primária
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-tinta-media">
          Uma mentoria individual, feita com escuta e com base em evidências, para quem quer entender
          melhor o cuidado em saúde mental na própria prática ou na própria equipe. A avaliação é sempre
          individual e presencial; a mentoria não substitui consulta nem tratamento.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BotaoMentoria className="bg-verde-escuro text-white hover:bg-verde" />
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-tinta-media/20 bg-white px-6 py-3.5 text-sm font-semibold text-verde-escuro transition-colors hover:border-verde/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
          >
            Ler o blog
          </Link>
        </div>
      </section>

      {/* Atuação */}
      <section className="border-y border-tinta-media/10 bg-white">
        <div className="mx-auto w-full max-w-4xl px-6 py-14 sm:px-8">
          <h2 className="font-serif text-2xl font-bold text-verde-escuro">Duas frentes, um mesmo olhar</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-tinta-media/15 p-5">
              <h3 className="text-sm font-bold text-verde-escuro">Pronto Atendimento Psiquiátrico (PAP)</h3>
              <p className="mt-2 text-sm leading-relaxed text-tinta-media">
                O contato diário com a urgência em saúde mental ensina a reconhecer sinais de gravidade e a
                decidir com segurança.
              </p>
            </div>
            <div className="rounded-2xl border border-tinta-media/15 p-5">
              <h3 className="text-sm font-bold text-verde-escuro">Atenção Primária à Saúde (APS)</h3>
              <p className="mt-2 text-sm leading-relaxed text-tinta-media">
                O cuidado construído ao longo do tempo, em vínculo com pacientes, famílias e equipes da unidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Para quem */}
      <section className="bg-areia">
        <div className="mx-auto w-full max-w-4xl px-6 py-14 sm:px-8">
          <h2 className="font-serif text-2xl font-bold text-verde-escuro">Para quem é</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PUBLICOS.map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="rounded-2xl border border-tinta-media/15 bg-white p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <Icone className="h-5 w-5 text-verde" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-verde-escuro">{titulo}</h3>
                </div>
                <p className="text-sm leading-relaxed text-tinta-media">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto w-full max-w-4xl px-6 py-14 sm:px-8">
        <h2 className="font-serif text-2xl font-bold text-verde-escuro">Como funciona</h2>
        <ol className="mt-6 space-y-4">
          {PASSOS.map(({ titulo, texto }, i) => (
            <li key={titulo} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-verde-escuro text-sm font-bold text-white" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-verde-escuro">{titulo}</h3>
                <p className="text-sm leading-relaxed text-tinta-media">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="border-t border-tinta-media/10 bg-verde-escuro">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-start gap-4 px-6 py-14 sm:px-8">
          <h2 className="font-serif text-2xl font-bold text-white">Vamos conversar sobre a sua mentoria?</h2>
          <p className="max-w-xl text-slate-300">
            Escreva contando o seu contexto. A resposta vem por e-mail, com os próximos passos.
          </p>
          <BotaoMentoria className="bg-dourado text-verde-escuro hover:bg-white" />
        </div>
      </section>

      {/* Identificação e conformidade (CFM) */}
      <footer className="border-t border-tinta-media/10 bg-white">
        <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-8">
          <ul className="space-y-1.5 text-sm text-tinta-media">
            {IDENTIFICACAO.map((linha, i) => (
              <li key={linha} className={i === 0 ? 'flex items-start gap-2 font-semibold text-verde-escuro' : ''}>
                {i === 0 && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-verde" aria-hidden="true" />}
                <span>{linha}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 text-sm text-tinta-media">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-verde" aria-hidden="true" />
            <span>Se precisar de apoio agora: CVV 188 (ligação gratuita, 24h) · SAMU 192.</span>
          </p>
          <p className="mt-4 text-xs leading-relaxed text-tinta-media">{AVISO_CFM}</p>
        </div>
      </footer>
    </main>
  );
}
