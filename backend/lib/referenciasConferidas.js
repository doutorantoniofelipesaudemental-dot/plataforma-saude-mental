// Regra de referência no pipeline (ordem de 12/11/2026).
// Nenhuma peça aprovada sem referência conferida (DOI ou PMID) e com atribuição compatível com a frase.
// Busca vazia ou DOI ausente vira "pendente-de-conferencia", nunca "errada".
// Função pura: não consulta a internet nem o banco.

const STATUS = { CONFERIDA: 'conferida', PENDENTE: 'pendente-de-conferencia', INCOMPATIVEL: 'atribuicao-incompativel' };

function sobrenomeDoPrimeiroAutor(texto) {
  // "Kessler RC, Berglund P..." -> "Kessler"; aceita "Dr. Silva" e "Silva, J." em qualquer posição simples.
  const t = String(texto || '').trim().replace(/^Dr\.?\s+/i, '');
  const m = t.match(/^([A-Za-zÀ-ÿ'\- ]+?)(?:\s+[A-Z]{1,3})?(?:,|\s+[A-Z]|\s+et al)/);
  return m ? m[1].trim().split(' ').pop() : null;
}

// refs: [{ texto, doi?, pmid?, conferida?: boolean, frase?: string }]
// Devolve { ok, itens: [{ indice, status, motivo }] }. ok = true só se todos conferidos e compatíveis.
function conferirReferencias(refs) {
  if (!Array.isArray(refs) || refs.length === 0) {
    return { ok: false, itens: [{ indice: null, status: STATUS.PENDENTE, motivo: 'sem referências no texto' }] };
  }
  const itens = refs.map((r, indice) => {
    if (!r || (!r.doi && !r.pmid)) return { indice, status: STATUS.PENDENTE, motivo: 'sem DOI nem PMID' };
    if (r.conferida !== true) return { indice, status: STATUS.PENDENTE, motivo: 'DOI/PMID não conferido' };
    if (r.frase) {
      const sobrenome = sobrenomeDoPrimeiroAutor(r.texto);
      if (sobrenome && !String(r.frase).includes(sobrenome)) {
        return { indice, status: STATUS.INCOMPATIVEL, motivo: `frase não cita o primeiro autor (${sobrenome})` };
      }
    }
    return { indice, status: STATUS.CONFERIDA, motivo: '' };
  });
  return { ok: itens.every((i) => i.status === STATUS.CONFERIDA), itens };
}

module.exports = { conferirReferencias, sobrenomeDoPrimeiroAutor, STATUS };
