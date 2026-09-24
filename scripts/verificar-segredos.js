#!/usr/bin/env node
/**
 * Verificador de segredos do projeto (seção "Segredos" do CLAUDE.md).
 *
 *   node scripts/verificar-segredos.js --staged     arquivos em stage (hook de pre-commit)
 *   node scripts/verificar-segredos.js --historico  todo o histórico do git (todas as branches)
 *   node scripts/verificar-segredos.js <arquivo…>   arquivos avulsos
 *
 * NUNCA imprime o valor encontrado — só arquivo, linha (ou commit) e o tipo.
 * Sai com código 1 se achar algo, bloqueando o commit.
 *
 * Falso positivo inevitável (ex.: um exemplo em documentação): acrescente
 * `segredos:permitir` na MESMA linha. Nos testes, monte tokens falsos por
 * concatenação ('IG' + 'AA' + …) em vez de escrevê-los inteiros.
 */
const { execFileSync } = require('child_process');

const REGRAS = [
  { tipo: 'token da Meta/Instagram (IGAA)', padrao: /\bIGAA[A-Za-z0-9_-]{30,}/ },
  { tipo: 'token da Meta/Facebook (EAA)', padrao: /\bEAA[A-Za-z0-9]{30,}/ },
  {
    tipo: 'string de conexão MongoDB com senha',
    padrao: /mongodb(?:\+srv)?:\/\/([^\s:@/"'`]+):([^\s@/"'`]+)@/,
    // Placeholder de documentação (.env.example): usuario:senha@…
    valido: (m) => !(/^(?:<?usu[aá]rio>?|<?user(?:name)?>?)$/i.test(m[1]) && /^(?:<?senha>?|<?pass(?:word)?>?)$/i.test(m[2])),
  },
  { tipo: 'chave da Anthropic', padrao: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { tipo: 'chave estilo OpenAI (sk-)', padrao: /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/ },
  { tipo: 'token do Replicate', padrao: /\br8_[A-Za-z0-9]{20,}/ },
  { tipo: 'token do Vercel Blob', padrao: /\bvercel_blob_rw_[A-Za-z0-9_]{20,}/ },
  { tipo: 'token do GitHub', padrao: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { tipo: 'chave privada', padrao: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    // CRON_SECRET=…, ADMIN_TOKEN: "…", FACEBOOK_APP_SECRET = '…' etc. com valor literal.
    tipo: 'segredo atribuído (CRON_SECRET, *_TOKEN, *_SECRET, *_KEY)',
    padrao: /\b(?:CRON_SECRET|[A-Z0-9_]*(?:SECRET|TOKEN|API_KEY|PASSWORD|SENHA))\s*[:=]\s*["']?([^\s"'`,;)]{12,})/,
    valido: (m) =>
      !/^(?:<|\$\{|process\.env|xxx|\.\.\.|seu_|your_|placeholder|\[REDACTED\])/i.test(m[1]) &&
      // Nome de chave em snake_case minúsculo (ex.: CHAVE_TOKEN = 'dsm_admin_token') não é segredo.
      !/^[a-z][a-z0-9_]*$/.test(m[1]) &&
      // Referência a outra constante (ex.: INSTAGRAM_ACCESS_TOKEN = TOKEN_NOVO), não um literal.
      !/^[A-Z][A-Z0-9_]*$/.test(m[1]) &&
      // Expressão regular no código (ex.: /^INSTAGRAM_ACCESS_TOKEN=.*$/).
      !/\.\*|\$\/|\\[sdw]/.test(m[1]),
  },
];

const IGNORAR_ARQUIVO = [/(^|\/)node_modules\//, /(^|\/)package-lock\.json$/, /\.(png|jpe?g|gif|webp|ico|woff2?|mp3|mp4|pdf|zip)$/i];

function varrerTexto(texto) {
  const achados = [];
  texto.split(/\r?\n/).forEach((linha, i) => {
    if (linha.includes('segredos:permitir')) return;
    for (const regra of REGRAS) {
      const m = regra.padrao.exec(linha);
      if (m && (!regra.valido || regra.valido(m))) achados.push({ linha: i + 1, tipo: regra.tipo });
    }
  });
  return achados;
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 });
const ignorado = (arquivo) => IGNORAR_ARQUIVO.some((p) => p.test(arquivo));

function varrerStaged() {
  const arquivos = git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').split('\0').filter(Boolean);
  const achados = [];
  for (const arquivo of arquivos) {
    if (ignorado(arquivo)) continue;
    const conteudo = git('show', `:${arquivo}`);
    for (const a of varrerTexto(conteudo)) achados.push({ onde: `${arquivo}:${a.linha}`, tipo: a.tipo });
  }
  return achados;
}

function varrerHistorico() {
  // Só as linhas ADICIONADAS de cada commit, em todas as refs.
  const log = git('log', '--all', '-p', '--no-color', '--unified=0', '--format=@@commit %h');
  const achados = new Map();
  let commit = '';
  let arquivo = '';
  for (const linha of log.split('\n')) {
    if (linha.startsWith('@@commit ')) { commit = linha.slice(9); continue; }
    if (linha.startsWith('+++ ')) { arquivo = linha.replace(/^\+\+\+ (b\/)?/, ''); continue; }
    if (!linha.startsWith('+') || linha.startsWith('+++') || ignorado(arquivo)) continue;
    for (const a of varrerTexto(linha.slice(1))) {
      const chave = `${arquivo}|${a.tipo}`;
      if (!achados.has(chave)) achados.set(chave, { onde: arquivo, tipo: a.tipo, commits: new Set() });
      achados.get(chave).commits.add(commit);
    }
  }
  return [...achados.values()].map((a) => ({ ...a, commits: [...a.commits] }));
}

function main() {
  const args = process.argv.slice(2);
  let achados;
  if (args.includes('--historico')) achados = varrerHistorico();
  else if (args.includes('--staged')) achados = varrerStaged();
  else {
    const fs = require('fs');
    achados = args.flatMap((f) => varrerTexto(fs.readFileSync(f, 'utf8')).map((a) => ({ onde: `${f}:${a.linha}`, tipo: a.tipo })));
  }

  if (!achados.length) {
    console.log('verificar-segredos: nenhum segredo encontrado.');
    return;
  }
  console.error(`verificar-segredos: ${achados.length} ocorrência(s) com cara de segredo (valores omitidos):`);
  for (const a of achados) {
    console.error(`  - ${a.onde} — ${a.tipo}${a.commits ? ` (commits: ${a.commits.slice(0, 5).join(', ')}${a.commits.length > 5 ? '…' : ''})` : ''}`);
  }
  console.error('\nRemova o segredo (use variável de ambiente) ou, se for falso positivo, acrescente "segredos:permitir" na linha.');
  process.exit(1);
}

if (require.main === module) main();
module.exports = { varrerTexto, REGRAS };
