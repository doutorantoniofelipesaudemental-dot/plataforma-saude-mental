// Indice de roteamento de todos os artigos em src/content/artigos/.
//
// ARTIGOS_VOL2: segundo artigo de cada um dos 12 eixos da Matriz Editorial
// Expandida (Downloads/matriz_editorial_expandida.pdf) — conteudo novo,
// escrito para este projeto.
//
// ARTIGOS_SITE_ANTERIOR: os 65 artigos originais do site anterior
// (dr-antoniofelipe-saudemental.netlify.app), migrados de
// backend/seed-artigos.js e convertidos para MDX preservando o texto
// original do Dr. Antônio Felipe — nenhuma reescrita, so reformatacao de
// marcacao (HTML -> componentes Lead/Callout/RefsNote + <CallToTool/>).
//
// So slug + categoria/eixo aqui, para roteamento: titulo, resumo e demais
// metadados vivem no proprio .mdx de cada artigo.

export const ARTIGOS_VOL2 = [
  { eixo: 1, slug: 'benzodiazepinicos-uso-cronico-riscos' },
  { eixo: 2, slug: 'colapso-do-cuidador-emergencia-pa' },
  { eixo: 3, slug: 'burnout-docente-sala-de-aula' },
  { eixo: 4, slug: 'afastamento-trabalho-laudo-aps' },
  { eixo: 5, slug: 'tept-violencia-urbana-assalto' },
  { eixo: 6, slug: 'luto-gestacional-e-neonatal' },
  { eixo: 7, slug: 'ansiedade-depressao-gestacional' },
  { eixo: 8, slug: 'vape-nicotina-adolescentes' },
  { eixo: 9, slug: 'anorexia-bulimia-adolescencia' },
  { eixo: 10, slug: 'polifarmacia-idoso-delirium' },
  { eixo: 11, slug: 'peso-psicologico-doenca-cronica' },
  { eixo: 12, slug: 'comparacao-redes-sociais-autoestima' },
];

export const ARTIGOS_SITE_ANTERIOR = [
  { slug: 'relato-paciente-invisivel', categoria: 'Relatos da Prática' },
  { slug: 'relato-crise-evitavel', categoria: 'Relatos da Prática' },
  { slug: 'relato-familia-em-crise', categoria: 'Relatos da Prática' },
  { slug: 'relato-vinculo-perdido', categoria: 'Relatos da Prática' },
  { slug: 'relato-peso-invisivel-cuidador', categoria: 'Relatos da Prática' },
  { slug: 'relato-silencio-fatal', categoria: 'Relatos da Prática' },
  { slug: 'relato-entre-dois-mundos', categoria: 'Relatos da Prática' },
  { slug: 'relato-diagnostico-nao-aceito', categoria: 'Relatos da Prática' },
  { slug: 'relato-receita-nao-veio-sozinha', categoria: 'Relatos da Prática' },
  { slug: 'relato-corpo-envelhece-mente-esquecida', categoria: 'Relatos da Prática' },
  { slug: 'relato-medo-remedio', categoria: 'Relatos da Prática' },
  { slug: 'relato-aposta-familia', categoria: 'Relatos da Prática' },
  { slug: 'relato-cuidador-equipe-burnout', categoria: 'Relatos da Prática' },
  { slug: 'relato-territorio-segredos', categoria: 'Relatos da Prática' },
  { slug: 'relato-ultima-consulta-antes-desistir', categoria: 'Relatos da Prática' },
  { slug: 'relato-esquecimento-nao-idade', categoria: 'Relatos da Prática' },
  { slug: 'relato-prato-campo-batalha', categoria: 'Relatos da Prática' },
  { slug: 'relato-segunda-chance-caps', categoria: 'Relatos da Prática' },
  { slug: 'relato-nao-saber-tudo', categoria: 'Relatos da Prática' },
  { slug: 'relato-tabaco-ninguem-perguntava', categoria: 'Relatos da Prática' },
  { slug: 'tempo-tela-criancas', categoria: 'Pais & Famílias' },
  { slug: 'redes-sociais-criancas', categoria: 'Pais & Famílias' },
  { slug: 'alimentacao-criancas', categoria: 'Pais & Famílias' },
  { slug: 'rotina-criancas', categoria: 'Pais & Famílias' },
  { slug: 'jogos-online-criancas', categoria: 'Pais & Famílias' },
  { slug: 'primeiro-episodio-psicotico', categoria: 'Médicos & Enfermeiros' },
  { slug: 'burnout-medicos-enfermeiros', categoria: 'Médicos & Enfermeiros' },
  { slug: 'contencao-mecanica-pa', categoria: 'Médicos & Enfermeiros' },
  { slug: 'intoxicacao-agitacao-pa', categoria: 'Médicos & Enfermeiros' },
  { slug: 'alta-pa-psiquiatrico', categoria: 'Médicos & Enfermeiros' },
  { slug: 'matriciamento-saude-mental', categoria: 'Médicos & Enfermeiros' },
  { slug: 'grupos-terapeuticos-aps', categoria: 'Médicos & Enfermeiros' },
  { slug: 'quando-encaminhar-aps', categoria: 'Médicos & Enfermeiros' },
  { slug: 'jogos-online-consulta-medicos', categoria: 'Médicos & Enfermeiros' },
  { slug: 'tempo-tela-consulta-medicos', categoria: 'Médicos & Enfermeiros' },
  { slug: 'redes-sociais-consulta-medicos', categoria: 'Médicos & Enfermeiros' },
  { slug: 'alimentacao-consulta-medicos', categoria: 'Médicos & Enfermeiros' },
  { slug: 'rotina-consulta-medicos', categoria: 'Médicos & Enfermeiros' },
  { slug: 'sobrecarga-cuidador-consulta', categoria: 'Médicos & Enfermeiros' },
  { slug: 'saude-mental-perinatal-consulta', categoria: 'Médicos & Enfermeiros' },
  { slug: 'saude-mental-idoso-consulta', categoria: 'Médicos & Enfermeiros' },
  { slug: 'jogo-patologico-rastreio', categoria: 'Médicos & Enfermeiros' },
  { slug: 'compulsao-alimentar-rastreio', categoria: 'Médicos & Enfermeiros' },
  { slug: 'dependencia-quimica-rastreio-aps', categoria: 'Médicos & Enfermeiros' },
  { slug: 'psicofarmacos-aps-medicos', categoria: 'Médicos & Enfermeiros' },
  { slug: 'psicofarmacos-mitos-culturais', categoria: 'Geral' },
  { slug: 'risco-suicidio-aps', categoria: 'Médicos & Enfermeiros' },
  { slug: 'manejo-crise-psiquiatrica', categoria: 'Médicos & Enfermeiros' },
  { slug: 'neuropsicologia-pratica-clinica', categoria: 'Médicos & Enfermeiros' },
  { slug: 'saude-mental-residencia', categoria: 'Residentes & Estudantes' },
  { slug: 'realidade-saude-mental-aps', categoria: 'Residentes & Estudantes' },
  { slug: 'programa-saude-mental-ocupacional', categoria: 'Empresas & RH' },
  { slug: 'afastamento-transtorno-mental', categoria: 'Empresas & RH' },
  { slug: 'saude-mental-cuidador', categoria: 'Pacientes & Famílias' },
  { slug: 'gestacao-amamentacao-saude-mental', categoria: 'Pacientes & Famílias' },
  { slug: 'saude-mental-idoso', categoria: 'Pacientes & Famílias' },
  { slug: 'crise-psiquiatrica-familia', categoria: 'Pacientes & Famílias' },
  { slug: 'primeira-consulta-saude-mental', categoria: 'Pacientes & Famílias' },
  { slug: 'psicofarmacos-mitos-verdades', categoria: 'Pacientes & Famílias' },
  { slug: 'compulsao-jogos', categoria: 'Pacientes & Famílias' },
  { slug: 'compulsao-alimentar', categoria: 'Pacientes & Famílias' },
  { slug: 'dependencia-quimica', categoria: 'Pacientes & Famílias' },
  { slug: 'tmc-aps', categoria: 'Geral' },
  { slug: 'burnout-aps', categoria: 'Geral' },
  { slug: 'professores-saude-mental', categoria: 'Geral' },
];

export const TODOS_ARTIGOS = [
  ...ARTIGOS_VOL2.map((a) => ({ ...a, origem: 'vol2' })),
  ...ARTIGOS_SITE_ANTERIOR.map((a) => ({ ...a, origem: 'site-anterior' })),
];
