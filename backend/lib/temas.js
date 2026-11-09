/**
 * Temas do Portal (fonte única). Os 7 temas são os mesmos da seção "Temas do Portal"
 * de public/index.html e os eixos de scripts/plano-diretor/pilares.js (ordem de 09/11/2026).
 *
 * Os artigos hoje são classificados pela categoria do banco (enum `CATEGORIAS` em
 * backend/models/Artigo.js). `categorias` é a ponte PROVISÓRIA categoria → tema até o
 * levantamento de reclassificação (relatorios/reclassificacao-temas-20261109.md) ser
 * aplicado pelo Dr. Antônio. Pontes órfãs (Médicos & Enfermeiros, Residentes & Estudantes,
 * Pós-Graduação & Concursos, Geral) são PROVISÓRIAS (ordem de 09/11/2026, item 4). "Relatos da Prática"
 * é tratado à parte (`RELATOS`), fora dos filtros de tema.
 */

const RELATOS = 'Relatos da Prática';

const TEMAS = Object.freeze([
  {
    slug: 'infancia-familia',
    nome: 'Infância, Adolescência, Pais & Família, Professores & Saúde Escolar',
    curto: 'Infância & Família',
    frase: 'Saúde mental na infância e na adolescência envolve emoções, aprendizado, sono e relações, em fases de grande crescimento.',
    categorias: ['Infância & Adolescência', 'Pais & Famílias', 'Educadores & Professores'],
  },
  {
    slug: 'maternidade-perinatal',
    nome: 'Maternidade, Puerpério & Saúde Perinatal',
    curto: 'Maternidade & Perinatal',
    frase: 'Gravidez, parto e os meses depois do nascimento são fases de grandes mudanças no corpo e na mente.',
    categorias: ['Maternidade, Puerpério & Lactação'],
  },
  {
    slug: 'vida-adulta-envelhecimento',
    nome: 'Vida Adulta, Envelhecimento & Cuidados Paliativos',
    curto: 'Vida Adulta & Envelhecimento',
    frase: 'Ao longo da vida adulta e do envelhecimento, a saúde mental acompanha trabalho, família, perdas e mudanças do corpo.',
    categorias: ['Saúde Mental na Terceira Idade', 'Luto & Divórcio', 'Transição de Carreira & Aposentadoria', 'Pós-Graduação & Concursos'],
  },
  {
    slug: 'cuidar-de-quem-cuida',
    nome: 'Cuidar de Quem Cuida & Saúde do Trabalhador (NR-1)',
    curto: 'Cuidar de Quem Cuida (NR-1)',
    frase: 'Quem cuida de um familiar doente, de pacientes ou de equipes também precisa de cuidado.',
    categorias: ['Cuidadores & Famílias', 'Trabalho Doméstico & Cuidados do Lar', 'Linhas de Cuidado (Cuidadores & Professores)', 'Empresas & RH', 'Pacientes & Famílias', 'Médicos & Enfermeiros', 'Residentes & Estudantes'],
  },
  {
    slug: 'transtornos-mentais',
    nome: 'Transtornos Mentais',
    curto: 'Transtornos Mentais',
    frase: 'O que são os transtornos mentais, como é feito o diagnóstico e quais condutas têm respaldo científico, explicados com clareza.',
    categorias: ['Condições Específicas', 'Ansiedade Social & Timidez', 'Compulsões & Transtornos Alimentares', 'Neurodivergência na Vida Adulta'],
  },
  {
    slug: 'habitos-sono',
    nome: 'Hábitos, Estilo de Vida & Sono',
    curto: 'Hábitos & Sono',
    frase: 'Alimentação, atividade física, sono, uso de telas, álcool, tabaco e outras substâncias fazem parte do dia a dia e influenciam o humor, a ansiedade e a energia.',
    categorias: ['Dependências & Adições'],
  },
  {
    slug: 'sociedade-cultura',
    nome: 'Sociedade, Cultura & Existência',
    curto: 'Sociedade & Cultura',
    frase: 'Saúde mental também depende do lugar onde a pessoa vive, trabalha e se relaciona.',
    categorias: ['Migrantes & Expatriados', 'Terceiro Setor & Causas Sociais', 'Geral'],
  },
]);

/** Texto do filtro "Relatos da Prática" (independente dos temas). */
const RELATOS_FRASE = 'Artigos literários inspirados na prática clínica, com identidades protegidas, que mostram o lado humano do cuidado.';

function temaPorSlug(slug) {
  return TEMAS.find((t) => t.slug === slug) || null;
}

/** Categorias do banco cobertas por um tema (vazio se o slug não existir). */
function categoriasDoTema(slug) {
  const tema = temaPorSlug(slug);
  return tema ? [...tema.categorias] : [];
}

/** Categorias que só ganharam tema por ponte PROVISÓRIA (aguardam decisão do Dr. Antônio). */
const PONTES_PROVISORIAS = Object.freeze(['Médicos & Enfermeiros', 'Residentes & Estudantes', 'Pós-Graduação & Concursos', 'Geral']);

/**
 * Tema efetivo de um artigo: o campo `tema` se preenchido; senão a ponte categoria → tema.
 * Relatos da Prática nunca têm tema. Retorna o slug ou '' (só Todos).
 */
function temaEfetivo(artigo) {
  if (artigo.tema) return artigo.tema;
  if (artigo.categoria === RELATOS) return '';
  const tema = TEMAS.find((t) => t.categorias.includes(artigo.categoria));
  return tema ? tema.slug : '';
}

module.exports = { TEMAS, RELATOS, RELATOS_FRASE, PONTES_PROVISORIAS, temaPorSlug, categoriasDoTema, temaEfetivo };
