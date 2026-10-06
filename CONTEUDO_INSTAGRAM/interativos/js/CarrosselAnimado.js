/*
 * CarrosselAnimado: carrossel 4:5 (1080 x 1350) orientado a dados, com animacoes em HTML/CSS/SVG/Canvas.
 * Script classico; expoe window.CarrosselAnimado. Depende de AudioPlayer.js e Anime2DManager.js e de
 * interativos/css/carrossel.css. Lottie (lottie-web) so e baixado se o movimento reduzido estiver desligado.
 *
 *   CarrosselAnimado.init({
 *     titulo: 'Texto de acessibilidade', slug: 'slug-do-artigo-no-portal',
 *     base: '../interativos/',                       // caminho ate CONTEUDO_INSTAGRAM/interativos/
 *     slides: [ {tipo:'capa', tag:'Pacote 61 · Conteúdo educativo', titulo:'...', nota:'...'}, ... ]
 *   });
 *
 * Tipos de slide: capa, aviso, sala, porta, palavras, escuta, respiracao, batimento, simples, alerta, gravidade, assinatura.
 * Campos comuns: tag, texto, hl (trecho em destaque; padrao: ultima frase), nota (frase curta em italico).
 */
(function (root) {
  'use strict';

  var LOTTIE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
  var LOTTIE_SRI = 'sha512-jEnuDt6jfecCjthQAJ+ed0MTVA++5ZKmlUcmDGBv2vUI/REn6FuIdixLNnQT+vKusE2hhTk2is3cFvv5wA+Sgg==';
  var ASSINATURA = ['Dr. Antônio Felipe · Médico · CRM-BA 41322',
    'Especialista em Medicina de Família e Comunidade · RQE 26638',
    'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)'];
  var IA = 'Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).';
  var CHECK = function (d) {
    return '<svg viewBox="0 0 56 56" aria-hidden="true"><circle pathLength="1" class="draw" style="animation-delay:' + d + 's" cx="28" cy="28" r="24" fill="none" stroke="#F7C95E" stroke-width="4"/>' +
      '<path pathLength="1" class="draw" style="animation-delay:' + (d + .4) + 's" d="M16 29 L25 38 L41 18" fill="none" stroke="#F7C95E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // texto com destaque: hl explicito ou ultima frase (quando ha mais de uma)
  function comDestaque(texto, hl) {
    var t = esc(texto);
    if (hl === false) return t;
    if (!hl) {
      var i = texto.lastIndexOf('. ', texto.length - 2);
      if (i < 0) return t;
      hl = texto.slice(i + 2);
    }
    var h = esc(hl), k = t.lastIndexOf(h);
    if (k < 0) return t;
    return t.slice(0, k) + '<span class="hl">' + h + '</span>' + t.slice(k + h.length);
  }

  function room(kind) {
    var S = '#25493A', st = 'fill="none" stroke="' + S + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"';
    var dl = function (n) { return ' style="animation-delay:' + n + 's"'; };
    var d = kind === 'draw', cls = (d || kind === 'door') ? 'draw' : '';
    return '<svg class="art" viewBox="0 0 800 480" aria-hidden="true">' +
      '<defs><radialGradient id="g' + kind + '"><stop offset="0" stop-color="#F7C95E" stop-opacity=".9"/><stop offset="1" stop-color="#F7C95E" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="400" cy="120" r="170" fill="url(#g' + kind + ')" style="transform-origin:center;transform-box:fill-box;animation:glow 2.4s ease-out ' + (d ? 1.2 : .3) + 's backwards"/>' +
      '<g ' + st + '>' +
      '<rect class="' + cls + '" x="300" y="40" width="200" height="150" rx="6" pathLength="1"' + dl(0) + '/>' +
      '<path class="' + cls + '" pathLength="1" d="M400 40 V190 M300 115 H500"' + dl(.3) + '/>' +
      '<path class="' + cls + '" pathLength="1" d="M30 420 H770"' + dl(.5) + '/>' +
      '<path class="' + cls + '" pathLength="1" d="M120 230 V420 M120 320 H235 M235 320 V420"' + dl(.8) + '/>' +
      '<path class="' + cls + '" pathLength="1" d="M680 230 V420 M680 320 H565 M565 320 V420"' + dl(1.1) + '/>' +
      '<path class="' + cls + '" pathLength="1" d="M335 370 H465 M345 370 V420 M455 370 V420"' + dl(1.3) + '/>' +
      '<path class="' + cls + '" pathLength="1" d="M385 370 L392 315 H408 L415 370 Z"' + dl(1.5) + '/>' +
      '</g>' + (kind === 'door' ? '<rect x="700" y="170" width="85" height="250" rx="6" fill="#B8741A" opacity=".22"/><rect class="door" x="700" y="170" width="85" height="250" rx="6" fill="#B8741A"/>' : '') + '</svg>';
  }

  var B = {
    capa: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div><h1 data-letters="' + esc(s.titulo) + '"></h1>' +
        '<div style="margin-top:20px;width:78%;align-self:center">' + room('cover') + '</div>' +
        (s.nota ? '<p class="n rv" style="animation-delay:2.6s;margin-top:20px">' + esc(s.nota) + '</p>' : '');
    },
    aviso: function (s) {
      return '<div class="tag rv">' + esc(s.tag || 'Aviso e contexto') + '</div><p class="t" data-type="' + esc(s.texto) + '"></p>' +
        (s.nota ? '<p class="n rv" style="animation-delay:5.5s">' + esc(s.nota) + '</p>' : '');
    },
    sala: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div>' + room('draw') +
        '<p class="t rv" style="animation-delay:1.8s;margin-top:40px">' + comDestaque(s.texto, s.hl) + '</p>';
    },
    palavras: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div><p class="t" data-words="' + esc(s.texto) + '" data-step="0.12"></p>' +
        (s.destaque ? '<p class="t rv" style="animation-delay:3.4s;margin-top:20px"><span class="hl">' + esc(s.destaque) + '</span></p>' : '') +
        (s.nota ? '<p class="n rv" style="animation-delay:3.4s">' + esc(s.nota) + '</p>' : '');
    },
    escuta: function (s) {
      var topo = '<div class="tag rv">' + esc(s.tag) + '</div><div data-lottie="escuta" class="rv" style="width:360px;height:360px;margin:-20px auto -10px"></div>';
      if (s.destaque) return topo + '<p class="t" data-words="' + esc(s.texto) + '" data-step="0.12"></p><p class="t rv" style="animation-delay:3.4s;margin-top:20px"><span class="hl">' + esc(s.destaque) + '</span></p>';
      return topo + '<p class="t rv" style="animation-delay:.8s">' + comDestaque(s.texto, s.hl) + '</p>';
    },
    porta: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div>' + room('door') +
        '<p class="t rv" style="animation-delay:1.2s;font-size:40px;margin-top:30px">' + comDestaque(s.texto, s.hl) + '</p>';
    },
    respiracao: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div>' +
        '<div style="position:relative;width:78%;aspect-ratio:500/360;margin:0 auto"><div data-lottie="respiracao" style="position:absolute;inset:0"></div>' +
        '<svg viewBox="0 0 500 360" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><g transform="translate(220 100)">' +
        '<path pathLength="1" class="draw" d="M0 0 L12 120 H48 L60 0 Z" fill="none" stroke="#25493A" stroke-width="5" stroke-linejoin="round"/>' +
        '<rect class="wl" x="6" y="55" width="48" height="62" fill="#7FB2C4" opacity=".85"/></g></svg></div>' +
        '<p class="t rv" style="animation-delay:1s;margin-top:20px">' + comDestaque(s.texto, s.hl) + '</p>';
    },
    batimento: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div><svg class="art" viewBox="0 0 800 220" style="height:230px" aria-hidden="true">' +
        '<path pathLength="1" class="beat" d="M0 110 H200 L230 110 L260 40 L300 180 L330 110 H480 L510 110 L540 60 L575 160 L600 110 H800" fill="none" stroke="#25493A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/></svg>' +
        '<p class="t rv" style="animation-delay:.5s;margin-top:30px">' + comDestaque(s.texto, s.hl) + '</p>' +
        (s.nota ? '<p class="n rv" style="animation-delay:1.8s">' + esc(s.nota) + '</p>' : '');
    },
    simples: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div><p class="t rv" style="animation-delay:.3s">' + comDestaque(s.texto, s.hl) + '</p>' +
        (s.nota ? '<p class="n rv" style="animation-delay:1.4s">' + esc(s.nota) + '</p>' : '');
    },
    alerta: function (s) {
      return '<div class="tag rv">' + esc(s.tag) + '</div><h2 class="rv" style="animation-delay:.2s">' + esc(s.titulo) + '</h2>' +
        '<div class="num"><div style="animation:slideL .9s .8s backwards"><strong>192</strong><span>SAMU, emergência</span></div>' +
        '<div style="animation:slideR .9s .8s backwards"><strong>188</strong><span>CVV, apoio 24 horas</span></div></div>' +
        (s.nota ? '<p class="n rv" style="animation-delay:1.8s">' + esc(s.nota) + '</p>' : '');
    },
    gravidade: function (s) {
      var li = (s.itens || []).map(function (t, i) {
        return '<li class="rv" style="animation-delay:' + (.6 + i) + 's">' + CHECK(.6 + i) + '<span>' + esc(t) + '</span></li>';
      }).join('');
      return '<div class="tag rv">' + esc(s.tag) + '</div><h2 class="rv" style="animation-delay:.1s">Atenção imediata</h2><ul class="lst">' + li + '</ul>' +
        '<p class="t rv" style="animation-delay:3.4s;margin-top:30px;font-size:38px">' + s.texto + '</p>';
    },
    assinatura: function (s) {
      return '<div class="tag rv">' + esc(s.tag || 'Assinatura ética e aviso') + '</div>' +
        '<p class="t rv" style="animation-delay:.2s;font-size:40px">' + esc(s.texto) + '</p>' +
        '<div class="sig rv" style="animation-delay:1.2s;margin-top:44px;border-left:8px solid var(--ambar);padding-left:28px"><b class="grad">' + esc(ASSINATURA[0]) + '</b><br>' + esc(ASSINATURA[1]) + '<br>' + esc(ASSINATURA[2]) + '</div>' +
        '<p class="sub rv" style="animation-delay:1.8s">🎧 Ouça o artigo narrado no Portal: drsaudemental.vercel.app/artigo/' + esc(s.slug) + '</p>' +
        '<p class="sub rv" style="animation-delay:2.2s;font-size:26px">' + esc(IA) + '</p>' +
        '<div class="foot"><span>CVV 188</span><span>SAMU 192</span></div>';
    }
  };
  var ESCURO = { alerta: 1, gravidade: 1 };
  var POEIRA = { capa: 1, respiracao: 1 };
  var LOTTIES = {
    escuta: { name: 'acolhimento-escuta-ativa', alt: 'Duas formas lado a lado com um anel suave ao redor, representando a escuta ativa' },
    respiracao: { name: 'respiracao-guiada', alt: 'Círculos suaves que se expandem e recolhem devagar, como uma respiração calma' }
  };

  function init(cfg) {
    var base = cfg.base || '../interativos/';
    document.title = cfg.titulo;
    var N = cfg.slides.length;
    document.body.innerHTML =
      '<div class="wrap" id="wrap"><div class="stage" id="stage" role="region" aria-roledescription="carrossel" aria-label="' + esc(cfg.titulo) + '">' +
      '<canvas id="dust" width="1080" height="1350" aria-hidden="true"></canvas><div class="progress" id="progress" aria-hidden="true"></div>' +
      cfg.slides.map(function (s, i) {
        var tp = B[s.tipo] ? s.tipo : 'simples';
        s.slug = s.slug || cfg.slug;
        return '<section class="slide' + (ESCURO[tp] ? ' dark' : '') + '"' + (POEIRA[tp] ? ' data-dust="1"' : '') + ' data-tipo="' + tp + '" aria-label="Slide ' + (i + 1) + ' de ' + N + '">' + B[tp](s) + '</section>';
      }).join('') + '</div></div>' +
      '<div class="controls" role="group" aria-label="Controles do carrossel"><button id="prev" aria-label="Slide anterior">◀ Anterior</button>' +
      '<span class="count" id="count" aria-live="polite">1 / ' + N + '</span><button id="next" aria-label="Próximo slide">Próximo ▶</button>' +
      '<button id="auto" aria-pressed="false">Automático: desligado</button></div>';

    var anime = new root.Anime2DManager(), reduce = anime.reduced;
    var audio = new root.AudioPlayer({ bgm: cfg.bgm || null, voiceovers: cfg.voiceovers || {} });
    // Modo de revisao (?revisao=1), uso interno: botao discreto para alternar entre a voz principal e a alternativa.
    // Sem o parametro, ou sem voiceoversAlt no config, nada aparece para o publico.
    if (cfg.voiceoversAlt && /(?:^|[?&])revisao=1(?:&|$)/.test(root.location.search)) {
      var vozes = cfg.vozes || { principal: 'principal', alternativa: 'alternativa' };
      var usaAlt = false, bv = document.createElement('button');
      bv.type = 'button'; bv.id = 'voz-revisao';
      var pintaVoz = function () {
        var nome = usaAlt ? vozes.alternativa : vozes.principal;
        bv.textContent = 'Voz: ' + nome + ' (revisão)';
        bv.setAttribute('aria-pressed', String(usaAlt));
        bv.setAttribute('aria-label', 'Alternar a voz da narração. Voz atual: ' + nome);
      };
      bv.addEventListener('click', function () { usaAlt = !usaAlt; audio.setVoiceovers(usaAlt ? cfg.voiceoversAlt : (cfg.voiceovers || {})); pintaVoz(); });
      pintaVoz();
      document.querySelector('.controls').appendChild(bv);
    }
    anime.watchLoops(document, '.beat,.grad');
    var slides = [].slice.call(document.querySelectorAll('.slide')), cur = 0;
    var stage = document.getElementById('stage'), prog = document.getElementById('progress'), count = document.getElementById('count');
    var autoBtn = document.getElementById('auto'), timer = null, DUR = 9000;
    slides.forEach(function () { var i = document.createElement('i'); i.appendChild(document.createElement('b')); prog.appendChild(i); });

    // texto animado
    function split(el, txt, mode, step) {
      el.setAttribute('aria-label', txt); el.textContent = '';
      var d = 0;
      txt.split(' ').forEach(function (word, wi, arr) {
        var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        if (mode === 'letters') {
          word.split('').forEach(function (ch) {
            var s = document.createElement('span'); s.className = 'l'; s.textContent = ch;
            s.style.animation = 'drop .9s cubic-bezier(.3,.7,.3,1) ' + (d * step).toFixed(2) + 's backwards'; d++; w.appendChild(s);
          });
        } else { w.textContent = word; w.style.animation = 'rise .7s ease ' + (d * step).toFixed(2) + 's backwards'; d++; }
        el.appendChild(w); if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
      });
    }
    [].forEach.call(document.querySelectorAll('[data-letters]'), function (e) { split(e, e.dataset.letters, 'letters', .035); });
    [].forEach.call(document.querySelectorAll('[data-words]'), function (e) { split(e, e.dataset.words, 'words', parseFloat(e.dataset.step) || .1); });
    [].forEach.call(document.querySelectorAll('[data-type]'), function (e) {
      var t = e.dataset.type; e.setAttribute('aria-label', t); e.textContent = '';
      var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); e.appendChild(vis); e._t = t; e._v = vis;
    });
    var typeTimer = null;
    function runType(sl) {
      clearInterval(typeTimer);
      var e = sl.querySelector('[data-type]'); if (!e) return;
      if (reduce) { e._v.textContent = e._t; return; }
      var i = 0; e._v.textContent = '';
      typeTimer = setInterval(function () { i++; e._v.textContent = e._t.slice(0, i) + (i < e._t.length ? '|' : ''); if (i >= e._t.length) { clearInterval(typeTimer); e._v.textContent = e._t; } }, 22);
    }

    // Lottie: lottie-web so com movimento permitido; senao, poster estatico
    var lots = [];
    slides.forEach(function (sl, i) {
      var box = sl.querySelector('[data-lottie]');
      if (box) lots.push({ box: box, slide: i, def: LOTTIES[box.dataset.lottie] });
    });
    if (lots.length) {
      var mount = function () {
        anime.lottie = root.lottie || null;
        lots.forEach(function (l) {
          var p = base + 'assets/anime/lottie/' + l.def.name;
          l.entry = anime.addLottie(l.box, { path: p + '.json', poster: p + '.poster.svg', alt: l.def.alt });
          if (l.entry.anim && l.slide !== cur) l.entry.anim.pause();
        });
      };
      if (reduce) mount();
      else {
        var sc = document.createElement('script'); sc.src = LOTTIE_SRC; sc.integrity = LOTTIE_SRI; sc.crossOrigin = 'anonymous';
        sc.onload = mount; sc.onerror = mount; document.head.appendChild(sc);
      }
    }

    // poeira suave (canvas)
    var cv = document.getElementById('dust'), cx = cv.getContext('2d'), ps = [], raf = 0, i;
    for (i = 0; i < 38; i++) ps.push({ x: Math.random() * 1080, y: Math.random() * 1350, r: 3 + Math.random() * 7, v: .12 + Math.random() * .3, a: .12 + Math.random() * .18, p: Math.random() * 6 });
    function frame(t) {
      cx.clearRect(0, 0, 1080, 1350);
      ps.forEach(function (p) {
        p.y -= p.v; p.x += Math.sin(t / 2200 + p.p) * .35; if (p.y < -10) { p.y = 1360; p.x = Math.random() * 1080; }
        cx.beginPath(); cx.fillStyle = 'rgba(184,116,26,' + p.a + ')'; cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
      });
      raf = requestAnimationFrame(frame);
    }
    function dust(on) { cancelAnimationFrame(raf); cx.clearRect(0, 0, 1080, 1350); if (on && !reduce && !document.hidden) raf = requestAnimationFrame(frame); }

    function go(n) {
      cur = (n + N) % N;
      slides.forEach(function (s, k) { s.classList.toggle('active', k === cur); });
      var sl = slides[cur];
      stage.classList.toggle('dark-ui', sl.classList.contains('dark'));
      [].forEach.call(prog.children, function (c, k) { c.classList.toggle('done', k < cur); var b = c.firstChild; b.style.transition = 'none'; b.style.width = k < cur ? '100%' : '0'; });
      count.textContent = (cur + 1) + ' / ' + N;
      runType(sl); dust(!!sl.dataset.dust); audio.playSlide(cur);
      if (!reduce) lots.forEach(function (l) { if (l.entry && l.entry.anim) { if (l.slide === cur) l.entry.anim.play(); else l.entry.anim.pause(); } });
      if (timer) schedule();
    }
    function schedule() {
      clearTimeout(timer);
      var b = prog.children[cur].firstChild;
      requestAnimationFrame(function () { b.style.transition = 'width ' + DUR + 'ms linear'; b.style.width = '100%'; });
      timer = setTimeout(function () { if (cur < N - 1) go(cur + 1); else toggleAuto(false); }, DUR);
    }
    function toggleAuto(on) {
      if (on === undefined) on = !timer;
      autoBtn.setAttribute('aria-pressed', on);
      autoBtn.textContent = 'Automático: ' + (on ? 'ligado' : 'desligado');
      if (on) { timer = 1; schedule(); } else { clearTimeout(timer); timer = null; var b = prog.children[cur].firstChild; b.style.transition = 'none'; b.style.width = '0'; }
    }
    document.getElementById('next').onclick = function () { go(cur + 1); };
    document.getElementById('prev').onclick = function () { go(cur - 1); };
    autoBtn.onclick = function () { toggleAuto(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(cur + 1); else if (e.key === 'ArrowLeft') go(cur - 1); });
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    stage.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); });
    document.addEventListener('visibilitychange', function () { dust(!!slides[cur].dataset.dust); });
    function fit() { var s = Math.min(window.innerWidth / 1080, (window.innerHeight - 150) / 1350); document.documentElement.style.setProperty('--s', Math.max(s, .2)); }
    window.addEventListener('resize', fit); fit();
    go(0);
  }

  root.CarrosselAnimado = { init: init };
})(typeof window !== 'undefined' ? window : this);
