const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '../../scripts/youtube/entrarNaFila.js');
const PUB = path.join(__dirname, '../../scripts/youtube/publicarYoutube.js');

function montar({ capitulos } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'fila-raiz-'));
  fs.mkdirSync(path.join(raiz, 'relatorios/youtube'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'relatorios/youtube/fila.json'), JSON.stringify({ itens: [] }), 'utf8');
  const pacote = path.join(raiz, 'carrosseis-instagram/youtube/teste-pacote');
  fs.mkdirSync(path.join(pacote, 'arquivos'), { recursive: true });
  fs.writeFileSync(path.join(pacote, 'arquivos/video.mp4'), Buffer.from('video-de-teste'));
  fs.writeFileSync(path.join(pacote, 'arquivos/legenda.srt'), '1\n00:00:00,000 --> 00:00:02,000\nTeste\n', 'utf8');
  const caps = capitulos || [{ inicio: '0:00', titulo: 'Abertura' }, { inicio: '0:30', titulo: 'Sinais' }, { inicio: '1:05', titulo: 'Tratamento' }];
  const descricao = [
    'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito', '',
    'Artigo: https://www.drantoniofelipemedico.com.br/artigo/teste', '',
    'Dr. Antônio Felipe — Médico — CRM-BA 41322', 'Aviso (Resolução CFM 2.454/2026): conteúdo com IA.', '',
    'Capítulos:', ...caps.map((c) => `${c.inicio} ${c.titulo}`), '',
    'Em crise: CVV 188 · SAMU 192.',
  ].join('\n');
  fs.writeFileSync(path.join(pacote, 'meta.json'), JSON.stringify({
    titulo: 'Título de teste', descricao, tags: ['teste'], slug: 'teste-pacote',
    artigo: 'https://www.drantoniofelipemedico.com.br/artigo/teste', playlist: 'Teste',
    publicarEm: '2026-11-30T08:00:00-03:00', privacidadeInicial: 'private',
    arquivos: { video: 'arquivos/video.mp4', legenda: 'arquivos/legenda.srt' }, capitulos: caps,
  }), 'utf8');
  return { raiz, pacote };
}

function rodar(raiz, pacote, extra = []) {
  return spawnSync(process.execPath, [SCRIPT, `--pacote=${pacote}`, ...extra], {
    env: { ...process.env, DRS_RAIZ: raiz }, encoding: 'utf8', timeout: 20000,
  });
}
const lerFila = (raiz) => JSON.parse(fs.readFileSync(path.join(raiz, 'relatorios/youtube/fila.json'), 'utf8'));

test('dry-run não grava e sai com 0 quando o pacote está completo', () => {
  const { raiz, pacote } = montar();
  const r = rodar(raiz, pacote);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(lerFila(raiz).itens.length, 0);
  assert.match(r.stdout, /DRY-RUN: nada gravado/);
});

test('bloqueia capítulos com menos de 10 s e não começa em 0:00', () => {
  const { raiz, pacote } = montar({ capitulos: [{ inicio: '0:05', titulo: 'A' }, { inicio: '0:10', titulo: 'B' }, { inicio: '0:30', titulo: 'C' }] });
  const r = rodar(raiz, pacote);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /não começa em 0:00/);
  assert.match(r.stdout, /menos de 10 s/);
});

test('--aplicar sem backup de hoje é bloqueado e a fila fica igual', () => {
  const { raiz, pacote } = montar();
  const r = rodar(raiz, pacote, ['--aplicar']);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /sem backup de hoje/);
  assert.equal(lerFila(raiz).itens.length, 0);
});

test('backup, aplicar e conferir: item entra uma única vez com o hash do vídeo', () => {
  const { raiz, pacote } = montar();
  assert.equal(rodar(raiz, pacote, ['--backup']).status, 0);
  const a = rodar(raiz, pacote, ['--aplicar']);
  assert.equal(a.status, 0, a.stdout + a.stderr);
  const fila = lerFila(raiz);
  assert.equal(fila.itens.length, 1);
  assert.equal(fila.itens[0].slot, '2026-11-24T12:00:00.000Z');
  assert.equal(fila.itens[0].status, 'aprovado-checagem');
  assert.equal(rodar(raiz, pacote, ['--conferir']).status, 0);
  // segunda tentativa não duplica
  const dup = rodar(raiz, pacote, ['--aplicar']);
  assert.equal(dup.status, 1);
  assert.match(dup.stdout, /já existe na fila/);
});

test('publicador encerra a conexão com o banco quando nada está devido', () => {
  const src = fs.readFileSync(PUB, 'utf8');
  const i = src.indexOf("log('nada devido agora.')");
  assert.ok(i > 0, 'trecho "nada devido agora" não encontrado');
  const trecho = src.slice(i - 80, i + 80);
  assert.match(trecho, /mongoose\.disconnect\(\)/);
});
