// Três checagens de aprovação (backend/lib/checagensAprovacao.js): imagem sem
// marca d'água/ruído, humanização e ética/CFM. Sem banco, sem rede.
const { test } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const sharp = require('sharp');

const {
  checarImagemSemMarcaDagua,
  checarHumanizacao,
  checarEticaCfm,
  executarChecagensAprovacao,
  LINHAS_PORTAL,
  LINHAS_SOCIAL,
} = require('../../backend/lib/checagensAprovacao');
const { AVISO_CFM } = require('../../backend/lib/conformidadeCfm');

const PORTAL = LINHAS_PORTAL.join('\n');
const SOCIAL = LINHAS_SOCIAL.join('\n');

const TEXTO_ACOLHEDOR =
  'Se você anda dormindo mal, saiba que isso é mais comum do que parece e não significa fraqueza. ' +
  'Seu corpo está pedindo cuidado, e tudo bem precisar de ajuda. Vamos entender juntos o que pode estar acontecendo, ' +
  'no seu ritmo, com escuta e respeito pela sua história.';

/* ------------------------------- 1. Imagem ------------------------------- */

const gradiente = () =>
  sharp(Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d3330"/><stop offset="1" stop-color="#124440"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>'
  ));

test('imagem: arte limpa em gradiente passa, mesmo com verificação de cantos', async () => {
  const png = await gradiente().png().toBuffer();
  const r = await checarImagemSemMarcaDagua(png, { verificarCantos: true });
  assert.deepStrictEqual(r.falhas, []);
});

test('imagem: ruído visual reprova', async () => {
  const w = 400, h = 500;
  const bruto = crypto.randomBytes(w * h * 3);
  const png = await sharp(bruto, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  const r = await checarImagemSemMarcaDagua(png);
  assert.ok(r.falhas.some((f) => /ruído/.test(f)), r.falhas.join('|'));
});

test('imagem: logo/selo no canto inferior direito reprova (só com verificarCantos)', async () => {
  const base = await gradiente().resize(1080, 1350).png().toBuffer();
  // "selo": quadriculado de alto contraste no canto, como o brilho de IA de fotos geradas.
  let selo = '';
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 0) selo += `<rect x="${960 + i * 14}" y="${1250 + j * 14}" width="14" height="14" fill="#fff"/>`;
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">${selo}</svg>`);
  const png = await sharp(base).composite([{ input: svg }]).png().toBuffer();
  assert.ok((await checarImagemSemMarcaDagua(png, { verificarCantos: true })).falhas.some((f) => /inferior direito/.test(f)));
  assert.deepStrictEqual((await checarImagemSemMarcaDagua(png)).falhas, []);
});

test('imagem: metadado de proveniência de IA (C2PA) reprova', async () => {
  const png = await gradiente().png().toBuffer();
  const marcado = Buffer.concat([png, Buffer.from('jumbf c2pa Made with Google AI')]);
  const r = await checarImagemSemMarcaDagua(marcado);
  assert.ok(r.falhas.some((f) => /metadado de IA/.test(f)), r.falhas.join('|'));
});

test('imagem: ausente ou ilegível reprova', async () => {
  assert.strictEqual((await checarImagemSemMarcaDagua(null)).ok, false);
  assert.strictEqual((await checarImagemSemMarcaDagua(Buffer.from('não sou imagem'))).ok, false);
});

/* ---------------------------- 2. Humanização ----------------------------- */

test('humanização: texto acolhedor passa', () => {
  assert.deepStrictEqual(checarHumanizacao(TEXTO_ACOLHEDOR).falhas, []);
});

test('humanização: voz de chatbot e burocrática reprovam', () => {
  const r = checarHumanizacao('Prezado usuário, segue abaixo a lista. Como um modelo de linguagem, ademais, o indivíduo acometido deve procurar atendimento.');
  assert.ok(r.falhas.length >= 3, r.falhas.join('|'));
});

test('humanização: linguagem invalidante reprova', () => {
  const r = checarHumanizacao('Isso é frescura. É só força de vontade, então pare de reclamar e supere logo.');
  assert.ok(r.falhas.some((f) => /invalidante/.test(f)));
});

test('humanização: texto longo e seco, sem acolhimento, reprova', () => {
  const seco = 'A prevalência do transtorno varia conforme critérios diagnósticos e amostras estudadas em diferentes regiões. '.repeat(3);
  const r = checarHumanizacao(seco);
  assert.ok(r.falhas.some((f) => /pouco acolhimento/.test(f)), r.falhas.join('|'));
});

/* --------------------------- 3. Ética médica e CFM ----------------------- */

test('CFM portal: exige as 5 linhas, CRM e RQE', () => {
  assert.deepStrictEqual(checarEticaCfm(`${TEXTO_ACOLHEDOR}\n\n${PORTAL}`).falhas, []);
  const r = checarEticaCfm(`${TEXTO_ACOLHEDOR}\n\n${SOCIAL}`); // só 3 linhas
  assert.ok(r.falhas.some((f) => /5 linhas/.test(f)), r.falhas.join('|'));
});

test('CFM social: as 3 linhas bastam', () => {
  assert.deepStrictEqual(checarEticaCfm(`${TEXTO_ACOLHEDOR}\n\n${SOCIAL}`, { contexto: 'social' }).falhas, []);
});

test('CFM: sem CRM/RQE reprova', () => {
  const r = checarEticaCfm(TEXTO_ACOLHEDOR);
  assert.ok(r.falhas.some((f) => /CRM-BA 41322/.test(f)) && r.falhas.some((f) => /RQE 26638/.test(f)));
});

test('CFM: promessa de cura e sensacionalismo reprovam', () => {
  for (const t of [
    'Cura garantida para a sua ansiedade.',
    'Cure sua depressão com este método.',
    'Resultado garantido, sem efeitos colaterais!',
    'Método milagroso e infalível. Você não vai acreditar!',
    'ATENÇÃO URGENTE DEPRESSÃO TERRÍVEL agora',
  ]) {
    const r = checarEticaCfm(`${t}\n\n${PORTAL}`);
    assert.ok(r.falhas.length > 0, `deveria reprovar: ${t}`);
  }
});

test('CFM: nunca apresentar o Dr. Antônio Felipe como psiquiatra', () => {
  const r = checarEticaCfm(`O psiquiatra Dr. Antônio Felipe explica.\n\n${PORTAL}`);
  assert.ok(r.falhas.some((f) => /psiquiatra/.test(f)));
  // As pós-graduações e "atuo em Pronto Atendimento Psiquiátrico" (linhas do CFM) não disparam o veto.
  assert.deepStrictEqual(checarEticaCfm(`${TEXTO_ACOLHEDOR}\n\n${PORTAL}`).falhas, []);
});

test('CFM: tema sensível exige CVV 188 (detectado ou forçado)', () => {
  const sensivel = `${TEXTO_ACOLHEDOR} Se aparecerem pensamentos suicidas, você não está sozinho.\n\n${PORTAL}`;
  assert.ok(checarEticaCfm(sensivel).falhas.some((f) => /CVV 188/.test(f)));
  assert.deepStrictEqual(checarEticaCfm(`${sensivel}\nApoio agora: CVV 188 · SAMU 192`).falhas, []);
  assert.ok(checarEticaCfm(`${TEXTO_ACOLHEDOR}\n\n${PORTAL}`, { sensivel: true }).falhas.some((f) => /CVV 188/.test(f)));
});

/* ------------------------------ Fluxo completo --------------------------- */

test('fluxo: peça conforme é aprovada; qualquer falha bloqueia com motivo por eixo', async () => {
  const png = await gradiente().png().toBuffer();
  const boa = await executarChecagensAprovacao({ texto: `${TEXTO_ACOLHEDOR}\n\n${SOCIAL}\n\n${AVISO_CFM}`, imagens: [png], contexto: 'social' });
  assert.strictEqual(boa.aprovado, true, boa.motivo);
  assert.strictEqual(boa.motivo, null);

  const ruim = await executarChecagensAprovacao({ texto: 'Prezado usuário, cura garantida.', imagens: [Buffer.from('x')], contexto: 'social' });
  assert.strictEqual(ruim.aprovado, false);
  assert.match(ruim.motivo, /imagem:/);
  assert.match(ruim.motivo, /humanização:/);
  assert.match(ruim.motivo, /ética\/CFM:/);
});

/* -------------- Integração: legenda de 3 linhas e legado ------------------- */

test('legenda do feed usa a assinatura de 3 linhas; conteúdo legado (1 linha) continua válido', () => {
  const { montarLegendaInstagram, IDENTIFICACAO, IDENTIFICACAO_3_LINHAS, temIdentificacaoSocial } = require('../../backend/lib/legendaInstagram');
  const artigo = {
    titulo: 'Sono e cuidado: quando descansar pede ajuda',
    resumo: 'Como o sono muda quando a rotina pesa e quando procurar apoio.',
    categoria: 'Geral',
    conteudo: '<p>Dormir mal cansa o corpo e a mente.</p><p>Você merece descansar e pedir ajuda sem culpa.</p>',
  };
  assert.ok(montarLegendaInstagram(artigo).texto.includes(IDENTIFICACAO_3_LINHAS));
  const legado = montarLegendaInstagram(artigo, { legado: true }).texto;
  assert.ok(legado.includes(IDENTIFICACAO) && !legado.includes(IDENTIFICACAO_3_LINHAS));
  assert.ok(temIdentificacaoSocial(legado) && temIdentificacaoSocial(IDENTIFICACAO_3_LINHAS));
  assert.deepStrictEqual(checarEticaCfm(`${TEXTO_ACOLHEDOR}\n\n${IDENTIFICACAO}`, { contexto: 'social' }).falhas, []);
});

test('tripla checagem: a 4ª etapa bloqueia promessa de cura na legenda e não vaza buffer para o registro', async () => {
  const { executarTriplaChecagem } = require('../../backend/lib/checagemRedes');
  const { montarLegendaInstagram } = require('../../backend/lib/legendaInstagram');
  const { renderizarCapaRedes } = require('../../backend/lib/capaRedes');
  const artigo = {
    _id: 'x9', slug: 'sono-cuidado', titulo: 'Sono e cuidado: quando descansar pede ajuda',
    resumo: 'Como o sono muda quando a rotina pesa e quando procurar apoio.', categoria: 'Geral',
    conteudo: '<p>Dormir mal cansa o corpo e a mente.</p><p>Você merece descansar e pedir ajuda sem culpa.</p>',
  };
  const r = await renderizarCapaRedes(artigo);
  const capa = { buffer: r.buffer, meta: { modelo: r.modelo, titulo: r.titulo, hash: r.hash } };
  const legenda = montarLegendaInstagram(artigo);
  const ok = await executarTriplaChecagem(artigo, { legenda, capa, contarOutrosComHash: async () => 0 });
  assert.ok(ok.aprovacao, 'resultado traz a 4ª etapa');
  assert.ok(!JSON.stringify(ok.visual).includes('"buffer"'), 'buffer não é serializado');
  const ruim = await executarTriplaChecagem(artigo, { legenda: { ...legenda, texto: `${legenda.texto}\n\nCura garantida em 7 dias!` }, capa, contarOutrosComHash: async () => 0 });
  assert.strictEqual(ruim.aprovado, false);
  assert.match(ruim.motivo, /promessa de cura/);
});

test('humanização: termo estigmatizante citado para ser combatido não reprova; afirmado, reprova', () => {
  const longo = ' Você merece cuidado, escuta e ajuda no seu tempo, e tudo bem pedir apoio à família e à equipe de saúde.';
  assert.deepStrictEqual(checarHumanizacao(`Desmistifica o preconceito de que depressão é fraqueza de caráter.${longo}`).falhas, []);
  assert.deepStrictEqual(checarHumanizacao(`Depressão não é frescura nem drama.${longo}`).falhas, []);
  assert.ok(checarHumanizacao(`Isso é fraqueza de caráter, só isso.${longo}`).falhas.some((f) => /invalidante/.test(f)));
});
