/**
 * Rotina mensal do Blob (dia 1, 03:00; tarefa DrSM-Blob-Rotina-Mensal, criada DESATIVADA). Apaga SÓ os grupos c e d.
 *   node --env-file-if-exists=.env scripts/blob-rotina-mensal.js --simular   só lê e grava o relatório (padrão)
 *   node --env-file-if-exists=.env scripts/blob-rotina-mensal.js --aplicar   apaga c/d se a trava permitir
 * Trava (todas precisam passar; senão NÃO apaga e alerta):
 *   1) nenhum item de a/b entre os apagáveis, e a/b iguais antes e depois (o endpoint só lista c/d);
 *   2) apagáveis < 50% dos blobs (contagem);
 *   3) no máximo 20 arquivos por rodada (trava do blob:orfas);
 *   4) o servidor também recusa acima de 50% das narrações (backend/lib/blobNarracoes.js).
 * Relatório antes e depois: relatorios/blob/rotina-mensal-AAAA-MM-DD.md. Nunca imprime o ADMIN_TOKEN.
 */
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';
const MAX_ARQUIVOS = 20;
const PERCENTUAL_MAXIMO = 0.5;

// Função pura (testável): decide se pode apagar, a partir do inventário antes.
// Falha segura: inventário ausente ou sem grupos = não apaga. Qualquer item em a ou b = não apaga NADA (ordem do Dr. Antônio, 19/10/2026).
function avaliarTrava(antes, { aplicar }) {
  if (!antes || !antes.grupos || !antes.listas) return { podeApagar: false, apagaveis: 0, motivos: ['inventário ausente ou sem grupos (falha segura)'] };
  const motivos = [];
  const L = antes.listas;
  const apagaveis = [...(L.c || []), ...(L.d || [])];
  const itensAB = (L.a || []).length + (L.b || []).length;
  if (itensAB) motivos.push(`${itensAB} item(ns) nos grupos a/b: nada é apagado`);
  const abUrls = new Set([...(L.a || []), ...(L.b || [])].map((x) => x.url));
  const emAB = apagaveis.filter((x) => abUrls.has(x.url)).length;
  if (emAB) motivos.push(`${emAB} arquivo(s) apagável(is) também aparecem em a/b`);
  if (apagaveis.length > antes.blobs * PERCENTUAL_MAXIMO) motivos.push(`apagáveis (${apagaveis.length}) passam de 50% dos blobs (${antes.blobs})`);
  if (apagaveis.length > MAX_ARQUIVOS) motivos.push(`${apagaveis.length} arquivos c/d (> ${MAX_ARQUIVOS}): rever com o Dr. Antônio`);
  const podeApagar = aplicar && motivos.length === 0 && apagaveis.length > 0;
  if (!aplicar) motivos.push('modo simulação: nada apagado');
  return { podeApagar, apagaveis: apagaveis.length, motivos };
}

// a/b precisam estar iguais antes e depois (invariante: a rotina não mexe neles).
function abMudou(antes, depois) {
  return ['a', 'b'].some((g) => (antes.grupos[g] || {}).arquivos !== (depois.grupos[g] || {}).arquivos);
}

const resumo = (j) => `${j.blobs} arquivos, ${j.totalMB} MB · a ${j.grupos.a.arquivos} · b ${j.grupos.b.arquivos} · c ${j.grupos.c.arquivos} · d ${j.grupos.d.arquivos} · apagáveis ${j.apagaveis.arquivos}`;

async function inventario(H) {
  const j = await fetch(`${BASE}/api/admin/blob-narracoes?completo=1`, { headers: H }).then((r) => r.json());
  if (!j.grupos) throw new Error(`resposta inesperada: ${JSON.stringify(j).slice(0, 120)}`);
  return j;
}

function gravar(linhas) {
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const pasta = path.resolve(__dirname, '../relatorios/blob');
  fs.mkdirSync(pasta, { recursive: true });
  const arquivo = path.join(pasta, `rotina-mensal-${hoje}.md`);
  fs.writeFileSync(arquivo, `${linhas.join('\n')}\n`, 'utf8');
  return arquivo;
}

// Alerta no topo do ESTADO-GERAL.md e primeira linha do RESUMO-DO-DIA.md (mesmo padrão do agendarDiario.js).
function alertarBlob(texto) {
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const raiz = path.resolve(__dirname, '..');
  const eg = path.join(raiz, 'relatorios/ESTADO-GERAL.md');
  const bloco = `<!-- ALERTA-BLOB:INICIO -->\n> # 🚨 ROTINA DO BLOB NÃO APAGOU NADA (${hoje}): ${texto}\n<!-- ALERTA-BLOB:FIM -->\n`;
  if (fs.existsSync(eg)) {
    const t = fs.readFileSync(eg, 'utf8');
    const re = /<!-- ALERTA-BLOB:INICIO -->[\s\S]*?<!-- ALERTA-BLOB:FIM -->\n?/;
    fs.writeFileSync(eg, re.test(t) ? t.replace(re, bloco) : t.replace(/\n/, `\n${bloco}`), 'utf8');
  }
  const resumo = path.join(raiz, 'relatorios/RESUMO-DO-DIA.md');
  const atual = fs.existsSync(resumo) ? fs.readFileSync(resumo, 'utf8') : '';
  // Mesmo formato lido por resumoDoDia.js (PREFIXO_ALERTA_BLOB): a conferência das 09:30 mantém esta linha no topo.
  fs.writeFileSync(resumo, `PRECISA DO DR. ANTÔNIO: SIM — Blob: ${texto}\n${atual.replace(/^PRECISA DO DR\. ANTÔNIO:.*\n?/, '')}`, 'utf8');
}

async function main() {
  const aplicar = process.argv.includes('--aplicar');
  if (!aplicar && !process.argv.includes('--simular')) throw new Error('use --simular ou --aplicar');
  if (!process.env.ADMIN_TOKEN) throw new Error('ADMIN_TOKEN ausente no .env');
  const H = { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` };
  const modo = aplicar ? 'APLICAR' : 'SIMULAÇÃO';
  const antes = await inventario(H);
  const trava = avaliarTrava(antes, { aplicar });
  const linhas = [`# Rotina mensal do Blob — ${modo}`, '', `**Antes:** ${resumo(antes)}`, `**Apagáveis (c/d):** ${trava.apagaveis}`, ''];
  let alerta = false;
  if (aplicar && !trava.podeApagar && trava.apagaveis > 0) {
    alerta = true;
    linhas.push('**ALERTA: NÃO apagado.** Motivos: ' + trava.motivos.join('; '));
    alertarBlob(trava.motivos.join('; '));
  } else if (aplicar && trava.apagaveis === 0) {
    linhas.push('Nada a apagar.');
  } else if (!aplicar) {
    linhas.push(`Simulação: ${trava.apagaveis} arquivo(s) c/d seriam apagados${trava.motivos.length ? ` (${trava.motivos.join('; ')})` : ''}. Nada apagado.`);
  }
  if (trava.podeApagar) {
    const r = await fetch(`${BASE}/api/admin/blob-narracoes?aplicar=1`, { method: 'DELETE', headers: H }).then((x) => x.json());
    const depois = await inventario(H);
    const mudouAB = abMudou(antes, depois);
    linhas.push(`**Apagadas:** ${r.apagadas}${r.recusado ? ` · RECUSADO pelo servidor: ${r.recusado}` : ''}`, `**Depois:** ${resumo(depois)}`);
    if (mudouAB) { alerta = true; linhas.push('**ALERTA:** a ou b mudaram de tamanho durante a rotina (conferir com o Dr. Antônio).'); }
  }
  const arquivo = gravar(linhas);
  console.log(`rotina ${modo}: ${alerta ? 'ALERTA' : 'ok'} → ${arquivo}`);
  process.exit(alerta ? 1 : 0);
}

if (require.main === module) main().catch((e) => {
  console.error('ERRO:', e.message);
  if (process.argv.includes('--aplicar')) alertarBlob(`falha antes de apagar (${e.message}); nada apagado`);
  process.exit(1);
});

module.exports = { avaliarTrava, abMudou, MAX_ARQUIVOS };
