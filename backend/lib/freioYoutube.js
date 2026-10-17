/**
 * Freio do YouTube (17/10/2026): ao contrário do Instagram (ligado, salvo "false"), este nasce DESLIGADO: só YOUTUBE_PUBLICACAO_ATIVA=true
 * liga a publicação. Ausente, vazio ou qualquer outro valor = nada é publicado. O freio geral REDES_PUBLICACAO_ATIVA=false também bloqueia.
 * O publicador roda no computador do consultório (Agendador do Windows) e lê o .env local; o endpoint /api/admin/freio-youtube mostra o valor
 * da variável na Vercel (mantenha os dois iguais).
 */
const { redesAtivas } = require('./freioRedes');

const youtubeLigado = (env = process.env) => String(env.YOUTUBE_PUBLICACAO_ATIVA ?? '').trim().toLowerCase() === 'true';
const youtubeAtivo = (env = process.env) => youtubeLigado(env) && redesAtivas(env);

module.exports = { youtubeLigado, youtubeAtivo };
