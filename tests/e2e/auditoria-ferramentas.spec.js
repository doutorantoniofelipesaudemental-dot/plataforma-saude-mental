// Auditoria de ponta a ponta do blog: SSR/CLS de todos os artigos publicados e
// comportamento de todos os miniaplicativos embutidos (ver CLAUDE.md, seções
// 19 e 20). Artigos e ferramentas são descobertos em runtime pela API/HTML —
// um artigo novo com `id="ferramenta-*"` entra na auditoria sem mexer aqui.
//
// O contador POST /ferramenta-uso é interceptado no navegador: rodar a suíte
// contra produção não polui as métricas do /admin.
const { test, expect } = require('@playwright/test');

const LOTES_ARTIGOS = 6;
const LOTES_FERRAMENTAS = 3;
const CLS_MAXIMO = 0.1;

// Valores esperados das calculadoras numéricas com as entradas usadas abaixo
// (50 colaboradores × R$ 4.000; simulador com os valores padrão do formulário).
const VALOR_ESPERADO = {
  'ferramenta-presenteismo': '264.000',
  'ferramenta-simulador-roi': '243.000',
};

async function listarSlugs(request) {
  const slugs = [];
  for (let pagina = 1; ; pagina++) {
    const resposta = await request.get(`/api/artigos?pagina=${pagina}&limite=24`);
    expect(resposta.ok(), 'GET /api/artigos').toBeTruthy();
    const { itens, paginacao } = await resposta.json();
    itens.forEach((a) => slugs.push(a.slug));
    if (!itens.length || pagina >= paginacao.paginas) break;
  }
  return slugs;
}

async function listarSlugsComFerramenta(request) {
  const slugs = await listarSlugs(request);
  const comFerramenta = [];
  for (const slug of slugs) {
    const html = await (await request.get(`/artigo/${slug}`)).text();
    if (/id="ferramenta-[a-z0-9-]+"/.test(html)) comFerramenta.push(slug);
  }
  return comFerramenta;
}

const lote = (lista, i, total) => lista.filter((_, k) => k % total === i);

async function observarCls(page) {
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

/* ------------------------------- Artigos -------------------------------- */

test.describe('Artigos — SSR, CLS e layout (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

  for (let i = 0; i < LOTES_ARTIGOS; i++) {
    test(`lote ${i + 1}/${LOTES_ARTIGOS}`, async ({ page, request }) => {
      const slugs = lote(await listarSlugs(request), i, LOTES_ARTIGOS);
      await observarCls(page);
      const errosJs = [];
      page.on('pageerror', (e) => errosJs.push(e.message));

      for (const slug of slugs) {
        errosJs.length = 0;
        const resposta = await page.goto(`/artigo/${slug}`, { waitUntil: 'load' });
        expect.soft(resposta.status(), `${slug}: status`).toBe(200);
        const html = await resposta.text();
        expect.soft(html, `${slug}: corpo pré-renderizado (data-ssr)`).toMatch(/<article[^>]*data-ssr="1"/);
        expect.soft(html, `${slug}: JSON-LD`).toContain('application/ld+json');
        await page.waitForTimeout(1000);

        const dom = await page.evaluate(() => {
          const capa = document.querySelector('.artigo-capa img');
          return {
            h1: !!document.querySelector('h1')?.textContent.trim(),
            capaSemDimensoes: capa ? !(capa.getAttribute('width') && capa.getAttribute('height')) : false,
            overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
            cls: window.__cls,
          };
        });
        expect.soft(dom.h1, `${slug}: h1`).toBe(true);
        expect.soft(dom.capaSemDimensoes, `${slug}: capa sem width/height`).toBe(false);
        expect.soft(dom.overflowX, `${slug}: rolagem horizontal no mobile`).toBe(false);
        expect.soft(dom.cls, `${slug}: CLS`).toBeLessThan(CLS_MAXIMO);
        expect.soft(errosJs, `${slug}: erros de JS`).toEqual([]);
      }
    });
  }
});

/* ---------------------------- Miniaplicativos ---------------------------- */

async function lerResultado(page, raiz) {
  return page.evaluate((raiz) => {
    const c = document.getElementById(raiz);
    const res = c.querySelector('.ferramenta-embutida__resultado');
    const texto = res.innerText.replace(/\u00a0/g, ' ');
    const pontos = texto.match(/(\d+)\s+de\s+(\d+)/);
    return {
      visivel: !res.hidden && res.offsetHeight > 0,
      nivel: res.classList.contains('nivel-alto') ? 'alto' : res.classList.contains('nivel-atencao') ? 'atencao' : 'base',
      pontos: pontos ? Number(pontos[1]) : null,
      texto,
      erro: (c.querySelector('.erro')?.textContent || '').trim(),
    };
  }, raiz);
}

/** Marca a 1ª, a do meio ou a última opção de cada grupo; devolve a soma esperada. */
async function preencher(page, raiz, modo) {
  return page.evaluate(({ raiz, modo }) => {
    const c = document.getElementById(raiz);
    const grupos = {};
    c.querySelectorAll('input[type=radio]').forEach((i) => (grupos[i.name] ||= []).push(i));
    let soma = 0;
    for (const lista of Object.values(grupos)) {
      const escolhido = modo === 'min' ? lista[0] : modo === 'max' ? lista.at(-1) : lista[Math.floor(lista.length / 2)];
      escolhido.checked = true;
      soma += Number(escolhido.value) || 0;
    }
    const checks = [...c.querySelectorAll('input[type=checkbox]')];
    checks.forEach((i, k) => { i.checked = modo === 'max' || (modo === 'mid' && k < checks.length / 2); });
    if (checks.length) soma = checks.filter((i) => i.checked).length;
    c.querySelectorAll('input[type=number]').forEach((i) => {
      if (!i.value) i.value = /colab/.test(i.id) ? 50 : /salario/.test(i.id) ? 4000 : 10;
    });
    return soma;
  }, { raiz, modo });
}

async function auditarFerramenta(page, slug) {
  const usos = [];
  await page.route('**/ferramenta-uso', (rota) => {
    usos.push(rota.request().method());
    rota.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  const errosJs = [];
  page.on('pageerror', (e) => errosJs.push(e.message));
  await page.goto(`/artigo/${slug}`, { waitUntil: 'load' });

  const raiz = await page.evaluate(() => document.querySelector('[id^="ferramenta-"]').id);
  const tipo = await page.evaluate((id) => {
    const c = document.getElementById(id);
    return c.querySelector('input[type=radio]') ? 'radio' : c.querySelector('input[type=checkbox]') ? 'checklist' : 'numerico';
  }, raiz);
  const botao = page.locator(`#${raiz} button[id$="-calcular"]`);
  const rotulo = `${slug} (${raiz})`;

  // Envio incompleto é bloqueado e não conta uso.
  const temCampoVazio = await page.evaluate((id) =>
    [...document.querySelectorAll(`#${id} input[type=number]`)].some((i) => !i.value), raiz);
  if (tipo === 'radio' || temCampoVazio) {
    await botao.click();
    const r = await lerResultado(page, raiz);
    expect.soft(r.visivel, `${rotulo}: resultado com respostas faltando`).toBe(false);
    expect.soft(r.erro, `${rotulo}: mensagem de erro`).not.toBe('');
    expect.soft(usos.length, `${rotulo}: uso contado sem resultado`).toBe(0);
  }

  const niveis = [];
  for (const modo of tipo === 'numerico' ? ['min'] : ['min', 'mid', 'max']) {
    const antes = usos.length;
    const esperado = await preencher(page, raiz, modo);
    await botao.click();
    const r = await lerResultado(page, raiz);
    niveis.push(r.nivel);
    expect.soft(r.visivel, `${rotulo} [${modo}]: resultado visível`).toBe(true);
    if (r.pontos !== null && tipo !== 'numerico') {
      expect.soft(r.pontos, `${rotulo} [${modo}]: pontuação`).toBe(esperado);
    }
    expect.soft(r.texto, `${rotulo} [${modo}]: disclaimer no resultado`).toMatch(/n(ão|em) substitui/i);
    expect.soft(usos.length - antes, `${rotulo} [${modo}]: POST /ferramenta-uso`).toBe(1);
    if (VALOR_ESPERADO[raiz]) {
      expect.soft(r.texto, `${rotulo}: valor calculado`).toContain(VALOR_ESPERADO[raiz]);
    }
  }
  if (tipo !== 'numerico') {
    expect.soft(new Set(niveis).size, `${rotulo}: níveis de resultado variam (${niveis})`).toBeGreaterThan(1);
  }

  // CTA leva à Home, na âncora certa e com o tipo de atendimento pré-marcado.
  const cta = page.locator(`#${raiz} .ferramenta-embutida__acao a`).first();
  const href = await cta.getAttribute('href');
  expect.soft(href, `${rotulo}: CTA`).toMatch(/^\/(\?tipo=(particular|consultoria-empresa))?#(contato-servicos|agendar)$/);
  await Promise.all([page.waitForURL((u) => u.pathname === '/'), cta.click()]);
  await page.waitForTimeout(1500);
  const destino = await page.evaluate(() => {
    const alvo = document.getElementById(location.hash.slice(1));
    const r = alvo?.getBoundingClientRect();
    return {
      tipo: new URLSearchParams(location.search).get('tipo'),
      marcado: document.querySelector('#formulario-contato-servicos input[name="tipoAtendimento"]:checked')?.value,
      alvoNaTela: !!r && r.top < innerHeight && r.bottom > 0,
    };
  });
  expect.soft(destino.alvoNaTela, `${rotulo}: Home rolou até o formulário`).toBe(true);
  if (destino.tipo) expect.soft(destino.marcado, `${rotulo}: ?tipo= pré-marcado`).toBe(destino.tipo);
  expect.soft(errosJs, `${rotulo}: erros de JS`).toEqual([]);
}

test.describe('Miniaplicativos — cálculo, salvaguardas e CTA', () => {
  for (let i = 0; i < LOTES_FERRAMENTAS; i++) {
    test(`lote ${i + 1}/${LOTES_FERRAMENTAS}`, async ({ browser, request }) => {
      const slugs = lote(await listarSlugsComFerramenta(request), i, LOTES_FERRAMENTAS);
      expect(slugs.length, 'nenhuma ferramenta encontrada').toBeGreaterThan(0);
      for (const slug of slugs) {
        const contexto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        await auditarFerramenta(await contexto.newPage(), slug);
        await contexto.close();
      }
    });
  }

  test('salvaguardas de crise (CVV 188 / SAMU 192) no nível alto', async ({ page }) => {
    const obrigatorias = [
      'dependencia-quimica-comportamental-sinais',
      'ansiedade-social-medo-julgamento',
      'depressao-pos-parto-ansiedade-perinatal',
      'sinais-alerta-comportamentais-jovens',
    ];
    await page.route('**/ferramenta-uso', (r) => r.fulfill({ status: 200, body: '{"ok":true}' }));
    for (const slug of obrigatorias) {
      await page.goto(`/artigo/${slug}`);
      const raiz = await page.evaluate(() => document.querySelector('[id^="ferramenta-"]').id);
      await preencher(page, raiz, 'max');
      await page.click(`#${raiz} button[id$="-calcular"]`);
      const r = await lerResultado(page, raiz);
      expect.soft(r.nivel, `${slug}: nível alto`).toBe('alto');
      expect.soft(r.texto, `${slug}: CVV 188`).toContain('188');
      expect.soft(r.texto, `${slug}: SAMU 192`).toContain('192');
    }
  });

  test('ferramenta funciona também no fallback sem SSR', async ({ page }) => {
    const slug = 'estresse-migratorio-adaptacao-cultural';
    // Slug inexistente cai no fallback do servidor: shell estático cru, sem
    // data-ssr — o mesmo HTML servido quando o SSR não consegue consultar o banco.
    const shell = await (await page.request.get('/artigo/__slug-inexistente-e2e__')).text();
    await page.route(new RegExp(`/artigo/${slug}$`), (r) => r.fulfill({ contentType: 'text/html', body: shell }));
    const usos = [];
    await page.route('**/ferramenta-uso', (r) => { usos.push(1); r.fulfill({ status: 200, body: '{"ok":true}' }); });
    await page.goto(`/artigo/${slug}`);
    const raiz = 'ferramenta-estresse-migratorio';
    await page.waitForSelector(`#${raiz} button[id$="-calcular"]`);
    expect(await page.evaluate(() => document.querySelector('article')?.dataset.ssr)).toBeUndefined();
    await preencher(page, raiz, 'max');
    await page.click(`#${raiz} button[id$="-calcular"]`);
    expect((await lerResultado(page, raiz)).visivel).toBe(true);
    expect(usos).toHaveLength(1);
  });
});

/* ------------------- Checklist de Sobrecarga: CTAs e cuidado ------------------- */

test.describe('Checklist de Sobrecarga — CTAs e mensagem de cuidado', () => {
  const SLUG = 'ansiedade-corporativa-sintomas-tratamento';
  const RAIZ = 'ferramenta-checklist-sobrecarga';

  async function calcularCom(page, marcados) {
    await page.evaluate(({ raiz, marcados }) => {
      document.querySelectorAll(`#${raiz} input[type=checkbox]`).forEach((i, k) => { i.checked = k < marcados; });
    }, { raiz: RAIZ, marcados });
    await page.click('#cs-calcular');
    return page.evaluate(() => {
      const cuidado = document.getElementById('cs-cuidado');
      const res = document.getElementById('cs-resultado');
      // Contraste WCAG AA de cada texto visível do resultado contra o fundo real.
      const rgb = (c) => c.match(/[\d.]+/g).map(Number);
      const lum = (c) => {
        const [r, g, b] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const fundo = (el) => {
        for (let e = el; e; e = e.parentElement) {
          const c = getComputedStyle(e).backgroundColor;
          const v = rgb(c);
          if (v.length < 4 || v[3] > 0) return c;
        }
        return 'rgb(255, 255, 255)';
      };
      const reprovados = [...res.querySelectorAll('h4, p, a')]
        .filter((el) => el.offsetParent !== null && !el.closest('[hidden]') && el.textContent.trim())
        .map((el) => {
          const cs = getComputedStyle(el);
          const [a, b] = [lum(cs.color), lum(fundo(el))];
          const razao = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
          return razao >= (grande ? 3 : 4.5) ? null : `${el.className || el.tagName} ${razao.toFixed(2)}:1`;
        })
        .filter(Boolean);
      return {
        titulo: res.querySelector('h4').textContent,
        texto: document.getElementById('cs-resultado-texto').textContent,
        alto: res.classList.contains('nivel-alto'),
        atencao: res.classList.contains('nivel-atencao'),
        cuidadoVisivel: !cuidado.hidden && cuidado.offsetHeight > 0,
        reprovados,
      };
    });
  }

  // Faixas do próprio checklist: 0–2 pontuais (base), 3–5 atenção (âmbar),
  // 6–8 e 9–10 nível alto (terracota + mensagem de cuidado).
  const FRASE_ATENCAO = 'Pequenos ajustes na rotina e uma conversa com um profissional podem evitar que isso se agrave.';
  for (const [marcados, faixa] of [[0, 'base'], [2, 'base'], [3, 'atencao'], [5, 'atencao'], [6, 'alto'], [8, 'alto'], [9, 'alto'], [10, 'alto']]) {
    test(`${marcados} itens marcados → faixa ${faixa}`, async ({ page }) => {
      await page.route('**/ferramenta-uso', (r) => r.fulfill({ status: 200, body: '{"ok":true}' }));
      await page.goto(`/artigo/${SLUG}`);
      const r = await calcularCom(page, marcados);
      expect(r.titulo).toContain(`${marcados} de 10`);
      expect(r.alto, 'visual nivel-alto').toBe(faixa === 'alto');
      expect(r.atencao, 'visual nivel-atencao').toBe(faixa === 'atencao');
      expect(r.cuidadoVisivel, 'mensagem de cuidado').toBe(faixa === 'alto');
      expect(r.texto.includes(FRASE_ATENCAO), 'frase da faixa intermediária').toBe(faixa === 'atencao');
      // A versão longa repetia "merecem atenção" do texto original da faixa.
      expect(r.texto, 'frase longa antiga removida').not.toContain('Alguns sinais de sobrecarga merecem atenção');
      expect(r.reprovados, 'contraste WCAG AA').toEqual([]);
    });
  }

  test('mensagem de cuidado: CVV 188 (tel:), chat cvv.org.br em nova aba, SAMU 192, sem ícone', async ({ page }) => {
    await page.route('**/ferramenta-uso', (r) => r.fulfill({ status: 200, body: '{"ok":true}' }));
    await page.goto(`/artigo/${SLUG}`);
    await calcularCom(page, 10);
    const c = await page.evaluate(() => {
      const el = document.getElementById('cs-cuidado');
      const tel = el.querySelector('a[href="tel:188"]');
      const cvv = el.querySelector('a[href="https://cvv.org.br"]');
      return {
        texto: el.textContent,
        tel: tel?.textContent,
        cvv: cvv?.textContent,
        cvvAlvo: cvv?.getAttribute('target'),
        cvvRel: cvv?.getAttribute('rel') || '',
        icones: el.querySelectorAll('svg, img').length,
      };
    });
    expect(c.tel).toBe('188');
    expect(c.cvv).toBe('cvv.org.br');
    expect(c.cvvAlvo).toBe('_blank');
    expect(c.cvvRel).toContain('noopener');
    expect(c.texto).toContain('192 (SAMU)');
    expect(c.texto).toContain('você não precisa lidar com isso sozinho');
    expect(c.icones).toBe(0);
  });

  for (const [rotulo, seletor, tipo] of [
    ['principal', '#cs-resultado .ferramenta-embutida__acao .botao--primario', 'particular'],
    ['secundário', '#cs-resultado .ferramenta-embutida__acao .ferramenta-embutida__secundario', 'consultoria-empresa'],
  ]) {
    test(`CTA ${rotulo} → Home com ?tipo=${tipo} pré-marcado, sem contar uso extra`, async ({ page }) => {
      const usos = [];
      await page.route('**/ferramenta-uso', (r) => { usos.push(1); r.fulfill({ status: 200, body: '{"ok":true}' }); });
      await page.goto(`/artigo/${SLUG}`);
      await calcularCom(page, 1);
      expect(usos, 'um uso por cálculo').toHaveLength(1);

      const cta = page.locator(seletor);
      await expect(cta).toHaveAttribute('href', `/?tipo=${tipo}#contato-servicos`);
      if (rotulo === 'principal') await expect(cta).toHaveText('Solicitar consulta de orientação');
      else await expect(cta).toHaveText('Sua equipe está assim? Conheça a consultoria para empresas');

      await Promise.all([page.waitForURL((u) => u.pathname === '/'), cta.click()]);
      await page.waitForTimeout(1200);
      const marcado = await page.evaluate(() =>
        document.querySelector('#formulario-contato-servicos input[name="tipoAtendimento"]:checked')?.value);
      expect(marcado).toBe(tipo);
      expect(usos, 'clique no CTA não conta uso').toHaveLength(1);
    });
  }
});

/* --------------------------------- Blog ---------------------------------- */

test.describe('Blog — barra de filtros', () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) {
    test(`linha única, sem CLS em 4G lento (${viewport.width}px)`, async ({ page, context }) => {
      await page.setViewportSize(viewport);
      // Rede lenta faz a fonte chegar depois da 1ª pintura — é aí que a troca
      // de fonte reorganizava a barra de filtros.
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8,
      });
      await observarCls(page);
      await page.goto('/blog', { waitUntil: 'load', timeout: 60_000 });
      await page.waitForTimeout(2500);
      const r = await page.evaluate(() => {
        const filtros = document.getElementById('filtros');
        const topos = new Set([...filtros.querySelectorAll('.filtro')].map((b) => b.offsetTop));
        return {
          linhas: topos.size,
          overflowPagina: document.documentElement.scrollWidth > window.innerWidth + 1,
          cls: window.__cls,
        };
      });
      expect(r.linhas, 'filtros em uma linha só').toBe(1);
      expect(r.overflowPagina, 'rolagem horizontal da página').toBe(false);
      expect(r.cls, 'CLS do /blog').toBeLessThan(CLS_MAXIMO);
    });
  }
});
