/**
 * Uso do Vercel Blob (ordem de 23/10/2026): alerta na conferência diária quando passar de 80% do plano.
 * Plano PRO: 5 GB (5120 MB). Função pura para o cálculo; a leitura usa o mesmo endpoint de blob:orfas (ADMIN_TOKEN, só leitura).
 */
const LIMITE_MB_PRO = 5 * 1024;
const LIMIAR = 0.8;

function avaliarUsoBlob({ totalMB, limiteMB = LIMITE_MB_PRO, limiar = LIMIAR }) {
  const percentual = Math.round((totalMB / limiteMB) * 1000) / 10;
  const alerta = totalMB / limiteMB > limiar;
  const texto = `Blob em ${percentual}% do plano (${totalMB} MB de ${limiteMB} MB)`;
  return { percentual, alerta, texto: alerta ? `${texto}: acima de ${limiar * 100}%, confira antes de novos uploads` : texto };
}

async function lerTotalMBBlob({ base, token, fetchFn = fetch }) {
  const j = await fetchFn(`${base}/api/admin/blob-narracoes?completo=1`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
  if (typeof j.totalMB !== 'number') throw new Error(`resposta sem totalMB: ${JSON.stringify(j).slice(0, 80)}`);
  return j.totalMB;
}

module.exports = { avaliarUsoBlob, lerTotalMBBlob, LIMITE_MB_PRO, LIMIAR };
