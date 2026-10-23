import { createHash } from 'node:crypto';
import narracoes from '@/src/content/narracoes.json';

/**
 * URL do áudio do texto, ou '' (sem narração, narração marcada para renarrar ou MDX alterado depois da narração).
 * O manifesto guarda o hash do MDX narrado (scripts/narrar-app.js): se o arquivo mudar, o áudio para de tocar.
 */
export function narracaoDoTexto(slug, mdx) {
  const entrada = narracoes[slug];
  if (!entrada || entrada.renarrar || !entrada.url) return '';
  const fonteAtual = createHash('sha256').update(mdx).digest('hex');
  return entrada.fonteHash === fonteAtual ? entrada.url : '';
}
