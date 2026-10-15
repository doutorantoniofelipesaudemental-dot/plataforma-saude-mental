/**
 * Calendário de publicação do site (PROMPT-MESTRE, decisão 7): 11 itens por dia útil, de segunda a sexta,
 * a partir de 19/10/2026, sem feriados. Horários America/Bahia (UTC-3, sem horário de verão).
 *
 * Regras:
 *  - série Corpo e Saúde Mental: por numero_serie, 1 a 2 por dia, distribuída para terminar junto;
 *  - demais: ordem de semana_publicacao (Plano 180), alternando os públicos em rodízio;
 *  - artigo e relato ligados saem no mesmo dia (artigo antes, relato depois, nunca em horários seguidos);
 *  - nunca a mesma categoria/tema em horários seguidos (inclusive na virada do dia).
 */
// 11 por dia útil (autorização de 14/10/2026). Horários de hora em hora (08:00–18:00): suposição minha, pois o item 8 do pedido veio cortado.
const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const POR_DIA = HORARIOS.length;
const INICIO = '2026-10-19';
const FERIADOS = new Set(['2026-11-02', '2026-11-20', '2026-12-08']);

const PUBLICO_POR_CATEGORIA = {
  'Pais & Famílias': 'pais', 'Infância & Adolescência': 'pais', 'Educadores & Professores': 'pais',
  'Médicos & Enfermeiros': 'profissionais', 'Residentes & Estudantes': 'profissionais', 'Pós-Graduação & Concursos': 'profissionais',
  'Empresas & RH': 'empresas',
};
// Tema = assunto do texto (não só a categoria): evita, por exemplo, dois textos sobre apostas em horários seguidos.
const TEMAS = [
  ['apostas', /aposta|bets?\b|jogo-patologico|jogos?-online/], ['ia', /(^|-)ia(-|$)|chatbot|aplicativo|inteligencia-artificial|terapeuta/],
  ['burnout', /burnout|esgotamento|fadiga/], ['suicidio', /suicid|autolesao|automutilacao/], ['luto', /luto|perda/], ['bullying', /bullying|cyberbullying|assedio/],
  ['ansiedade', /ansiedade|panico|fobia/], ['depressao', /depress|tristeza/], ['sono', /sono|insonia/], ['telas', /tela|redes-sociais|internet|digital/],
  ['alimentar', /aliment|compuls|anorexia|bulimia|peso/], ['dependencia', /alcool|drogas|dependencia|tabaco|vape|nicotina/], ['trauma', /trauma|tept|violencia/],
  ['gestacao', /gest|puerper|materni|amament|baby-blues/], ['idosos', /idoso|demencia|alzheimer|esquecimento/], ['trabalho', /trabalho|ocupacional|empresa|lideranc|nr-1|afastamento/],
  ['cuidadores', /cuidador|sobrecarga/], ['neurodiv', /tdah|autis|neurodiv/], ['racismo', /racis|indigena|migrante|preconceito/],
];
const temaDe = (it) => { const t = `${it.slug} ${(it.titulo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; const m = TEMAS.find(([, re]) => re.test(t)); return m ? m[0] : it.categoria; };

const ORDEM_PUBLICOS = ['pacientes', 'pais', 'profissionais', 'empresas', 'relatos'];
const publicoDe = (categoria) => PUBLICO_POR_CATEGORIA[categoria] || 'pacientes';

function diasUteis(n) {
  const dias = [];
  const d = new Date(`${INICIO}T12:00:00Z`);
  while (dias.length < n) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6 && !FERIADOS.has(iso)) dias.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dias;
}

/** Ordena as 8 posições do dia respeitando as regras; devolve null se impossível. */
function arranjarDia(itens, ultimoDiaAnterior, relaxar) {
  const n = itens.length;
  const chave = (i) => i.chaveTema;
  const usados = new Array(n).fill(false);
  const sel = [];
  const pos = new Map();
  function ok(i, p) {
    if (p === 0 && ultimoDiaAnterior && chave(i) === ultimoDiaAnterior) return false;
    if (p > 0 && chave(sel[p - 1]) === chave(i)) return false;
    if (i.tipo === 'relato' && i.parDia) {
      const pa = pos.get(i.parDia);
      if (pa === undefined) return false; // artigo antes
      if (!relaxar && p - pa < 2) return false;
    }
    if (i.tipo === 'artigo' && i.parDia && pos.has(i.parDia)) return false;
    return true;
  }
  function dfs(p) {
    if (p === n) return true;
    for (let k = 0; k < n; k += 1) {
      if (usados[k] || !ok(itens[k], p)) continue;
      usados[k] = true; sel.push(itens[k]); pos.set(itens[k].slug, p);
      if (dfs(p + 1)) return true;
      usados[k] = false; sel.pop(); pos.delete(itens[k].slug);
    }
    return false;
  }
  return dfs(0) ? sel : null;
}

/**
 * @param {Array<{slug,titulo,tipo,categoria,semana?,numeroSerie?,serie?:boolean,ordem:number,par?:string}>} itens
 *   `par` = slug do item ligado (se também estiver na lista, saem no mesmo dia).
 * @returns {{agenda: Array<{slug,data,hora,slot,titulo,tipo,publico}>, avisos: string[]}}
 */
function montarCalendario(itens) {
  const avisos = [];
  const total = itens.length;
  const nDias = Math.ceil(total / POR_DIA);
  const dias = diasUteis(nDias);
  const porSlug = new Map(itens.map((i) => [i.slug, i]));

  const corpo = itens.filter((i) => i.serie).sort((a, b) => a.numeroSerie - b.numeroSerie);
  const principais = itens.filter((i) => !i.serie);

  // Unidades (par = 2 itens no mesmo dia). O artigo define o público e a posição.
  const usadoNoPar = new Set();
  const unidades = [];
  for (const it of [...principais].sort((a, b) => (a.semana ?? 99) - (b.semana ?? 99) || a.ordem - b.ordem)) {
    if (usadoNoPar.has(it.slug)) continue;
    const parceiro = it.par && porSlug.get(it.par) && !porSlug.get(it.par).serie ? porSlug.get(it.par) : null;
    if (parceiro && !usadoNoPar.has(parceiro.slug)) {
      usadoNoPar.add(it.slug); usadoNoPar.add(parceiro.slug);
      const [art, rel] = it.tipo === 'artigo' ? [it, parceiro] : [parceiro, it];
      if (art.tipo === rel.tipo) { unidades.push({ itens: [it], publico: it.tipo === 'relato' ? 'relatos' : publicoDe(it.categoria), semana: it.semana ?? 99 }); unidades.push({ itens: [parceiro], publico: parceiro.tipo === 'relato' ? 'relatos' : publicoDe(parceiro.categoria), semana: parceiro.semana ?? 99 }); continue; }
      art.parDia = rel.slug; rel.parDia = art.slug;
      unidades.push({ itens: [art, rel], publico: publicoDe(art.categoria), semana: Math.min(art.semana ?? 99, rel.semana ?? 99) });
    } else unidades.push({ itens: [it], publico: it.tipo === 'relato' ? 'relatos' : publicoDe(it.categoria), semana: it.semana ?? 99 });
  }
  const filas = Object.fromEntries(ORDEM_PUBLICOS.map((p) => [p, unidades.filter((u) => u.publico === p)]));

  const totais = Object.fromEntries(ORDEM_PUBLICOS.map((p) => [p, filas[p].length]));
  const agenda = [];
  let ultimoTema = null;
  let iCorpo = 0;
  dias.forEach((data, d) => {
    const nCorpo = Math.floor(((d + 1) * corpo.length) / nDias) - Math.floor((d * corpo.length) / nDias);
    const doDia = corpo.slice(iCorpo, iCorpo + nCorpo); iCorpo += nCorpo;
    let capacidade = Math.min(POR_DIA, total - agenda.length) - doDia.length;
    const escolhidas = [...doDia];
    let tentativas = 0;
    const inicial = Object.fromEntries(ORDEM_PUBLICOS.map((p) => [p, Math.max(1, totais[p])]));
    const contaChave = (k) => escolhidas.filter((e) => (e.serie ? 'corpo' : temaDe(e)) === k).length;
    while (capacidade > 0 && tentativas < 60) {
      tentativas += 1;
      // fila com maior fração restante (proporcional): todas terminam juntas
      const candidatas = ORDEM_PUBLICOS.filter((p) => filas[p].some((u) => u.itens.length <= capacidade))
        .sort((a, b) => filas[b].length / inicial[b] - filas[a].length / inicial[a]);
      if (!candidatas.length) break;
      const pub = candidatas[0];
      const cabem = filas[pub].map((u, i) => ({ u, i })).filter(({ u }) => u.itens.length <= capacidade);
      const evita = (u) => u.itens.some((x) => contaChave(temaDe(x)) >= 2 || contaChave(x.categoria) >= 3);
      const escolha = cabem.find(({ u }) => !evita(u)) || cabem[0];
      filas[pub].splice(escolha.i, 1);
      escolhidas.push(...escolha.u.itens); capacidade -= escolha.u.itens.length;
    }
    if (capacidade > 0) {
      // sobra de pares sem encaixe: quebra o par (aviso) para completar o dia
      for (const pub of ORDEM_PUBLICOS) while (capacidade > 0 && filas[pub].length) {
        const u = filas[pub][0];
        const [it] = u.itens.splice(0, 1);
        if (!u.itens.length) filas[pub].shift();
        if (it.parDia) { avisos.push(`par desfeito para fechar o dia ${data}: ${it.slug}`); it.parDia = null; }
        escolhidas.push(it); capacidade -= 1;
      }
    }
    for (const it of escolhidas) it.chaveTema = it.serie ? 'corpo' : temaDe(it);
    let arranjo = arranjarDia(escolhidas, ultimoTema, false);
    if (!arranjo) { avisos.push(`dia ${data}: regra de não-adjacência relaxada para pares`); arranjo = arranjarDia(escolhidas, ultimoTema, true); }
    if (!arranjo) { avisos.push(`dia ${data}: não foi possível evitar tema repetido em horários seguidos`); arranjo = [...escolhidas]; }
    ultimoTema = arranjo[arranjo.length - 1]?.chaveTema ?? ultimoTema;
    arranjo.forEach((it, i) => {
      const hora = HORARIOS[i];
      agenda.push({ slug: it.slug, titulo: it.titulo, tipo: it.tipo, publico: it.serie ? 'série Corpo' : it.tipo === 'relato' ? `relato (${publicoDe(it.categoria) === 'pacientes' ? 'geral' : publicoDe(it.categoria)})` : publicoDe(it.categoria), data, hora, slot: `${data}T${hora}:00-03:00` });
    });
  });
  const restantes = Object.values(filas).flat().length;
  if (restantes) avisos.push(`${restantes} unidade(s) não agendada(s)`);
  return { agenda, avisos };
}

module.exports = { temaDe, HORARIOS, POR_DIA, INICIO, FERIADOS, publicoDe, diasUteis, montarCalendario };
