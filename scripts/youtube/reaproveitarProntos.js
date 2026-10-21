/**
 * Reaproveitamento dos vídeos reprovados que passam nas checagens (ordem de 20/10/2026, item 2).
 * Passa só os que estão na lista de aprovados pelas checagens; os demais continuam na regeração, com o motivo.
 * Novos horários: depois do último já programado, 1 por dia (proximosHorarios). Nenhum horário existente muda.
 *   node scripts/youtube/reaproveitarProntos.js            simulação (não grava)
 *   node scripts/youtube/reaproveitarProntos.js --aplicar  grava (fila.json com backup, listas e pacotes da fila manual)
 */
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib');
const { copiarPacote } = require('./copiarPacoteManual');
const { proximosHorarios } = require('./proximosHorarios');
const { statusPelaConferencia } = require('./conferirVideo');

const segundaDe = (dt) => { const l = new Date(dt.getTime() - 3 * 3600e3); const dow = (l.getUTCDay() + 6) % 7; const m = new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() - dow)); return m.toISOString().slice(0, 10); };
const rotuloSlot = (dt) => { const l = new Date(dt.getTime() - 3 * 3600e3); return `${String(l.getUTCDate()).padStart(2, '0')}-${String(l.getUTCMonth() + 1).padStart(2, '0')}-${String(l.getUTCHours()).padStart(2, '0')}h`; };

// Função pura: ordena os aprovados pelo horário original e calcula os novos horários a partir do último da fila.
function planejar({ itens, aprovadosIds, feriados }) {
  const ultimoAnterior = itens.map((i) => i.slot).filter(Boolean).sort().at(-1);
  const aprovados = itens.filter((i) => aprovadosIds.includes(i.id)).sort((a, b) => String(a.slot).localeCompare(String(b.slot)));
  const horarios = proximosHorarios({ ultimoSlot: ultimoAnterior, tipos: aprovados.map((i) => i.tipo), feriados });
  const lista = aprovados.map((it, i) => ({ id: it.id, tipo: it.tipo, slug: it.slug, slotAnterior: it.slot, slotNovo: horarios[i] ? horarios[i].slot : null }));
  return { ultimoAnterior, aprovados: lista, novoUltimo: horarios.length ? horarios[horarios.length - 1].slot : ultimoAnterior };
}

// Textos do pacote manual: mesmos campos e formato que a fila gera (montarFila).
function escreverTextos(dir, it, meta) {
  const publicarEm = new Date(new Date(it.slot).getTime() - 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  fs.writeFileSync(path.join(dir, 'titulo.txt'), meta.titulo, 'utf8');
  fs.writeFileSync(path.join(dir, 'descricao.txt'), meta.descricao, 'utf8');
  fs.writeFileSync(path.join(dir, 'tags.txt'), meta.tags.join(', '), 'utf8');
  const tipo = it.tipo === 'short' ? 'Short (9:16)' : 'Vídeo longo (16:9)';
  const leia = 'Publicar em: ' + publicarEm + ' (Bahia)\n' + 'Playlist: ' + it.playlist + '\n' + 'Tipo: ' + tipo + '\n' + 'Texto no site: ' + L.SITE + '/artigo/' + it.slug + '\n' + 'Público: não é conteúdo para crianças. Legenda .srt: Studio > Legendas > Enviar arquivo (ou "Sincronizar automaticamente").\n';
  fs.writeFileSync(path.join(dir, 'LEIA-ME.txt'), leia, 'utf8');
}

module.exports = { planejar, escreverTextos, proximosHorarios, segundaDe, rotuloSlot };

if (require.main === module) {
  const aplicar = process.argv.includes('--aplicar');
  const fila = JSON.parse(fs.readFileSync(path.join(L.RAIZ, 'relatorios/youtube/fila.json'), 'utf8'));
  const checagem = JSON.parse(fs.readFileSync(path.join(L.RAIZ, '.tmp/conf/checagem-54.json'), 'utf8'));
  const aprovadosIds = checagem.filter((r) => r.passa).map((r) => r.id);
  const { FERIADOS } = require('../../backend/lib/calendarioSite');
  const plano = planejar({ itens: fila.itens, aprovadosIds, feriados: FERIADOS });
  console.log(JSON.stringify({ modo: aplicar ? 'APLICADO' : 'simulação', aprovados: plano.aprovados.length, ultimoAnterior: plano.ultimoAnterior, novoUltimo: plano.novoUltimo, voltamParaRegeracao: checagem.length - aprovadosIds.length }));
}
