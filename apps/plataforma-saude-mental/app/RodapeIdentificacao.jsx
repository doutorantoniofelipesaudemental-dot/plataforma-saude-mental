// Identificação oficial do médico: assinatura padrão completa de 5 linhas (CLAUDE.md §1.A), exibida UMA vez por página de texto.
// O corpo dos textos (.mdx) não leva mais o bloco de identificação (15/10/2026).
const LINHAS = [
  'Dr. Antônio Felipe — Médico — CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade — RQE 26638',
  'Atua no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho',
  'NÃO ESPECIALISTA',
];

export default function RodapeIdentificacao() {
  return (
    <footer className="mt-12 border-t border-tinta-media/20 pt-6 text-sm leading-relaxed text-tinta-media">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Responsável técnico</p>
      <p>
        {LINHAS.map((linha, i) => (
          <span key={linha}>
            {linha}
            {i < LINHAS.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    </footer>
  );
}
