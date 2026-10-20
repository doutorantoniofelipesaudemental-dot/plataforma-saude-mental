/**
 * Checagem cruzada (ordem de 20/10/2026): cada item "aprovado-checagem" da fila precisa ter uma conferência do conferidor
 * com ok=true, versão atual e o mesmo hash do vídeo. Qualquer divergência vira alerta na conferência diária. Só leitura.
 */
const fs = require('node:fs');
const path = require('node:path');
const { VERSAO } = require('./conferirVideo');

// Função pura: recebe a fila e um leitor de conferência (pasta -> objeto ou null). Devolve a lista de divergências.
function divergencias(itens, lerConferencia) {
  const out = [];
  for (const it of itens.filter((i) => i.status === 'aprovado-checagem')) {
    const c = lerConferencia(it.pasta);
    let motivo = null;
    if (!c) motivo = 'aprovado sem conferência do conferidor';
    else if (c.ok !== true) motivo = 'aprovado, mas o conferidor reprovou';
    else if (c.versao !== VERSAO) motivo = `conferência de versão antiga (${c.versao})`;
    else if (c.hashVideo !== it.hashVideo) motivo = 'hash do vídeo diferente do conferido';
    if (motivo) out.push({ id: it.id, motivo });
  }
  return out;
}

// Leitor do disco (usado pela conferência diária). Não escreve nada.
function lerConferenciaDoDisco(raiz) {
  return (pasta) => {
    try { return JSON.parse(fs.readFileSync(path.join(raiz, pasta, 'conferencia.json'), 'utf8')); } catch { return null; }
  };
}

module.exports = { divergencias, lerConferenciaDoDisco };
