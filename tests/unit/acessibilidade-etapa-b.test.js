// Etapa B (22/10/2026): alvos de toque de 44 px, foco visível, estado das abas para leitor de tela e movimento reduzido.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const APP = path.join(__dirname, '..', '..', 'apps', 'plataforma-saude-mental');
const ler = (rel) => fs.readFileSync(path.join(APP, rel), 'utf8');
const FERRAMENTA = 'app/ferramentas/sistema-integrado-saude-mental.jsx';
const NOVOS = ['RegistroPensamentos', 'Aterramento54321', 'EmailOptIn'].map((n) => `src/components/ferramentas/${n}.jsx`);

test('abas do miniaplicativo: alvo de 44 px, foco visível e estado para leitor de tela', () => {
  const t = ler(FERRAMENTA);
  assert.match(t, /aria-pressed=\{activeTab === chave\}/);
  assert.match(t, /min-h-\[44px\][^`]*items-center/);
  assert.match(t, /focus-visible:ring-2 focus-visible:ring-dourado/);
});

test('componentes novos: todo botão e campo com alvo de 44 px e foco visível', () => {
  for (const rel of NOVOS) {
    const t = ler(rel);
    const botoes = (t.match(/<button\b/g) || []).length;
    assert.ok(botoes > 0, `${rel} tem botões`);
    const comAlvo = (t.match(/min-h-\[44px\]/g) || []).length;
    assert.ok(comAlvo >= botoes, `${rel}: ${comAlvo} alvos para ${botoes} botões`);
    assert.match(t, /focus-visible:ring-2 focus-visible:ring-dourado/, `${rel} sem foco visível`);
  }
});

test('movimento: o miniaplicativo lê prefers-reduced-motion e aplica nos componentes animados', () => {
  const t = ler(FERRAMENTA);
  assert.match(t, /useMovimentoReduzido\(\)/);
  assert.match(t, /reduzMovimento/);
  const hook = ler('src/hooks/useMovimentoReduzido.js');
  assert.match(hook, /prefers-reduced-motion: reduce/);
});

test('registro de pensamentos e escalas anunciam o resultado com role=status', () => {
  assert.match(ler('src/components/ferramentas/RegistroPensamentos.jsx'), /role="status"/);
  assert.match(ler('src/components/ferramentas/EmailOptIn.jsx'), /role="status"/);
});
