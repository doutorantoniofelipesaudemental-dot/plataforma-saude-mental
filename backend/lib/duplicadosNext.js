/**
 * Textos do app Next (.mdx) que também existem no domínio principal (MongoDB) precisam de canonical para o www.
 * O app Next lê app/slugsDominioPrincipal.js; a auditoria confere essa lista contra o MongoDB a cada execução
 * (falha se um texto existir nos dois lugares sem canonical) e, com --corrigir, regenera o arquivo.
 */
const fs = require('node:fs');
const path = require('node:path');

const ARQUIVO = path.join(__dirname, '../../apps/plataforma-saude-mental/app/slugsDominioPrincipal.js');
const CABECALHO = '// Slugs do domínio principal (www.drantoniofelipemedico.com.br), publicados ou agendados. Gerado por `npm run auditoria -- --corrigir`.\n// O canonical dos textos do app Next que existem lá aponta para a versão do domínio principal (conteúdo duplicado).\n';

function lerSlugsCanonicos() {
  if (!fs.existsSync(ARQUIVO)) return new Set();
  const m = fs.readFileSync(ARQUIVO, 'utf8').match(/new Set\((\[[\s\S]*?\])\)/);
  return new Set(m ? JSON.parse(m[1]) : []);
}

function gravarSlugsCanonicos(slugs) {
  const lista = [...new Set(slugs)].sort();
  const corpo = `${CABECALHO}export const SLUGS_DOMINIO_PRINCIPAL = new Set(${JSON.stringify(lista)});\nexport const DOMINIO_PRINCIPAL = 'https://www.drantoniofelipemedico.com.br';\n\nexport function canonicalDoTexto(slug, caminhoNext) {\n  return SLUGS_DOMINIO_PRINCIPAL.has(slug) ? DOMINIO_PRINCIPAL + '/artigo/' + slug : 'https://plataforma-saude-mental-steel.vercel.app' + caminhoNext;\n}\n`;
  fs.writeFileSync(ARQUIVO, corpo, 'utf8');
}

/** Falhas: slug do .mdx que existe no MongoDB mas não está na lista de canonical. */
function falhasDuplicados(slugsMdx, slugsMongo, canonicos = lerSlugsCanonicos()) {
  const mongo = new Set(slugsMongo);
  return slugsMdx.filter((s) => mongo.has(s) && !canonicos.has(s));
}

module.exports = { lerSlugsCanonicos, gravarSlugsCanonicos, falhasDuplicados, ARQUIVO };
