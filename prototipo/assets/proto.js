// Protótipo: busca no índice local (sem /api), leitura confortável, filtro do blog. Mídia só ao clicar.
(function () {
  var raiz = document.documentElement;
  var script = document.querySelector('script[src$="proto.js"]');
  var prefixo = script ? script.getAttribute('src').replace(/assets\/proto\.js.*$/, '') : '';

  // Busca no índice (títulos de páginas existentes)
  var busca = document.getElementById('busca');
  var lista = document.getElementById('sugestoes');
  var indice = [];
  if (busca && lista) {
    fetch(prefixo + 'assets/indice.json').then(function (r) { return r.json(); }).then(function (j) { indice = j; }).catch(function () {});
    busca.addEventListener('input', function () {
      var q = busca.value.trim().toLowerCase();
      lista.innerHTML = '';
      if (q.length < 2) return;
      indice.filter(function (p) { return p.titulo.toLowerCase().indexOf(q) !== -1; }).slice(0, 6).forEach(function (p) {
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = prefixo + p.url; a.textContent = p.titulo;
        a.style.cssText = 'display:block;min-height:44px;line-height:44px;color:#fff;font-weight:600';
        li.appendChild(a); lista.appendChild(li);
      });
    });
  }

  // Leitura confortável (letra e temas), em todas as páginas
  var tam = 1.2;
  function ajustar(d) {
    tam = Math.max(1, Math.min(1.6, tam + d));
    document.querySelectorAll('.corpo, .texto-grande').forEach(function (el) { el.style.fontSize = tam + 'rem'; });
  }
  var mais = document.querySelector('.fmais'), menos = document.querySelector('.fmenos');
  if (mais) mais.addEventListener('click', function () { ajustar(0.1); });
  if (menos) menos.addEventListener('click', function () { ajustar(-0.1); });
  var escuro = document.querySelector('.escuro');
  if (escuro) escuro.addEventListener('click', function () {
    var on = raiz.getAttribute('data-theme') !== 'dark';
    raiz.setAttribute('data-theme', on ? 'dark' : 'light');
    escuro.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  var calmo = document.querySelector('.calmo');
  if (calmo) calmo.addEventListener('click', function () {
    var on = !document.body.classList.contains('modo-calmo');
    document.body.classList.toggle('modo-calmo', on);
    calmo.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  // Filtro por tema no blog (só na tela; sem chamada de rede)
  var filtros = document.querySelectorAll('.filtro');
  var cards = document.querySelectorAll('.card-artigo');
  filtros.forEach(function (b) {
    b.addEventListener('click', function () {
      var alvo = b.getAttribute('data-filtro');
      cards.forEach(function (c) { c.style.display = (alvo === 'todos' || c.getAttribute('data-serie') === alvo) ? '' : 'none'; });
      filtros.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
  });
  // Narração: só ao clicar (URL já publicada do artigo)
  var ouvir = document.querySelector(".ouvir");
  if (ouvir) ouvir.addEventListener("click", function () {
    ouvir.disabled = true;
    var area = document.querySelector(".area-audio");
    var au = document.createElement("audio"); au.controls = true; au.preload = "none"; au.src = ouvir.getAttribute("data-audio");
    au.setAttribute("aria-label", "Narração do artigo");
    au.addEventListener("error", function () { area.textContent = "Narração indisponível neste protótipo."; });
    area.appendChild(au); au.play().catch(function () {});
  });
})();
