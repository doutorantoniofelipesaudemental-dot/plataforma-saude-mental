/**
 * Teto de chamadas do `claude -p` (ordem do Dr. Antônio, 19/10/2026). Número de partida: 3 por dia e 15 por semana (seg a dom).
 * Relógio de Salvador (UTC-3). Regras: consulta ANTES de chamar e registra DEPOIS. Teto atingido = não chama (e avisa no ESTADO-GERAL).
 * Contador ilegível = não chama e não sobrescreve (falha segura). Sem trabalho na fila = nenhuma chamada (quem chama decide).
 * Arquivos: relatorios/consumo-claude.json (fonte) e relatorios/CONSUMO.md (resumo para comparar com o /usage).
 *   node scripts/consumoClaude.js     mostra o consumo de hoje e da semana
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const ARQUIVOS_PADRAO = {
  json: path.join(RAIZ, 'relatorios/consumo-claude.json'),
  md: path.join(RAIZ, 'relatorios/CONSUMO.md'),
  estado: path.join(RAIZ, 'relatorios/ESTADO-GERAL.md'),
};
const TETO = { dia: 3, semana: 15 };
const ORIGEM_LINKEDIN = 'agendarDiario-lote'; // origem da chamada diária do LinkedIn
const RESERVA_LINKEDIN = 1; // quantas chamadas do dia ficam reservadas ao LinkedIn
const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Função pura: dia no relógio de Salvador (UTC-3, sem horário de verão).
const diaSalvador = (agora) => new Date(agora.getTime() - 3 * 3600e3).toISOString().slice(0, 10);

// Função pura: segunda-feira da semana (seg a dom) que contém o dia.
function segundaDaSemana(dia) {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// Função pura: interpreta o texto do contador. Ilegível ou fora do formato = { ok: false } (não chama).
function interpretar(texto) {
  let obj;
  try { obj = JSON.parse(texto); } catch { return { ok: false, motivo: 'JSON inválido' }; }
  if (!obj || !Array.isArray(obj.chamadas)) return { ok: false, motivo: 'estrutura inesperada' };
  const invalido = obj.chamadas.some((r) => !r || Number.isNaN(Date.parse(r.quando)) || !DATA.test(r.dia) || !DATA.test(r.semana));
  if (invalido) return { ok: false, motivo: 'registro inválido' };
  return { ok: true, registros: obj.chamadas };
}

// Função pura: uso de hoje e da semana e se ainda pode chamar. Teto diário vale antes do semanal.
function avaliar(registros, agora = new Date(), teto = TETO, origem = '') {
  const dia = diaSalvador(agora);
  const semana = segundaDaSemana(dia);
  const uso = {
    dia: registros.filter((r) => r.dia === dia).length,
    semana: registros.filter((r) => r.semana === semana).length,
  };
  // uma chamada do dia fica reservada ao LinkedIn (ordem de 20/10/2026): as outras rotinas param uma antes do teto
  const reserva = origem === ORIGEM_LINKEDIN ? 0 : RESERVA_LINKEDIN;
  const motivo = uso.dia >= teto.dia - reserva
    ? (reserva && uso.dia < teto.dia ? 'última chamada do dia reservada ao LinkedIn' : 'teto diário')
    : uso.semana >= teto.semana ? 'teto semanal' : '';
  return { pode: !motivo, motivo, uso, dia, semana };
}

// Função pura: resumo em Markdown (curto) para comparar com o /usage.
function resumo(registros, agora = new Date()) {
  const a = avaliar(registros, agora);
  const porChave = (campo) => registros.reduce((m, r) => ({ ...m, [r[campo]]: (m[r[campo]] || 0) + 1 }), {});
  const linhas = (mapa, n) => Object.entries(mapa)
    .sort(([x], [y]) => (x < y ? 1 : -1))
    .slice(0, n)
    .map(([k, v]) => `| ${k} | ${v} |`);
  return [
    '# Consumo do claude -p (teto de partida)', '',
    `Atualizado: ${agora.toISOString()} · Hoje (Salvador): ${a.dia} · Semana (seg): ${a.semana}`, '',
    `**Hoje: ${a.uso.dia}/${TETO.dia} · Semana: ${a.uso.semana}/${TETO.semana}**`, '',
    'Número de partida (19/10/2026): depois de uma semana, compare com o /usage e ajuste TETO em scripts/consumoClaude.js.', '',
    '| Dia | Chamadas |', '|---|---|', ...linhas(porChave('dia'), 14), '',
    '| Semana (seg) | Chamadas |', '|---|---|', ...linhas(porChave('semana'), 8), '',
  ].join('\n');
}

function lerContador(arquivos = ARQUIVOS_PADRAO) {
  if (!fs.existsSync(arquivos.json)) return { ok: true, registros: [] };
  try { return interpretar(fs.readFileSync(arquivos.json, 'utf8')); } catch (e) { return { ok: false, motivo: `não lido (${e.code || e.message})` }; }
}

// Consulta ANTES de chamar o claude -p. Contador ilegível = não chama (falha segura).
function podeChamarClaude({ agora = new Date(), arquivos = ARQUIVOS_PADRAO, origem = '' } = {}) {
  const lido = lerContador(arquivos);
  if (!lido.ok) return { pode: false, motivo: `contador ilegível (${lido.motivo}); não chama por segurança` };
  return avaliar(lido.registros, agora, TETO, origem);
}

// Registra DEPOIS da chamada. Não sobrescreve contador ilegível. Simular não grava nada.
function registrarChamada({ agora = new Date(), origem = 'desconhecida', simular = false, arquivos = ARQUIVOS_PADRAO } = {}) {
  if (simular) return { gravado: false, simulado: true };
  const lido = lerContador(arquivos);
  if (!lido.ok) return { gravado: false, motivo: `contador ilegível (${lido.motivo}); não sobrescrito` };
  const dia = diaSalvador(agora);
  const registros = [...lido.registros, { quando: agora.toISOString(), dia, semana: segundaDaSemana(dia), origem }];
  try {
    fs.mkdirSync(path.dirname(arquivos.json), { recursive: true });
    fs.writeFileSync(arquivos.json, `${JSON.stringify({ versao: 1, chamadas: registros }, null, 1)}\n`, 'utf8');
    fs.writeFileSync(arquivos.md, resumo(registros, agora), 'utf8');
  } catch (e) {
    return { gravado: false, motivo: `gravação falhou (${e.message})` };
  }
  return { gravado: true };
}

// Alerta no topo do ESTADO-GERAL.md (um bloco só; outro aviso substitui o anterior).
function avisarTeto(motivo, agora = new Date(), arquivos = ARQUIVOS_PADRAO) {
  if (!fs.existsSync(arquivos.estado)) return false;
  const bloco = `<!-- ALERTA-CLAUDE-P:INICIO -->\n> # 🚨 TETO DO claude -p ATINGIDO (${diaSalvador(agora)}): ${motivo}. Chamadas do agendador do LinkedIn paradas até o próximo período. Ver relatorios/CONSUMO.md.\n<!-- ALERTA-CLAUDE-P:FIM -->\n`;
  const texto = fs.readFileSync(arquivos.estado, 'utf8');
  const re = /<!-- ALERTA-CLAUDE-P:INICIO -->[\s\S]*?<!-- ALERTA-CLAUDE-P:FIM -->\n?/;
  const novo = re.test(texto) ? texto.replace(re, bloco) : texto.replace(/\n/, `\n${bloco}`);
  fs.writeFileSync(arquivos.estado, novo, 'utf8');
  return true;
}

module.exports = { TETO, ORIGEM_LINKEDIN, RESERVA_LINKEDIN, ARQUIVOS_PADRAO, diaSalvador, segundaDaSemana, interpretar, avaliar, resumo, podeChamarClaude, registrarChamada, avisarTeto };

if (require.main === module) {
  const lido = lerContador();
  if (!lido.ok) console.log(`contador ilegível: ${lido.motivo}`);
  else {
    const a = avaliar(lido.registros);
    console.log(`hoje ${a.uso.dia}/${TETO.dia} · semana ${a.uso.semana}/${TETO.semana} · ${a.pode ? 'pode chamar' : `não chama: ${a.motivo}`}`);
  }
}
