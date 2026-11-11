/**
 * Feed RSS do podcast (ordem de 20/10/2026, fase 1). Função pura: recebe os artigos e devolve o XML.
 * Só entram textos PUBLICADOS com narração gravada no Blob (trava B respeitada: texto agendado não aparece).
 * Trava C (ordem de 29/10/2026): só entra texto com revisão médica APROVADA e hash do corpo igual ao aprovado.
 * Sem revisão, o feed fica válido e vazio.
 * Cada episódio: título, resumo, link do texto, aviso educativo, CVV 188 · SAMU 192 quando o tema pede,
 * e a frase "Narração com voz sintética".
 */
const R = require('./revisaoMedica');
const AVISO = 'Conteúdo educativo, não substitui consulta. Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.';
const LINHA_CRISE = 'Em crise: CVV 188 · SAMU 192.';
const VOZ = 'Narração com voz sintética.';
const SENSIVEL = /suic|autoles|violência|violencia|abuso|crise|emergência|emergencia|morte|luto|automutil/i;

const escapar = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Função pura: o tema pede o CVV quando o título ou o resumo tratam de crise, violência, luto ou risco.
const temaSensivel = (texto) => SENSIVEL.test(String(texto || ''));

// Duração estimada (segundos) a partir dos caracteres narrados (~15 caracteres por segundo de fala).
const duracaoSegundos = (caracteres) => Math.max(1, Math.round(Number(caracteres || 0) / 15));

const rfc822 = (d) => new Date(d).toUTCString();

// Função pura: escolhe os artigos que podem virar episódio. Trava B: só publicado, com narração e já no ar.
function episodiosDe(artigos, { base, agora = new Date(), revisaoDe = () => null, hashDe = () => null }) {
  return artigos
    .filter((a) => a && a.publicado === true && a.narracao && a.narracao.url && a.publicadoEm && new Date(a.publicadoEm) <= new Date(agora))
    .filter((a) => R.estadoRevisao({ registro: revisaoDe(a.slug), hashAtual: hashDe(a) }).valido)
    .sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
    .map((a) => {
      const link = `${base}/artigo/${a.slug}`;
      const linhas = [a.resumo || '', `Texto completo: ${link}`, AVISO];
      if (temaSensivel(`${a.titulo} ${a.resumo}`)) linhas.push(LINHA_CRISE);
      linhas.push(VOZ);
      return {
        guid: link,
        titulo: a.titulo,
        resumo: a.resumo || '',
        descricao: linhas.join('\n\n'),
        link,
        audio: a.narracao.url,
        bytes: Number(a.narracao.bytes || 0),
        duracao: duracaoSegundos(a.caracteres || (a.narracao && a.narracao.caracteres)),
        publicadoEm: a.publicadoEm,
      };
    });
}

// Função pura: monta o XML RSS 2.0 com as tags do iTunes/Apple e do Spotify.
function montarFeed({ canal, episodios }) {
  const itens = episodios.map((e) => `    <item>
      <title>${escapar(e.titulo)}</title>
      <link>${escapar(e.link)}</link>
      <guid isPermaLink="false">${escapar(e.guid)}</guid>
      <pubDate>${rfc822(e.publicadoEm)}</pubDate>
      <description>${escapar(e.descricao)}</description>
      <itunes:summary>${escapar(e.resumo)}</itunes:summary>
      <enclosure url="${escapar(e.audio)}" length="${e.bytes}" type="audio/mpeg"/>
      <itunes:duration>${e.duracao}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapar(canal.titulo)}</title>
    <link>${escapar(canal.link)}</link>
    <description>${escapar(canal.descricao)}</description>
    <language>pt-br</language>
    <copyright>${escapar(canal.copyright)}</copyright>
    <itunes:author>${escapar(canal.autor)}</itunes:author>
    <itunes:summary>${escapar(canal.descricao)}</itunes:summary>
    <itunes:owner>
      <itunes:name>${escapar(canal.autor)}</itunes:name>
      <itunes:email>${escapar(canal.email)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${escapar(canal.capa)}"/>
    <itunes:category text="Health &amp; Fitness">
      <itunes:category text="Mental Health"/>
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <image>
      <url>${escapar(canal.capa)}</url>
      <title>${escapar(canal.titulo)}</title>
      <link>${escapar(canal.link)}</link>
    </image>
${itens}
  </channel>
</rss>
`;
}

const CANAL = {
  titulo: 'Portal de Saúde Mental Doutor Antônio Felipe Garabito',
  link: 'https://www.drantoniofelipemedico.com.br',
  descricao: 'Narrações dos textos do Portal de Saúde Mental Doutor Antônio Felipe Garabito. Conteúdo educativo, não substitui consulta.',
  copyright: '© 2026 Portal de Saúde Mental Doutor Antônio Felipe Garabito',
  autor: 'Dr. Antônio Felipe',
  email: 'doutor.antoniofelipe.saudemental@gmail.com',
  capa: 'https://www.drantoniofelipemedico.com.br/podcast/capa-3000.png',
};

module.exports = { escapar, temaSensivel, duracaoSegundos, episodiosDe, montarFeed, CANAL, AVISO, LINHA_CRISE, VOZ };
