/**
 * Prompts de capa ILUSTRADA de artigo (CLAUDE.md, 20-duodecies).
 *
 * Monta, a partir do título e da categoria, um prompt para gerador de imagem
 * (FLUX via Replicate, Nano Banana…) no padrão do projeto:
 *   - AFIRMATIVO (Regra 18.3): descreve o que deve aparecer — nunca "no/sem/
 *     without". Geradores tendem a desenhar justamente o que foi negado.
 *   - 3D conceitual / claymorphism, só objetos simbólicos e formas abstratas:
 *     sem pessoas, sem fotorrealismo, sem citar estúdio ou marca.
 *   - Paleta institucional: #0d3330, #faf7f2, dourado suave, sálvia dessaturada.
 *   - Imagem sem texto: o título entra no HTML, não na arte (modelo de imagem
 *     escreve letras deformadas). O título só escolhe a metáfora.
 *
 * Formatos: `artigo` = 1200×630 (1,91:1, a capa do site/og:image — Seção 19.3)
 * e `video-vertical` = 1080×1920 (9:16, capa de Reels/Shorts). O 4:5 NÃO
 * existe aqui: carrossel e capa do feed são tipográficos e validados por hash
 * (capaRedes.js, carrosselAprovado.js).
 */
const sharp = require('sharp');

const FORMATOS = {
  artigo: {
    largura: 1200,
    altura: 630,
    proporcaoGerador: '16:9', // o mais próximo que os geradores aceitam; recorta para 1,91:1 depois
    composicao: 'Wide horizontal composition, the main subject placed in the right third, generous calm cream space on the left',
  },
  'video-vertical': {
    largura: 1080,
    altura: 1920,
    proporcaoGerador: '9:16',
    composicao: 'Tall vertical composition, the main subject in the upper-middle area, calm open space in the lower third for on-screen captions',
  },
};

// Tema → metáfora afirmativa. Ordem importa: o primeiro que casar vence.
// Padrões sobre título + categoria sem acento e em minúsculas.
const TEMAS = [
  { id: 'tdah', re: /tdah|deficit de atencao|hiperativ|neurodivergen|foco|concentrac/, metafora: 'A friendly glowing brain gliding along calm, orderly trails of warm light between neatly floating clocks' },
  { id: 'ansiedade', re: /ansiedad|panico|fobia|medo|timidez|preocupac/, metafora: 'A small storm cloud gently dissolving into calm golden light particles inside a serene glass sphere' },
  { id: 'burnout', re: /burnout|esgotament|exaust|sobrecarg|estresse|fadiga/, metafora: 'A glowing battery resting on a tidy minimalist desk beside a small potted plant, steadily recharging with soft golden energy waves' },
  { id: 'depressao', re: /depress|tristez|desanim|anedon/, metafora: 'A tender green sprout rising from soft rounded soil toward a warm window of light' },
  { id: 'sono', re: /sono|insonia|dormir|descanso/, metafora: 'A crescent moon resting on soft rounded clouds above a quiet night lamp with a warm glow' },
  { id: 'luto', re: /luto|perda|divorci|separac/, metafora: 'Two small paper boats floating side by side on still water at a soft golden dawn' },
  { id: 'dependencia', re: /dependenc|adic|alcool|droga|compuls|jogo/, metafora: 'A loosened knot of soft rope gently unwinding into a smooth path that leads toward warm light' },
  { id: 'trabalho', re: /empresa|rh\b|lideranc|gestao|gestor|produtiv|presenteism|corporativ|trabalho|carreira|aposentad/, metafora: 'An isometric calm workspace with a balanced scale, a thriving plant and a softly lit open door' },
  { id: 'saude-profissional', re: /residenc|medic|enferm|plantao|estudant|academ|concurso|pos-graduac/, metafora: 'A stethoscope curving into a soft heart shape beside an open book and a warm desk lamp' },
  { id: 'educadores', re: /professor|docente|escola|educador/, metafora: 'A neat stack of books with a glowing desk lamp and a small plant on a calm wooden table' },
  { id: 'maternidade', re: /puerper|materni|gestac|perinatal|lactac|pos-parto/, metafora: 'A soft crescent-shaped cradle of light holding a small glowing orb, surrounded by gentle floating petals' },
  { id: 'terceira-idade', re: /terceira idade|idoso|envelhec/, metafora: 'A quiet wooden bench beneath a rounded tree with softly falling golden leaves' },
  // Sem "familia": a categoria "Pacientes & Famílias" é de adultos (terapia,
  // autoestima, raiva…) e caía na pipa. "pais" já cobre "Pais & Famílias".
  { id: 'infancia', re: /infancia|adolescen|jovem|jovens|crianc|filho|filha|pais\b/, metafora: 'A small rounded kite rising on a gentle breeze with a soft ribbon trail across a calm sky' },
  { id: 'migracao', re: /migra|expatri|cultur/, metafora: 'A small paper airplane gliding over a soft rounded map toward a warmly lit home' },
  { id: 'cuidado', re: /cuidador|compaixao|voluntari|terceiro setor/, metafora: 'A small watering can tenderly caring for a blooming garden inside a glass dome' },
];
const METAFORA_PADRAO = 'A serene glass sphere holding calm layers of soft light, resting on a smooth rounded pedestal';

const ESTILO =
  '3D conceptual illustration with soft clay-like forms (claymorphism), rounded shapes and gentle matte textures, a scene composed entirely of symbolic objects and abstract shapes';
const LUZ = 'Soft diffuse lighting with a warm ambient glow and a shallow depth of field';
const PALETA =
  'Institutional palette: deep teal (#0d3330), warm cream (#faf7f2), muted soft gold accents and desaturated sage green';
const CLIMA = 'Calm, hopeful and empathetic mood for mental health psychoeducation, clean and uncluttered, a text-free image';

const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Tema do artigo pelo título; a categoria só decide se o título não casar. */
function detectarTema(titulo, categoria) {
  for (const fonte of [normalizar(titulo), normalizar(categoria)]) {
    const tema = TEMAS.find((t) => t.re.test(fonte));
    if (tema) return tema;
  }
  return { id: 'geral', metafora: METAFORA_PADRAO };
}

// Travas do padrão: o prompt final passa por aqui antes de ir ao gerador.
const PROIBIDOS = [
  [/\b(no|not|without|never|avoid|don'?t|sem|nunca|evite|nao)\b/i, 'negação (Regra 18.3: descrever afirmativamente)'],
  [/pixar|ghibli|disney|dreamworks|marvel|anime|octane|unreal engine|midjourney/i, 'marca, estúdio ou motor citado'],
  [/photo-?realistic|photograph|hyper-?real|realistic (face|person|people)|portrait|selfie/i, 'fotorrealismo'],
  [/\b(person|people|man|woman|patient|doctor|nurse|face|faces|child|children|human)\b/i, 'pessoa descrita (capa só com objetos simbólicos)'],
  [/--\w+|\b(4k|8k)\b/i, 'sintaxe de outro gerador (--ar, 8k…)'],
];

function verificarPrompt(prompt) {
  return PROIBIDOS.filter(([re]) => re.test(prompt)).map(([re, motivo]) => `${motivo}: "${prompt.match(re)[0]}"`);
}

/**
 * Prompt da capa + dimensões. Lança se o formato for 4:5 (carrossel é
 * tipográfico) ou se o prompt montado violar o padrão.
 */
function montarPromptCapa({ titulo, categoria, formato = 'artigo' }) {
  if (formato === 'carrossel' || formato === '4:5') {
    throw new Error('carrossel e capa do feed (4:5) são tipográficos e validados por hash — não usam capa ilustrada');
  }
  const f = FORMATOS[formato];
  if (!f) throw new Error(`formato "${formato}" desconhecido — use ${Object.keys(FORMATOS).join(' ou ')}`);
  const tema = detectarTema(titulo, categoria);
  const prompt = [`${tema.metafora}.`, `${ESTILO}.`, `${f.composicao}.`, `${LUZ}.`, `${PALETA}.`, `${CLIMA}.`].join(' ');
  const falhas = verificarPrompt(prompt);
  if (falhas.length) throw new Error(`prompt fora do padrão: ${falhas.join('; ')}`);
  return { prompt, tema: tema.id, largura: f.largura, altura: f.altura, proporcaoGerador: f.proporcaoGerador };
}

/** Recorta (centro) e redimensiona a imagem gerada para a dimensão EXATA do formato. */
async function ajustarDimensao(buffer, formato = 'artigo') {
  const f = FORMATOS[formato];
  if (!f) throw new Error(`formato "${formato}" desconhecido`);
  return sharp(buffer).resize(f.largura, f.altura, { fit: 'cover', position: 'centre' }).png().toBuffer();
}

module.exports = { montarPromptCapa, detectarTema, verificarPrompt, ajustarDimensao, FORMATOS, TEMAS };
