/**
 * Portão ZERO GENÉRICO no pipeline das redes (ordem de 10/11/2026, 06:15, item 1).
 * Overrides explícitos por post (um arquivo JSON versionado): frases clínicas literais do artigo, pontos concretos
 * literais, eixo do dia e, se preciso, legenda/telas. Sem IA: tudo determinístico e revisável.
 */
const fs = require('node:fs');
const path = require('node:path');
const { checarZeroGenerico } = require('./zeroGenerico');
const { IDENTIFICACAO_COMPLETA } = require('../identificacaoCfm');
const LINHAS_IDENTIFICACAO = new Set(IDENTIFICACAO_COMPLETA.split('\n').map((l) => l.trim()));

/** Lê o arquivo de overrides: { ovs: { <slug>: {...} }, trocas: { <slugAntigo>: <slugNovo> } }. Ausente = vazio. */
function carregarOverrides(arquivo) {
  if (!arquivo || !fs.existsSync(arquivo)) return { ovs: {}, trocas: {} };
  const j = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  return { ovs: j.ovs || {}, trocas: j.trocas || {} };
}

/** Aplica o override ao plano do planejarPost (só os campos presentes). Devolve novo objeto. */
function aplicarOverride(plano, ov) {
  if (!ov) return plano;
  const p = JSON.parse(JSON.stringify(plano));
  if (ov.legendaCorpo) p.legendaCorpo = ov.legendaCorpo;
  if (ov.telas) p.telas = ov.telas;
  if (ov.refs) p.refs = ov.refs;
  return p;
}

/** Histórico das pastas da fila (últimas semanas), sem a pasta que está sendo gerada. */
function historicoDe(saida, { excluirId } = {}) {
  if (!fs.existsSync(saida)) return [];
  const out = [];
  for (const nome of fs.readdirSync(saida)) {
    if (nome === 'revisar' || nome === excluirId) continue;
    const meta = path.join(saida, nome, 'meta.json');
    const leg = path.join(saida, nome, 'legenda.txt');
    if (!fs.existsSync(meta) || !fs.existsSync(leg)) continue;
    const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
    out.push({ slug: m.slug, dataISO: String(m.dataSugerida || '').slice(0, 10), legenda: fs.readFileSync(leg, 'utf8') });
  }
  return out;
}

// Trechos fixos do rodapé e da estrutura: não são frases do artigo, não entram na conferência de literalidade.
const FIXOS = [/^Texto completo no link da bio\.?$/i, /^Refer[êe]ncias:/i, /^#/, /^🔗/, /^Se precisar de apoio/i, /^Em crise:/i, /^Conteúdo do Portal/i, /^Orientação geral/i, /^Conteúdo educativo/i, /^Salve para ler depois\.?$/i, /^Compartilhe com quem precisa\.?$/i];
/**
 * Frases clínicas da legenda: cada sentença do corpo (sem rodapé fixo e sem marcadores), para conferir literalidade.
 * A conferência é feita sobre o que VAI AO AR; não se declara frase a parte.
 */
function derivarFrases(legenda) {
  const corpo = String(legenda || '').split(/\n\s*\n/).filter((b) => !/^(Referências:|Conteúdo do Portal|Conteúdo educativo|Orientação geral|Em crise:|#|Salve para ler|Compartilhe com|Texto completo)/i.test(b.trim()))
    .join('\n').replace(/^•\s*/gm, '');
  const frases = [];
  for (const linha of corpo.split('\n')) {
    const t = linha.trim();
    if (!t || LINHAS_IDENTIFICACAO.has(t) || FIXOS.some((re) => re.test(t))) continue;
    for (const s of t.split(/(?<=[.!?])\s+/)) if (s.trim().length > 25) frases.push(s.trim());
  }
  return frases;
}

/**
 * Roda o zero genérico sobre a legenda final. `doc` é o artigo do Mongo (slug, publicado, conteudo, resumo).
 * O eixo, as frases e os pontos vêm do override; sem override, a checagem falha (regras b, c, f): não há aprovação silenciosa.
 */
function avaliarZeroGenerico({ doc, legenda, ov = {}, dataISO, historico = [], urlTexto }) {
  return checarZeroGenerico({
    post: {
      legenda,
      eixo: ov.eixo,
      artigo: { publicado: doc.publicado === true, slug: doc.slug, link: urlTexto, corpo: doc.conteudo || '', resumo: doc.resumo || '' },
      frasesClinicas: ov.frasesClinicas || derivarFrases(legenda),
      pontos: ov.pontos || [],
    },
    dataISO,
    historico,
  });
}

module.exports = { carregarOverrides, aplicarOverride, historicoDe, avaliarZeroGenerico, derivarFrases };
