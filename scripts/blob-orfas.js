/**
 * Órfãs do Blob (narrações dos grupos c e d; nunca a/b). Dry-run por padrão.
 *   npm run blob:orfas                 lista os arquivos c/d (grupo, caminho, tamanho); não apaga nada (GET)
 *   npm run blob:orfas -- --aplicar    apaga SÓ c/d (DELETE ?aplicar=1); recusa se houver mais de 20 arquivos ou se c+d passar de 50% (trava do servidor)
 * Usa ADMIN_TOKEN do .env (nunca imprime). Base: NARRACAO_API_BASE ou https://drsaudemental.vercel.app.
 */
const BASE = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';
const MAX = 20;
const aplicar = process.argv.includes('--aplicar');
const H = { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` };
const mb = (b) => (b / 1048576).toFixed(2);

(async () => {
  if (!process.env.ADMIN_TOKEN) throw new Error('ADMIN_TOKEN ausente no .env');
  const j = await fetch(`${BASE}/api/admin/blob-narracoes?completo=1`, { headers: H }).then((r) => r.json());
  if (!j.grupos) throw new Error(`resposta inesperada: ${JSON.stringify(j).slice(0, 120)}`);
  const lista = ['c', 'd'].flatMap((g) => ((j.listas || {})[g] || []).map((x) => ({ g: g.toUpperCase(), ...x })));
  console.log(`Blob: ${j.blobs} arquivos, ${j.totalMB} MB · narrações ${j.narracoes} (a ${j.grupos.a.arquivos} · b ${j.grupos.b.arquivos} · c ${j.grupos.c.arquivos} · d ${j.grupos.d.arquivos})`);
  console.log(`Apagáveis (c+d): ${j.apagaveis.arquivos} arquivos, ${j.apagaveis.MB} MB, ${j.apagaveis.percentualDasNarracoes}% das narrações\n`);
  for (const x of lista) console.log(`grupo ${x.g} · ${x.pathname} · ${mb(x.size)} MB · enviado em ${x.uploadedAt}`);
  if (!aplicar) return console.log('\nDRY-RUN: nada foi apagado. Para apagar só estes: npm run blob:orfas -- --aplicar');
  if (lista.length > MAX) throw new Error(`${lista.length} arquivos c/d (> ${MAX}): não apago; rever com o Dr. Antônio`);
  if (!lista.length) return console.log('\nNada a apagar.');
  const r = await fetch(`${BASE}/api/admin/blob-narracoes?aplicar=1`, { method: 'DELETE', headers: H }).then((x) => x.json());
  console.log(`\nAPLICADO: apagadas ${r.apagadas}${r.recusado ? ` · RECUSADO: ${r.recusado}` : ''} · Blob agora ${r.totalMB} MB`);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
