/*
 * Anime2DManager: animacao vetorial 2D (Lottie JSON, GSAP/CSS e rigging de SVG), com trava de
 * acessibilidade. Script classico; expoe window.Anime2DManager.
 *
 *   var anime = new Anime2DManager({ lottie: window.lottie, gsap: window.gsap });  // ambos opcionais
 *   anime.addLottie(el, { path: 'assets/anime/lottie/acolhimento.json', poster: 'assets/anime/lottie/acolhimento.png' });
 *   anime.rig(svg, { eyes: '.olho', blinkEvery: 4200, gesture: '.mao' });          // piscar e gesto de acolhimento
 *   anime.watchLoops(document, '.breath, .ringc, .beat');                          // loops CSS
 *
 * Com prefers-reduced-motion: reduce: nada em loop; Lottie mostra o quadro estatico (poster ou frame 0).
 * Sem Lottie/GSAP carregados, cai para CSS e Web Animations API, sem erro.
 */
(function (root) {
  'use strict';

  function Anime2DManager(opts) {
    opts = opts || {};
    this.lottie = opts.lottie || root.lottie || null;
    this.gsap = opts.gsap || root.gsap || null;
    this._mq = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this._lotties = [];
    this._rigs = [];
    this._loops = [];
    var self = this;
    this._onChange = function () { self._apply(); };
    if (this._mq) { (this._mq.addEventListener ? this._mq.addEventListener('change', this._onChange) : this._mq.addListener(this._onChange)); }
  }

  Object.defineProperty(Anime2DManager.prototype, 'reduced', {
    get: function () { return !!(this._mq && this._mq.matches); }
  });

  /** Lottie JSON. Reduzido: mostra o poster (img) ou o frame 0 parado. */
  Anime2DManager.prototype.addLottie = function (container, o) {
    o = o || {};
    var entry = { container: container, anim: null, poster: null };
    var self = this;
    function poster() {
      if (!o.poster || entry.poster) return;
      var img = document.createElement('img');
      img.src = o.poster; img.alt = o.alt || ''; img.style.cssText = 'width:100%;height:100%;object-fit:contain';
      if (!o.alt) img.setAttribute('aria-hidden', 'true');
      entry.poster = img; container.appendChild(img);
    }
    if (this.reduced && o.poster) { poster(); this._lotties.push(entry); return entry; }
    if (!this.lottie) { poster(); this._lotties.push(entry); return entry; }   // sem biblioteca: poster
    entry.anim = this.lottie.loadAnimation({
      container: container, renderer: 'svg', loop: o.loop !== false, autoplay: !this.reduced,
      path: o.path, animationData: o.animationData
    });
    if (this.reduced) entry.anim.addEventListener('DOMLoaded', function () { entry.anim.goToAndStop(0, true); });
    this._lotties.push(entry);
    return entry;
  };

  /** Rigging de SVG: piscar de olhos e gesto de acolhimento (balanco suave), via WAAPI/GSAP. */
  Anime2DManager.prototype.rig = function (svg, o) {
    o = o || {};
    var rig = { svg: svg, timers: [], anims: [] };
    var self = this;
    var eyes = o.eyes ? [].slice.call(svg.querySelectorAll(o.eyes)) : [];
    function blink() {
      if (self.reduced) return;
      eyes.forEach(function (e) {
        e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
        if (self.gsap) self.gsap.fromTo(e, { scaleY: 1 }, { scaleY: .08, duration: .09, yoyo: true, repeat: 1, ease: 'power1.inOut' });
        else if (e.animate) e.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)' }, { transform: 'scaleY(1)' }], { duration: 180 });
      });
    }
    if (eyes.length) {
      var every = o.blinkEvery || 4200;
      rig.start = function () { rig.stop(); rig.timers.push(setInterval(blink, every + Math.random() * 1200)); };
      rig.stop = function () { rig.timers.forEach(clearInterval); rig.timers = []; };
      rig.start();
    } else { rig.start = rig.stop = function () {}; }

    if (o.gesture) {
      [].forEach.call(svg.querySelectorAll(o.gesture), function (g) {
        g.style.transformBox = 'fill-box'; g.style.transformOrigin = '50% 100%';
        if (g.animate) {
          var a = g.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }],
            { duration: 3200, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
          rig.anims.push(a);
          if (self.reduced) a.pause();
        }
      });
    }
    this._rigs.push(rig);
    if (this.reduced) rig.stop();
    return rig;
  };

  /** Loops em CSS: congela (animation-play-state) quando reduzido ou quando o container esta oculto. */
  Anime2DManager.prototype.watchLoops = function (scope, selector) {
    var els = [].slice.call((scope || document).querySelectorAll(selector));
    this._loops = this._loops.concat(els);
    this._apply();
    return els;
  };

  /** Timeline GSAP; reduzido: salta para o estado final. */
  Anime2DManager.prototype.timeline = function (cfg) {
    if (!this.gsap) return null;
    var tl = this.gsap.timeline(cfg);
    if (this.reduced) tl.progress(1).pause();
    return tl;
  };

  Anime2DManager.prototype.pause = function () { this._set(true); };
  Anime2DManager.prototype.resume = function () { if (!this.reduced) this._set(false); };

  Anime2DManager.prototype._set = function (paused) {
    this._lotties.forEach(function (l) { if (l.anim) paused ? l.anim.pause() : l.anim.play(); });
    this._rigs.forEach(function (r) { paused ? r.stop() : r.start(); r.anims.forEach(function (a) { paused ? a.pause() : a.play(); }); });
    this._loops.forEach(function (e) { e.style.animationPlayState = paused ? 'paused' : 'running'; });
  };

  Anime2DManager.prototype._apply = function () {
    if (this.reduced) {
      this._set(true);
      this._lotties.forEach(function (l) { if (l.anim) l.anim.goToAndStop(0, true); });
    } else { this._set(false); }
  };

  Anime2DManager.prototype.destroy = function () {
    this._rigs.forEach(function (r) { r.stop(); r.anims.forEach(function (a) { a.cancel(); }); });
    this._lotties.forEach(function (l) { if (l.anim) l.anim.destroy(); });
    if (this._mq) { (this._mq.removeEventListener ? this._mq.removeEventListener('change', this._onChange) : this._mq.removeListener(this._onChange)); }
  };

  root.Anime2DManager = Anime2DManager;
})(typeof window !== 'undefined' ? window : this);
