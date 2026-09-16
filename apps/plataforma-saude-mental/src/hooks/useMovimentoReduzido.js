'use client';

import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

/**
 * Le `prefers-reduced-motion` sem quebrar a hidratacao.
 *
 * O `useReducedMotion` da framer-motion devolve `null` no SSR e o valor real ja
 * na primeira renderizacao do cliente. Quando o usuario tem a preferencia
 * ligada, os dois renders divergem: o React descarta a hidratacao do atributo
 * `style` do elemento animado e o componente fica preso no estado inicial
 * (`opacity: 0`, deslocado). O erro atinge exatamente quem depende do caminho
 * acessivel.
 *
 * `useSyncExternalStore` resolve isso por contrato: o `getServerSnapshot` vale
 * no SSR e durante a hidratacao, e so depois o React compara com o valor real
 * do cliente e re-renderiza. A assinatura tambem mantem o valor vivo se a
 * preferencia do sistema mudar com a pagina aberta.
 */
function assinar(aoMudar) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener('change', aoMudar);
  return () => consulta.removeEventListener('change', aoMudar);
}

function lerNoCliente() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(CONSULTA).matches;
}

function lerNoServidor() {
  return false;
}

export default function useMovimentoReduzido() {
  return useSyncExternalStore(assinar, lerNoCliente, lerNoServidor);
}
