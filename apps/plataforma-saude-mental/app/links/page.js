import Link from 'next/link';

export const metadata = {
  title: 'Links',
  description:
    'Dr. Antonio Felipe, médico de família e comunidade: agendamento de consulta, mentoria em saúde mental, portal de conteúdo com narrações em áudio e Instagram.',
};

// Canal unico de agendamento: e-mail do consultorio.
const AGENDAMENTO = 'mailto:doutor.antoniofelipe.saudemental@gmail.com?subject=Agendamento%20de%20consulta';

const BOTOES = [
  {
    emoji: '🟢',
    label: 'Agendamento de Consulta Médica',
    detalhe: 'Solicite seu horário por e-mail',
    href: AGENDAMENTO,
    externo: true,
    destaque: true,
  },
  {
    emoji: '🏢',
    label: 'Mentoria e Consultoria em Saúde Mental',
    detalhe: 'Para empresas e instituições de ensino',
    href: '/#servicos',
  },
  {
    emoji: '🎙️',
    label: 'Portal de Saúde Mental & Narrações em Áudio',
    detalhe: 'Artigos com narração no topo da página',
    href: '/',
  },
  {
    emoji: '📱',
    label: 'Instagram & Conteúdos Educativos',
    detalhe: '@doutor.antoniofelipe.smental',
    href: 'https://instagram.com/doutor.antoniofelipe.smental',
    externo: true,
  },
];

const POS_GRADUACOES = [
  'Psiquiatria',
  'Saúde Mental & Atenção Psicossocial',
  'Medicina do Trabalho',
  'Neuropsicologia',
  'Terapia Cognitivo-Comportamental',
];

const ATUACAO = [
  'Pronto Atendimento Psiquiátrico',
  'Atenção Primária à Saúde',
  'Mentoria e Consultoria em Saúde Mental do Dr. Antonio Felipe',
];

const FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado';

function Botao({ emoji, label, detalhe, href, externo, destaque }) {
  const classes = `flex min-h-14 w-full items-center gap-4 rounded-2xl px-5 py-4 text-left shadow-sm transition-colors ${FOCO} ${
    destaque
      ? 'bg-verde-escuro text-white hover:bg-verde'
      : 'border border-tinta-media/20 bg-white text-tinta hover:border-verde hover:bg-areia'
  }`;
  const conteudo = (
    <>
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <span className="flex flex-col">
        <span className="text-base font-semibold leading-snug">{label}</span>
        <span className={`text-sm ${destaque ? 'text-white/85' : 'text-tinta-media'}`}>{detalhe}</span>
      </span>
    </>
  );
  return externo ? (
    <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
      {conteudo}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {conteudo}
    </Link>
  );
}

export default function PaginaLinks() {
  return (
    <main className="flex-1 bg-areia px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col gap-3 text-center">
          <h1 className="font-serif text-3xl font-bold text-verde-escuro">Dr. Antonio Felipe</h1>
          <p className="text-base font-medium text-tinta">
            Médico Especialista em Medicina de Família e Comunidade
          </p>
          <p className="text-sm font-semibold text-verde">CRM-BA 41322 | RQE 26638</p>

          <div className="mt-2 flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-media">
              Pós-graduações (não especialista)
            </p>
            <p className="text-sm leading-relaxed text-tinta-media">{POS_GRADUACOES.join(' • ')}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-media">Atuação</p>
            <p className="text-sm leading-relaxed text-tinta-media">{ATUACAO.join(' • ')}</p>
          </div>
        </header>

        <nav aria-label="Links principais">
          <ul className="flex flex-col gap-3">
            {BOTOES.map((b) => (
              <li key={b.label}>
                <Botao {...b} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
