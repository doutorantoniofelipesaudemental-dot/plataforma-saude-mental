// Auditoria visual e de acessibilidade dos miniaplicativos no celular
// (CLAUDE.md, 20-undecies): iPhone 13 e Pixel 7, estado inicial e com o
// resultado aberto. Mede o que pode ser medido — sem opinião:
//   - rolagem horizontal (página e bloco da ferramenta);
//   - alvo de toque ≥ 44 × 44 px (WCAG 2.5.5, nível AAA) em botões, opções,
//     campos e links de ação (links dentro de frase são exceção da própria WCAG);
//   - contraste AAA: 7:1 para texto normal, 4.5:1 para texto grande
//     (≥ 24 px, ou ≥ 18,66 px em negrito), contra o fundo efetivo;
//   - regressão visual: captura do bloco da ferramenta comparada com a base em
//     tests/e2e/visual-miniapps.spec.js-snapshots/ (atualizar de propósito com
//     `npm run test:visual:atualizar`, nunca para "fazer passar"). As bases
//     são por sistema (-win32) e ficam FORA do git (~11 MB); base ausente é
//     gravada na primeira execução, sem acusar falha.
// Contador /ferramenta-uso interceptado: não polui o /admin.
const fs = require('fs');
const path = require('path');
const { test, expect, devices } = require('@playwright/test');

// Sem defaultBrowserType: a emulação roda no Chromium (tamanho, densidade, toque, UA).
const semNavegador = ({ defaultBrowserType, ...resto }) => resto;
const APARELHOS = { 'iphone-13': semNavegador(devices['iPhone 13']), 'pixel-7': semNavegador(devices['Pixel 7']) };

async function slugsComFerramenta(request) {
  const slugs = [];
  for (let pagina = 1; ; pagina++) {
    const r = await (await request.get(`/api/artigos?pagina=${pagina}&limite=24`)).json();
    slugs.push(...r.itens.map((a) => a.slug));
    if (!r.itens.length || pagina >= r.paginacao.paginas) break;
  }
  const com = [];
  for (const slug of slugs) {
    if (/id="ferramenta-[a-z0-9-]+"/.test(await (await request.get(`/artigo/${slug}`)).text())) com.push(slug);
  }
  return com;
}

/** Medições dentro do bloco da ferramenta (roda no navegador). */
function medir(raiz) {
  const c = document.getElementById(raiz);
  const rgba = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, 0];
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  };
  const misturar = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const fundo = (el) => {
    const pilha = [];
    for (let e = el; e; e = e.parentElement) pilha.push(rgba(getComputedStyle(e).backgroundColor));
    let cor = [255, 255, 255];
    for (const c2 of pilha.reverse()) if (c2[3] > 0) cor = misturar(c2, cor);
    return cor;
  };
  const lum = (cor) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(cor[0]) + 0.7152 * f(cor[1]) + 0.0722 * f(cor[2]);
  };
  const contraste = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden]');
  };
  const nome = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} "${(el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40)}"`;

  const falhasContraste = [];
  for (const el of c.querySelectorAll('*')) {
    const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!temTexto || !visivel(el)) continue;
    const s = getComputedStyle(el);
    const px = parseFloat(s.fontSize);
    const grande = px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700);
    const bg = fundo(el);
    const razao = contraste(misturar(rgba(s.color), bg), bg);
    const minimo = grande ? 4.5 : 7;
    if (razao < minimo) falhasContraste.push(`${nome(el)} ${razao.toFixed(2)}:1 (mín. ${minimo}:1, ${px}px)`);
  }

  const falhasToque = [];
  const alvos = c.querySelectorAll('button, .botao, select, textarea, input:not([type=radio]):not([type=checkbox]):not([type=hidden]), .opcao, label:has(> input[type=checkbox]), .ferramenta-embutida__acao a');
  for (const el of alvos) {
    if (!visivel(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) falhasToque.push(`${nome(el)} ${Math.round(r.width)}×${Math.round(r.height)}px`);
  }

  return {
    overflowPagina: document.documentElement.scrollWidth > innerWidth + 1,
    overflowBloco: c.scrollWidth > c.clientWidth + 1,
    falhasContraste: [...new Set(falhasContraste)],
    falhasToque: [...new Set(falhasToque)],
  };
}

/** Marca a última opção de cada grupo, metade dos checks e valores padrão nos números. */
function preencherMax(raiz) {
  const c = document.getElementById(raiz);
  const grupos = {};
  c.querySelectorAll('input[type=radio]').forEach((i) => (grupos[i.name] ||= []).push(i));
  Object.values(grupos).forEach((l) => (l.at(-1).checked = true));
  c.querySelectorAll('input[type=checkbox]').forEach((i) => (i.checked = true));
  c.querySelectorAll('input[type=number]').forEach((i) => {
    if (!i.value) i.value = /colab/.test(i.id) ? 50 : /salario/.test(i.id) ? 4000 : 10;
  });
}

for (const [aparelho, config] of Object.entries(APARELHOS)) {
  test.describe(`Miniaplicativos no celular — ${aparelho}`, () => {
    test.use(config);

    test('layout, toque 44 px, contraste AAA e regressão visual', async ({ page, request }) => {
      const slugs = await slugsComFerramenta(request);
      expect(slugs.length, 'nenhuma ferramenta encontrada').toBeGreaterThan(0);
      await page.route('**/ferramenta-uso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
      await page.emulateMedia({ reducedMotion: 'reduce' });

      for (const slug of slugs) {
        await page.goto(`/artigo/${slug}`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const raiz = await page.evaluate(() => document.querySelector('[id^="ferramenta-"]').id);
        const bloco = page.locator(`#${raiz}`);

        for (const estado of ['inicial', 'resultado']) {
          if (estado === 'resultado') {
            await page.evaluate(preencherMax, raiz);
            await page.locator(`#${raiz} button[id$="-calcular"]`).click();
            await page.waitForTimeout(300);
          }
          const m = await page.evaluate(medir, raiz);
          const rotulo = `${aparelho} · ${raiz} · ${estado}`;
          expect.soft(m.overflowPagina, `${rotulo}: rolagem horizontal na página`).toBe(false);
          expect.soft(m.overflowBloco, `${rotulo}: conteúdo vaza do bloco`).toBe(false);
          expect.soft(m.falhasToque, `${rotulo}: alvos de toque < 44 px`).toEqual([]);
          expect.soft(m.falhasContraste, `${rotulo}: contraste abaixo do AAA`).toEqual([]);
          const nomeBase = `${raiz}-${estado}-${aparelho}.png`;
          const opcoes = { animations: 'disabled', caret: 'hide', scale: 'css' };
          const base = test.info().snapshotPath(nomeBase);
          if (!fs.existsSync(base)) {
            // Clone novo ou miniapp novo: grava a base e registra — não é regressão.
            fs.mkdirSync(path.dirname(base), { recursive: true });
            await bloco.screenshot({ ...opcoes, path: base });
            test.info().annotations.push({ type: 'base visual criada', description: nomeBase });
          } else {
            await expect.soft(bloco, `${rotulo}: regressão visual`).toHaveScreenshot(nomeBase, { ...opcoes, maxDiffPixelRatio: 0.01 });
          }
        }
      }
    });
  });
}
