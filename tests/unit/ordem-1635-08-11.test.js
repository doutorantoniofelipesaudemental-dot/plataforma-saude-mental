// Ordem de 08/11/2026 (16:35): handoff acolhedor, identificação de 5 linhas nas legendas,
// arquivo-fluxo-antigo sem oferta de consulta e @google/genai removido.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..', '..');
const ler = (arquivo) => fs.readFileSync(path.join(raiz, arquivo), 'utf8');

test('humanHandoff fora de crise: acolhe, indica o caminho de cuidado e o contato institucional', () => {
  const js = ler('backend/lib/skills/skillRegistry.js');
  assert.match(js, /Para cuidado em saúde mental, procure a UBS ou o CAPS da sua região, ou o seu plano de saúde\./);
  assert.match(js, /Em crise: CVV 188 · SAMU 192\./);
  assert.match(js, /O Portal não agenda consultas; contato institucional \(mentoria, consultoria e formação\): \$\{EMAIL_CONSULTORIO\} \(assunto: Contato\)\./);
  assert.doesNotMatch(js, /Para agendar|Agendamento de consulta/);
  // Crise continua com o ramo próprio (CVV 188 / SAMU 192 em destaque).
  assert.match(js, /categoria === 'crise'\s*\?\s*\{ canal: 'telefone', texto: 'Você importa\. Ligue agora para o CVV 188 \(24 h\) ou SAMU 192\.'/);
});

test('CLAUDE.md §1.B: identificação de 5 linhas; menção de "3 linhas" só se marcada como substituída', () => {
  const md = ler('CLAUDE.md');
  const linhas = md.split('\n');
  const inicio = linhas.findIndex((l) => l.startsWith('#### B. IDENTIFICAÇÃO NO INSTAGRAM'));
  const fim = linhas.findIndex((l, i) => i > inicio && l.startsWith('#'));
  const secao = linhas.slice(inicio, fim).join('\n');
  assert.match(secao, /IDENTIFICAÇÃO DE 5 LINHAS/);
  assert.match(secao, /Pós-graduação em Psiquiatria/);
  assert.match(secao, /NÃO ESPECIALISTA/);
  // Histórico preservado: a decisão de 18/10 continua no arquivo, marcada como substituída.
  const decisao1810 = linhas.find((l) => l.startsWith('- Decisões do Dr. Antônio (18/10/2026)'));
  assert.ok(decisao1810, 'decisão de 18/10 não encontrada');
  assert.match(decisao1810, /PAP\/APS só na versão de 3 linhas \(substituída pela ordem de 08\/11\/2026 \(identificação de 5 linhas\)\)/);
  // Nenhuma menção a "3 linhas" dentro da §1.B fora da marca de substituição.
  for (const l of secao.split('\n')) {
    if (/\b3 linhas\b/.test(l)) assert.match(l, /substituída pela ordem de 08\/11\/2026/, l.slice(0, 80));
  }
  // Decisão de 15/10 (assinatura curta de 3 linhas): histórica, marcada como substituída.
  const decisao1510 = linhas.find((l) => l.startsWith('- **Assinatura padrão (15/10/2026)'));
  assert.ok(decisao1510, 'decisão de 15/10 não encontrada');
  assert.match(decisao1510, /assinatura curta de 3 linhas[^.]*\(substituída pela ordem de 08\/11\/2026 \(identificação de 5 linhas\)\)/);
});

test('CLAUDE.md: legendas e roteiros usam a identificação de 5 linhas, não o bloco de 3 linhas', () => {
  const md = ler('CLAUDE.md');
  const regra = md.split('\n').find((l) => l.startsWith('- Toda legenda/roteiro:'));
  assert.ok(regra, 'regra de legenda/roteiro não encontrada');
  assert.match(regra, /identificação de 5 linhas \(`IDENTIFICACAO_COMPLETA`/);
  assert.doesNotMatch(regra, /bloco de 3 linhas/);
});

test('arquivo-fluxo-antigo: nenhuma oferta de consulta; CTA de leitura do artigo no lugar', () => {
  for (const arq of ['CONTEUDO_INSTAGRAM/arquivo-fluxo-antigo/CALENDARIO_30_DIAS.md', 'CONTEUDO_INSTAGRAM/arquivo-fluxo-antigo/30_ROTEIROS_REELS.md']) {
    const txt = ler(arq);
    assert.doesNotMatch(txt, /agende (uma |sua |uma nova )?consulta/i, arq);
    assert.match(txt, /Leia o artigo completo — link na bio\./, arq);
  }
});

test('@google/genai removido do package.json e sem require no código do projeto', () => {
  const pkg = JSON.parse(ler('package.json'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(deps['@google/genai'], undefined);
  assert.equal(deps['groq-sdk'], undefined);
  const alvos = ['backend', 'scripts', 'apps/plataforma-saude-mental'];
  const achados = [];
  const andar = (dir) => {
    for (const nome of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git'].includes(nome.name)) continue;
      const p = path.join(dir, nome.name);
      if (nome.isDirectory()) andar(p);
      else if (/\.(js|mjs|cjs|jsx|ts|tsx)$/.test(nome.name) && /google\/genai|GoogleGenAI/.test(fs.readFileSync(p, 'utf8'))) achados.push(p);
    }
  };
  for (const a of alvos) andar(path.join(raiz, a));
  assert.deepEqual(achados, []);
});
