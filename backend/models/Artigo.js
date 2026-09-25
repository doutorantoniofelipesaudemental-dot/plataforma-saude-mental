const { mongoose } = require('../lib/db');
const { slugify } = require('../lib/texto');

// Taxonomia baseada nos públicos reais atendidos pelo trabalho de mentoria e
// consultoria do Dr. Antônio Felipe (migrada do site anterior).
const CATEGORIAS = [
  'Relatos da Prática',
  'Pacientes & Famílias',
  'Pais & Famílias',
  'Médicos & Enfermeiros',
  'Residentes & Estudantes',
  'Empresas & RH',
  'Geral',
  'Educadores & Professores',
  'Cuidadores & Famílias',
  'Migrantes & Expatriados',
  'Infância & Adolescência',
  'Luto & Divórcio',
  'Maternidade, Puerpério & Lactação',
  'Saúde Mental na Terceira Idade',
  'Trabalho Doméstico & Cuidados do Lar',
  'Neurodivergência na Vida Adulta',
  'Pós-Graduação & Concursos',
  'Ansiedade Social & Timidez',
  'Terceiro Setor & Causas Sociais',
  'Transição de Carreira & Aposentadoria',
  'Dependências & Adições',
  'Compulsões & Transtornos Alimentares',
];

// Fluxo de aprovação para publicação nas redes sociais (backend/lib/socialPublisher.js)
// — independente de `publicado`, que controla só a visibilidade no site.
// Um artigo pode estar publicado no site e ainda não aprovado para redes.
const STATUS_REDES = ['rascunho', 'aprovado', 'publicado'];

/**
 * Artigo do blog. O campo `conteudo` guarda HTML escrito pela própria clínica
 * (conteúdo confiável, criado apenas por rotas administrativas autenticadas) e
 * é renderizado como HTML no front-end.
 */
const ArtigoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'Título é obrigatório.'],
      trim: true,
      maxlength: [180, 'Título muito longo.'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    resumo: {
      type: String,
      required: [true, 'Resumo é obrigatório.'],
      trim: true,
      maxlength: [320, 'Resumo muito longo.'],
    },
    conteudo: {
      type: String,
      required: [true, 'Conteúdo é obrigatório.'],
    },
    categoria: {
      type: String,
      required: true,
      enum: { values: CATEGORIAS, message: 'Categoria inválida.' },
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      set: (v) => (Array.isArray(v) ? v.map((t) => String(t).trim()).filter(Boolean).slice(0, 8) : []),
    },
    autor: { type: String, default: 'Dr. Antônio Felipe', trim: true, maxlength: 120 },
    imagemCapa: { type: String, default: '', trim: true, maxlength: 500 },
    // URL do áudio (Vercel Blob) com a narração TTS do artigo completo,
    // gerada pelo backend Python de automação e enviada via PUT
    // /api/artigos/:slug/midia/audio. Vazio enquanto não houver narração.
    audioNarracaoUrl: { type: String, default: '', trim: true, maxlength: 500 },
    // Contador anônimo de "Solicitar narração em áudio" (POST
    // /api/artigos/:slug/solicitar-narracao) — só faz sentido enquanto
    // audioNarracaoUrl estiver vazio; usado para priorizar gravação.
    solicitacoesNarracao: { type: Number, default: 0, min: 0 },
    // Quantas vezes a ferramenta interativa embutida no conteúdo (calculadora,
    // termômetro, escala) foi usada — cada artigo tem no máximo uma.
    usosFerramenta: { type: Number, default: 0, min: 0 },
    tempoLeitura: { type: Number, default: 4, min: 1, max: 60 },
    publicado: { type: Boolean, default: true, index: true },
    publicadoEm: { type: Date, default: Date.now, index: true },
    visualizacoes: { type: Number, default: 0, min: 0 },
    // Contadores anônimos da enquete de engajamento no fim do artigo
    // (POST /api/artigos/:slug/enquete) — sem identificação de quem votou,
    // só a soma por opção, para métricas simples no /admin.
    enquete: {
      util: {
        sim: { type: Number, default: 0, min: 0 },
        nao: { type: Number, default: 0, min: 0 },
      },
      perfil: {
        gestorRh: { type: Number, default: 0, min: 0 },
        profissionalSaude: { type: Number, default: 0, min: 0 },
        usoPessoal: { type: Number, default: 0, min: 0 },
      },
    },
    // Aprovação para redes sociais (ver STATUS_REDES acima) — default
    // 'rascunho' para nunca disparar publicação sem revisão explícita.
    status: {
      type: String,
      enum: { values: STATUS_REDES, message: 'Status inválido.' },
      default: 'rascunho',
      index: true,
    },
    // Quando o artigo foi de fato postado em alguma rede (setado junto com
    // status 'publicado'). A fila diária (backend/lib/filaRedes.js) conta
    // estes horários para respeitar o teto de posts/dia e o intervalo mínimo.
    publicadoRedesEm: { type: Date, default: null, index: true },
    // Capa 4:5 do feed (backend/lib/capaRedes.js) — separada de `imagemCapa`,
    // que é a capa 1200×630 do site/og:image. `hash` é o SHA-256 do PNG.
    capaRedes: {
      url: { type: String, default: '' },
      hash: { type: String, default: '', index: true },
      largura: Number,
      altura: Number,
      modelo: String,
      titulo: String,
      subtitulo: String,
      geradaEm: Date,
    },
    // Narração versionada (backend/lib/narracao.js): hash = SHA-256 de voz +
    // texto narrado; se o conteúdo mudar, o hash esperado muda e a narração
    // fica "desatualizada" sozinha. `audioNarracaoUrl` segue como a URL tocada.
    narracao: {
      url: String,
      hash: String,
      voz: String,
      caracteres: Number,
      bytes: Number,
      geradaEm: Date,
    },
    // Linha curta opcional abaixo do título na capa das redes.
    subtituloRedes: { type: String, default: '', trim: true, maxlength: 120 },
    // Reescrita aprovada importada (backend/tools/importar-reescritas.js).
    // A checagem de conteúdo reprova o artigo se um lote em
    // backend/data/reescritas/ tiver versão dele ainda não importada.
    reescrita: {
      lote: String,
      hash: String,
      importadaEm: Date,
    },
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
    versionKey: false,
  }
);

// Busca textual por título/resumo/tags.
ArtigoSchema.index({ titulo: 'text', resumo: 'text', tags: 'text' });
ArtigoSchema.index({ publicado: 1, publicadoEm: -1 });

// Mongoose 9 não usa mais o callback `next` nos hooks — é síncrono ou promise.
ArtigoSchema.pre('validate', function gerarSlug() {
  if (!this.slug && this.titulo) {
    this.slug = slugify(this.titulo);
  }
});

module.exports =
  mongoose.models.Artigo || mongoose.model('Artigo', ArtigoSchema);
module.exports.CATEGORIAS = CATEGORIAS;
module.exports.STATUS_REDES = STATUS_REDES;
