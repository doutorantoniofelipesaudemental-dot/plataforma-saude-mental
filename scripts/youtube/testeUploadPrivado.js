/**
 * Teste de upload do YouTube — SEMPRE como PRIVADO (só o dono do canal vê). Não muda a fila, não liga o freio.
 *   node --env-file=.env scripts/youtube/testeUploadPrivado.js              confere o vídeo e mostra o que enviaria (não envia)
 *   node --env-file=.env scripts/youtube/testeUploadPrivado.js --confirmar  envia 1 vídeo privado e mostra o link
 *   ... --id=<id da fila>   escolhe o item (padrão: o primeiro Short aprovado)
 * Faz as mesmas conferências do publicador (hash do vídeo, texto, metadados). O freio geral REDES_PUBLICACAO_ATIVA=false ainda bloqueia.
 */
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib');
const yt = require('../../backend/lib/youtube');
const { itemPublicavel, itemDemoAuditoria } = require('./itemPublicavel');

const confirmar = process.argv.includes('--confirmar');
const idArg = (process.argv.find((a) => a.startsWith('--id=')) || '').split('=')[1];

(async () => {
  const fila = JSON.parse(fs.readFileSync(path.join(L.REL, 'fila.json'), 'utf8')).itens;
  // Reprovado e imagem parada nunca são escolhidos. Com --id, só a demonstração da auditoria (ordem de 30/10/2026).
  const it = fila.find((i) => (idArg ? i.id === idArg && itemDemoAuditoria(i) : itemPublicavel(i) && i.tipo === 'short'));
  if (!it) throw new Error('nenhum item aprovado encontrado');
  const dir = path.join(L.RAIZ, it.pasta);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const arq = path.join(dir, meta.arquivos.video);
  const bloqueios = [];
  if (!fs.existsSync(arq) || L.sha256(arq) !== it.hashVideo) bloqueios.push('hash do vídeo difere do checado (ou arquivo ausente)');
  bloqueios.push(...L.checarTexto(meta), ...yt.validarMetadados({ titulo: meta.titulo, descricao: meta.descricao, tags: meta.tags }));
  console.log(`Item: ${it.id} (${it.tipo}) · título: ${meta.titulo} · ${(fs.statSync(arq).size / 1048576).toFixed(1)} MB`);
  if (bloqueios.length) throw new Error(`bloqueado: ${bloqueios.join(' | ')}`);
  if (!yt.credenciaisYoutube()) throw new Error('sem credenciais do YouTube no .env (siga relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md)');
  if (!confirmar) { console.log('Conferido. Nada enviado (use --confirmar para subir 1 vídeo PRIVADO).'); return; }
  const r = await yt.enviarVideo({ arquivo: arq, titulo: `[TESTE PRIVADO] ${meta.titulo}`.slice(0, 100), descricao: meta.descricao, tags: meta.tags, privacidade: 'private', short: it.tipo === 'short' });
  console.log(`ENVIADO como PRIVADO: ${r.link} (privacidade aplicada: ${r.privacidade})`);
  // registra como "teste": fora de relatórios e da fila (relatorios/youtube/videos-teste.json)
  const regArq = path.join(L.REL, 'videos-teste.json');
  const reg = fs.existsSync(regArq) ? JSON.parse(fs.readFileSync(regArq, 'utf8')) : { nota: 'Vídeos de TESTE (privados).', videos: [] };
  reg.videos.push({ id: r.id, tipo: 'teste', privacidade: r.privacidade, enviadoEm: new Date().toISOString().slice(0, 10), origem: it.id, link: r.link });
  fs.writeFileSync(regArq, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  fs.appendFileSync(path.join(L.REL, 'publicacao-log.md'), `- ${new Date().toISOString()} TESTE PRIVADO ${it.id} → ${r.link} (${r.privacidade})\n`);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
