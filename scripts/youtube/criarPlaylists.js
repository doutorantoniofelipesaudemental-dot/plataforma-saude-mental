/**
 * Cria no canal as 10 playlists por tema (idempotente) e grava relatorios/youtube/playlists.json {nome: id}.
 * Precisa de OAuth com o escopo "youtube" (npm run youtube:autorizar, versão de 15/10/2026). Respeita os freios.
 *   node --env-file=.env scripts/youtube/criarPlaylists.js [--simular]
 */
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib');
const yt = require('../../backend/lib/youtube');
const { exigirRedesAtivas } = require('../../backend/lib/freioRedes');

const DESCR = {
  'Ansiedade': 'Textos e vídeos sobre ansiedade, em linguagem simples.',
  'Depressão': 'Depressão, luto e transtornos do humor: sinais, cuidado e quando procurar ajuda.',
  'Saúde Mental na APS': 'Saúde mental na Atenção Primária à Saúde: condutas gerais, vínculo e rede de cuidado.',
  'Urgências': 'Crise, urgência e emergência em saúde mental. Em crise: CVV 188 · SAMU 192.',
  'Trabalho e NR-1': 'Saúde mental no trabalho, riscos psicossociais e NR-1.',
  'Cuidados Paliativos': 'Cuidados paliativos, luto e apoio a pacientes, famílias e equipes.',
  'Violência': 'Violência e saúde mental: reconhecer, acolher e buscar a rede de proteção.',
  'Migração': 'Migração, refúgio e saúde mental.',
  'Corpo e Saúde Mental': 'Imagem corporal, alimentação, peso e saúde mental.',
  'Relatos da Prática': 'Narrativas compostas, inspiradas em padrões observados na prática clínica; nenhum personagem corresponde a uma pessoa real.',
};
(async () => {
  exigirRedesAtivas('criação de playlists');
  if (process.argv.includes('--simular')) return console.log(L.PLAYLISTS.map((p) => `criaria: ${p}`).join('\n'));
  const token = await yt.obterAccessToken();
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const arq = path.join(L.REL, 'playlists.json');
  const mapa = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : {};
  const ex = await (await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50', { headers: h })).json();
  if (ex.error) throw new Error(`YouTube: ${ex.error.message} (reautorize com o escopo novo: npm run youtube:autorizar)`);
  for (const i of ex.items || []) if (L.PLAYLISTS.includes(i.snippet.title)) mapa[i.snippet.title] = i.id;
  for (const nome of L.PLAYLISTS) {
    if (mapa[nome]) continue;
    const r = await (await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', { method: 'POST', headers: h, body: JSON.stringify({ snippet: { title: nome, description: DESCR[nome], defaultLanguage: 'pt-BR' }, status: { privacyStatus: 'public' } }) })).json();
    if (r.error) throw new Error(`YouTube: ${r.error.message}`);
    mapa[nome] = r.id; console.log('criada:', nome);
  }
  fs.writeFileSync(arq, JSON.stringify(mapa, null, 1), 'utf8');
  console.log('playlists.json gravado:', Object.keys(mapa).length);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
