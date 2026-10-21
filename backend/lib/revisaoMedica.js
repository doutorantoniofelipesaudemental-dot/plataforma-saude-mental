/**
 * Revisão médica e selo (ordem de 21/10/2026). Funções puras: não gravam nada.
 * Regra: só `aprovar()` grava "aprovada", e só com o hash do texto aprovado. Se o texto muda, a aprovação cai.
 * Sem aprovação registrada, o site mostra o aviso honesto (nunca "Revisado por").
 */
const crypto = require('node:crypto');

const STATUS = Object.freeze({ PENDENTE: 'pendente', APROVADA: 'aprovada', REPROVADA: 'reprovada' });

// Normaliza fim de linha e espaços das bordas: o hash não muda por causa de CRLF.
function hashConteudo(texto) {
  const normal = String(texto || '').replace(/\r\n/g, '\n').trim();
  return crypto.createHash('sha256').update(normal, 'utf8').digest('hex');
}

function formatarData(data) {
  const d = data instanceof Date ? data : new Date(data);
  const p = (n) => String(n).padStart(2, '0');
  // Data de Salvador (UTC-3), para o aviso mostrar o dia que o Dr. Antônio vê.
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return `${p(local.getUTCDate())}/${p(local.getUTCMonth() + 1)}/${local.getUTCFullYear()}`;
}

// Texto do aviso enquanto não há aprovação. Não diz "revisado".
function avisoPendente({ atualizadoEm }) {
  return `Conteúdo educativo produzido com apoio de inteligência artificial e checagem automatizada de referências, sob responsabilidade do Dr. Antônio Felipe Garabito. Revisão médica individual: pendente. Atualizado em ${formatarData(atualizadoEm)}.`;
}

// Função pura: a aprovação só vale se o hash do texto atual é o mesmo que foi aprovado.
function estadoRevisao({ registro, hashAtual }) {
  if (!registro || registro.status !== STATUS.APROVADA) return { status: STATUS.PENDENTE, valido: false };
  if (!hashAtual || registro.hash !== hashAtual) return { status: STATUS.PENDENTE, valido: false, motivo: 'texto mudou depois da aprovação' };
  return { status: STATUS.APROVADA, valido: true };
}

// Selo só com aprovação válida. Sem ela, devolve null (e o aviso pendente é mostrado).
function selo({ registro, hashAtual }) {
  const e = estadoRevisao({ registro, hashAtual });
  if (!e.valido) return null;
  return `Revisado pelo Dr. Antônio Felipe Garabito em ${formatarData(registro.aprovadoEm)}`;
}

// Transição: aprovar exige o hash do texto que está sendo aprovado.
function aprovar({ slug, hash, revisor, data }) {
  if (!slug || !hash) throw new Error('aprovar exige slug e hash do texto');
  if (!revisor) throw new Error('aprovar exige quem aprovou');
  return { slug, status: STATUS.APROVADA, hash, revisor, aprovadoEm: new Date(data).toISOString() };
}

// Transição: reprovar nunca grava "aprovada". Exige motivo.
function reprovar({ slug, motivo, data }) {
  if (!slug || !motivo) throw new Error('reprovar exige slug e motivo');
  return { slug, status: STATUS.REPROVADA, motivo, reprovadoEm: new Date(data).toISOString() };
}

module.exports = { STATUS, hashConteudo, formatarData, avisoPendente, estadoRevisao, selo, aprovar, reprovar };
