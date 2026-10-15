/**
 * Publicação autônoma multi-plataforma.
 *   node backend/tools/publicar-autonomo.js            fila real (carrosseis-instagram/_fila/*.json), AO VIVO
 *   node backend/tools/publicar-autonomo.js --teste    teste simulado (rascunhos embutidos, nenhuma rede tocada)
 *   --sem-llm   só regras determinísticas (sem Ollama)
 */
const fs = require('node:fs');
const path = require('node:path');
const { processarFila, imprimir } = require('../lib/agents/actionOrchestrator');

const args = new Set(process.argv.slice(2));
const FILA = path.resolve(__dirname, '../../carrosseis-instagram/_fila');

// Rascunho 1: falha de propósito (sem SUS/avisos, "frescura", dose sem trava, revisão "aprovada",
//             slug inválido, imagem com marca d'água simulada) → exercita auto-correção e regeração.
// Rascunho 2: sem título → não corrigível automaticamente → retirado da fila.
const IDENT = 'Dr. Antônio Felipe · Médico · CRM-BA 41322\nEspecialista em Medicina de Família e Comunidade · RQE 26638\nAtuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)';
const RASCUNHOS_TESTE = [
  {
    id: 'ansiedade-noturna', tema: 'ansiedade à noite', titulo: 'Ansiedade à noite: o que ajuda', slug: 'Ansiedade Noturna!', revisaoMedica: 'aprovado',
    redes: ['instagram', 'youtube', 'linkedin'], tipo: 'carrossel', imagens: [{ simulaMarcaDagua: true }, { simulaMarcaDagua: false }],
    legenda: `Você não aguenta a ansiedade? Não é frescura. TODO revisar.\nSe houver indicação, quem decide a medicação (por exemplo, 10 mg) é o médico, após avaliação.\nRespirar devagar é uma estratégia de apoio.\n\n${IDENT}`,
  },
  { id: 'sem-titulo', tema: 'sono', slug: 'sono', revisaoMedica: 'pendente', redes: ['instagram'], imagens: [], legenda: `Dormir mal afeta o humor.\n\n${IDENT}` },
];

(async () => {
  const simulado = args.has('--teste') || args.has('--simulado');
  const usarLlm = !args.has('--sem-llm');
  let fila;
  if (args.has('--teste')) fila = RASCUNHOS_TESTE;
  else {
    fila = fs.existsSync(FILA) ? fs.readdirSync(FILA).filter((f) => f.endsWith('.json')).map((f) => ({ ...JSON.parse(fs.readFileSync(path.join(FILA, f), 'utf8')), _arquivo: path.join(FILA, f) })) : [];
    if (!fila.length) return console.log(`Fila vazia (${FILA}). Nada a publicar.`);
  }
  imprimir(await processarFila(fila, { simulado, usarLlm }));
})().catch((e) => { console.error(e); process.exit(1); });
