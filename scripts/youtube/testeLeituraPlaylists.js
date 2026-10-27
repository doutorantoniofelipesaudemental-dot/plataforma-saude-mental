/**
 * Teste SÓ DE LEITURA da autorização nova (escopo youtube.force-ssl): lista as playlists do canal.
 *   npm run youtube:teste-playlists
 * Não grava nada no YouTube e não imprime tokens nem segredos. Faz uma troca de token e um GET em playlists.list.
 * Saída final: "STATUS: OK" ou "STATUS: FALHOU <motivo curto>" (código de saída 0 ou 1).
 */
const { obterAccessToken, credenciaisYoutube, ErroYoutube } = require('../../backend/lib/youtube');

const LIMITE_MOTIVO = 200;
const LIMITE_LISTA = 20;

// Função pura: URL de leitura (mine=true, sem escrita).
function urlPlaylists() {
  const params = new URLSearchParams({ part: 'snippet', mine: 'true', maxResults: '50' });
  return `https://www.googleapis.com/youtube/v3/playlists?${params}`;
}

// Função pura: resumo dos itens da resposta (só títulos, sem IDs internos).
function resumirPlaylists(itens) {
  const titulos = (itens || []).map((i) => (i && i.snippet && i.snippet.title) || '(sem título)');
  return { total: titulos.length, titulos: titulos.slice(0, LIMITE_LISTA) };
}

// Função pura: motivo curto de erro da API, sem corpo bruto (evita eco de dados sensíveis).
function interpretarErroApi(status, corpo) {
  const erro = (corpo && corpo.error) || {};
  const razao = (erro.errors && erro.errors[0] && erro.errors[0].reason) || erro.status || `HTTP ${status}`;
  const mensagem = String(erro.message || '').slice(0, LIMITE_MOTIVO);
  return mensagem ? `${razao}: ${mensagem}` : String(razao);
}

async function main() {
  if (!credenciaisYoutube()) {
    console.log('STATUS: FALHOU faltam YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET ou YOUTUBE_REFRESH_TOKEN no .env');
    return 1;
  }
  let token;
  try {
    token = await obterAccessToken();
  } catch (e) {
    const motivo = e instanceof ErroYoutube ? e.message : 'falha ao obter o token';
    console.log(`STATUS: FALHOU ${motivo}`);
    return 1;
  }
  const r = await fetch(urlPlaylists(), { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.log(`STATUS: FALHOU playlists.list recusado (${interpretarErroApi(r.status, corpo)})`);
    return 1;
  }
  const resumo = resumirPlaylists(corpo.items);
  console.log(`OK: a autorização lê as playlists do canal (${resumo.total} playlist(s) encontrada(s)). Nada foi gravado.`);
  resumo.titulos.forEach((t) => console.log(`  - ${t}`));
  console.log('STATUS: OK');
  return 0;
}

module.exports = { urlPlaylists, resumirPlaylists, interpretarErroApi };

if (require.main === module) {
  main().then((codigo) => process.exit(codigo)).catch((e) => {
    console.log(`STATUS: FALHOU ${String(e.message || e).slice(0, LIMITE_MOTIVO)}`);
    process.exit(1);
  });
}
