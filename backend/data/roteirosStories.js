/**
 * Roteiros de Stories de Instagram (vertical, 1080x1920), em formato
 * estruturado — mesmo espírito de `roteirosVideoReels.js`, adaptado para o
 * ritmo de Stories: sequência curta de quadros (gancho → conteúdo → CTA),
 * consumida por `GET /api/admin/export-video-data?tipo=stories` e por
 * ferramentas de geração automática de vídeo/imagem.
 *
 * `categoria` reflete o valor real do campo `categoria` do artigo-base em
 * `backend/models/Artigo.js` (mesmo enum `CATEGORIAS`). `[LINK]` é
 * placeholder substituído pela URL real do artigo no momento da publicação;
 * o quadro de CTA carrega o sticker de link (equivalente ao "arraste para
 * cima"/link em resposta, conforme o recurso disponível na conta).
 */

const HASHTAGS_FIXAS = ['#saudemental', '#psiquiatria', '#doutorsaudemental', '#stories'];

const ROTEIROS_STORIES = [
  {
    tema: 'Sua equipe pode estar em risco de burnout',
    slugArtigo: 'burnout-na-gestao-fatores-de-risco',
    categoria: 'Empresas & RH',
    quadros: [
      {
        ordem: 1,
        tipo: 'gancho',
        textoTela: 'Sua equipe pode estar em risco de burnout — e você pode não estar vendo',
        sugestaoVisual: 'Escritório visto de cima, mesa com notebook aberto tarde da noite, tipografia grande centralizada',
      },
      {
        ordem: 2,
        tipo: 'conteudo',
        textoTela: 'A OMS classifica burnout como fenômeno ocupacional — não fraqueza individual',
        sugestaoVisual: 'Citação em destaque sobre fundo verde-escuro sólido, selo "OMS · CID-11"',
      },
      {
        ordem: 3,
        tipo: 'conteudo',
        textoTela: '6 fatores de risco psicossocial explicam boa parte do esgotamento das equipes',
        sugestaoVisual: 'Lista numerada rápida (carga, clareza, autonomia, suporte, reconhecimento, equilíbrio) com ícones simples',
      },
      {
        ordem: 4,
        tipo: 'cta',
        textoTela: 'Teste a Matriz de Risco Psicossocial no artigo — arraste para cima',
        sugestaoVisual: 'Botão de link em destaque, mesma paleta do site',
        linkSticker: '[LINK]',
      },
    ],
    hashtagsExtras: ['#burnout', '#gestaodepessoas', '#riscopsicossocial'],
  },
  {
    tema: 'Estresse ou ansiedade? Nem sempre é a mesma coisa',
    slugArtigo: 'ansiedade-corporativa-sintomas-tratamento',
    categoria: 'Empresas & RH',
    quadros: [
      {
        ordem: 1,
        tipo: 'gancho',
        textoTela: 'Estresse ou ansiedade? Nem sempre é a mesma coisa',
        sugestaoVisual: 'Pessoa em pausa respirando, mãos no rosto, luz suave',
      },
      {
        ordem: 2,
        tipo: 'conteudo',
        textoTela: 'O Brasil tem uma das maiores prevalências de ansiedade do mundo, segundo a OMS',
        sugestaoVisual: 'Estatística em destaque, fundo areia com tipografia serifada grande',
      },
      {
        ordem: 3,
        tipo: 'conteudo',
        textoTela: '5 sinais ajudam a diferenciar uma reação pontual de um quadro clínico',
        sugestaoVisual: 'Lista curta com ícones (duração, intensidade, prejuízo funcional, sintomas físicos, evitação)',
      },
      {
        ordem: 4,
        tipo: 'cta',
        textoTela: 'Faça o checklist rápido de autoavaliação no artigo — arraste para cima',
        sugestaoVisual: 'Botão de link em destaque, mesma paleta do site',
        linkSticker: '[LINK]',
      },
    ],
    hashtagsExtras: ['#ansiedadecorporativa', '#saudementalnotrabalho'],
  },
  {
    tema: 'Saúde mental não é benefício. É estratégia.',
    slugArtigo: 'saude-mental-pilar-de-performance-liderancas',
    categoria: 'Empresas & RH',
    quadros: [
      {
        ordem: 1,
        tipo: 'gancho',
        textoTela: 'Saúde mental não é benefício. É estratégia de performance.',
        sugestaoVisual: 'Sala de reunião luminosa, liderança em pé apresentando, tipografia grande centralizada',
      },
      {
        ordem: 2,
        tipo: 'conteudo',
        textoTela: 'Cada R$1 investido em tratamento de ansiedade e depressão retorna cerca de R$4 em produtividade (estimativa OMS)',
        sugestaoVisual: 'Número "R$1 → R$4" em destaque máximo, fundo verde-escuro sólido',
      },
      {
        ordem: 3,
        tipo: 'conteudo',
        textoTela: 'Protocolo preventivo real: mapeamento de riscos, canais de apoio, lideranças capacitadas, fluxos claros, monitoramento',
        sugestaoVisual: 'Lista numerada rápida com ícones simples',
      },
      {
        ordem: 4,
        tipo: 'cta',
        textoTela: 'Simule o impacto financeiro na sua empresa no artigo — arraste para cima',
        sugestaoVisual: 'Botão de link em destaque, mesma paleta do site',
        linkSticker: '[LINK]',
      },
    ],
    hashtagsExtras: ['#performanceorganizacional', '#lideranca', '#prevencao'],
  },
];

module.exports = { ROTEIROS_STORIES, HASHTAGS_FIXAS };
