/* Extras de UX: alternador de tema, respiração guiada e "Meu Plano de Cuidado".
   Nada aqui envia dados ao servidor: as respostas do questionário existem só na
   memória da página e somem ao fechá-la (sem cookie, storage ou requisição). */
(function () {
  'use strict';

  /* ------------------------------- PWA ---------------------------------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () { /* sem PWA: o site funciona igual */ }); });
  }

  /* ------------------------------- Tema --------------------------------- */
  var raiz = document.documentElement;
  function lerTema() { try { return localStorage.getItem('tema'); } catch (e) { return null; } }
  function gravarTema(t) { try { localStorage.setItem('tema', t); } catch (e) { /* sem storage: só vale nesta visita */ } }
  function escuroAgora() {
    var t = raiz.getAttribute('data-tema');
    return t ? t === 'escuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  var salvo = lerTema();
  if (salvo === 'claro' || salvo === 'escuro') raiz.setAttribute('data-tema', salvo);

  var botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'tema-botao';
  function rotular() {
    var escuro = escuroAgora();
    botao.textContent = escuro ? '☀' : '☾';
    botao.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
  }
  botao.addEventListener('click', function () {
    var novo = escuroAgora() ? 'claro' : 'escuro';
    raiz.setAttribute('data-tema', novo);
    gravarTema(novo);
    rotular();
  });
  rotular();
  document.body.appendChild(botao);

  /* --------------------------- Respiração guiada ------------------------ */
  var resp = document.getElementById('respiracao');
  if (resp) {
    var esfera = resp.querySelector('.respiracao__esfera');
    var estado = resp.querySelector('.respiracao__estado');
    var iniciar = resp.querySelector('.respiracao__botao');
    var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 4 s inspire · 4 s segure · 6 s expire (ciclo de 14 s, expiração mais longa acalma).
    var fases = [['inspire', 'Inspire pelo nariz…', 4000], ['segure', 'Segure suavemente…', 4000], ['expire', 'Solte o ar devagar…', 6000]];
    var timer = null;
    var i = 0;
    function passo() {
      var f = fases[i % fases.length];
      resp.setAttribute('data-fase', f[0]);
      estado.textContent = f[1];
      if (esfera && reduzir) esfera.textContent = f[0] === 'inspire' ? '↑' : f[0] === 'expire' ? '↓' : '•';
      i += 1;
      timer = setTimeout(passo, f[2]);
    }
    function parar() {
      clearTimeout(timer); timer = null; i = 0;
      resp.removeAttribute('data-fase');
      estado.textContent = 'Pronto quando você estiver.';
      iniciar.textContent = 'Começar';
      iniciar.setAttribute('aria-pressed', 'false');
    }
    iniciar.addEventListener('click', function () {
      if (timer) { parar(); return; }
      iniciar.textContent = 'Parar';
      iniciar.setAttribute('aria-pressed', 'true');
      passo();
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && timer) parar(); });
  }

  /* ------------------------ Meu Plano de Cuidado ------------------------ */
  var form = document.getElementById('plano-form');
  if (form) {
    var trilhas = {
      sono: { titulo: 'Sono e descanso', busca: 'sono' },
      ansiedade: { titulo: 'Ansiedade e preocupação', busca: 'ansiedade' },
      humor: { titulo: 'Humor e desânimo', busca: 'depressão' },
      trabalho: { titulo: 'Trabalho e esgotamento', busca: 'burnout' },
      cuidador: { titulo: 'Cuidar de quem cuida', busca: 'cuidador' },
    };
    var saida = document.getElementById('plano-resultado');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dados = new FormData(form);
      var pontos = {};
      form.querySelectorAll('input[type=radio]:checked').forEach(function (r) {
        pontos[r.dataset.trilha] = (pontos[r.dataset.trilha] || 0) + Number(r.value);
      });
      var risco = dados.get('seguranca') === '1';
      var ordem = Object.keys(trilhas).sort(function (a, b) { return (pontos[b] || 0) - (pontos[a] || 0); }).slice(0, 3);
      var html = '';
      if (risco) {
        html += '<p><strong>Você não precisa passar por isso sozinho(a).</strong> Ligue agora para o <a href="tel:188">CVV 188</a> (24 h, gratuito) ou, em emergência, para o <a href="tel:192">SAMU 192</a>.</p>';
      }
      html += '<h3>Suas trilhas de leitura</h3><ul>';
      ordem.forEach(function (k) {
        html += '<li><a href="/blog?busca=' + encodeURIComponent(trilhas[k].busca) + '">' + trilhas[k].titulo + '</a></li>';
      });
      html += '</ul><p><small>Este questionário é anônimo: suas respostas não saem deste aparelho e não são gravadas. Ele orienta leituras; não é diagnóstico nem substitui avaliação profissional.</small></p>';
      saida.innerHTML = html;
      saida.hidden = false;
      saida.focus();
      form.reset();
    });
  }
})();
