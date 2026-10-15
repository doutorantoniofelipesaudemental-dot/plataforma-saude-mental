/**
 * Ciclo de narração SEM o Claude (Edge-TTS gratuito, voz pt-BR-AntonioNeural). Pensado para o Agendador de Tarefas do Windows
 * (scripts/agendar-tarefas-windows.ps1), todo dia à noite:
 *   1. pré-gera os MP3 que faltam (publicados primeiro, depois agendados; lotes de 50, até --lotes=N, padrão 4);
 *   2. confere (duração, decodificação, tamanho) e envia todos os MP3 com selo de hash válido, publicados e agendados
 *      ("aguardando publicação": o site só toca o áudio depois que o texto for publicado e enquanto o hash conferir);
 *   3. anota o resultado em relatorios/narracao-progresso.md.
 * Texto editado depois de narrado: o selo não bate, o áudio não toca e o texto volta para a fila do passo 1 (regeneração).
 *   node scripts/cicloNarracao.js [--lotes=4] [--so-enviar]
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1];
const roda = (args) => spawnSync(process.execPath, ['--env-file=.env', ...args], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 4 * 3600e3 });
const PROG = path.join(RAIZ, 'relatorios', 'narracao-progresso.md');
const nota = (t) => fs.appendFileSync(PROG, `${t}\n`, 'utf8');
const agora = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Bahia' });

let geradas = 0, falhas = 0;
if (!process.argv.includes('--so-enviar')) {
  const lotes = Number(arg('lotes', 4));
  for (let i = 0; i < lotes; i++) {
    const lote = (roda(['backend/scripts/proximoLoteNarracao.js', '--pre-gerar', '--n=50']).stdout || '').trim();
    if (!lote) break;
    const r = roda(['backend/tools/narrar-artigos.js', `--slugs=${lote}`, '--provedor=edge', '--incluir-agendados']);
    const saida = `${r.stdout || ''}`;
    const f = (saida.match(/FALHOU/g) || []).length;
    falhas += f; geradas += lote.split(',').length - f;
    if (f > 3) break; // Edge-TTS instável: tenta de novo na próxima noite
  }
}
const env = roda(['backend/scripts/enviarNarracoesPublicadas.js', '--agendados', '--enviar']);
const resumo = roda(['backend/scripts/proximoLoteNarracao.js', '--resumo']).stdout.trim().split('\n').pop();
const linhaEnvio = ((env.stdout || '').split('\n').find((l) => /ENVIAR · aprovados/.test(l)) || (env.stdout || '').split('\n')[0] || '').trim();
nota(`\n## Ciclo automático — ${agora()}\n- Pré-geradas nesta execução: ${geradas} · falhas de geração: ${falhas}\n- ${linhaEnvio}\n- Estado geral: ${resumo}`);
console.log(`ciclo ok · geradas ${geradas} · falhas ${falhas}\n${linhaEnvio}\n${resumo}`);
process.exit(env.status || 0);
