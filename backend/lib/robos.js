/**
 * Detecta navegadores automatizados e robôs pelo User-Agent, para que não
 * contem como visita (GET /api/artigos/:slug). Motivo: em 2026-09-23 as
 * rodadas da suíte e2e (Playwright headless) somaram dezenas de "visitas" ao
 * Checklist de Sobrecarga e o empurraram para o topo da fila de publicação,
 * que ordena por visualizações (backend/lib/filaRedes.js).
 *
 * Detecção por User-Agent é best-effort: robô que se passa por navegador comum
 * continua contando. User-Agent vazio também é tratado como robô — navegador
 * de verdade sempre envia um.
 */
const PADRAO_ROBO = new RegExp(
  [
    'headlesschrome', 'headless', 'playwright', 'puppeteer', 'phantomjs', 'selenium', 'webdriver',
    'lighthouse', 'chrome-lighthouse', 'pagespeed',
    // "Googlebot/2.1", "Slackbot-…", "…bot;" — sem casar "CUBOT" (marca de celular).
    '\\bbot\\b', 'bot[/;-]', 'crawler', 'crawl', 'spider', 'slurp', 'archiver',
    'facebookexternalhit', 'meta-externalagent', 'embedly', 'whatsapp', 'telegrambot', 'linkedinbot',
    'curl/', 'wget/', 'python-requests', 'python-urllib', 'axios/', 'node-fetch', 'undici', 'go-http-client', 'java/',
  ].join('|'),
  'i'
);

function ehRobo(userAgent) {
  const ua = String(userAgent || '').trim();
  return !ua || PADRAO_ROBO.test(ua);
}

module.exports = { ehRobo };
