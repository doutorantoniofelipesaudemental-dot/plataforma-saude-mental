/**
 * Trava contra agendamento duplicado do LinkedIn (ordem de 20/10/2026). Conta no BANCO (coleção linkedin_fila), não no arquivo de estado.
 * Antes de cada chamada ao agente: conta os itens abertos (aprovado-checagem / manual) e os agendados (agendado-linkedin).
 * Depois da chamada: só segue se exatamente UM item saiu de aberto e entrou em agendado. Qualquer outra coisa = parar.
 */
const ABERTOS = ['aprovado-checagem', 'manual'];
const AGENDADO = 'agendado-linkedin';

// Função pura: a partir da lista de status de todos os itens, devolve as duas contagens.
function contagens(statusDosItens) {
  return {
    abertos: statusDosItens.filter((s) => ABERTOS.includes(s)).length,
    agendados: statusDosItens.filter((s) => s === AGENDADO).length,
  };
}

// Função pura: confirma que a chamada agendou exatamente 1 item (e nenhum outro mudou).
function confirmarUmAgendado(antes, depois) {
  return depois.agendados === antes.agendados + 1 && depois.abertos === antes.abertos - 1;
}

// Lê o banco. Se não conseguir ler, lança erro: quem chama deve parar (sem ler, não agenda).
async function lerContagens(mongoose) {
  const docs = await mongoose.connection.db.collection('linkedin_fila').find({}, { projection: { status: 1 } }).toArray();
  return contagens(docs.map((d) => d.status));
}

module.exports = { ABERTOS, AGENDADO, contagens, confirmarUmAgendado, lerContagens };
