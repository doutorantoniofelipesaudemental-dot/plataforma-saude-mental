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
  /* PHQ-9 e GAD-7 (versões em português; fontes visíveis na página). Tudo roda no navegador: nada é enviado, gravado ou contado. */
  var form = document.getElementById('plano-form');
  if (form) {
    var saida = document.getElementById('plano-resultado');
    var erro = document.getElementById('plano-erro');
    var faixaPhq = function (n) { return n <= 4 ? 'mínimos' : n <= 9 ? 'leves' : n <= 14 ? 'moderados' : n <= 19 ? 'moderadamente graves' : 'graves'; };
    var faixaGad = function (n) { return n <= 4 ? 'mínimos' : n <= 9 ? 'leves' : n <= 14 ? 'moderados' : 'graves'; };
    var soma = function (prefixo, qtd) {
      var total = 0;
      for (var i = 1; i <= qtd; i++) {
        var marcado = form.querySelector('input[name="' + prefixo + i + '"]:checked');
        if (!marcado) return null;
        total += Number(marcado.value);
      }
      return total;
    };
    var alertaItem9 = function () {
      var marcado = form.querySelector('input[name="phq9"]:checked');
      var aviso = document.getElementById('plano-alerta-9');
      var risco = !!marcado && Number(marcado.value) > 0;
      if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'plano-alerta-9';
        aviso.className = 'plano__crise';
        aviso.setAttribute('role', 'alert');
        form.parentNode.insertBefore(aviso, form);
      }
      aviso.hidden = !risco;
      aviso.innerHTML = risco ? '<p><strong>Se você tem pensado em se ferir ou em morrer, procure ajuda agora: <a href="tel:188">CVV 188</a> (24 h, gratuito), <a href="tel:192">SAMU 192</a> ou o pronto-socorro mais próximo.</strong></p>' : '';
    };
    form.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'phq9') alertaItem9();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phq = soma('phq', 9);
      var gad = soma('gad', 7);
      if (phq === null || gad === null) {
        erro.textContent = 'Responda todas as perguntas para ver o resultado. Nada é enviado nem gravado.';
        erro.hidden = false;
        var primeira = form.querySelector('fieldset:not(:has(input:checked)) input');
        if (primeira) primeira.focus();
        return;
      }
      erro.hidden = true;
      var item9 = form.querySelector('input[name="phq9"]:checked');
      var risco = !!item9 && Number(item9.value) > 0;
      var html = '';
      if (risco) {
        html += '<div class="plano__crise" role="alert"><p><strong>Se você tem pensado em se ferir ou em morrer, procure ajuda agora: <a href="tel:188">CVV 188</a> (24 h, gratuito), <a href="tel:192">SAMU 192</a> ou o pronto-socorro mais próximo.</strong></p></div><p><small>Você também pode procurar a UPA ou o pronto-socorro mais próximo e, para acompanhamento, o CAPS ou a UBS. Mais informações: <a href="https://www.cvv.org.br" target="_blank" rel="noopener">cvv.org.br</a></small></p>';
      }
      html += '<h3>Seu resultado</h3><ul><li>Humor (PHQ-9), ' + phq + ' de 27 pontos: suas respostas sugerem sintomas ' + faixaPhq(phq) + '.</li><li>Ansiedade (GAD-7), ' + gad + ' de 21 pontos: suas respostas sugerem sintomas ' + faixaGad(gad) + '.</li></ul>';
      if (phq >= 10 || gad >= 10 || risco) {
        html += '<p>Vale conversar com um profissional de saúde. Você pode procurar a unidade básica de saúde (UBS) do seu bairro ou o CAPS da sua cidade; a avaliação individual é o que esclarece o que está acontecendo, e cuidar disso é um passo importante.</p>';
      } else {
        html += '<p>Se algo ainda incomoda você, vale conversar com um profissional de saúde na sua UBS, mesmo com pontuação baixa.</p>';
      }
      html += '<h3>Sugestões de leitura</h3><ul><li><a href="/blog?busca=' + encodeURIComponent('depressão') + '">Humor e desânimo</a></li><li><a href="/blog?busca=ansiedade">Ansiedade e preocupação</a></li></ul>';
      html += '<p><small>Este resultado não é diagnóstico e não substitui consulta. Suas respostas não saem deste aparelho e não são gravadas. Fontes: PHQ-9 e GAD-7, listadas abaixo do questionário.</small></p>';
      saida.innerHTML = html;
      saida.hidden = false;
      saida.focus();
      form.reset();
    });
    var limpar = document.getElementById('plano-limpar');
    if (limpar) {
      limpar.addEventListener('click', function () {
        form.reset();
        erro.hidden = true;
        saida.hidden = true;
        saida.innerHTML = '';
        var topo = form.querySelector('input');
        if (topo) topo.focus();
      });
    }
  }
})();
