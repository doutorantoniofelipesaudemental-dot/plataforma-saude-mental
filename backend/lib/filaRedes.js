/**
 * Fila diária de publicação nas redes (Seção 20-ter do CLAUDE.md).
 *
 * Em vez de postar todos os artigos aprovados de uma vez — o que estouraria o
 * limite diário da API do Instagram e inundaria o feed —, um Vercel Cron chama
 * `publicarProximoDaFila()` em horários fixos e cada chamada publica no máximo
 * UM artigo, o de maior engajamento entre os aprovados. Duas travas valem para
 * qualquer publicação registrada em `publicadoRedesEm` (cron, CLI ou /admin):
 *
 *   - teto de REDES_POSTS_POR_DIA posts nas últimas 24h (padrão 2);
 *   - intervalo mínimo de REDES_INTERVALO_MIN_HORAS desde o último (padrão 4).
 *
 * Assim, uma execução duplicada do cron ou um disparo manual no mesmo dia não
 * vira post extra. Os scripts Python legados (Regra 20) NÃO passam por aqui —
 * não rodá-los enquanto a fila estiver ativa.
 */
const Artigo = require('../models/Artigo');
const { publicarArtigoNasRedes, ErroPublicacao } = require('./socialPublisher');
const { estadoPausa } = require('./tokenInstagram');

const HORA_MS = 60 * 60 * 1000;
// Artigo barrado (pré-condição técnica ou tripla checagem editorial — ver
// checagemRedes.js) não trava a fila: a execução registra o motivo em
// RegistroPublicacao e tenta o próximo, até este limite.
const MAX_CANDIDATOS_POR_EXECUCAO = 10;
// Uma interação real (voto na enquete, uso da ferramenta, pedido de narração)
// vale mais que uma visualização. Hoje só `visualizacoes` tem dados, então é
// ela que decide a ordem na prática.
const PESO_INTERACAO = 10;

function configuracao() {
  const numero = (valor, padrao) => {
    const n = Number(valor);
    return Number.isFinite(n) && n > 0 ? n : padrao;
  };
  return {
    postsPorDia: numero(process.env.REDES_POSTS_POR_DIA, 2),
    intervaloMinHoras: numero(process.env.REDES_INTERVALO_MIN_HORAS, 4),
  };
}

/** Redes com credencial configurada — sem token do LinkedIn, nem tenta. */
function redesConfiguradas() {
  const redes = [];
  if (process.env.INSTAGRAM_ACCOUNT_ID && process.env.INSTAGRAM_ACCESS_TOKEN) redes.push('instagram');
  if (process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN) redes.push('linkedin');
  return redes;
}

/** Artigos aprovados e ainda não postados, do maior engajamento para o menor. */
async function listarFila(limite = 10) {
  const soma = (...campos) => ({ $add: campos.map((c) => ({ $ifNull: [`$${c}`, 0] })) });
  return Artigo.aggregate([
    { $match: { status: 'aprovado', publicado: true } },
    {
      $addFields: {
        engajamento: {
          $add: [
            { $ifNull: ['$visualizacoes', 0] },
            {
              $multiply: [
                PESO_INTERACAO,
                soma(
                  'enquete.util.sim', 'enquete.util.nao',
                  'enquete.perfil.gestorRh', 'enquete.perfil.profissionalSaude', 'enquete.perfil.usoPessoal',
                  'usosFerramenta', 'solicitacoesNarracao'
                ),
              ],
            },
          ],
        },
      },
    },
    { $sort: { engajamento: -1, publicadoEm: -1 } },
    { $limit: limite },
    { $project: { _id: 1, slug: 1, titulo: 1, engajamento: 1, visualizacoes: 1 } },
  ]);
}

/** Motivo para NÃO publicar agora, ou null se as travas permitem. */
async function motivoParaAguardar(agora = new Date()) {
  const { postsPorDia, intervaloMinHoras } = configuracao();

  const ultimas24h = await Artigo.countDocuments({ publicadoRedesEm: { $gte: new Date(agora - 24 * HORA_MS) } });
  if (ultimas24h >= postsPorDia) {
    return `teto diário atingido (${ultimas24h}/${postsPorDia} nas últimas 24h)`;
  }

  const ultimo = await Artigo.findOne({ publicadoRedesEm: { $ne: null } })
    .sort({ publicadoRedesEm: -1 })
    .select('publicadoRedesEm slug')
    .lean();
  if (ultimo) {
    const horas = (agora - ultimo.publicadoRedesEm) / HORA_MS;
    if (horas < intervaloMinHoras) {
      return `intervalo mínimo não cumprido (último post há ${horas.toFixed(1)}h, mínimo ${intervaloMinHoras}h)`;
    }
  }
  return null;
}

/**
 * Publica no máximo um artigo e devolve o que aconteceu, para o log do cron
 * ser legível em `vercel logs`. Só erros inesperados (banco fora, bug) sobem.
 */
async function publicarProximoDaFila({ simular = false } = {}) {
  const redes = redesConfiguradas();
  if (!redes.length) {
    return { publicado: false, motivo: 'nenhuma rede com credencial configurada' };
  }

  // Token recusado pela Meta: não tenta de novo com ele (pausa sai sozinha
  // quando um token novo é configurado — ver tokenInstagram.estadoPausa).
  const pausa = await estadoPausa();
  if (pausa) return { publicado: false, motivo: `pausada por token inválido: ${pausa.motivo}`, pausa };

  const aguardar = await motivoParaAguardar();
  if (aguardar) return { publicado: false, motivo: aguardar };

  const candidatos = await listarFila(MAX_CANDIDATOS_POR_EXECUCAO);
  if (!candidatos.length) return { publicado: false, motivo: 'fila vazia' };

  if (simular) {
    return { publicado: false, simulado: true, redes, proximo: candidatos[0] };
  }

  const pulados = [];
  for (const candidato of candidatos) {
    try {
      const resultado = await publicarArtigoNasRedes(String(candidato._id), { redes, confirmar: true, origem: 'cron' });
      if (resultado.executado) {
        return { publicado: true, artigo: candidato.slug, engajamento: candidato.engajamento, resultados: resultado.resultados, erros: resultado.erros, pulados };
      }
      // Todas as redes falharam (token expirado, API fora): o problema não é o
      // artigo — parar aqui em vez de queimar a fila tentando os próximos.
      return { publicado: false, motivo: 'todas as redes falharam', artigo: candidato.slug, erros: resultado.erros, pulados };
    } catch (err) {
      if (!(err instanceof ErroPublicacao)) throw err;
      // Pré-condição técnica ou tripla checagem barrou ESTE artigo: tenta o próximo.
      pulados.push({ artigo: candidato.slug, codigo: err.codigo, motivo: err.message });
    }
  }
  return { publicado: false, motivo: 'todos os candidatos barrados nas checagens', pulados };
}

module.exports = { publicarProximoDaFila, listarFila, motivoParaAguardar, redesConfiguradas, configuracao };
