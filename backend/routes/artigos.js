const express = require('express');
const Artigo = require('../models/Artigo');
const { exigirBanco, exigirAdmin, tratarErroValidacao, limitarTaxa } = require('../middleware');
const { slugify } = require('../lib/texto');
const { listarArtigos, listarCategorias, CAMPOS_LISTA } = require('../lib/listarArtigos');
const { dispararPublicacaoAutomatica } = require('../lib/socialPublisher');

/**
 * Dispara a esteira de publicação automática (Seção 20 do CLAUDE.md) quando
 * o status TRANSICIONA para 'aprovado' — nunca em re-saves que já estavam
 * aprovados/publicados, para não repetir o disparo a cada edição. Aguardado
 * (não fire-and-forget): funções serverless da Vercel podem ser encerradas
 * assim que a resposta HTTP é enviada, então "disparar em background" sem
 * aguardar arriscaria a publicação nunca completar. Efeito colateral aceito:
 * com AUTO_PUBLICAR_REDES=true, salvar um artigo como "aprovado" pode levar
 * alguns segundos a mais (até ~30s no pior caso, esperando o Instagram
 * processar o container) — com a variável desligada (padrão), o overhead é
 * desprezível (só checa a flag e loga).
 */
async function dispararSeTransicionouParaAprovado(statusAnterior, artigoSalvo) {
  if (!artigoSalvo || artigoSalvo.status !== 'aprovado' || statusAnterior === 'aprovado') return;
  await dispararPublicacaoAutomatica(artigoSalvo._id);
}

const router = express.Router();

/** GET /api/artigos/categorias — categorias disponíveis + contagem publicada. */
router.get('/categorias', exigirBanco, async (req, res) => {
  try {
    const categorias = await listarCategorias();
    res.json({ categorias });
  } catch (err) {
    console.error('[artigos] erro ao agregar categorias:', err);
    res.status(500).json({ erro: 'Não foi possível carregar as categorias.' });
  }
});

/**
 * GET /api/artigos
 * Query: categoria, busca, pagina, limite, destaque
 * Retorna apenas artigos publicados. Mesma lógica usada pelo SSR da
 * listagem do blog (ver backend/lib/renderizarBlog.js).
 */
router.get('/', exigirBanco, async (req, res) => {
  try {
    const { itens, paginacao } = await listarArtigos(req.query);
    res.json({ itens, paginacao });
  } catch (err) {
    console.error('[artigos] erro ao listar:', err);
    res.status(500).json({ erro: 'Não foi possível carregar os artigos.' });
  }
});

/**
 * GET /api/artigos/:slug
 * Detalhe do artigo + até 3 relacionados da mesma categoria.
 */
router.get('/:slug', exigirBanco, async (req, res) => {
  try {
    const artigo = await Artigo.findOneAndUpdate(
      { slug: req.params.slug, publicado: true },
      { $inc: { visualizacoes: 1 } },
      { new: true }
    ).lean();

    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

    const relacionados = await Artigo.find({
      _id: { $ne: artigo._id },
      categoria: artigo.categoria,
      publicado: true,
    })
      .select(CAMPOS_LISTA)
      .sort({ publicadoEm: -1 })
      .limit(3)
      .lean();

    res.json({ artigo, relacionados });
  } catch (err) {
    console.error('[artigos] erro ao buscar:', err);
    res.status(500).json({ erro: 'Não foi possível carregar o artigo.' });
  }
});

// Opções válidas por pergunta da enquete de engajamento — whitelist explícita
// para nunca usar `campo`/`valor` vindos do público direto num caminho de $inc.
const OPCOES_ENQUETE = {
  util: ['sim', 'nao'],
  perfil: ['gestorRh', 'profissionalSaude', 'usoPessoal'],
};

const limiteEnquete = limitarTaxa({ janelaMs: 60_000, maximo: 20 });

/**
 * POST /api/artigos/:slug/enquete
 * Incrementa um contador anônimo (sem IP/sessão salvos) da enquete de
 * engajamento no fim do artigo. Sem corpo de texto livre — só contagem.
 */
router.post('/:slug/enquete', limiteEnquete, exigirBanco, async (req, res) => {
  const { campo, valor } = req.body || {};
  const valoresValidos = OPCOES_ENQUETE[campo];
  if (!valoresValidos || !valoresValidos.includes(valor)) {
    return res.status(400).json({ erro: 'Campo ou valor da enquete inválido.' });
  }

  try {
    const resultado = await Artigo.updateOne(
      { slug: req.params.slug, publicado: true },
      { $inc: { [`enquete.${campo}.${valor}`]: 1 } },
      { timestamps: false } // voto não é edição de conteúdo — não deve mexer em atualizadoEm/dateModified
    );
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ erro: 'Artigo não encontrado.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[artigos] erro ao registrar enquete:', err);
    res.status(500).json({ erro: 'Não foi possível registrar sua resposta.' });
  }
});

const limiteSolicitarNarracao = limitarTaxa({ janelaMs: 60_000, maximo: 20 });

/**
 * POST /api/artigos/:slug/solicitar-narracao
 * Registra, de forma anônima, o interesse em narração para um artigo que
 * ainda não tem (o fallback do player só mostra o botão nesse caso — mas a
 * checagem aqui não depende disso, um clique em artigo que já ganhou áudio
 * nesse meio-tempo só some do contador de prioridade, sem gerar erro).
 */
router.post('/:slug/solicitar-narracao', limiteSolicitarNarracao, exigirBanco, async (req, res) => {
  try {
    const resultado = await Artigo.updateOne(
      { slug: req.params.slug, publicado: true },
      { $inc: { solicitacoesNarracao: 1 } },
      { timestamps: false }
    );
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ erro: 'Artigo não encontrado.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[artigos] erro ao registrar solicitação de narração:', err);
    res.status(500).json({ erro: 'Não foi possível registrar seu pedido.' });
  }
});

const limiteFerramentaUso = limitarTaxa({ janelaMs: 60_000, maximo: 30 });

/**
 * POST /api/artigos/:slug/ferramenta-uso
 * Conta anonimamente cada vez que a ferramenta interativa embutida no
 * artigo (calculadora, termômetro, escala) é usada — sem registrar
 * respostas, só a contagem, para saber quais ferramentas engajam mais.
 */
router.post('/:slug/ferramenta-uso', limiteFerramentaUso, exigirBanco, async (req, res) => {
  try {
    const resultado = await Artigo.updateOne(
      { slug: req.params.slug, publicado: true },
      { $inc: { usosFerramenta: 1 } },
      { timestamps: false }
    );
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ erro: 'Artigo não encontrado.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[artigos] erro ao registrar uso de ferramenta:', err);
    res.status(500).json({ erro: 'Não foi possível registrar o uso.' });
  }
});

/* ------------------------- rotas administrativas ------------------------- */

/** POST /api/artigos — cria artigo. */
router.post('/', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const dados = { ...req.body };
    if (dados.slug) dados.slug = slugify(dados.slug);
    const artigo = await Artigo.create(dados);

    // Criar já com status:'aprovado' também conta como transição (não havia
    // status anterior). Aguardado ANTES de responder — ver nota acima sobre
    // por que isso não pode ser fire-and-forget num runtime serverless.
    await dispararSeTransicionouParaAprovado(null, artigo);

    res.status(201).json({ ok: true, artigo });
  } catch (err) {
    if (tratarErroValidacao(err, res)) return;
    console.error('[artigos] erro ao criar:', err);
    res.status(500).json({ erro: 'Não foi possível criar o artigo.' });
  }
});

/** PUT /api/artigos/:slug — atualiza artigo. */
router.put('/:slug', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const dados = { ...req.body };
    if (dados.slug) dados.slug = slugify(dados.slug);

    const antes = await Artigo.findOne({ slug: req.params.slug }).select('status').lean();

    const artigo = await Artigo.findOneAndUpdate({ slug: req.params.slug }, dados, {
      new: true,
      runValidators: true,
    }).lean();

    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

    await dispararSeTransicionouParaAprovado(antes?.status, artigo);

    res.json({ ok: true, artigo });
  } catch (err) {
    if (tratarErroValidacao(err, res)) return;
    console.error('[artigos] erro ao atualizar:', err);
    res.status(500).json({ erro: 'Não foi possível atualizar o artigo.' });
  }
});

/** DELETE /api/artigos/:slug — remove artigo. */
router.delete('/:slug', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const artigo = await Artigo.findOneAndDelete({ slug: req.params.slug }).lean();
    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[artigos] erro ao remover:', err);
    res.status(500).json({ erro: 'Não foi possível remover o artigo.' });
  }
});

module.exports = router;
