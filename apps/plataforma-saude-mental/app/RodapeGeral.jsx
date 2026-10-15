import Link from 'next/link';

// Rodapé comum a todas as páginas do app: emergência (CVV/SAMU), contato só por e-mail e privacidade.
// A identificação do médico NÃO fica aqui: ela aparece uma única vez por texto (RodapeIdentificacao.jsx).
export default function RodapeGeral() {
  return (
    <footer className="border-t border-tinta-media/20 bg-white px-6 py-6 text-sm leading-relaxed text-tinta-media">
      <div className="mx-auto w-full max-w-4xl space-y-2">
        <p>
          <strong className="text-verde-escuro">Em crise:</strong> CVV{' '}
          <a className="font-semibold underline" href="tel:188">188</a> (ligação gratuita, 24 horas; também por chat em{' '}
          <a className="underline" href="https://www.cvv.org.br" target="_blank" rel="noopener noreferrer">cvv.org.br</a>) ·{' '}
          SAMU <a className="font-semibold underline" href="tel:192">192</a>. Em risco imediato, procure uma UPA, um pronto-socorro ou o CAPS.
        </p>
        <p>
          Contato e agendamento somente por e-mail:{' '}
          <a className="underline" href="mailto:doutor.antoniofelipe.saudemental@gmail.com">doutor.antoniofelipe.saudemental@gmail.com</a>.
          Não envie informações de saúde por e-mail. <Link className="underline" href="/privacidade">Privacidade</Link>
        </p>
      </div>
    </footer>
  );
}
