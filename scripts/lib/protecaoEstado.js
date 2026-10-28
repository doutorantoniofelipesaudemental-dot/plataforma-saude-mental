/**
 * Proteção dos arquivos de estado no merge (ordem de 28/10/2026).
 * Antes de trocar de branch, o merge-seguro copia os arquivos de estado (ignorados pelo Git) para .tmp/.
 * Depois do merge e da volta para a main, confere se continuam no disco; restaura sozinho os que sumiram, com conferência byte a byte.
 * Nunca sobrescreve um arquivo que existe e está diferente: só relata.
 */
const fs = require('node:fs');
const path = require('node:path');

// Arquivos de estado que a rotina escreve e que não podem sumir (além da lista do backup_estado).
const ESTADO_FIXO = [
  'relatorios/ESTADO-GERAL.md',
  'relatorios/PROMPT-ATUAL.md',
  'relatorios/PENDENTES.md',
  'relatorios/AUTORIZACOES.md',
  'relatorios/linkedin/FILA-MANUAL.md',
  'relatorios/tarefas-estado.md',
];

// Função pura: união sem repetição, na ordem em que aparece.
function listaProtegida(listaBackup = []) {
  return [...new Set([...ESTADO_FIXO, ...listaBackup])];
}

// Função pura: quais arquivos da lista existem agora e precisam de cópia.
function planejarProtecao(arquivos, existe) {
  return arquivos.map((rel) => ({ rel, copiar: Boolean(existe[rel]) }));
}

// Função pura: compara o que tinha antes (manifesto) com o que está no disco agora.
// restaurar = sumiu (pode voltar sozinho); divergentes = mudou (só relata); ok = igual.
function avaliarRestauracao(manifesto, atual) {
  const restaurar = [];
  const divergentes = [];
  const ok = [];
  for (const [rel, sha] of Object.entries(manifesto)) {
    if (!atual[rel]) restaurar.push(rel);
    else if (atual[rel] !== sha) divergentes.push(rel);
    else ok.push(rel);
  }
  return { restaurar, divergentes, ok };
}

const sha = (buf) => require('node:crypto').createHash('sha256').update(buf).digest('hex');

// Copia os arquivos que existem para o destino (com conferência byte a byte). Devolve o manifesto { rel: sha }.
function protegerEstado({ raiz, lista, destino }) {
  const existe = {};
  for (const rel of lista) existe[rel] = fs.existsSync(path.join(raiz, rel));
  const manifesto = {};
  for (const { rel, copiar } of planejarProtecao(lista, existe)) {
    if (!copiar) continue;
    const origem = path.join(raiz, rel);
    const alvo = path.join(destino, rel);
    const bytes = fs.readFileSync(origem);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, bytes);
    if (!fs.readFileSync(alvo).equals(bytes)) throw new Error(`cópia de ${rel} não confere; o merge não começou`);
    manifesto[rel] = sha(bytes);
  }
  return { manifesto, destino };
}

// Depois do merge: restaura o que sumiu (confere byte a byte) e relata o que mudou. Devolve as linhas do relatório.
function verificarEstado({ raiz, manifesto, destino }) {
  const atual = {};
  for (const rel of Object.keys(manifesto)) {
    const p = path.join(raiz, rel);
    atual[rel] = fs.existsSync(p) ? sha(fs.readFileSync(p)) : null;
  }
  const av = avaliarRestauracao(manifesto, atual);
  const linhas = [];
  for (const rel of av.restaurar) {
    const origem = path.join(destino, rel);
    const alvo = path.join(raiz, rel);
    const bytes = fs.readFileSync(origem);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, bytes);
    const ok = fs.readFileSync(alvo).equals(bytes) && sha(bytes) === manifesto[rel];
    linhas.push(ok ? `RESTAURADO (sumiu depois do merge): ${rel}` : `FALHA ao restaurar ${rel}: conferência byte a byte não bateu`);
  }
  for (const rel of av.divergentes) linhas.push(`DIVERGENTE (não alterado pela proteção, conferir): ${rel}`);
  linhas.push(`Estado protegido: ${av.ok.length} igual(is), ${av.restaurar.length} restaurado(s), ${av.divergentes.length} divergente(s). Cópia em ${path.relative(raiz, destino)}.`);
  return linhas;
}

module.exports = { ESTADO_FIXO, listaProtegida, planejarProtecao, avaliarRestauracao, protegerEstado, verificarEstado };
