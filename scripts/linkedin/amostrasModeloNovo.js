/**
 * Gera as 3 amostras do modelo novo, lado a lado com o texto atual (ordem de 28/10/2026, item 8).
 * Não grava na fila nem no banco. Grava relatorios/linkedin/amostras-modelo-novo.md.
 * Entradas: texto atual de cada post (fila-manual) e trechos dos artigos indicados em cada amostra (com a seção de origem).
 * O dado numérico vem do resumo no PubMed (PMID informado) e só entra se o número estiver no resumo.
 */
const fs = require('node:fs');
const path = require('node:path');
const F = require('./formatoPost');
const { checarPost } = require('../../backend/lib/linkedinChecagem');

const RAIZ = path.resolve(__dirname, '..', '..');
// A fila manual (texto atual) fica na pasta principal, fora do Git: DRS_RAIZ_FILA aponta para ela.
const FILA = path.join(process.env.DRS_RAIZ_FILA || RAIZ, 'relatorios', 'linkedin', 'fila-manual');
const SAIDA = path.join(RAIZ, 'relatorios', 'linkedin', 'amostras-modelo-novo.md');
const IDENT = 'Dr. Antônio Felipe · Médico · CRM-BA 41322 · Especialista em Medicina de Família e Comunidade · RQE 26638';
const AVISO_IA = 'Conteúdo produzido com apoio de ferramentas de IA, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).';

// Resumo do PubMed, PMID 30462669 (Zendle D, Cairns P. PLoS One. 2018): frase com o número.
const RESUMO_ZENDLE = 'A large-scale survey of gamers (n = 7,422) found evidence for a link between loot box spending and problem gambling.';
const DADO_ZENDLE = F.dadoVerificado(RESUMO_ZENDLE, '7,422');

const AMOSTRAS = [
  {
    nome: 'Amostra 1: quando-encaminhar-aps (fila 02/11/2026)',
    pasta: '02-11-texto-i-2026-11-02',
    slug: 'quando-encaminhar-aps',
    gancho: 'Cuidado colaborativo na Atenção Primária, com apoio especializado, está associado a melhora da depressão e da ansiedade.',
    dado: null,
    dadoMotivo: 'Sem número verificável nesta amostra; a linha é omitida.',
    sinais: ['Depressão em adultos atendidos na atenção primária', 'Ansiedade em adultos atendidos na atenção primária'],
    referenciaConferida: { pmid: '23076925', doi: '10.1002/14651858.CD006525.pub2' },
    ajuda: ['Resumo clínico claro, com hipótese diagnóstica e tratamentos já tentados', 'Motivo específico do encaminhamento, não apenas "avaliação psiquiátrica"', 'Comunicação direta com o serviço receptor'],
    fonteAjuda: 'seção "Como encaminhar bem" do artigo',
    // Archer et al. 2012 (PMID 23076925, conferido). Sustenta: cuidado colaborativo associado a melhora de depressão e ansiedade na APS (conclusão do resumo).
    // Os itens de "Sinais" descrevem a população do estudo, não diagnóstico; "O que ajuda" vem do próprio artigo (seção "Como encaminhar bem"), não do Archer.
    referencia: 'Archer J, Bower P, Gilbody S, et al. Collaborative care for depression and anxiety problems. Cochrane Database Syst Rev. 2012;10(10):CD006525.',
    mentoria: true,
    conduta: true,
    hashtags: ['#AtencaoPrimaria', '#MedicinaDeFamilia', '#SaudeMental'],
  },
  {
    nome: 'Amostra 2: jogos-online-consulta-medicos (fila 09/11/2026)',
    pasta: '09-11-texto-i-2026-11-09',
    slug: 'jogos-online-consulta-medicos',
    gancho: 'Jogos online como Roblox, Fortnite e Free Fire são diferentes do "tempo de tela" genérico: envolvem conversa com desconhecidos, compras dentro do jogo e mecânicas que prendem a atenção.',
    // O número só entra se estiver no resumo do PubMed (dadoVerificado); a frase em português repete o número conferido.
    referenciaConferida: { pmid: '30462669' },
    dado: DADO_ZENDLE ? 'Em uma pesquisa com 7.422 jogadores, os gastos em caixas de recompensa (loot boxes) apareceram ligados ao jogo problemático (fonte: resumo no PubMed, PMID 30462669).' : null,
    dadoMotivo: 'Número conferido no resumo do PubMed.',
    sinais: ['Conversa com desconhecidos dentro do jogo', 'Gastos dentro do jogo (moedas virtuais, skins)', 'Dificuldade de parar quando é hora de parar'],
    ajuda: ['Perguntar na consulta com quem o jovem joga e se há supervisão do chat', 'Conhecer as ferramentas de supervisão parental das plataformas', 'Combinar, em família, como são os gastos e o momento de parar'],
    fonteAjuda: 'seções "Como investigar na consulta" e "Orientando a família" do artigo',
    referencia: 'Zendle D, Cairns P. Video game loot boxes are linked to problem gambling: results of a large-scale survey. PLoS One. 2018;13(11):e0206767.',
    mentoria: false,
    conduta: true,
    hashtags: ['#SaudeMental', '#Infancia', '#ECADigital'],
  },
  {
    nome: 'Amostra 3: primeiro-episodio-psicotico (fila 13/11/2026)',
    pasta: '13-11-texto-i-2026-11-13',
    slug: 'primeiro-episodio-psicotico',
    gancho: 'Quanto mais tempo passa sem tratamento nos primeiros episódios de psicose, maior a associação com pior evolução a longo prazo.',
    dado: null,
    dadoMotivo: 'Sem número verificável nesta amostra; a linha é omitida.',
    sinais: ['Mudança de comportamento que se afasta do cotidiano habitual', 'Desconfiança ou ideias que não se encaixam no contexto'],
    ajuda: ['Encaminhamento urgente, sem aguardar agendamento eletivo', 'Comunicar o serviço receptor com resumo clínico', 'Orientar a família sem minimizar e sem dramatizar'],
    fonteAjuda: 'seção "Conduta inicial" do artigo (APS e família)',
    // Penttilä et al. 2014 conferido no PubMed (PMID 25252316, DOI 10.1192/bjp.bp.113.127753). O resumo descreve correlação "pequena, mas consistente".
    referenciaConferida: { pmid: '25252316', doi: '10.1192/bjp.bp.113.127753' },
    referencia: 'Penttilä M, Jääskeläinen E, Hirvonen N, et al. Duration of untreated psychosis as predictor of long-term outcome in schizophrenia: systematic review and meta-analysis. Br J Psychiatry. 2014;205(2):88-94.',
    mentoria: false,
    conduta: true,
    hashtags: ['#SaudeMental', '#AtencaoPrimaria', '#PrimeiroEpisodio'],
  },
];

function textoAtual(pasta) {
  const achado = fs.readdirSync(FILA).map((s) => path.join(FILA, s, pasta, 'texto.txt')).find((p) => fs.existsSync(p));
  return achado ? fs.readFileSync(achado, 'utf8').trim() : '(texto atual não encontrado)';
}

function montarNovo(a) {
  const rodape = F.montarRodape({ identificacao: IDENT, avisoIA: AVISO_IA, hashtags: a.hashtags });
  const texto = F.montarPostNovo({
    gancho: a.gancho, dado: a.dado, sinais: a.sinais, ajuda: a.ajuda, pergunta: F.perguntaDoSlug(a.slug),
    linkArtigo: `https://www.drantoniofelipemedico.com.br/artigo/${a.slug}`, mentoria: a.mentoria,
    referencia: a.referencia, rodape, conduta: a.conduta,
  });
  const checagem = checarPost({ tipo: 'texto', texto, referenciaConferida: a.referenciaConferida });
  return { texto, falhas: F.validarPostNovo(texto, { mentoria: a.mentoria, hashtags: a.hashtags }), checagem };
}

const blocos = AMOSTRAS.map((a) => {
  const novo = montarNovo(a);
  return [
    `## ${a.nome}`,
    '',
    `- Dado numérico: ${a.dado ? 'SIM' : 'NÃO'} (${a.dadoMotivo})`,
    `- "O que ajuda, na prática": ${a.fonteAjuda}`,
    `- Validação do modelo novo: ${novo.falhas.length ? novo.falhas.join(' | ') : 'sem falhas'} · ${novo.texto.length} caracteres · gancho ${a.gancho.length} caracteres`,
    '',
    '### Atual (fila, sem alteração de conteúdo)',
    '',
    '```text',
    textoAtual(a.pasta),
    '```',
    '',
    '### Modelo novo (NÃO ATIVO; depende de aprovação no domingo)',
    '',
    '```text',
    novo.texto,
    '```',
    '',
  ].join('\n');
});

const cabecalho = [
  '# Amostras do modelo novo do LinkedIn (28/10/2026)',
  '',
  'Gerado por `scripts/linkedin/amostrasModeloNovo.js`. Não grava na fila nem no banco. O modelo novo NÃO está ativo: a fila segue com o modelo atual, só com a correção do rótulo "Pontos práticos" e do espaço em "JAMA .".',
  '',
  'Pendência de checagem humana: os trechos de "O que ajuda, na prática" vêm das seções indicadas em cada amostra. A amostra 3 trata de conduta clínica; o aviso de protocolos locais já está incluído.',
  '',
].join('\n');

fs.writeFileSync(SAIDA, `${cabecalho}\n${blocos.join('\n')}`, 'utf8');
console.log(`gravado: ${path.relative(RAIZ, SAIDA)}`);
for (const a of AMOSTRAS) {
  const n = montarNovo(a);
  console.log(`${a.slug}: modelo ${n.falhas.length ? `FALHAS ${n.falhas.join(' | ')}` : 'ok'} · checagem real ${n.checagem.length ? `FALHAS ${n.checagem.join(' | ')}` : 'ok'} (${n.texto.length} caracteres)`);
}
