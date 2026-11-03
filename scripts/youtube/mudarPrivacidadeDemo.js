/**
 * Teste de privacidade do YouTube (ordem do Dr. Antônio, 03/11/2026).
 * Muda SÓ o vídeo de demonstração, de "private" para "unlisted", e confere por videos.list.
 * Não liga nem desliga freio, não edita .env, não toca em outros vídeos e nunca publica ("public").
 *   node --env-file-if-exists=.env scripts/youtube/mudarPrivacidadeDemo.js                  confere o estado atual (não altera)
 *   node --env-file-if-exists=.env scripts/youtube/mudarPrivacidadeDemo.js --confirmar      muda Nf3dPwqjCOg de private para unlisted
 */
const fs = require('node:fs');
const path = require('node:path');
const yt = require('../../backend/lib/youtube');

const DEMO_ID = 'Nf3dPwqjCOg';
const DE = 'private';
const PARA = 'unlisted';
const LOG = path.resolve(__dirname, '..', '..', 'relatorios', 'youtube', 'privacidade-teste-log.md');

// Regra pura (testada em tests/unit/mudar-privacidade-demo.test.js): só este id, só private -> unlisted.
function podeMudar({ id, atual, destino }) {
  if (id !== DEMO_ID) return { ok: false, motivo: 'id diferente do vídeo de demonstração' };
  if (destino !== PARA) return { ok: false, motivo: `destino "${destino}" não permitido (só "${PARA}")` };
  if (atual !== DE) return { ok: false, motivo: `estado atual "${atual}", esperado "${DE}"` };
  return { ok: true };
}

async function lerStatus(token) {
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${DEMO_ID}`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`videos.list recusou (${r.status}): ${j.error?.message || ''}`);
  const item = (j.items || [])[0];
  if (!item) throw new Error('vídeo não encontrado com este id na conta autorizada');
  return item.status.privacyStatus;
}

if (require.main === module) (async () => {
  const confirmar = process.argv.includes('--confirmar');
  if (!yt.credenciaisYoutube()) throw new Error('sem credenciais do YouTube no ambiente (ver relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md)');
  const token = await yt.obterAccessToken();
  const atual = await lerStatus(token);
  console.log(`Vídeo ${DEMO_ID}: privacidade atual = ${atual}`);
  if (!confirmar) { console.log(`Nada alterado. Para mudar ${DE} -> ${PARA}, use --confirmar.`); return; }

  const regra = podeMudar({ id: DEMO_ID, atual, destino: PARA });
  if (!regra.ok) throw new Error(`bloqueado: ${regra.motivo}`);

  const r = await fetch('https://www.googleapis.com/youtube/v3/videos?part=status', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: DEMO_ID, status: { privacyStatus: PARA, selfDeclaredMadeForKids: false } }),
  });
  const corpo = await r.json().catch(() => ({}));
  const resposta = `HTTP ${r.status}; privacyStatus devolvido: ${corpo.status?.privacyStatus ?? 'n/d'}${corpo.error ? `; erro: ${corpo.error.message}` : ''}`;
  console.log(resposta);

  const depois = await lerStatus(token);
  const linha = `- ${new Date().toISOString()} vídeo ${DEMO_ID}: ${atual} -> ${PARA} | resposta: ${resposta} | videos.list após a mudança: ${depois}`;
  fs.appendFileSync(LOG, linha + '\n', 'utf8');
  console.log(linha);
  if (depois !== PARA) throw new Error(`a mudança NÃO ficou: estado após a tentativa = ${depois}`);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });

module.exports = { podeMudar, DEMO_ID, DE, PARA };
