/**
 * Publica o branch atual SÓ depois de o portão aprovar (ordem de 21/10/2026).
 *   node scripts/publicarBranch.js            roda o portão; se APROVADO, faz push e abre (ou atualiza) o PR
 *   node scripts/publicarBranch.js --so-portao roda o portão e mostra o resultado, sem push nem PR
 * Regra: push e PR nunca acontecem sem "PORTÃO APROVADO" no resultado E código de saída 0.
 * Falha de infraestrutura (DNS, banco fora, rede caiu): espera 5 min e repete o portão até 2 vezes.
 * Se persistir, registra "falha de infraestrutura" e NÃO abre PR.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const ESPERA_MS = 5 * 60 * 1000;
const MAXIMO_REPETICOES = 2;
const REGEX_APROVADO = /PORTÃO APROVADO · relatório: (.+)$/m;
const REGEX_RELATORIO = /PORTÃO (?:APROVADO|REPROVADO) · relatório: (.+)$/m;
const REGEX_INFRA = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|getaddrinfo|rede caiu|falha de conexão/i;

// Função pura: decide pela saída e pelo código de saída. Só aprova com as duas condições.
function decidirPelaSaida(saida, codigo) {
  const texto = String(saida || '');
  const achado = texto.match(REGEX_APROVADO);
  if (codigo === 0 && achado && !/PORTÃO REPROVADO/.test(texto)) {
    return { aprovado: true, relatorio: achado[1].trim(), motivo: 'portão aprovado' };
  }
  const infra = REGEX_INFRA.test(texto);
  const relatorio = texto.match(REGEX_RELATORIO);
  return {
    aprovado: false,
    relatorio: relatorio ? relatorio[1].trim() : null,
    infra,
    motivo: infra ? 'falha de infraestrutura' : 'portão reprovado (ver o relatório)',
  };
}

// Função pura: a sequência completa. Dependências entram como parâmetro (testável sem rede nem git).
async function publicar({ rodarPortao, empurrar, abrirOuAtualizarPR, esperar = async () => {}, log = () => {} }) {
  let ultima = null;
  for (let tentativa = 0; tentativa <= MAXIMO_REPETICOES; tentativa++) {
    const { saida, codigo } = await rodarPortao();
    ultima = decidirPelaSaida(saida, codigo);
    if (ultima.aprovado) {
      log(`Portão aprovado: ${ultima.relatorio}`);
      await empurrar();
      const pr = await abrirOuAtualizarPR();
      return { publicado: true, pr, relatorio: ultima.relatorio, motivo: ultima.motivo };
    }
    if (!ultima.infra) break;
    if (tentativa < MAXIMO_REPETICOES) {
      log(`Falha de infraestrutura na tentativa ${tentativa + 1}. Espero 5 min e repito.`);
      await esperar(ESPERA_MS);
    }
  }
  log(`NÃO publicado: ${ultima.motivo}${ultima.relatorio ? ` (relatório: ${ultima.relatorio})` : ''}`);
  return { publicado: false, motivo: ultima.motivo, relatorio: ultima.relatorio };
}

// Lado real: git, gh e o portão. Usado só pela linha de comando.
function executar(cmd, args, opcoes = {}) {
  const r = spawnSync(cmd, args, { cwd: RAIZ, encoding: 'utf8', shell: process.platform === 'win32', ...opcoes });
  return { saida: `${r.stdout || ''}${r.stderr || ''}`, codigo: r.status };
}

function branchAtual() {
  return executar('git', ['rev-parse', '--abbrev-ref', 'HEAD']).saida.trim();
}

function rodarPortaoReal() {
  const r = executar('npm', ['run', 'portao'], { maxBuffer: 64 * 1024 * 1024 });
  process.stdout.write(r.saida.split('\n').slice(-6).join('\n') + '\n');
  return r;
}

function empurrarReal(branch) {
  const r = executar('git', ['push', '-u', 'origin', branch]);
  if (r.codigo !== 0) throw new Error(`push falhou: ${r.saida.slice(-300)}`);
}

function abrirOuAtualizarPRReal(branch) {
  const lista = executar('gh', ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number', '--jq', '.[0].number']);
  const numero = lista.saida.trim();
  if (numero) return `PR #${numero} (já existia; atualizado pelo push)`;
  const assunto = executar('git', ['log', '-1', '--format=%s']).saida.trim();
  const corpo = 'Publicado por scripts/publicarBranch.js somente após o portão APROVADO.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)';
  const novo = executar('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', assunto, '--body', corpo]);
  if (novo.codigo !== 0) throw new Error(`gh pr create falhou: ${novo.saida.slice(-300)}`);
  return novo.saida.trim().split('\n').pop();
}

module.exports = { decidirPelaSaida, publicar, ESPERA_MS, MAXIMO_REPETICOES };

if (require.main === module) {
  (async () => {
    const soPortao = process.argv.includes('--so-portao');
    const branch = branchAtual();
    console.log(`Branch: ${branch}. Rodando o portão antes de qualquer push.`);
    if (soPortao) {
      const r = rodarPortaoReal();
      const d = decidirPelaSaida(r.saida, r.codigo);
      console.log(d.aprovado ? `APROVADO: ${d.relatorio}` : `NÃO APROVADO: ${d.motivo}`);
      process.exitCode = d.aprovado ? 0 : 1;
      return;
    }
    const res = await publicar({
      rodarPortao: async () => rodarPortaoReal(),
      empurrar: async () => empurrarReal(branch),
      abrirOuAtualizarPR: async () => abrirOuAtualizarPRReal(branch),
      esperar: (ms) => new Promise((ok) => setTimeout(ok, ms)),
      log: (m) => console.log(m),
    });
    if (res.publicado) console.log(`Publicado: ${res.pr}`);
    else process.exitCode = 1;
  })().catch((e) => { console.error('ERRO:', e.message.slice(0, 300)); process.exitCode = 1; });
}
