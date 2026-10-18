/**
 * Gera, para UM post da fila, o script (função assíncrona) que o Claude executa na página de publicação do LinkedIn
 * (agendador NATIVO, perfil pessoal, sessão do Chrome do Dr. Antônio já logada). Não guarda nem lê senha, cookie ou token.
 *   node --env-file=.env scripts/linkedin/gerarScriptAgendar.js <id> <passo> [saida.js]
 *     passo = "texto"   insere o texto no editor (só se estiver vazio) e abre o agendador
 *     passo = "data"    preenche data e hora (19:30 Bahia) e confere o rótulo "Publicação em ..."
 *     passo = "agendar" confirma o horário e clica em Agendar (NUNCA em Publicar)
 *     passo = "tudo"    os três em sequência; PARA no primeiro problema
 * Regra (CLAUDE.md): só entra post que passou na auditoria + tripla checagem (scripts/linkedin/preAgendamento.js).
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const DIAS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const PAUSA = 'const esp = (a, b) => new Promise((r) => setTimeout(r, a + Math.random() * (b - a)));';

function corpoTexto(it) {
  return `${PAUSA}
  const texto = ${JSON.stringify(it.texto)};
  const achar = () => [...document.querySelectorAll('[contenteditable="true"]')].find((e) => e.offsetParent !== null && e.getBoundingClientRect().width > 300);
  let ed = achar();
  for (let k = 0; !ed && k < 20; k++) { await esp(900, 1300); ed = achar(); }
  if (!ed) return { erro: 'editor não encontrado' };
  if (ed.innerText.trim().length > 0) return { erro: 'o editor já tem texto: não vou escrever por cima', caracteres: ed.innerText.length };
  await esp(1200, 2200); ed.focus(); await esp(600, 1200);
  const linhas = texto.split('\\n');
  for (let i = 0; i < linhas.length; i++) { if (linhas[i]) document.execCommand('insertText', false, linhas[i]); if (i < linhas.length - 1) document.execCommand('insertParagraph', false); if (i % 5 === 4) await esp(300, 700); }
  await esp(1000, 1800);
  // o ícone do relógio é o link logo à esquerda do botão Publicar (o rótulo muda: "Agendamento realizado" ou o número de posts já agendados)
  const pub = [...document.querySelectorAll('button')].find((b) => b.offsetParent !== null && (b.innerText || '').trim() === 'Publicar');
  if (!pub) return { erro: 'botão Publicar não encontrado', caracteres: ed.innerText.length };
  const pr = pub.getBoundingClientRect();
  const rel = [...document.querySelectorAll('a,button')].filter((x) => x.offsetParent !== null && x !== pub).find((x) => { const r = x.getBoundingClientRect(); return Math.abs(r.top - pr.top) < 25 && r.left < pr.left && pr.left - r.left < 140; });
  if (!rel) return { erro: 'ícone do agendador não encontrado', caracteres: ed.innerText.length };
  rel.click(); await esp(2200, 3200);
  return { id: ${JSON.stringify(it._id)}, caracteres: ed.innerText.length, inicio: ed.innerText.slice(0, 50), agendadorAberto: !!document.querySelector('input[placeholder="dd/mm/aaaa"]') };`;
}

function corpoData(dataBr, rotulo) {
  return `${PAUSA}
  const setar = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; el.focus(); s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const dt = document.querySelector('input[placeholder="dd/mm/aaaa"]');
  if (!dt) return { erro: 'campo de data não encontrado' };
  const hr = [...document.querySelectorAll('input')].filter((i) => i.offsetParent !== null && i !== dt).find((i) => i.getBoundingClientRect().top > dt.getBoundingClientRect().top);
  await esp(900, 1600); setar(dt, ${JSON.stringify(dataBr)}); await esp(900, 1500);
  hr.focus(); await esp(500, 900); setar(hr, '19:30'); await esp(1200, 1800);
  const op = [...document.querySelectorAll('[role=option],li,div')].find((e) => e.offsetParent !== null && e.children.length <= 3 && e.innerText && e.innerText.trim() === '19:30' && e.getBoundingClientRect().top > dt.getBoundingClientRect().top + 60);
  if (op) { op.click(); await esp(900, 1500); }
  const lab = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /Publicação em/.test(e.innerText || '')).map((e) => e.innerText.trim());
  return { data: dt.value, hora: hr.value, rotulo: lab, esperado: ${JSON.stringify(rotulo)}, confere: lab.includes(${JSON.stringify(rotulo)}) };`;
}

function corpoAgendar(id, rotulo) {
  return `${PAUSA}
  const conf = [...document.querySelectorAll('button')].find((x) => x.offsetParent !== null && (x.innerText || '').trim() === 'Confirmar');
  if (!conf) return { erro: 'botão Confirmar não encontrado' };
  await esp(800, 1500); conf.click(); await esp(1800, 2600);
  const ag = [...document.querySelectorAll('button')].find((x) => x.offsetParent !== null && (x.innerText || '').trim() === 'Agendar');
  if (!ag) return { erro: 'botão Agendar não encontrado (não clico em Publicar)' };
  const rot = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /Publicação em/.test(e.innerText || '')).map((e) => e.innerText.trim());
  if (!rot.includes(${JSON.stringify(rotulo)})) return { erro: 'rótulo diferente do esperado', rot };
  await esp(900, 1600); ag.click(); await esp(3000, 4200);
  const av = [...document.querySelectorAll('[role=alert],.artdeco-toast-item')].map((x) => (x.innerText || '').trim()).filter((t) => /agendad|Publicação/i.test(t)).slice(0, 2);
  // sucesso só com o aviso "Publicação agendada"; qualquer outra coisa (ex.: "Você atingiu o limite de publicações de hoje") é erro e PARA tudo
  const limite = /atingiu o limite|limite de publica|verifica|segurança|atividade incomum/i.test(document.body.innerText) ? (document.body.innerText.match(/Você atingiu[^.]*\\./) || ['aviso do LinkedIn na tela'])[0] : '';
  if (limite) return { erro: 'o LinkedIn barrou o agendamento: ' + limite, id: ${JSON.stringify(id)} };
  if (!av.some((t) => /Publicação agendada/i.test(t))) return { erro: 'sem o aviso "Publicação agendada": não conto como agendado', avisos: av, id: ${JSON.stringify(id)} };
  return { id: ${JSON.stringify(id)}, avisos: av, url: location.pathname };`;
}

(async () => {
  const [id, passo, saida] = process.argv.slice(2);
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const it = await mongoose.connection.db.collection('linkedin_fila').findOne({ _id: id });
  await mongoose.disconnect();
  if (!it) throw new Error(`item não encontrado: ${id}`);
  const d = new Date(new Date(it.slot).getTime() - 3 * 3600e3);
  const iso = d.toISOString().slice(0, 10);
  const dataBr = `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}/${iso.slice(0, 4)}`.replace(/^(\d)\//, '0$1/').replace(/\/(\d)\//, '/0$1/');
  const rotulo = `Publicação em ${DIAS[d.getUTCDay()]}, ${Number(iso.slice(8, 10))} de ${MESES[d.getUTCMonth()]}, 19:30`;
  const T = corpoTexto(it), D = corpoData(dataBr, rotulo), A = corpoAgendar(id, rotulo);
  let codigo;
  if (passo === 'tudo') {
    codigo = `async () => {
  const A = async () => { ${T} };
  const B = async () => { ${D} };
  const C = async () => { ${A} };
  const a = await A(); if (!a || a.erro || !a.agendadorAberto) return { fase: 'texto', a };
  const b = await B(); if (!b || !b.confere) return { fase: 'data', b };
  const c = await C(); if (!c || c.erro) return { fase: 'agendar', c }; return { id: ${JSON.stringify(id)}, caracteres: a.caracteres, rotulo: b.rotulo, agendado: c };
}
`;
  } else if ({ texto: T, data: D, agendar: A }[passo]) codigo = `async () => {\n  ${{ texto: T, data: D, agendar: A }[passo]}\n}\n`;
  else throw new Error('passo: texto | data | agendar | tudo');
  const arq = saida || path.join(process.env.TEMP, `li-${id}-${passo}.js`);
  fs.writeFileSync(arq, codigo, 'utf8');
  console.log(arq);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
