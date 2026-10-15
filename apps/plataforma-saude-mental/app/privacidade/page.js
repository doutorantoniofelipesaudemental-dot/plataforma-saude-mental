export const metadata = {
  title: 'Privacidade',
  alternates: { canonical: 'https://www.drantoniofelipemedico.com.br/privacidade' },
  description: 'Como este site trata dados pessoais (LGPD, Lei 13.709/2018): sem formulários, sem cookies, sem análise de audiência.',
};

export default function PaginaPrivacidade() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 text-sm leading-relaxed text-tinta-media sm:px-8">
      <h1 className="font-serif text-3xl font-bold text-verde-escuro">Política de Privacidade</h1>
      <p className="mt-3">
        Este é o mesmo tratamento de dados do site principal, descrito em{' '}
        <a className="underline" href="https://www.drantoniofelipemedico.com.br/privacidade">www.drantoniofelipemedico.com.br/privacidade</a>
        {' '}(LGPD, Lei nº 13.709/2018). Em resumo:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        <li>Este site não coleta nem guarda dados de visitantes e não tem formulários de contato. O contato e o agendamento são feitos somente por e-mail; não envie informações de saúde por e-mail.</li>
        <li>As ferramentas e questionários (como PHQ-9 e GAD-7) funcionam no seu navegador: as respostas não são enviadas nem gravadas, e desaparecem ao fechar a página. Os resultados não são diagnóstico e não substituem consulta.</li>
        <li>Não há cookies, publicidade nem ferramentas de análise de audiência. A hospedagem (Vercel) pode registrar dados técnicos de acesso, como IP e navegador, para segurança e funcionamento.</li>
        <li>Para exercer seus direitos da LGPD (acesso, correção, eliminação e outros), escreva para <a className="underline" href="mailto:doutor.antoniofelipe.saudemental@gmail.com">doutor.antoniofelipe.saudemental@gmail.com</a>.</li>
      </ul>
      <p className="mt-6">Em crise: CVV 188 (24 horas, gratuito) · SAMU 192.</p>
    </main>
  );
}
