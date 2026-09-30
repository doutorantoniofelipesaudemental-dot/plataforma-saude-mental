/**
 * Ideação editorial com aprovação prévia do Dr. Antônio Felipe.
 *   npm run bot:ideacao -- --propor [--n=6] [--tema="burnout na APS"] [--tipo=artigo-cientifico|cronica]
 *   npm run bot:ideacao -- --demanda="texto do pedido do médico" [--tipo=cronica]
 *   npm run bot:ideacao -- --listar
 *   npm run bot:ideacao -- --aprovar=<id>   |   --rejeitar=<id>
 *
 * Só grava CONTEUDO_INSTAGRAM/pautas/ (pautas.json e PAUTAS.md). Não escreve artigo,
 * não publica, não toca na fila. Depois de aprovada a pauta e publicado o artigo:
 * npm run bot:gerar-posts -- --slug=<slug> deriva o ecossistema omnichannel.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
for (const arquivo of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(RAIZ, arquivo))) process.loadEnvFile(path.join(RAIZ, arquivo));
}

const { gerarJson } = require('../backend/lib/llm');
const ideacao = require('../backend/lib/ideacao');
const metasEditoriais = require('../backend/lib/metasEditoriais');

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, ...resto] = a.replace(/^--/, '').split('=');
    args[chave] = resto.length ? resto.join('=') : true;
  }
  return args;
}

const resumo = (r) => `  [${r.status}] ${r.id}\n      ${r.titulo}${r.problemas?.length ? `\n      ⚠ ${r.problemas.join('; ')}` : ''}`;

/**
 * Acervo do MongoDB (artigos publicados: título, resumo, categoria e tags), lido direto, sem paginação
 * da API. Serve à checagem de originalidade e a "não repita estes títulos".
 */
async function carregarAcervo() {
  try {
    const db = require('../backend/lib/db');
    const Artigo = require('../backend/models/Artigo');
    await db.connect();
    const acervo = await Artigo.find({ publicado: true }).select('titulo resumo categoria tags slug').lean();
    await db.mongoose.disconnect();
    return { acervo, indisponivel: false };
  } catch (err) {
    console.log(`\n  ⚠ acervo do banco indisponível (${err.message}): a originalidade NÃO pôde ser verificada — as pautas saem marcadas e não podem ser aprovadas.\n`);
    return { acervo: [], indisponivel: true };
  }
}

/** Artigos publicados por categoria, direto do banco (sem paginação). Null se o banco não responder. */
async function contarPorCategoria() {
  try {
    const db = require('../backend/lib/db');
    const Artigo = require('../backend/models/Artigo');
    await db.connect();
    const grupos = await Artigo.aggregate([{ $match: { publicado: true } }, { $group: { _id: '$categoria', n: { $sum: 1 } } }]);
    await db.mongoose.disconnect();
    return Object.fromEntries(grupos.map((g) => [g._id, g.n]));
  } catch (err) {
    console.log(`\n  (banco indisponível: ${err.message} — progresso atual não calculado)`);
    return null;
  }
}

async function main() {
  const args = argumentos();
  const registros = ideacao.lerRegistros();

  // `npm run bot:ideacao --listar` (sem `--`) é engolido pelo npm e chega como npm_config_listar.
  if (args.listar || process.env.npm_config_listar) {
    console.log(registros.length ? registros.map(resumo).join('\n') : '  Nenhuma pauta ainda.');
    const metas = metasEditoriais.lerMetas();
    if (metas) {
      const contagem = await contarPorCategoria();
      console.log(`\n${metasEditoriais.renderizarProgresso(metas, metasEditoriais.calcularProgresso(metas, contagem))}\n`);
    }
    return;
  }
  // --aprovar=todas [--lote=N]: aprova as pautas em "proposta" e sem problemas (rejeitadas e com problemas ficam de fora).
  if (args.aprovar === 'todas') {
    const alvo = registros.filter((r) => r.status === 'proposta' && (!args.lote || r.lote === Number(args.lote)));
    const aprovadas = [];
    const puladas = [];
    for (const r of alvo) {
      try {
        ideacao.mudarStatus(registros, r.id, 'aprovada');
        aprovadas.push(r);
      } catch (err) {
        puladas.push(`${r.titulo} — ${err.message}`);
      }
    }
    ideacao.gravarRegistros(registros);
    console.log(`  ${aprovadas.length} pauta(s) aprovada(s) por Dr. Antônio Felipe.`);
    if (puladas.length) console.log(`  ${puladas.length} pulada(s):\n${puladas.map((p) => `    - ${p}`).join('\n')}`);
    return;
  }
  for (const [flag, status] of [['aprovar', 'aprovada'], ['rejeitar', 'rejeitada']]) {
    if (typeof args[flag] === 'string') {
      const r = ideacao.mudarStatus(registros, args[flag], status);
      ideacao.gravarRegistros(registros);
      console.log(`  ${status}: ${r.titulo}`);
      return;
    }
  }
  if (typeof args.demanda === 'string') {
    const r = ideacao.criarDemanda(args.demanda, { tipo: args.tipo === 'cronica' ? 'cronica' : 'artigo-cientifico' });
    ideacao.gravarRegistros([...registros, r]);
    console.log(`  Demanda registrada (aguarda sua aprovação):\n${resumo(r)}`);
    return;
  }
  // --redigir [--lote=N] [--id=<id>] [--limite=N]: rascunho em Markdown das pautas APROVADAS, com as 3 checagens
  // automáticas (humanização, ética/CFM, originalidade). Passou → status "redigida" vinculado ao slug/ID.
  if (args.redigir) {
    const rascunhos = require('../backend/lib/rascunhoArtigo');
    const { acervo, indisponivel } = await carregarAcervo();
    if (indisponivel) throw new Error('sem o acervo do banco a originalidade não pode ser checada — rascunhos não gerados');
    const alvo = registros
      .filter((r) => r.status === 'aprovada' && (!args.lote || r.lote === Number(args.lote)) && (typeof args.id !== 'string' || r.id === args.id))
      .slice(0, Number(args.limite) || 999);
    if (!alvo.length) {
      console.log('  Nenhuma pauta aprovada (e ainda sem rascunho) para redigir.');
      return;
    }
    const slugsUsados = new Set([...acervo.map((a) => a.slug).filter(Boolean), ...registros.map((r) => r.rascunho?.slug).filter(Boolean)]);
    const gerar = async ({ sistema, usuario, schema }) => (await gerarJson({ sistema, usuario, schema })).dados;
    let ok = 0;
    for (const [i, pauta] of alvo.entries()) {
      const outros = registros.filter((r) => r.status === 'redigida' && r.id !== pauta.id).map((r) => ({ titulo: r.titulo, resumo: r.pauta }));
      try {
        const r = await rascunhos.gerarRascunho(pauta, { gerar, acervo, outros, slugsUsados });
        if (r.ok) {
          const arquivo = rascunhos.gravarRascunho(r.slug, r.md);
          ideacao.marcarRedigida(registros, pauta.id, { arquivo: path.relative(RAIZ, arquivo).split(path.sep).join('/'), slug: r.slug, checagens: r.checagens });
          slugsUsados.add(r.slug);
          ok++;
          console.log(`  [${i + 1}/${alvo.length}] redigida (${r.tentativas} tentativa(s)): ${pauta.titulo}`);
        } else {
          const arquivo = rascunhos.gravarRascunho(r.slug, r.md, path.join(rascunhos.PASTA_RASCUNHOS, '_reprovados'));
          pauta.ultimaTentativaRascunho = { em: new Date().toISOString(), arquivo: path.relative(RAIZ, arquivo).split(path.sep).join('/'), motivo: r.checagens.motivo };
          console.log(`  [${i + 1}/${alvo.length}] REPROVADO nas checagens após ${r.tentativas} tentativas: ${pauta.titulo}
      ${r.checagens.motivo.slice(0, 300)}`);
        }
      } catch (err) {
        console.log(`  [${i + 1}/${alvo.length}] FALHOU: ${pauta.titulo} — ${err.message.slice(0, 200)}`);
      }
      ideacao.gravarRegistros(registros); // grava a cada pauta
    }
    console.log(`
  ${ok}/${alvo.length} pauta(s) redigida(s). Rascunhos em CONTEUDO_INSTAGRAM/pautas/rascunhos/ — revisão médica pendente em todos.
`);
    return;
  }
  if (args.reverificar) {
    const { acervo, indisponivel } = await carregarAcervo();
    if (indisponivel) throw new Error('sem acervo do banco não há como reverificar');
    const alteradas = ideacao.reverificarOriginalidade(registros, acervo);
    ideacao.gravarRegistros(registros);
    console.log(alteradas.length ? `  ${alteradas.length} pauta(s) rejeitada(s) por originalidade:
${alteradas.map(resumo).join('\n')}` : '  Nenhuma pauta reprovada: todas as propostas são originais.');
    return;
  }
  if (args.lote) {
    const numero = Number(args.lote);
    const plano = ideacao.LOTES[numero];
    if (!plano) throw new Error(`lote ${args.lote} não definido (existem: ${Object.keys(ideacao.LOTES).join(', ')})`);
    const doLote = registros.filter((r) => r.lote === numero);
    if (doLote.length && !args.forcar && !args.completar) throw new Error(`o lote ${numero} já foi gerado — use --completar (repõe as rejeitadas por originalidade) ou --forcar (refaz tudo)`);
    const mantidas = args.forcar ? registros.filter((r) => r.lote !== numero) : registros;
    const { acervo, indisponivel } = await carregarAcervo();
    const geradas = [];
    const todas = () => [...mantidas, ...geradas];
    for (const { grupo, quantidade, temas } of ideacao.normalizarPlano(plano)) {
      const g = ideacao.GRUPOS[grupo];
      const validas = () => todas().filter((r) => r.lote === numero && r.categoria === grupo && r.status !== 'rejeitada').length;
      let provedor = '';
      // 1) Temas pedidos pelo médico: uma chamada dirigida por tema. Se a trava de originalidade rejeitar,
      //    o motivo (artigo mais próximo) volta ao modelo para ele mudar o ÂNGULO, sem sair do tema.
      for (const tema of temas) {
        const cumprido = () => todas().some((r) => r.lote === numero && r.categoria === grupo && r.temaPedido === tema && r.status !== 'rejeitada');
        const recusas = [];
        for (let rodada = 0; rodada < 5 && !cumprido(); rodada++) {
          const evitar = [...acervo.map((a) => a.titulo), ...todas().filter((r) => r.status !== 'rejeitada').map((r) => r.titulo)];
          const usuario = [
            `Proponha EXATAMENTE 1 pauta INÉDITA da categoria "${grupo}" sobre este tema pedido pelo médico: "${tema}".`,
            `Contexto da categoria: ${g.instrucao}`,
            `Tipo "${g.tipo}", título com até 90 caracteres. Ela precisa ser ORIGINAL: não pode copiar, parafrasear nem repetir o assunto de nenhum título existente. Escolha um ângulo específico e diferente (população, cenário, momento do cuidado, conduta) mantendo o tema pedido.`,
            recusas.length ? `Tentativas anteriores REJEITADAS por redundância (mude de ângulo): ${recusas.join(' || ')}` : '',
            `Títulos já existentes: ${evitar.slice(-160).join(' | ') || 'nenhum'}.`,
          ].filter(Boolean).join('\n');
          const r = await gerarJson({ sistema: ideacao.SISTEMA_IDEACAO, usuario, schema: ideacao.SCHEMA_IDEACAO });
          provedor = r.provedor;
          const recebidas = r.dados.propostas.filter((p) => p.tipo === g.tipo).slice(0, 1);
          const novas = ideacao.criarPropostas(recebidas, { acervo, existentes: todas(), acervoIndisponivel: indisponivel, categoria: grupo, lote: numero, deslocamento: todas().length, extra: { temaPedido: tema } });
          geradas.push(...novas);
          ideacao.gravarRegistros(todas());
          for (const n of novas.filter((x) => x.status === 'rejeitada')) {
            recusas.push(`"${n.titulo}" (${n.problemas.find((x) => /^originalidade/.test(x)) || 'redundante'})`);
            console.log(`  ${grupo} · tema pedido (rodada ${rodada + 1}) rejeitado por originalidade:\n${resumo(n)}`);
          }
        }
        console.log(`  ${grupo} · tema "${tema.slice(0, 60)}…": ${cumprido() ? 'pauta original gerada' : 'NÃO foi possível gerar uma pauta original'}`);
      }
      // Até 4 rodadas: pautas rejeitadas por originalidade são repostas, para o lote fechar com a quantidade pedida.
      for (let rodada = 0; rodada < 4 && validas() < quantidade; rodada++) {
        const faltam = quantidade - validas();
        const evitar = [...acervo.map((a) => a.titulo), ...todas().map((r) => r.titulo)];
        const usuario = [
          `Proponha EXATAMENTE ${faltam} pautas INÉDITAS para a categoria "${grupo}": ${g.instrucao}`,
          `Todas do tipo "${g.tipo}". Títulos distintos entre si e com até 90 caracteres. Cada pauta deve tratar de um ASSUNTO clínico ou humano que ainda não foi coberto: não é aceito copiar, parafrasear nem repetir o tema dos títulos já existentes.`,
          `Títulos já existentes (não repita nem reformule o assunto): ${evitar.slice(-160).join(' | ') || 'nenhum'}.`,
        ].join('\n');
        const r = await gerarJson({ sistema: ideacao.SISTEMA_IDEACAO, usuario, schema: ideacao.SCHEMA_IDEACAO });
        provedor = r.provedor;
        const recebidas = r.dados.propostas.filter((p) => p.tipo === g.tipo).slice(0, faltam);
        const novas = ideacao.criarPropostas(recebidas, { acervo, existentes: todas(), acervoIndisponivel: indisponivel, categoria: grupo, lote: numero, deslocamento: todas().length });
        geradas.push(...novas);
        ideacao.gravarRegistros(todas()); // grava a cada rodada: nada se perde se uma falhar
        const rej = novas.filter((n) => n.status === 'rejeitada');
        if (rej.length) console.log(`  ${grupo}: ${rej.length} pauta(s) rejeitada(s) por originalidade (rodada ${rodada + 1}):
${rej.map(resumo).join('\n')}`);
      }
      console.log(`  ${grupo}: ${validas()}/${quantidade} pauta(s) originais (${provedor || 'sem chamada ao modelo'})${validas() < quantidade ? ' — MENOS que o pedido' : ''}`);
    }
    const doLoteFinal = todas().filter((r) => r.lote === numero);
    const rejeitadas = doLoteFinal.filter((r) => r.status === 'rejeitada').length;
    const comProblema = doLoteFinal.filter((r) => r.status !== 'rejeitada' && r.problemas.length).length;
    console.log(`
  Lote ${numero}: ${doLoteFinal.length - rejeitadas} pauta(s) válida(s), ${rejeitadas} rejeitada(s) por originalidade, ${comProblema} com problema(s). Leia CONTEUDO_INSTAGRAM/pautas/PAUTAS.md e decida com --aprovar/--rejeitar.
`);
    return;
  }
  if (args.propor) {
    const { acervo, indisponivel } = await carregarAcervo();
    const n = Math.min(Math.max(Number(args.n) || 6, 1), 12);
    const tipo = ideacao.TIPOS.includes(args.tipo) ? args.tipo : null;
    const usuario = [
      `Proponha ${n} pautas${tipo ? ` do tipo "${tipo}"` : ' (mistura de artigos científicos e crônicas, mais artigos)'}.`,
      args.tema ? `Tema pedido pelo médico: ${args.tema}.` : 'Sem tema definido: varie entre saúde mental na APS, sono, ansiedade, humor, trabalho e cuidadores.',
      `Já publicados (não repita nem reformule o assunto): ${acervo.slice(0, 160).map((a) => a.titulo).join(' | ') || 'nenhum informado'}.`,
    ].join('\n');
    const { dados, provedor } = await gerarJson({ sistema: ideacao.SISTEMA_IDEACAO, usuario, schema: ideacao.SCHEMA_IDEACAO });
    const novas = ideacao.criarPropostas(dados.propostas, { acervo, existentes: registros, acervoIndisponivel: indisponivel });
    ideacao.gravarRegistros([...registros, ...novas]);
    console.log(`\n  ${novas.length} pauta(s) proposta(s) por ${provedor}. Leia CONTEUDO_INSTAGRAM/pautas/PAUTAS.md e decida:\n${novas.map(resumo).join('\n')}\n`);
    return;
  }
  console.log('\n  Use --propor [--n=6 --tema="..." --tipo=...], --demanda="...", --listar, --aprovar=<id> ou --rejeitar=<id>.\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('  ERRO:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { main };
