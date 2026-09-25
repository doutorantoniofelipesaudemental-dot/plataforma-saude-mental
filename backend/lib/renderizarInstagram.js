/**
 * Página do link da bio (/instagram): os artigos dos posts mais recentes da
 * fila, do mais novo para o mais antigo. Atualiza sozinha — cada post que a
 * fila publica grava `publicadoRedesEm`, e a página lista por esse campo.
 * Mesmo padrão do /blog: shell estático (public/instagram.html) com o bloco
 * da lista substituído no servidor; se o bloco não bater, serve o shell.
 */
const fs = require('fs');
const path = require('path');
const Artigo = require('../models/Artigo');
const { montarCartaoArtigo } = require('./renderizarBlog');

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'public', 'instagram.html');
const LIMITE = 12;

const BLOCO_LISTA = `<div class="grade grade--3" id="lista-instagram">
        <div class="estado-vazio"><h3>Os posts estão carregando</h3><p>Se a lista não aparecer, <a href="/blog">veja todos os artigos no blog</a>.</p></div>
      </div>`;

let templateCache = null;
function lerTemplate() {
  if (!templateCache || process.env.NODE_ENV !== 'production') {
    templateCache = fs.readFileSync(TEMPLATE_PATH, 'utf8').replace(/\r\n/g, '\n');
  }
  return templateCache;
}

async function listarPostsRecentes(limite = LIMITE) {
  return Artigo.find({ publicado: true, publicadoRedesEm: { $ne: null } })
    .sort({ publicadoRedesEm: -1 })
    .limit(limite)
    .select('titulo slug resumo categoria imagemCapa tempoLeitura publicadoEm publicadoRedesEm')
    .lean();
}

function renderizarInstagramHtml(artigos) {
  const html = lerTemplate();
  if (!html.includes(BLOCO_LISTA)) {
    console.warn('[renderizarInstagram] template mudou — servindo o shell.');
    return html;
  }
  const lista = artigos.length
    ? artigos.map(montarCartaoArtigo).join('')
    : '<div class="estado-vazio"><h3>Nenhum post por aqui ainda</h3><p><a href="/blog">Veja todos os artigos no blog</a>.</p></div>';
  return html.replace(BLOCO_LISTA, `<div class="grade grade--3" id="lista-instagram" data-ssr="1">${lista}</div>`);
}

module.exports = { listarPostsRecentes, renderizarInstagramHtml };
