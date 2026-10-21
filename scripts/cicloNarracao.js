/**
 * Ciclo de narração SEM o Claude (Edge-TTS gratuito, voz pt-BR-AntonioNeural). Pensado para o Agendador de Tarefas do Windows
 * (scripts/agendar-tarefas-windows.ps1), todo dia à noite:
 *   0. ao começar, ENVIA o que já estiver pronto de uma execução interrompida (pula o que já está "ok" no banco com o hash certo);
 *   1. pré-gera os MP3 que faltam em ordem de DATA DE PUBLICAÇÃO (publicados primeiro; lotes de 50, até --lotes=N, padrão 4);
 *   2. ENVIO INCREMENTAL: a cada 10 áudios gerados, confere (duração, decodificação, tamanho, vinheta) e envia ao Blob na hora.
 *      Uma interrupção (Ctrl+C, queda de energia, janela fechada) perde no máximo os 10 em andamento; o que já foi enviado fica
 *      ("aguardando publicação": o site só toca o áudio depois que o texto for publicado e enquanto o hash conferir);
 *   3. no fim, um último envio e a anotação em relatorios/narracao-progresso.md.
 * Texto editado depois de narrado: o selo não bate, o áudio não toca e o texto volta para a fila do passo 1 (regeneração).
 *   node scripts/cicloNarracao.js [--lotes=4] [--so-enviar] [--grupo=10]
 */
require('./carregarEnv').carregarEnv(); // .env carregado aqui (sem --env-file na linha de comando)
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1];
const roda = (args) => spawnSync(process.execPath, [...args], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 4 * 3600e3 });
const PROG = path.join(RAIZ, 'relatorios', 'narracao-progresso.md');
const nota = (t) => fs.appendFileSync(PROG, `${t}\n`, 'utf8');
const agora = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Bahia' });
const log = (t) => console.log(`[${agora()}] ${t}`);
const GRUPO = Math.max(1, Number(arg('grupo', 10)));

/**
 * Áudio reprovado na conferência (duração fora da faixa, corte, decodificação com erro) NÃO pode ficar preso: sem isto o MP3 ruim continuaria
 * "pronto" e nunca seria regerado. Vai para narracoes-geradas/_reprovados/ (para inspeção) e o texto volta para a fila de geração.
 */
const REVISAR = path.join(RAIZ, 'relatorios', 'narracao-revisar.json'); // textos que reprovaram 2x: saem do ciclo até alguém olhar
function descartarReprovados(saida) {
  const motivos = new Map([...String(saida || '').matchAll(/REPROVADO ([a-z0-9-]+): ([^\n]*)/g)].map((m) => [m[1], m[2].slice(0, 160)]));
  let revisar = {}; try { revisar = JSON.parse(fs.readFileSync(REVISAR, 'utf8')); } catch { /* primeira vez */ }
  const pasta = path.join(RAIZ, 'narracoes-geradas'), lixo = path.join(pasta, '_reprovados');
  for (const [slug, motivo] of motivos) {
    const r = revisar[slug] = { tentativas: ((revisar[slug] && revisar[slug].tentativas) || 0) + 1, motivo, em: new Date().toISOString() };
    fs.mkdirSync(lixo, { recursive: true });
    for (const ext of ['.mp3', '.base.mp3', '.hash', '.vinheta', '.txt']) {
      const o = path.join(pasta, slug + ext);
      if (fs.existsSync(o)) fs.renameSync(o, path.join(lixo, slug + ext));
    }
    log(r.tentativas >= 2 ? `áudio reprovado ${r.tentativas}x ("${motivo}"): FORA do ciclo até revisão (relatorios/narracao-revisar.json)` : `áudio reprovado na conferência, descartado para regerar (tentativa ${r.tentativas}): ${slug}`);
  }
  if (motivos.size) fs.writeFileSync(REVISAR, JSON.stringify(revisar, null, 1), 'utf8');
  return motivos.size;
}

/** Envia o que está pronto (MP3 com selo de hash válido e que ainda não está "ok" no banco). Repetir é seguro: o que já está enviado é pulado. */
function enviarProntos(rotulo) {
  const r = roda(['backend/scripts/enviarNarracoesPublicadas.js', '--agendados', '--enviar']);
  const linha = ((r.stdout || '').split('\n').find((l) => /ENVIAR · aprovados/.test(l)) || (r.stdout || '').split('\n')[0] || '').trim();
  log(`envio (${rotulo}): ${linha || 'nada a enviar'}`);
  descartarReprovados(r.stdout);
  return r;
}

let geradas = 0, falhas = 0, interrompido = false;
if (!process.argv.includes('--so-enviar')) {
  enviarProntos('início: o que ficou pronto de execuções anteriores'); // retomada
  const lotes = Number(arg('lotes', 4));
  for (let i = 0; i < lotes && !interrompido; i++) {
    const lote = (roda(['backend/scripts/proximoLoteNarracao.js', '--pre-gerar', '--n=50']).stdout || '').trim();
    if (!lote) break;
    const slugs = lote.split(',');
    for (let k = 0; k < slugs.length; k += GRUPO) {
      const grupo = slugs.slice(k, k + GRUPO);
      const r = roda(['backend/tools/narrar-artigos.js', `--slugs=${grupo.join(',')}`, '--provedor=edge', '--incluir-agendados']);
      const f = ((r.stdout || '').match(/FALHOU/g) || []).length;
      falhas += f; geradas += grupo.length - f;
      log(`lote ${i + 1}, grupo ${k / GRUPO + 1}: ${grupo.length - f} gerados, ${f} falhas`);
      enviarProntos(`lote ${i + 1}, grupo ${k / GRUPO + 1}`); // incremental
      if (falhas > 3) { interrompido = true; break; } // Edge-TTS instável: tenta de novo na próxima noite
    }
  }
}
const env = enviarProntos('final');
const resumo = roda(['backend/scripts/proximoLoteNarracao.js', '--resumo']).stdout.trim().split('\n').pop();
const linhaEnvio = ((env.stdout || '').split('\n').find((l) => /ENVIAR · aprovados/.test(l)) || (env.stdout || '').split('\n')[0] || '').trim();
nota(`\n## Ciclo automático — ${agora()}\n- Pré-geradas nesta execução: ${geradas} · falhas de geração: ${falhas}${interrompido ? ' · parou cedo (Edge-TTS instável)' : ''}\n- ${linhaEnvio}\n- Estado geral: ${resumo}`);
console.log(`ciclo ok · geradas ${geradas} · falhas ${falhas}\n${linhaEnvio}\n${resumo}`);
process.exit(env.status || 0);
