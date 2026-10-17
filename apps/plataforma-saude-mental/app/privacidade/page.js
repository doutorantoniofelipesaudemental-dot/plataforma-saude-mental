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
        {' '}(LGPD, Lei nº 13.709/2018). Última atualização: 16/10/2026. Em resumo:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        <li>Este site não coleta nem guarda dados de visitantes e não tem formulários de contato. O contato e o agendamento são feitos somente por e-mail; não envie informações de saúde por e-mail.</li>
        <li>As ferramentas e questionários (como PHQ-9 e GAD-7) funcionam no seu navegador: as respostas não são enviadas nem gravadas, e desaparecem ao fechar a página. Os resultados não são diagnóstico e não substituem consulta.</li>
        <li>Não há cookies, publicidade nem ferramentas de análise de audiência. A hospedagem (Vercel) pode registrar dados técnicos de acesso, como IP e navegador, para segurança e funcionamento; para limitar excesso de pedidos, o servidor mantém o IP só na memória temporária, sem gravá-lo.</li>
        <li>O banco de dados (MongoDB Atlas) guarda o conteúdo dos textos e contadores anônimos, sem dados pessoais de visitantes. O e-mail é operado pelo Google (Gmail).</li>
        <li>O controlador é o consultório do Dr. Antônio Felipe. Para exercer seus direitos da LGPD (acesso, correção, eliminação e outros), escreva para <a className="underline" href="mailto:doutor.antoniofelipe.saudemental@gmail.com">doutor.antoniofelipe.saudemental@gmail.com</a>.</li>
        <li>
          <strong>Uso da API do YouTube:</strong> o Portal usa os Serviços de API do YouTube apenas para publicar e organizar os vídeos do próprio canal do Portal (vídeos, miniaturas e listas de reprodução). Por meio dessa API, não coletamos, não armazenamos e não compartilhamos dados de visitantes nem de usuários do YouTube. O YouTube é um serviço do Google e está sujeito aos{' '}
          <a className="underline" href="https://www.youtube.com/t/terms" rel="noopener noreferrer" target="_blank">Termos de Serviço do YouTube</a> e à{' '}
          <a className="underline" href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">Política de Privacidade do Google</a>. O acesso do Portal à conta do canal foi concedido pelo titular do canal, que pode revogá-lo a qualquer momento em{' '}
          <a className="underline" href="https://myaccount.google.com/permissions" rel="noopener noreferrer" target="_blank">myaccount.google.com/permissions</a>.
        </li>
      </ul>
      <p className="mt-6">Em crise: CVV 188 (24 horas, gratuito) · SAMU 192.</p>
    </main>
  );
}
