/**
 * Checagem dos endpoints da API do YouTube (ordem de 01/11/2026).
 * Lista = os 7 endpoints declarados no formulário da auditoria enviado em 01/11/2026 12:12
 * (relatorios/youtube/auditoria-envio/RESPOSTAS.md). Qualquer outro endpoint reprova o portão.
 * Compromisso da Seção 7: endpoint novo ou mudança de uso exige aviso por escrito ao YouTube ANTES.
 *
 * Limite: a checagem lê o caminho do endpoint no código. Não distingue GET de POST em todos os casos.
 * Chamadas montadas em variáveis não são vistas (o portão não é prova completa).
 */

// Caminhos permitidos (prefixo depois de googleapis.com/). Cada um corresponde a um endpoint do formulário.
const PERMITIDOS = [
  { caminho: 'upload/youtube/v3/videos', endpoint: 'videos.insert' },                  // upload resumable
  { caminho: 'youtube/v3/videos?part=status', endpoint: 'videos.update' },            // agendamento (publishAt)
  { caminho: 'upload/youtube/v3/thumbnails/set', endpoint: 'thumbnails.set' },
  { caminho: 'upload/youtube/v3/captions', endpoint: 'captions.insert' },
  { caminho: 'youtube/v3/playlists', endpoint: 'playlists.list / playlists.insert' },
  { caminho: 'youtube/v3/playlistItems', endpoint: 'playlistItems.insert' },
];

const REGEX_ENDPOINT = /googleapis\.com\/((?:upload\/)?youtube\/v3\/[^\s'"`)\]}]*)/g;

// Função pura: devolve as violações de um texto (arquivo já lido).
function analisarTexto(texto, arquivo = '') {
  const violacoes = [];
  const linhas = String(texto || '').split(/\r?\n/);
  linhas.forEach((linha, i) => {
    for (const m of linha.matchAll(REGEX_ENDPOINT)) {
      const alvo = m[1];
      // Ignora o que vem depois de "?" nos casos sem part (ex.: videos?part=status). Mantém o trecho do formulário.
      const permitido = PERMITIDOS.some((p) => {
        if (p.caminho.includes('?')) return alvo.startsWith(p.caminho);
        const base = alvo.split('?')[0];
        return base === p.caminho || base.startsWith(p.caminho + '/');
      });
      // videos sem "part=status" (ex.: videos?part=snippet) não está na lista: só o insert (upload) e o update de status são permitidos.
      const videosSemStatus = /^youtube\/v3\/videos(\?|$)/.test(alvo) && !alvo.startsWith('youtube/v3/videos?part=status');
      if (!permitido || videosSemStatus) {
        violacoes.push({ arquivo, linha: i + 1, endpoint: 'googleapis.com/' + alvo.split('&')[0] });
      }
    }
  });
  return violacoes;
}

// Lista de endpoints usados no código (para o relatório do portão).
function endpointsUsados(texto) {
  const usados = new Set();
  for (const m of String(texto || '').matchAll(REGEX_ENDPOINT)) usados.add(m[1].split('&')[0]);
  return [...usados];
}

module.exports = { PERMITIDOS, analisarTexto, endpointsUsados };
