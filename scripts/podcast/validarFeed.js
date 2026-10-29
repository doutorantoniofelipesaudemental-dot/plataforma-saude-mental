/**
 * Validador do feed do podcast (ordem de 20/10/2026). SÓ LEITURA: não publica nem altera nada.
 *   node scripts/podcast/validarFeed.js                 valida o feed gerado pelo código (feed de exemplo com um episódio)
 *   node scripts/podcast/validarFeed.js caminho.xml     valida um arquivo XML baixado do site
 * Confere: RSS 2.0, tags do canal (iTunes e Spotify), itens (guid, data, áudio mpeg com tamanho) e a capa (1400 a 3000 px, quadrada, RGB, sem alfa).
 */
const fs = require('node:fs');
const path = require('node:path');
const R = require('../../backend/lib/revisaoMedica');

// Função pura: lista de problemas do XML (vazia = passou).
function validarXml(xml) {
  const p = [];
  const tem = (re, msg) => { if (!re.test(xml)) p.push(msg); };
  tem(/<rss[^>]*version="2\.0"/, 'RSS 2.0: falta version="2.0"');
  tem(/xmlns:itunes="http:\/\/www\.itunes\.com\/dtds\/podcast-1\.0\.dtd"/, 'namespace do iTunes ausente');
  tem(/<channel>[\s\S]*<title>[^<]+<\/title>/, 'canal sem título');
  tem(/<description>[\s\S]*?<\/description>/, 'canal sem descrição');
  tem(/<language>pt-br<\/language>/, 'idioma do canal deve ser pt-br');
  tem(/<itunes:image href="https:\/\/[^"]+"\/>/, 'capa do canal (itunes:image) ausente ou sem https');
  tem(/<itunes:owner>[\s\S]*<itunes:email>[^<]+@[^<]+<\/itunes:email>[\s\S]*<\/itunes:owner>/, 'dono do podcast (itunes:owner com e-mail) ausente');
  tem(/<itunes:category text="[^"]+">/, 'categoria do iTunes ausente');
  tem(/<itunes:explicit>false<\/itunes:explicit>/, 'explicit deve ser false no canal');
  const itens = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  if (!itens.length) p.push('nenhum episódio (item)');
  itens.forEach((it, i) => {
    const n = i + 1;
    if (!/<title>[^<]+<\/title>/.test(it)) p.push(`episódio ${n}: sem título`);
    if (!/<guid[^>]*>[^<]+<\/guid>/.test(it)) p.push(`episódio ${n}: sem guid`);
    if (!/<pubDate>[^<]+<\/pubDate>/.test(it)) p.push(`episódio ${n}: sem data (pubDate)`);
    const enc = it.match(/<enclosure url="([^"]+)" length="(\d+)" type="([^"]+)"\/>/);
    if (!enc) p.push(`episódio ${n}: áudio (enclosure) ausente ou incompleto`);
    else {
      if (!/^https:\/\//.test(enc[1])) p.push(`episódio ${n}: áudio sem https`);
      if (enc[3] !== 'audio/mpeg') p.push(`episódio ${n}: tipo do áudio deve ser audio/mpeg`);
      if (Number(enc[2]) <= 0) p.push(`episódio ${n}: tamanho do áudio (length) zerado; o Apple e o Spotify pedem o tamanho do arquivo`);
    }
  });
  return p;
}

// Função pura: confere a capa pelas medidas (lidas do arquivo por quem chama).
function validarCapa({ largura, altura, canais, temAlfa }) {
  const p = [];
  if (largura !== altura) p.push('capa não é quadrada');
  if (largura < 1400 || largura > 3000) p.push(`capa com ${largura}px: a Apple aceita de 1400 a 3000 px`);
  if (canais && canais > 3) p.push('capa com canal alfa: use RGB sem transparência');
  if (temAlfa) p.push('capa com transparência: use RGB sem alfa');
  return p;
}

module.exports = { validarXml, validarCapa };

if (require.main === module) {
  (async () => {
    const { montarFeed, episodiosDe, CANAL } = require('../../backend/lib/podcast');
    const arq = process.argv[2];
    const xml = arq ? fs.readFileSync(path.resolve(arq), 'utf8') : montarFeed({ canal: CANAL, episodios: episodiosDe([{ slug: 'exemplo', titulo: 'Exemplo de episódio', resumo: 'Resumo de teste.', publicado: true, publicadoEm: new Date('2026-10-20T12:00:00Z'), narracao: { url: 'https://exemplo.blob.vercel-storage.com/exemplo.mp3', bytes: 123456, caracteres: 1500 } }], { revisaoDe: () => ({ status: R.STATUS.APROVADA, hash: 'exemplo' }), hashDe: () => 'exemplo', base: 'https://www.drantoniofelipemedico.com.br' }) });
    const erros = validarXml(xml);
    const capaPath = path.resolve(__dirname, '../../public/podcast/capa-3000.png');
    let capa = [];
    try {
      const sharp = require('sharp');
      const m = await sharp(capaPath).metadata();
      capa = validarCapa({ largura: m.width, altura: m.height, canais: m.channels, temAlfa: m.hasAlpha });
    } catch (e) { capa = ['capa não lida: ' + e.message.slice(0, 80)]; }
    const todos = [...erros, ...capa];
    console.log(todos.length ? 'REPROVADO:\n  - ' + todos.join('\n  - ') : 'PASSOU: feed e capa conferidos (validação de estrutura; a validação oficial é feita pelo Spotify e pelo Apple).');
    process.exitCode = todos.length ? 1 : 0;
  })();
}
