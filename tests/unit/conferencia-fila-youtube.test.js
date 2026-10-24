const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../../scripts/youtube/conferirVideo');
const F = require('../../scripts/youtube/conferenciaFila');

const TMP = path.join(__dirname, '../../.tmp');
const pasta = (nome) => { const d = path.join(TMP, nome); fs.mkdirSync(d, { recursive: true }); return d; };
const meta = { hashVideo: 'h1', tipo: 'short', arquivos: { video: 'short.mp4' }, checagemTexto: [], checagemMidia: [] };

test('assinatura: muda quando a legenda muda ou some (o cache não pode reusar um OK antigo)', () => {
  const d = pasta('ex-assin');
  fs.writeFileSync(path.join(d, 'cap.ass'), 'legenda A', 'utf8');
  const a = C.assinaturaConferencia(d, meta);
  fs.writeFileSync(path.join(d, 'cap.ass'), 'legenda B', 'utf8');
  assert.notEqual(C.assinaturaConferencia(d, meta), a, 'legenda alterada');
  fs.rmSync(path.join(d, 'cap.ass'));
  assert.match(C.assinaturaConferencia(d, meta), /sem-legenda/, 'legenda removida');
});

test('assinatura: muda quando o hash do vídeo muda', () => {
  const d = pasta('ex-assin2');
  assert.notEqual(C.assinaturaConferencia(d, meta), C.assinaturaConferencia(d, { ...meta, hashVideo: 'h2' }));
});

test('status: só vira aprovado com ok, versão atual, mesmo hash e sem falhas de checagem', () => {
  const ok = { ok: true, versao: C.VERSAO, hashVideo: 'h1' };
  assert.equal(C.statusPelaConferencia(ok, meta), 'aprovado-checagem');
  assert.equal(C.statusPelaConferencia({ ...ok, ok: false }, meta), 'reprovado');
  assert.equal(C.statusPelaConferencia({ ...ok, hashVideo: 'outro' }, meta), 'reprovado');
  assert.equal(C.statusPelaConferencia({ ...ok, versao: 'v1' }, meta), 'reprovado');
  assert.equal(C.statusPelaConferencia(null, meta), 'reprovado');
  assert.equal(C.statusPelaConferencia(ok, { ...meta, checagemTexto: ['link fora do domínio'] }), 'reprovado');
});

test('checagem cruzada: aprovado sem conferência, reprovado pelo conferidor, hash diferente e versão antiga são divergências', () => {
  const C_ = C.VERSAO;
  const itens = [
    { id: 'a', status: 'aprovado-checagem', pasta: 'sem', hashVideo: 'h1' },
    { id: 'b', status: 'aprovado-checagem', pasta: 'reprovou', hashVideo: 'h1' },
    { id: 'c', status: 'aprovado-checagem', pasta: 'hash', hashVideo: 'h1' },
    { id: 'd', status: 'aprovado-checagem', pasta: 'velha', hashVideo: 'h1' },
    { id: 'e', status: 'aprovado-checagem', pasta: 'certo', hashVideo: 'h1' },
    { id: 'f', status: 'reprovado', pasta: 'sem', hashVideo: 'h1' },
  ];
  const mapa = { reprovou: { ok: false, versao: C_, hashVideo: 'h1' }, hash: { ok: true, versao: C_, hashVideo: 'outro' }, velha: { ok: true, versao: 'v1', hashVideo: 'h1' }, certo: { ok: true, versao: C_, hashVideo: 'h1' } };
  const r = F.divergencias(itens, (p) => mapa[p] || null);
  assert.deepEqual(r.map((x) => x.id), ['a', 'b', 'c', 'd']);
  assert.match(r[0].motivo, /sem conferência/);
  assert.match(r[1].motivo, /reprovou/);
  assert.match(r[2].motivo, /hash/);
  assert.match(r[3].motivo, /versão antiga/);
});

test('checagem cruzada: fila conferida (ok, versão atual, mesmo hash) não tem divergência', () => {
  // Fixture: a checagem da fila real fica na conferência diária (scripts/conferencias/conferenciaDiaria.js), que lê arquivos locais ignorados pelo Git.
  const itens = [
    { id: 'x', status: 'aprovado-checagem', pasta: 'ok1', hashVideo: 'h1' },
    { id: 'y', status: 'reprovado', pasta: 'ok2', hashVideo: 'h2' },
  ];
  const mapa = { ok1: { ok: true, versao: C.VERSAO, hashVideo: 'h1' } };
  assert.deepEqual(F.divergencias(itens, (p) => mapa[p] || null), []);
});
