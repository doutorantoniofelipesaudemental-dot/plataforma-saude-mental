/**
 * Piloto de tradução para espanhol (es-419), 10 artigos. Ordem de 09/11/2026, 23:35 (item 5).
 * NADA vai ao ar enquanto ES_PILOTO_ATIVO não for 'true' (padrão: desligado). Páginas com noindex,
 * fora do sitemap, sem redirecionamento automático. Textos fixos pendentes de aprovação do Dr. Antônio Felipe.
 */
const fs = require('node:fs');
const path = require('node:path');

// Aviso de crise em espanhol: texto PENDENTE de aprovação (ordem 09/11, item 5). Único lugar onde ele fica.
const CRISE_ES = 'Si estás en crisis o con pensamientos de muerte, llama al número de emergencias de tu país. En Brasil: CVV 188 · SAMU 192.';

// Identificação de 5 linhas em espanhol: texto PENDENTE de aprovação.
const IDENTIFICACAO_ES = [
  'Dr. Antônio Felipe — Médico — CRM-BA 41322',
  'Especialista en Medicina de Familia y Comunidad — RQE 26638',
  'Ejerzo en Pronto Atendimento Psiquiátrico (PAP) y Atención Primaria de Salud (APS)',
  'Posgrados en Psiquiatría, Salud Mental, Atención Psicosocial, Terapia Cognitivo-Conductual, Neuropsicología y Medicina del Trabajo',
  'NO ESPECIALISTA',
];

const PASTA = path.join(__dirname, 'piloto');
const SLUGS = [
  'estresse-migratorio-adaptacao-cultural',
  'dependencia-quimica-comportamental-sinais',
  'compulsao-alimentar-compras-compulsivas',
  'sinais-alerta-comportamentais-jovens',
  'ansiedade-social-medo-julgamento',
  'depressao-pos-parto-ansiedade-perinatal',
  'burnout-na-gestao-fatores-de-risco',
  'fadiga-compaixao-cuidado-idosos',
  'transicao-carreira-aposentadoria-identidade',
  'sobrecarga-docente-descompressao',
];

function pilotoAtivo() {
  return process.env.ES_PILOTO_ATIVO === 'true';
}

function carregar(slug) {
  if (!SLUGS.includes(slug)) return null;
  const bruto = fs.readFileSync(path.join(PASTA, `${slug}.html`), 'utf8');
  const titulo = (bruto.match(/<!-- titulo: (.*?) -->/) || [])[1] || slug;
  const resumo = (bruto.match(/<!-- resumo: (.*?) -->/) || [])[1] || '';
  const corpo = bruto.replace(/<!--[\s\S]*?-->\n?/g, '').trim();
  return { slug, titulo, resumo, corpo };
}

module.exports = { CRISE_ES, IDENTIFICACAO_ES, SLUGS, pilotoAtivo, carregar };
