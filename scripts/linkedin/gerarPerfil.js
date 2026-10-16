/**
 * Perfil do LinkedIn (relatorios/linkedin/perfil/) e PROPOSTA do post da /mentoria (relatorios/linkedin/propostas/). Nada é publicado.
 *   node --env-file=.env scripts/linkedin/gerarPerfil.js
 */
const fs = require('node:fs');
const path = require('node:path');
const L = require('../youtube/lib');
const { checarPost } = require('../../backend/lib/linkedinChecagem');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const REL = path.join(L.RAIZ, 'relatorios', 'linkedin');
const PERFIL = path.join(REL, 'perfil'), PROP = path.join(REL, 'propostas');
fs.mkdirSync(PERFIL, { recursive: true }); fs.mkdirSync(PROP, { recursive: true });
const EMAIL = 'doutor.antoniofelipe.saudemental@gmail.com';

const HEADLINE = 'Médico de Família e Comunidade (RQE 26638) · Saúde mental no Pronto Atendimento e na Atenção Primária · Mentoria para a APS e consultoria para empresas';
const SOBRE = [
  'Sou o Dr. Antônio Felipe, médico (CRM-BA 41322), especialista em Medicina de Família e Comunidade (RQE 26638). Atuo no Pronto Atendimento Psiquiátrico (PAP) e na Atenção Primária à Saúde (APS).',
  '',
  'Escrevo e organizo conteúdo educativo sobre saúde mental para profissionais de saúde, gestores e equipes de RH, com referências científicas e linguagem simples. Todo texto tem versão em áudio e passa por auditoria técnica, científica, ética e humanizada.',
  '',
  'O que ofereço:',
  '• Mentoria para profissionais da Atenção Primária: discussão de condutas gerais e organização do cuidado em saúde mental na rotina da unidade.',
  '• Consultoria para empresas e equipes de RH: estruturação do cuidado com a saúde mental no trabalho, Kit NR-1 e gestão de riscos psicossociais.',
  '• Atendimento médico, mediante agendamento.',
  '',
  `Contato e agendamento somente por e-mail: ${EMAIL}`,
  `Portal, textos e áudios: ${L.SITE}/links`,
  '',
  'Conteúdo educativo, sem promessa de resultado, que não substitui consulta. Respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.',
  L.CRISE,
  '',
  L.IDENTIFICACAO_3_LINHAS,
].join('\n');
const DESTAQUES = [
  { titulo: 'Mentoria e consultoria', url: `${L.SITE}/mentoria` },
  { titulo: 'Portal de Saúde Mental e áudios', url: `${L.SITE}/links` },
  { titulo: 'Burnout em médicos e enfermeiros da Atenção Primária', url: `${L.SITE}/artigo/burnout-aps` },
  { titulo: 'Burnout em profissionais de saúde: o que as evidências mostram', url: `${L.SITE}/artigo/burnout-medicos-enfermeiros` },
  { titulo: 'Risco de suicídio na Atenção Primária', url: `${L.SITE}/artigo/risco-suicidio-aps` },
];
const POST_MENTORIA = [
  'Mentoria para profissionais da Atenção Primária e consultoria para empresas e equipes de RH.',
  '',
  'Na mentoria, discutimos condutas gerais e a organização do cuidado em saúde mental na rotina da unidade, sempre respeitando os protocolos locais.',
  'Na consultoria, apoiamos a estruturação do cuidado com a saúde mental no trabalho, incluindo o Kit NR-1 e a gestão de riscos psicossociais.',
  '',
  'São atividades de educação e de organização do cuidado: não oferecem diagnóstico nem tratamento à distância, e o formato de cada trabalho é conversado de forma individual.',
  '',
  `Contato e agendamento somente por e-mail: ${EMAIL}`,
  `Detalhes: ${L.SITE}/mentoria`,
  '',
  'Conteúdo informativo e educativo, que não substitui consulta. Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.',
  L.CRISE, L.AVISO_IA, '', L.IDENTIFICACAO_3_LINHAS, '', '#SaudeMentalNoTrabalho #AtencaoPrimaria #NR1',
].join('\n');

const falhas = [];
if (HEADLINE.length > 220) falhas.push(`headline com ${HEADLINE.length} caracteres (limite 220)`);
if (SOBRE.length > 2600) falhas.push(`"Sobre" com ${SOBRE.length} caracteres (limite 2600)`);
if (/psiquiatra/i.test(`${HEADLINE} ${SOBRE} ${POST_MENTORIA}`)) falhas.push('"psiquiatra"');
falhas.push(...checarEticaCfm(`${SOBRE}\n${POST_MENTORIA}`, { contexto: 'social', exigirIdentificacao: false }).falhas);
falhas.push(...checarPost({ tipo: 'proposta', texto: POST_MENTORIA.replace(EMAIL, 'e-mail na página de mentoria') }).filter((x) => !/^tamanho/.test(x)));

L.arte({ tipo: 'banner_li', saida: path.join(PERFIL, 'banner-1584x396.png') });
L.arte({ tipo: 'perfil', saida: path.join(PERFIL, 'foto-perfil.png') });
fs.writeFileSync(path.join(PERFIL, 'perfil-linkedin.md'), `# Perfil do LinkedIn — Dr. Antônio Felipe\n\nChecagem ética/CFM automática: ${falhas.length ? 'FALHOU: ' + falhas.join('; ') : 'aprovada'}.\n\n## Título (headline, ${HEADLINE.length}/220)\n${HEADLINE}\n\n## Sobre (${SOBRE.length}/2600)\n\`\`\`\n${SOBRE}\n\`\`\`\n\n## Destaques (Perfil > Adicionar seção em destaque > Link)\n${DESTAQUES.map((d, i) => `${i + 1}. ${d.titulo} — ${d.url}`).join('\n')}\n\n## Imagens\n- banner-1584x396.png (texto fora da área coberta pela foto de perfil, à esquerda)\n- foto-perfil.png (monograma da marca; troque por foto profissional se preferir)\n\n## Contato\nMostrar apenas o e-mail do consultório; não ativar mensageria de terceiros.\n`, 'utf8');
fs.writeFileSync(path.join(PROP, 'post-mentoria-PROPOSTA.md'), `# PROPOSTA — post da /mentoria (LinkedIn)\n\n**Status: aguardando a aprovação do Dr. Antônio. NÃO está na fila e nenhum script o publica.** É publicidade médica (Res. CFM 2.336/2023); contato só por e-mail.\n\nChecagem ética automática: ${falhas.length ? 'FALHOU: ' + falhas.join('; ') : 'aprovada'}.\n\n\`\`\`\n${POST_MENTORIA}\n\`\`\`\n\nPara aprovar: diga "aprovo o post da mentoria" e a data; ele passa pela Tripla Checagem e entra no calendário.\n`, 'utf8');
console.log(falhas.length ? `FALHAS: ${falhas.join(' | ')}` : `ok · headline ${HEADLINE.length} · sobre ${SOBRE.length}`);
