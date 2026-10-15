/**
 * Orquestrador autônomo (fluxo ponta a ponta). Qwen2.5-coder:14b só entra na
 * Etapa 5 (validação do esquema JSON dos payloads); o resto é determinístico.
 *
 * Linha de montagem SEQUENCIAL com desalocação ao fim de cada etapa:
 *   1 Roteirização + Quádrupla Checagem  gemma2:9b / llama3.2:3b  ~8,0 GB
 *   2 Voz/Narração                       Kokoro-TTS               ~2,5 GB
 *   3 Legendas .SRT                      Faster-Whisper           ~2,0 GB
 *   4 Animação                           ComfyUI / Wan2.1         ~10-12 GB
 *   5 Postagem multi-rede                HTTP REST (+ qwen valida) ~10 GB (modelo descarregado antes)
 * Guarda de RAM: antes de cada etapa exige (livre − estimativa) ≥ 6,5 GB para
 * Windows/Node; senão a etapa é ADIADA (nunca forçada).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ollama = require('../ollamaAdapter');
const sanitizer = require('./sanitizerActionAgent');
const curator = require('./clinicalCuratorAgent');
const audit = require('./auditActionAgent');
const humanized = require('./humanizedCheckAgent');
const media = require('./mediaDirectorAgent');
const { checarImagemSemMarcaDagua, LINHAS_SOCIAL } = require('../checagensAprovacao');
const { AVISO_CFM } = require('../conformidadeCfm');
const ig = require('../operacional/instagram/postPublisher');
const yt = require('../operacional/youtube/postPublisher');
const li = require('../operacional/linkedin/postPublisher');

const GB = 1024 ** 3;
const TETO_GB = 17.5;
const RESERVA_GB = 6.5;
const MAX_TENTATIVAS = 2;
const RAIZ = path.resolve(__dirname, '../../..');
const PASTA_MIDIAS = path.join(RAIZ, 'carrosseis-instagram');

const ETAPAS = [
  { n: 1, nome: 'Roteirização e Quádrupla Checagem', ferramenta: 'gemma2:9b / llama3.2:3b', gb: 8.0 },
  { n: 2, nome: 'Voz/Narração', ferramenta: 'Kokoro-TTS (fallback Edge-TTS)', gb: 2.5 },
  { n: 3, nome: 'Legendas .SRT', ferramenta: 'Faster-Whisper', gb: 2.0 },
  { n: 4, nome: 'Animação anime', ferramenta: 'ComfyUI / Wan2.1', gb: 11.0 },
  { n: 5, nome: 'Postagem autônoma multi-rede', ferramenta: 'REST (qwen2.5-coder:14b valida se couber)', gb: 10.0 },
];

const ORIENTACAO = 'Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.';
const LINHA_CRISE = 'Em crise: CVV 188 · SAMU 192';
const LINHA_SUS = 'Procure a UBS ou o CAPS do seu município: o cuidado pelo SUS é um direito seu.';
const SUBSTITUICOES = [[/\bfrescura\b/gi, 'sofrimento real'], [/\bdrama\b/gi, 'dor'], [/\b(louco|doido|surtado)(a?s?)\b/gi, 'pessoa em sofrimento'], [/\bcura garantida\b/gi, 'cuidado possível'], [/\bresultado garantido\b/gi, 'cuidado possível'], [/\bgarantimos\b/gi, 'buscamos'], [/\b100%\b/g, 'muito']];

/* ------------------------------- Memória ------------------------------------ */
const mapaRam = [];
const livreGb = () => os.freemem() / GB;
const usadoGb = () => (os.totalmem() - os.freemem()) / GB;

async function executarEtapa(etapa, fn, gbReal = etapa.gb) {
  const livreAntes = livreGb();
  const registro = { ...etapa, gbReal, livreAntesGb: +livreAntes.toFixed(1), status: 'ok', picoSistemaGb: +usadoGb().toFixed(1) };
  const minimo = etapa.n === 1 ? gbReal : gbReal + RESERVA_GB;
  if (livreAntes < minimo) {
    registro.status = 'adiada (RAM insuficiente)';
    registro.motivo = `livre ${livreAntes.toFixed(1)} GB < mínimo ${minimo.toFixed(1)} GB`;
    mapaRam.push(registro);
    return { adiada: true };
  }
  let saida;
  try {
    saida = await fn();
    registro.picoSistemaGb = +Math.max(usadoGb(), registro.picoSistemaGb).toFixed(1);
  } finally {
    for (const m of Object.values(ollama.MODELOS).flat()) await ollama.descarregar(m); // desaloca
    global.gc?.();
    registro.livreDepoisGb = +livreGb().toFixed(1);
  }
  mapaRam.push(registro);
  return { saida };
}

/* ------------------------- Quádrupla checagem ------------------------------- */
async function quadrupla(peca, { usarLlm }) {
  const agentes = [sanitizer, curator, audit, humanized];
  const resultados = {};
  for (const a of agentes) resultados[a.nome] = await a.checar(peca, { usarLlm }); // sequencial: 1 modelo por vez
  const falhas = Object.entries(resultados).flatMap(([n, r]) => r.falhas.map((f) => ({ agente: n, motivo: f })));
  return { aprovada: !falhas.length, resultados, falhas };
}

/* ------------------------------ Auto-correção ------------------------------- */
async function corrigir(peca, falhas, { usarLlm }) {
  const p = { ...peca };
  const motivos = falhas.map((f) => f.motivo);
  const tem = (re) => motivos.some((m) => re.test(m));
  let legenda = sanitizer.sanitizarTexto(p.legenda);
  for (const [re, novo] of SUBSTITUICOES) legenda = legenda.replace(re, novo);
  if (tem(/slug/i)) p.slug = sanitizer.slugificar(p.slug || p.titulo);
  if (tem(/revisaoMedica/)) p.revisaoMedica = 'pendente';
  if (tem(/trava/)) legenda = legenda.replace(/(\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|ml|mL|g)\b)(?!\s*\[DOSE)/gi, `$1 ${curator.TRAVA_DOSE}`);
  // Falhas que só o redator resolve (tom, culpa, coesão): reescrita com gemma2.
  const residual = motivos.filter((m) => /humaniza|curadoria|auditoria|linguagem|fala sobre/i.test(m));
  if (residual.length && usarLlm) {
    const r = await ollama.gerar('redacao', {
      sistema: 'Reescreva o texto em português do Brasil corrigindo SOMENTE os problemas listados. Fale com a pessoa (você), tom simples, sem culpa/medo. Preserve fatos, avisos, [DOSE A CONFIRMAR] e a assinatura. Devolva apenas o texto.',
      usuario: `Problemas: ${residual.join('; ')}

Texto:
${legenda}`, maxTokens: 700, timeoutMs: 240_000,
    });
    if (r.texto && r.texto.length > 80) legenda = r.texto;
  }
  // Blocos obrigatórios SEMPRE reaplicados pelo código (a reescrita do LLM pode tê-los perdido).
  const norm = (t) => t.replace(/\s+/g, ' ');
  const anexar = (bloco) => { legenda += `\n\n${bloco}`; };
  if (!/\bSUS\b/.test(legenda)) anexar(LINHA_SUS);
  if (!/orienta[çc][ãa]o geral/i.test(legenda) || !/protocolos? (?:hospitalares?|locais|do (?:pronto|PA)|da rede)/i.test(legenda)) anexar(ORIENTACAO);
  if (!/CVV 188/.test(legenda) || !/SAMU 192/.test(legenda)) anexar(LINHA_CRISE);
  if (!LINHAS_SOCIAL.every((l) => norm(legenda).includes(norm(l)))) anexar(LINHAS_SOCIAL.join('\n'));
  if (!legenda.includes(AVISO_CFM)) anexar(AVISO_CFM);
  p.legenda = legenda;
  return p;
}

/* ---------------------- Auditoria visual (marca d'água) --------------------- */
async function auditoriaVisual(peca, { simulado }) {
  const reprovadas = [];
  for (const [i, img] of (peca.imagens || []).entries()) {
    if (img && typeof img === 'object' && 'simulaMarcaDagua' in img) {
      if (img.simulaMarcaDagua) reprovadas.push({ i, motivo: 'marca d\'água de terceiros (simulada)' });
      continue;
    }
    if (typeof img === 'string' && fs.existsSync(img)) {
      const r = await checarImagemSemMarcaDagua(fs.readFileSync(img));
      if (!r.ok) reprovadas.push({ i, motivo: r.falhas.join('; ') });
    }
  }
  const regeradas = [];
  for (const r of reprovadas) {
    // PROIBIDO apagar a marca: a imagem é substituída por nova geração local.
    const g = await media.regerarImagem({ tema: peca.tema || peca.titulo, simulado });
    if (!g.regerada) return { ok: false, reprovadas, motivo: `marca d'água e regeração indisponível (${g.motivo})` };
    peca.imagens[r.i] = { regerada: true, via: g.via, simulaMarcaDagua: false };
    regeradas.push(r.i + 1);
  }
  return { ok: true, reprovadas, regeradas };
}

/* ------------------------------ Relatório ----------------------------------- */
function proximaSegunda(d = new Date()) {
  const x = new Date(d); x.setDate(x.getDate() + ((8 - x.getDay()) % 7 || 7));
  return x.toISOString().slice(0, 10);
}
/** Remove o JSON da fila (só no modo ao vivo e para peças lidas de _fila/). */
function removerDaFila(peca, simulado) {
  if (simulado || !peca._arquivo || !fs.existsSync(peca._arquivo)) return false;
  fs.unlinkSync(peca._arquivo);
  return true;
}

function registrarRetiradas(retiradas, simulado) {
  if (!retiradas.length) return null;
  const dir = path.join(PASTA_MIDIAS, '_relatorios');
  fs.mkdirSync(dir, { recursive: true });
  const arq = path.join(dir, `pendencias-segunda-${proximaSegunda()}${simulado ? '-TESTE' : ''}.md`);
  const linhas = retiradas.map((r) => `- **${r.id}** (${r.tentativas} correções automáticas): ${r.falhas.map((f) => `[${f.agente}] ${f.motivo}`).join(' | ')} — ${r.removidoDaFila ? 'removida de _fila' : 'fila preservada (simulação)'}`);
  fs.appendFileSync(arq, `\n## Retiradas da fila em ${new Date().toISOString()}\n${linhas.join('\n')}\n`, 'utf8');
  return arq;
}

/* ----------------------- Etapa 5: validação (qwen) -------------------------- */
async function validarPayloads(payloads, { usarLlm }) {
  const falhas = payloads.filter((p) => !p.rede || !p.legenda || (p.rede === 'youtube' && !p.titulo)).map((p) => `payload incompleto (${p.rede || '?'})`);
  if (usarLlm && !falhas.length) {
    const r = await ollama.gerar('codigo', { sistema: 'Valide o esquema. Responda só JSON {"valido":true|false,"erros":[]}.', usuario: JSON.stringify(payloads.map((p) => ({ rede: p.rede, tipo: p.tipo, temLegenda: Boolean(p.legenda), temTitulo: Boolean(p.titulo) }))), json: true, maxTokens: 80, timeoutMs: 240_000 });
    if (r.json?.valido === false) falhas.push(...(r.json.erros || ['esquema inválido']).map(String));
  }
  return falhas;
}

function montarPayloads(peca) {
  const redes = peca.redes || ['instagram'];
  const out = [];
  if (redes.includes('instagram')) out.push({ rede: 'instagram', tipo: peca.tipo || 'carrossel', legenda: peca.legenda, imagensUrls: peca.imagensUrls, arquivo: peca.video, videoUrl: peca.videoUrl, imagemUrl: peca.imagemUrl });
  if (redes.includes('youtube')) out.push({ rede: 'youtube', titulo: peca.titulo, legenda: peca.legenda, descricao: peca.legenda, tags: peca.tags || [], arquivo: peca.video, srt: peca.srt, thumbnail: peca.thumbnail, short: true, agendarPara: peca.agendarPara, palavraChave: peca.palavraChave });
  if (redes.includes('linkedin')) out.push({ rede: 'linkedin', tipo: peca.urlArtigo ? 'artigo' : 'texto', legenda: peca.legenda, titulo: peca.titulo, url: peca.urlArtigo });
  return out;
}

/* -------------------------------- Fluxo ------------------------------------- */
async function processarFila(fila, { simulado = true, usarLlm = true } = {}) {
  const inicio = Date.now();
  const relatorio = { simulado, aprovadas: [], retiradas: [], publicacoes: [], adiadas: [], registrosCorrecao: [] };
  const baselineGb = usadoGb();

  for (const original of fila) {
    let peca = { ...original, imagens: [...(original.imagens || [])] };
    const id = peca.id || peca.slug || peca.titulo || 'sem-id';
    let chk = null;
    let tentativas = 0;

    // Etapa 1 — roteirização (aqui: rascunho recebido) + Quádrupla Checagem com auto-correção.
    const custo = (gb) => (usarLlm ? gb : 0.5);
    const e1 = await executarEtapa(ETAPAS[0], async () => {
      for (;;) {
        chk = await quadrupla(peca, { usarLlm });
        if (chk.aprovada || tentativas >= MAX_TENTATIVAS) return;
        relatorio.registrosCorrecao.push({ id, tentativa: tentativas + 1, falhas: chk.falhas.map((f) => `[${f.agente}] ${f.motivo}`) });
        peca = await corrigir(peca, chk.falhas, { usarLlm });
        tentativas += 1;
      }
    }, custo(ETAPAS[0].gb));
    if (e1.adiada) { relatorio.adiadas.push({ id, etapa: 1 }); continue; }
    if (!chk.aprovada) { relatorio.retiradas.push({ id, tentativas, falhas: chk.falhas, removidoDaFila: removerDaFila(original, simulado) }); continue; } // fila segue

    const visual = await auditoriaVisual(peca, { simulado });
    if (!visual.ok) { relatorio.retiradas.push({ id, tentativas, falhas: [{ agente: 'auditoriaVisual', motivo: `${visual.motivo}. Substituir a imagem (marca d'água de terceiros não pode ser apagada)` }], removidoDaFila: removerDaFila(original, simulado) }); continue; }

    // Etapas 2-4 — mídia (cada uma libera a RAM ao terminar).
    const dir = path.join(PASTA_MIDIAS, peca.slug || sanitizer.slugificar(id));
    const audio = path.join(dir, 'narracao.mp3');
    const srt = path.join(dir, 'legendas.srt');
    const midia = { voz: null, legendas: null, animacao: null };
    if (peca.gerarMidia !== false) {
      const e2 = await executarEtapa(ETAPAS[1], () => media.narrar({ texto: peca.legenda, saida: audio, simulado }), simulado ? 0.3 : ETAPAS[1].gb);
      midia.voz = e2.saida || { adiada: true };
      const e3 = await executarEtapa(ETAPAS[2], () => media.legendar({ audio, saidaSrt: srt, simulado }), simulado ? 0.3 : ETAPAS[2].gb);
      midia.legendas = e3.saida || { adiada: true };
      const e4 = await executarEtapa(ETAPAS[3], () => media.animar({ tema: peca.tema || peca.titulo, simulado }), ETAPAS[3].gb);
      midia.animacao = e4.saida || { adiada: true };
      if (midia.legendas?.conector) peca.srt = srt;
    }

    // Etapa 5 — disparo autônomo.
    const e5 = await executarEtapa(ETAPAS[4], async () => {
      const payloads = montarPayloads(peca);
      // qwen2.5-coder:14b (~10 GB) só valida o esquema se houver margem; senão, validação determinística.
      const qwenCabe = usarLlm && livreGb() >= ETAPAS[4].gb + RESERVA_GB;
      const invalidos = await validarPayloads(payloads, { usarLlm: qwenCabe });
      if (invalidos.length) return [{ rede: 'todas', bloqueado: invalidos.join('; ') }];
      const saidas = [];
      for (const p of payloads) {
        try {
          const publicador = { instagram: ig, youtube: yt, linkedin: li }[p.rede];
          saidas.push(await publicador.publicar(p, { simulado }));
        } catch (e) { saidas.push({ rede: p.rede, erro: e.message }); }
      }
      return saidas;
    }, 0.5);
    if (e5.adiada) relatorio.adiadas.push({ id, etapa: 5 });
    relatorio.aprovadas.push({ id, tentativas, quadrupla: Object.fromEntries(Object.entries(chk.resultados).map(([n, r]) => [n, r.ok ? `OK${r.modelo ? ` (${r.modelo})` : ' (regras)'}` : 'FALHA'])), regeradas: visual.regeradas, midia });
    relatorio.publicacoes.push({ id, resultado: e5.saida || 'adiada' });
  }

  relatorio.arquivoSegunda = registrarRetiradas(relatorio.retiradas, simulado);
  relatorio.mapaRam = mapaRam;
  relatorio.ram = { baselineSistemaGb: +baselineGb.toFixed(1), picoSistemaGb: Math.max(...mapaRam.map((m) => m.picoSistemaGb), +baselineGb.toFixed(1)), tetoGb: TETO_GB, reservaGb: RESERVA_GB };
  relatorio.duracaoS = Math.round((Date.now() - inicio) / 1000);
  return relatorio;
}

function imprimir(r) {
  const L = (...a) => console.log(...a);
  L(`\n===== RELATÓRIO FINAL (${r.simulado ? 'SIMULADO — nenhuma rede foi tocada' : 'AO VIVO'}) — ${r.duracaoS}s =====`);
  L(`Aprovadas: ${r.aprovadas.length} | Retiradas da fila: ${r.retiradas.length} | Adiadas por RAM: ${r.adiadas.length}`);
  if (r.registrosCorrecao.length) { L('\n-- Auto-correção --'); r.registrosCorrecao.forEach((c) => L(`  ${c.id} tentativa ${c.tentativa}: ${c.falhas.join(' | ')}`)); }
  L('\n-- Quádrupla Checagem (peças aprovadas) --');
  r.aprovadas.forEach((a) => { L(`  ${a.id} (correções: ${a.tentativas}${a.regeradas?.length ? `, imagens regeradas: ${a.regeradas}` : ''})`); Object.entries(a.quadrupla).forEach(([n, s]) => L(`    ${n}: ${s}`)); });
  L('\n-- Retiradas da fila --');
  if (!r.retiradas.length) L('  (nenhuma)');
  r.retiradas.forEach((x) => L(`  ${x.id}: ${x.falhas.map((f) => f.motivo).join(' | ')}`));
  if (r.arquivoSegunda) L(`  Registrado em: ${r.arquivoSegunda}`);
  L('\n-- Publicação --');
  r.publicacoes.forEach((p) => L(`  ${p.id}: ${JSON.stringify(p.resultado)}`));
  L('\n-- Mapa de alocação de RAM --');
  L(`  Sistema antes: ${r.ram.baselineSistemaGb} GB em uso | pico medido: ${r.ram.picoSistemaGb} GB | teto: ${r.ram.tetoGb} GB | reserva Windows/Node: ${r.ram.reservaGb} GB`);
  r.mapaRam.forEach((m) => L(`  Etapa ${m.n} ${m.nome} [${m.ferramenta}] ~${m.gb} GB (guarda: ${m.gbReal} GB) | livre antes ${m.livreAntesGb} GB → depois ${m.livreDepoisGb ?? '-'} GB | ${m.status}${m.motivo ? ` (${m.motivo})` : ''}`));
}

module.exports = { processarFila, quadrupla, corrigir, auditoriaVisual, imprimir, ETAPAS, TETO_GB, RESERVA_GB };
