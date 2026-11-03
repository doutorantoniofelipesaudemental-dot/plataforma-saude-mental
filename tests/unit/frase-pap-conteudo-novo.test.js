const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Ordem de 02/11/2026: a frase antiga não pode voltar em conteúdo novo (geradores, ferramentas e validadores).
// Textos já publicados (ex.: backend/data/reescritas/semana-1, no ar) ficam como estão e não entram aqui.
const ANTIGA = 'Atua no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde';
const RAIZ = path.join(__dirname, '..', '..');
const PASTAS = ['backend/tools', 'backend/lib', 'scripts'];

function arquivos(dir) {
  const abs = path.join(RAIZ, dir);
  if (!fs.existsSync(abs)) return [];
  const saida = [];
  for (const nome of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(abs, nome.name);
    if (nome.isDirectory()) saida.push(...arquivos(path.relative(RAIZ, p)));
    else if (/\.(js|jsx|py|mjs|json|md)$/.test(nome.name)) saida.push(p);
  }
  return saida;
}

test('geradores, ferramentas e validadores não usam a frase antiga da assinatura', () => {
  const culpados = [];
  for (const pasta of PASTAS) {
    for (const f of arquivos(pasta)) {
      if (fs.readFileSync(f, 'utf8').includes(ANTIGA)) culpados.push(path.relative(RAIZ, f));
    }
  }
  assert.deepEqual(culpados, []);
});

test('gerador de imagens do LinkedIn usa a 3ª linha nova', () => {
  const src = fs.readFileSync(path.join(RAIZ, 'backend', 'tools', 'gerar-imagens-linkedin.py'), 'utf8');
  assert.ok(src.includes('Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)'));
});
