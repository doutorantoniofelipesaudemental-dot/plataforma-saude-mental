/**
 * Monta o PDF de apoio do formulário de auditoria da API do YouTube (ordem de 27/10/2026).
 *   node scripts/youtube/montarAnexoAuditoria.js [--link <URL do screencast>] [--saida <arquivo.pdf>] [--capturas <pasta>]
 * Padrão: lê as imagens de relatorios/youtube/auditoria-envio/capturas/ e grava supporting-materials.pdf na mesma pasta.
 * Prefixo do nome da imagem decide a seção: oauth-* (capturas do OAuth) e site-* (páginas de privacidade e termos).
 * Sem imagens, a seção mostra o espaço a preencher. Falha se o PDF passar de 10 MB (limite do formulário).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '../..');
const PASTA_PADRAO = path.join(RAIZ, 'relatorios/youtube/auditoria-envio');
const LIMITE_BYTES = 10 * 1024 * 1024;
const EXTENSOES = /\.(png|jpe?g)$/i;
const CHROMES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

// Resumo de uma página em inglês para o revisor (seção d do pedido).
const RESUMO_EN = [
  'Summary.',
  'Portal de Saúde Mental Doutor Antônio Felipe Garabito uses the YouTube Data API through one internal script. It uploads educational videos to the official channel of the portal\'s physician, at most one video per day, with the channel owner\'s OAuth authorization.',
  'Scope: only https://www.googleapis.com/auth/youtube.force-ssl, the single narrowest scope that covers every method we use.',
  'Methods: videos.insert (upload), thumbnails.set, playlists.list, playlists.insert, playlistItems.insert. captions.insert is planned for subtitle files and is not in use yet.',
  'Quota: about 102 units per day from the 10,000-unit pool (videos.insert uses its own 100-calls-per-day limit).',
  'Data: we do not collect, store or share data about viewers, subscribers or other YouTube users. We keep the channel authorization token only on the publishing computer, and internal records (title, video ID, date, status) while the channel is active. Records are deleted on request or within 30 days after access is revoked.',
  'Revocation: the owner can revoke access at any time at https://myaccount.google.com/permissions.',
  'Public pages: https://www.drantoniofelipemedico.com.br/termos and https://www.drantoniofelipemedico.com.br/privacidade.',
].join('\n\n');

// Função pura: separa os nomes das imagens pela seção do PDF. Ordem alfabética dentro de cada grupo.
function classificarCapturas(nomes) {
  const imagens = nomes.filter((n) => EXTENSOES.test(n)).sort();
  return {
    oauth: imagens.filter((n) => n.toLowerCase().startsWith('oauth-')),
    site: imagens.filter((n) => n.toLowerCase().startsWith('site-')),
    outras: imagens.filter((n) => !/^(oauth|site)-/i.test(n)),
  };
}

// Função pura: legenda a partir do nome do arquivo (ex.: oauth-02-escopos-solicitados.png → "02 escopos solicitados").
function rotuloDaCaptura(nome) {
  return nome.replace(EXTENSOES, '').replace(/^(oauth|site)-/i, '').replace(/[-_]+/g, ' ').trim();
}

// Função pura: imagem embutida no HTML (o PDF não depende de caminhos de arquivo).
function imagemComoDataUri(buffer, nome) {
  const tipo = /\.png$/i.test(nome) ? 'image/png' : 'image/jpeg';
  return `data:${tipo};base64,${buffer.toString('base64')}`;
}

// Função pura: 'dentro' quando o PDF cabe no limite do formulário.
function dentroDoLimite(bytes) {
  return bytes <= LIMITE_BYTES;
}

const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Função pura: monta o HTML do anexo. `imagens` é um mapa nome → data URI.
function montarHtml({ link, oauth = [], site = [], outras = [], imagens = {}, resumo = RESUMO_EN }) {
  const secao = (titulo, nomes, vazio) => {
    const corpo = nomes.length
      ? nomes.map((n) => `<figure><img src="${imagens[n]}" alt="${escapar(rotuloDaCaptura(n))}"><figcaption>${escapar(rotuloDaCaptura(n))}</figcaption></figure>`).join('\n')
      : `<p class="espaco">${escapar(vazio)}</p>`;
    return `<section><h2>${escapar(titulo)}</h2>${corpo}</section>`;
  };
  const linkTexto = link ? `<a href="${escapar(link)}">${escapar(link)}</a>` : '<span class="espaco">[PASTE THE SCREENCAST LINK HERE — unlisted video from the YouTube Studio]</span>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Supporting materials — YouTube API audit</title>
<style>
  body { font: 12pt/1.45 Arial, sans-serif; color: #111; margin: 0; }
  section { page-break-after: always; padding: 28px 40px; }
  h1 { font-size: 20pt; margin: 0 0 12px; } h2 { font-size: 15pt; margin: 0 0 14px; }
  figure { margin: 0 0 22px; } img { max-width: 100%; border: 1px solid #bbb; }
  figcaption { font-size: 10pt; color: #444; margin-top: 4px; }
  .espaco { border: 2px dashed #888; padding: 14px; color: #555; }
  pre { white-space: pre-wrap; font: 11pt/1.5 Arial, sans-serif; }
</style></head><body>
<section><h1>Supporting materials — YouTube API compliance audit</h1>
<p>Project: [PASTE PROJECT NUMBER]. Owner: Dr. Antonio Felipe Garabito. Contact: doutor.antoniofelipe.saudemental@gmail.com</p>
<h2>(a) Screencast of the upload</h2><p>${linkTexto}</p></section>
${secao('(b) OAuth consent, scopes and revocation', oauth, '[INSERT OAUTH SCREENSHOTS: save them as oauth-01-... .png in the capturas folder and run the script again]')}
${secao('(c) Privacy and terms pages (with address bar)', site, '[INSERT SCREENSHOTS: save them as site-privacidade.png and site-termos.png in the capturas folder and run the script again]')}
<section><h2>(d) One-page summary</h2><pre>${escapar(resumo)}</pre></section>
</body></html>`;
}

function acharChrome() {
  return CHROMES.find((c) => fs.existsSync(c)) || null;
}

// Função: espera (até 60 s) o PDF existir e parar de crescer. Não lança.
function esperarArquivo(caminho, limiteMs = 60000) {
  const fim = Date.now() + limiteMs;
  let anterior = -1;
  while (Date.now() < fim) {
    if (fs.existsSync(caminho)) {
      const tamanho = fs.statSync(caminho).size;
      if (tamanho > 0 && tamanho === anterior) return true;
      anterior = tamanho;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
  return fs.existsSync(caminho) && fs.statSync(caminho).size > 0;
}

// Imprime o HTML em PDF com o navegador instalado (sem dependências novas).
function imprimirPdf(html, saida) {
  const chrome = acharChrome();
  if (!chrome) throw new Error('Chrome ou Edge não encontrado para gerar o PDF.');
  const temp = path.join(os.tmpdir(), `anexo-auditoria-${process.pid}.html`);
  fs.writeFileSync(temp, html, 'utf8');
  try {
    const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer', `--print-to-pdf=${saida}`, `file:///${temp.replace(/\\/g, '/')}`], { encoding: 'utf8', timeout: 180000 });
    // No Windows o Chrome devolve o controle antes de terminar de gravar: espera o arquivo estabilizar.
    if (!esperarArquivo(saida)) throw new Error(`o navegador não gerou o PDF (código ${r.status})`);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

function main() {
  const args = process.argv.slice(2);
  const valor = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
  const pasta = valor('--capturas') || path.join(PASTA_PADRAO, 'capturas');
  const saida = valor('--saida') || path.join(PASTA_PADRAO, 'supporting-materials.pdf');
  const link = valor('--link');
  const nomes = fs.existsSync(pasta) ? fs.readdirSync(pasta) : [];
  const grupos = classificarCapturas(nomes);
  const imagens = {};
  for (const n of [...grupos.oauth, ...grupos.site, ...grupos.outras]) {
    imagens[n] = imagemComoDataUri(fs.readFileSync(path.join(pasta, n)), n);
  }
  imprimirPdf(montarHtml({ link, ...grupos, imagens }), saida);
  const tamanho = fs.statSync(saida).size;
  if (!dentroDoLimite(tamanho)) {
    fs.rmSync(saida, { force: true });
    throw new Error(`PDF com ${(tamanho / 1048576).toFixed(1)} MB passa do limite de 10 MB. Reduza as capturas (PNG menor ou JPEG) e rode de novo.`);
  }
  console.log(`PDF gerado: ${saida} (${(tamanho / 1048576).toFixed(2)} MB) · OAuth: ${grupos.oauth.length} · site: ${grupos.site.length} · link do screencast: ${link ? 'sim' : 'a preencher'}`);
}

module.exports = { classificarCapturas, rotuloDaCaptura, imagemComoDataUri, dentroDoLimite, montarHtml, RESUMO_EN, LIMITE_BYTES };

if (require.main === module) {
  try { main(); } catch (e) { console.error('ERRO:', e.message); process.exit(1); }
}
