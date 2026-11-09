/**
 * Bloco oficial de identificação de 5 linhas (assinatura padrão completa, decisão de 15/10/2026 e ordem de 02/11/2026).
 * Módulo sem dependências: evita importação circular entre conformidadeCfm e legendaInstagram.
 * Usado no portal, nas legendas do Instagram e do LinkedIn, e nas checagens sociais.
 */
const IDENTIFICACAO_COMPLETA = [
  'Dr. Antônio Felipe — Médico — CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade — RQE 26638',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho',
  'NÃO ESPECIALISTA',
].join('\n');

module.exports = { IDENTIFICACAO_COMPLETA };
