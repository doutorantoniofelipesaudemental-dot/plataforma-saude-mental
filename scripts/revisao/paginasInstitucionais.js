/**
 * Aviso de revisão das PÁGINAS INSTITUCIONAIS (ordem de 04/11/2026, 21:07).
 * Páginas: início, mentoria, links e privacidade. Só mostram o aviso "página revisada" quando o Dr. Antônio aprovou
 * a página com data e hash, registrados em relatorios/revisoes/paginas-revisadas.json (espelho em DECIDIDO.md).
 * Se o conteúdo da página muda, o hash deixa de bater e a página volta ao aviso geral.
 *
 *   node scripts/revisao/paginasInstitucionais.js --verificar                 (padrão: só lê; sai com 1 se alguma página estiver fora do estado)
 *   node scripts/revisao/paginasInstitucionais.js --aplicar                   (reescreve o aviso nas páginas conforme o registro)
 *   node scripts/revisao/paginasInstitucionais.js --aprovar mentoria.html --data 04/11/2026   (SÓ por ordem do Dr. Antônio; grava o registro)
 *
 * NÃO marque nenhuma página agora: o registro começa vazio.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '../..');
const PUBLIC = path.join(RAIZ, 'public');
const REGISTRO = path.join(RAIZ, 'relatorios/revisoes/paginas-revisadas.json');
const PAGINAS = ['index.html', 'mentoria.html', 'links.html', 'privacidade.html'];

const { AVISO_SITE: AVISO_GERAL, avisoRevisada } = require('../../backend/lib/revisaoMedica');

// Regex do aviso atual OU da versão "página revisada" (para o aviso ser trocado, não duplicado).
const REGEX_AVISO = /Conteúdo (?:educativo )?produzido com apoio de inteligência artificial[^<]*?\(Resolução CFM 2\.454\/2026\)\.[^<]*/;
const MARCA = '[[AVISO-DA-PAGINA]]';

// Hash do HTML com o aviso trocado por uma marca fixa: o próprio aviso não entra no hash.
function hashPagina(html) {
  const semAviso = html.replace(REGEX_AVISO, MARCA).replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(semAviso, 'utf8').digest('hex');
}

function lerRegistro() {
  if (!fs.existsSync(REGISTRO)) return {};
  return JSON.parse(fs.readFileSync(REGISTRO, 'utf8')).paginas || {};
}

// Texto do aviso que a página deve mostrar, conforme o registro. Sem registro válido = aviso geral.
function avisoEsperado(html, nome, registro = lerRegistro()) {
  const r = registro[nome];
  if (r && r.hash && r.data && r.hash === hashPagina(html)) return avisoRevisada(r.data);
  return AVISO_GERAL;
}

// Troca o aviso pelo esperado. Não toca no restante do HTML.
function aplicarAviso(html, aviso) {
  if (!REGEX_AVISO.test(html)) throw new Error('aviso não encontrado na página');
  return html.replace(REGEX_AVISO, aviso);
}

function paginaEstaNoEstado(html, nome, registro) {
  const aviso = avisoEsperado(html, nome, registro);
  return html.includes(aviso);
}

function formatarDataBR(d) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  if (!m) throw new Error('data deve ser DD/MM/AAAA');
  return d;
}

module.exports = { PAGINAS, AVISO_GERAL, avisoRevisada, hashPagina, avisoEsperado, aplicarAviso, paginaEstaNoEstado, lerRegistro, formatarDataBR, REGISTRO, PUBLIC };

if (require.main === module) {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const registro = lerRegistro();
  if (flag('--aprovar')) {
    const nome = valor('--aprovar'); const data = valor('--data');
    if (!PAGINAS.includes(nome)) { console.error('página não institucional:', nome); process.exit(1); }
    formatarDataBR(data);
    const html = fs.readFileSync(path.join(PUBLIC, nome), 'utf8');
    const novo = { ...registro, [nome]: { hash: hashPagina(html), data } };
    fs.writeFileSync(REGISTRO, JSON.stringify({ paginas: novo }, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({ aprovada: nome, data, hash: novo[nome].hash, proximo: 'npm run aviso:paginas -- --aplicar, depois registrar em DECIDIDO.md' }));
    process.exit(0);
  }
  const resultado = PAGINAS.map((nome) => {
    const p = path.join(PUBLIC, nome);
    const html = fs.readFileSync(p, 'utf8');
    const esperado = avisoEsperado(html, nome, registro);
    if (flag('--aplicar') && !html.includes(esperado)) {
      fs.writeFileSync(p, aplicarAviso(html, esperado), 'utf8');
      return { pagina: nome, acao: 'atualizado', aviso: esperado === AVISO_GERAL ? 'geral' : 'revisada' };
    }
    return { pagina: nome, ok: html.includes(esperado), aviso: esperado === AVISO_GERAL ? 'geral' : 'revisada' };
  });
  console.log(JSON.stringify(resultado, null, 1));
  if (!flag('--aplicar') && resultado.some((r) => r.ok === false)) process.exit(1);
}
