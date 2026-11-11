'use strict';
// Checagem automática do novo padrão visual (amostras). Lê o manifest.json gerado por
// gerarAmostras.py. Reprova: vídeo estático, texto cortado (fora da área segura ou do painel),
// título duplicado, caixa vazia e excesso de palavras de arte por quadro.
// Uso: node checagemVisual.js <manifest.json>   (código de saída 1 se reprovar)

const fs = require('fs');

const LIMITE_MOVIMENTO = 0.02; // média de diferença entre quadros (0 a 255); abaixo disso = estático
const MARGEM_SEGURA_X = 40;
const LIMITE_PALAVRAS_ARTE = 25;
const TIPOS_ARTE = ['arte', 'titulo', 'legenda', 'rotulo', 'selo'];
const TIPOS_FORA_DA_CONTA = ['assinatura', 'aviso', 'credito'];

function reprovaEstatico(cena, limite = LIMITE_MOVIMENTO) {
  if (typeof cena.movimento !== 'number' || cena.movimento < limite) {
    return `vídeo estático: cena ${cena.id} com movimento ${cena.movimento} (mínimo ${limite})`;
  }
  return null;
}

function reprovaTextoCortado(caixas, paineis, largura, altura, id = '?') {
  const motivos = [];
  const mapa = new Map((paineis || []).map((p) => [p.id, p]));
  for (const c of caixas || []) {
    const trecho = `"${(c.texto || '').slice(0, 40)}"`;
    if (c.x0 < MARGEM_SEGURA_X || c.x1 > largura - MARGEM_SEGURA_X || c.y0 < 0 || c.y1 > altura) {
      motivos.push(`texto fora da área segura em ${id}: ${trecho}`);
    }
    if (c.painel != null) {
      const p = mapa.get(c.painel);
      if (!p) {
        motivos.push(`painel inexistente (${c.painel}) em ${id}: ${trecho}`);
      } else if (c.x0 < p.x0 || c.x1 > p.x1 || c.y0 < p.y0 || c.y1 > p.y1) {
        motivos.push(`texto cortado pelo painel ${c.painel} em ${id}: ${trecho}`);
      }
    }
  }
  return motivos;
}

function reprovaTituloDuplicado(titulos) {
  const vistos = new Map();
  const motivos = [];
  for (const t of titulos) {
    const chave = String(t.titulo || '').trim().toLowerCase();
    if (!chave) continue;
    if (vistos.has(chave)) {
      motivos.push(`título duplicado: "${t.titulo}" em ${vistos.get(chave)} e ${t.id}`);
    } else {
      vistos.set(chave, t.id);
    }
  }
  return motivos;
}

function reprovaCaixaVazia(paineis, caixas, id = '?') {
  const motivos = [];
  for (const p of paineis || []) {
    const dentro = (caixas || []).filter((c) => c.painel === p.id && String(c.texto || '').trim() !== '');
    if (dentro.length === 0) motivos.push(`caixa vazia: painel ${p.id} em ${id}`);
  }
  for (const c of caixas || []) {
    if (String(c.texto || '').trim() === '') motivos.push(`texto vazio em ${id}`);
  }
  return motivos;
}

function reprovaExcessoPalavras(caixas, id = '?', limite = LIMITE_PALAVRAS_ARTE) {
  const total = (caixas || [])
    .filter((c) => TIPOS_ARTE.includes(c.tipo) && !TIPOS_FORA_DA_CONTA.includes(c.tipo))
    .reduce((soma, c) => soma + String(c.texto || '').trim().split(/\s+/)
      .filter((t) => /[\p{L}\p{N}]/u.test(t)).length, 0);
  return total > limite ? [`excesso de palavras em ${id}: ${total} (máximo ${limite})`] : [];
}

// Normaliza o manifest em itens (um por quadro/cena/slide/story/capa).
function itensDoManifest(m) {
  const itens = [];
  if (m.reel) {
    for (const grupo of m.reel.caixas) {
      const cena = m.reel.cenas.find((c) => c.id === grupo.cena) || {};
      itens.push({ id: `reel/${grupo.cena}`, titulo: grupo.titulo, largura: m.reel.largura, altura: m.reel.altura,
        caixas: grupo.caixas, paineis: grupo.paineis, cena: { id: grupo.cena, movimento: cena.movimento },
        video: true });
    }
  }
  if (m.carrossel) {
    for (const s of m.carrossel.slides) {
      const titulo = (s.caixas.find((c) => c.tipo === 'titulo') || {}).texto;
      itens.push({ id: `carrossel/${s.id}`, titulo, largura: m.carrossel.largura, altura: m.carrossel.altura,
        caixas: s.caixas, paineis: s.paineis });
    }
  }
  for (const s of m.stories || []) {
    const titulo = (s.caixas.find((c) => c.tipo === 'rotulo') || {}).texto;
    itens.push({ id: `stories/${s.id}`, titulo, largura: 1080, altura: 1920, caixas: s.caixas, paineis: s.paineis });
  }
  if (m.podcast) {
    itens.push({ id: 'podcast/capa', titulo: m.podcast.titulo, largura: m.podcast.largura,
      altura: m.podcast.altura, caixas: m.podcast.caixas, paineis: m.podcast.paineis });
  }
  return itens;
}

function checar(m) {
  const motivos = [];
  const itens = itensDoManifest(m);
  for (const it of itens) {
    motivos.push(...reprovaTextoCortado(it.caixas, it.paineis, it.largura, it.altura, it.id));
    motivos.push(...reprovaCaixaVazia(it.paineis, it.caixas, it.id));
    motivos.push(...reprovaExcessoPalavras(it.caixas, it.id));
    if (it.video) motivos.push(...[reprovaEstatico(it.cena)].filter(Boolean));
  }
  // título duplicado vale dentro de cada peça (reel, carrossel, conjunto de stories);
  // o mesmo tema repetido entre formatos é intencional.
  const grupos = { reel: [], carrossel: [], stories: [], podcast: [] };
  for (const it of itens) grupos[it.id.split('/')[0]].push({ id: it.id, titulo: it.titulo });
  for (const g of Object.values(grupos)) motivos.push(...reprovaTituloDuplicado(g));
  return { aprovado: motivos.length === 0, motivos, itensChecados: itens.length };
}

module.exports = {
  reprovaEstatico, reprovaTextoCortado, reprovaTituloDuplicado, reprovaCaixaVazia,
  reprovaExcessoPalavras, itensDoManifest, checar, LIMITE_MOVIMENTO, LIMITE_PALAVRAS_ARTE,
};

if (require.main === module) {
  const arquivo = process.argv[2];
  if (!arquivo) {
    console.error('Uso: node checagemVisual.js <manifest.json>');
    process.exit(2);
  }
  const resultado = checar(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
  console.log(JSON.stringify(resultado, null, 2));
  process.exit(resultado.aprovado ? 0 : 1);
}
