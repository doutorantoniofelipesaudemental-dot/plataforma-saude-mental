import RodapeIdentificacao from "../RodapeIdentificacao";

export const metadata = {
  title: "Sobre o Dr. Antônio Felipe",
  alternates: { canonical: "https://www.drantoniofelipemedico.com.br/sobre" },
  description:
    "Quem escreve o Portal: Dr. Antônio Felipe, médico, com atuação em Pronto Atendimento Psiquiátrico e Atenção Primária à Saúde. Como os textos são produzidos e revisados.",
};

export default function PaginaSobre() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 text-sm leading-relaxed text-tinta-media sm:px-8">
      <h1 className="font-serif text-3xl font-bold text-verde-escuro">Sobre o Dr. Antônio Felipe</h1>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-semibold text-verde-escuro">Quem escreve este Portal</h2>
        <p>
          Sou médico. Atuo no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde, onde a
          maior parte do cuidado em saúde mental começa. Escrevo para explicar, em linguagem simples,
          o que acontece nessas situações e quando procurar ajuda.
        </p>
        <p>
          Sou especialista em Medicina de Família e Comunidade. Tenho pós-graduação em Psiquiatria,
          Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e
          Medicina do Trabalho. Não sou especialista em psiquiatria.
        </p>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-semibold text-verde-escuro">Como os textos são produzidos e revisados</h2>
        <p>
          Os textos são elaborados com apoio de ferramentas de inteligência artificial e passam por
          checagem automatizada de referências, de links e de linguagem. Cada texto mostra, no topo da
          página, se a revisão médica foi registrada e quando. Sem esse registro, o texto aparece com
          o aviso de revisão pendente.
        </p>
        <p>
          O conteúdo é educativo e geral. Ele não substitui consulta, diagnóstico nem tratamento. Condutas,
          doses e fluxos seguem sempre os protocolos do hospital, do Pronto Atendimento e da rede de
          saúde local.
        </p>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-semibold text-verde-escuro">Contato</h2>
        <p>
          Agendamento de consulta somente por e-mail:{" "}
          <a className="underline" href="mailto:doutor.antoniofelipe.saudemental@gmail.com?subject=Agendamento%20de%20consulta">
            doutor.antoniofelipe.saudemental@gmail.com
          </a>
          . Não envie informações de saúde por e-mail sem necessidade.
        </p>
        <p>
          Instagram oficial:{" "}
          <a className="underline" href="https://instagram.com/doutor.antoniofelipe.smental" rel="noopener noreferrer" target="_blank">
            @doutor.antoniofelipe.smental
          </a>
          .
        </p>
      </section>

      <p className="mt-8">Em crise: CVV 188 (24 horas, gratuito) · SAMU 192.</p>

      <RodapeIdentificacao />
    </main>
  );
}
