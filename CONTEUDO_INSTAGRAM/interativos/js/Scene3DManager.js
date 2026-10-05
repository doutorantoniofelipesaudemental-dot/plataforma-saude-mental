/*
 * Scene3DManager: cena WebGL leve com Three.js (renderizador, camera, luzes e loop ate 60 FPS).
 * Script classico; expoe window.Scene3DManager. Three.js nao e embutido: passe o objeto THREE
 * (build UMD, ex.: three r128 do cdnjs) e, para .gltf/.glb, o GLTFLoader (THREE.GLTFLoader ou opts.GLTFLoader).
 *
 *   var scene = new Scene3DManager(container, { THREE: window.THREE, fallback: '<img ...>' });
 *   var porta = scene.addPrimitive('box', { size: [1, 2, .1], color: 0xB8741A });
 *   scene.spin(porta, 0.4);                         // rad/s; ignorado em prefers-reduced-motion
 *   scene.loadModel('assets/anime/models3d/sala.glb').then(function (m) { ... });
 *
 * Reduzido: renderiza um unico quadro estatico, sem rotacao nem movimento de camera.
 * Sem WebGL: mostra o conteudo `fallback` (alternativa estatica) e nao quebra a leitura.
 * Pausa sozinho quando a aba ou o elemento nao estao visiveis.
 */
(function (root) {
  'use strict';

  function Scene3DManager(container, opts) {
    opts = opts || {};
    var T = this.T = opts.THREE || root.THREE;
    this.container = container;
    this.opts = opts;
    this.ok = false;
    this._spins = [];
    this._updaters = [];
    this._running = false;
    this._visible = true;
    this._raf = 0;
    this._mq = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this._clock = null;

    if (!T) return this._fallback();
    try {
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: !opts.background, powerPreference: 'low-power' });
    } catch (e) { return this._fallback(); }

    this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    if (opts.background != null) this.renderer.setClearColor(opts.background, 1);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    container.appendChild(this.renderer.domElement);

    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(opts.fov || 40, 1, .1, 100);
    this.camera.position.set.apply(this.camera.position, opts.cameraPosition || [0, 1.2, 5]);
    this.camera.lookAt(0, 0, 0);

    // luz acolhedora: ambiente creme + direcional ambar
    this.scene.add(new T.AmbientLight(0xF6F0E2, .8));
    var sun = new T.DirectionalLight(0xF7C95E, .9);
    sun.position.set(3, 4, 3);
    this.scene.add(sun);

    this._clock = new T.Clock();
    var self = this;
    this._onResize = function () { self.resize(); };
    if (root.ResizeObserver) { this._ro = new ResizeObserver(this._onResize); this._ro.observe(container); }
    else root.addEventListener('resize', this._onResize);
    if (root.IntersectionObserver) {
      this._io = new IntersectionObserver(function (en) { self._visible = en[0].isIntersecting; self._sync(); });
      this._io.observe(container);
    }
    this._onVis = function () { self._sync(); };
    document.addEventListener('visibilitychange', this._onVis);
    this._onMq = function () { self._sync(); self.renderOnce(); };
    if (this._mq) { (this._mq.addEventListener ? this._mq.addEventListener('change', this._onMq) : this._mq.addListener(this._onMq)); }

    this.ok = true;
    this.resize();
    this.start();
  }

  Object.defineProperty(Scene3DManager.prototype, 'reduced', {
    get: function () { return !!(this._mq && this._mq.matches); }
  });

  Scene3DManager.prototype._fallback = function () {
    if (this.opts.fallback != null) this.container.innerHTML = this.opts.fallback;
    return this;
  };

  Scene3DManager.prototype.resize = function () {
    if (!this.ok) return;
    var w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderOnce();
  };

  /** Primitivas estilizadas (flat/toon-like): box, sphere, torus, cylinder, plane. */
  Scene3DManager.prototype.addPrimitive = function (type, o) {
    if (!this.ok) return null;
    o = o || {}; var T = this.T, s = o.size || [1, 1, 1], g;
    switch (type) {
      case 'sphere': g = new T.SphereGeometry(s[0] / 2, 32, 24); break;
      case 'torus': g = new T.TorusGeometry(s[0] / 2, (s[1] || .2) / 2, 16, 48); break;
      case 'cylinder': g = new T.CylinderGeometry(s[0] / 2, s[0] / 2, s[1] || 1, 32); break;
      case 'plane': g = new T.PlaneGeometry(s[0], s[1] || 1); break;
      default: g = new T.BoxGeometry(s[0], s[1], s[2]);
    }
    var m = new T.Mesh(g, new T.MeshStandardMaterial({ color: o.color != null ? o.color : 0x25493A, roughness: .85, metalness: 0, flatShading: true }));
    if (o.position) m.position.set(o.position[0], o.position[1], o.position[2]);
    this.scene.add(m); this.renderOnce();
    return m;
  };

  /** .gltf / .glb. Promise com o objeto 3D ja adicionado a cena. */
  Scene3DManager.prototype.loadModel = function (url) {
    var self = this, T = this.T;
    var Loader = this.opts.GLTFLoader || T.GLTFLoader;
    if (!this.ok || !Loader) return Promise.reject(new Error('GLTFLoader indisponivel'));
    return new Promise(function (res, rej) {
      new Loader().load(url, function (gltf) { self.scene.add(gltf.scene); self.renderOnce(); res(gltf.scene); }, undefined, rej);
    });
  };

  /** Rotacao continua (rad/s) em Y. Ignorada com prefers-reduced-motion. */
  Scene3DManager.prototype.spin = function (obj, speed) { if (obj) this._spins.push({ o: obj, v: speed == null ? .4 : speed }); };

  /** Callback por quadro: fn(dt, tempoTotal). Nao e chamado em modo reduzido. */
  Scene3DManager.prototype.onFrame = function (fn) { this._updaters.push(fn); };

  Scene3DManager.prototype._frame = function () {
    this._raf = 0;
    if (!this._running) return;
    var dt = Math.min(this._clock.getDelta(), .05), t = this._clock.elapsedTime;
    this._spins.forEach(function (s) { s.o.rotation.y += s.v * dt; });
    this._updaters.forEach(function (f) { f(dt, t); });
    this.renderer.render(this.scene, this.camera);
    this._raf = root.requestAnimationFrame(this._frame.bind(this));
  };

  Scene3DManager.prototype.renderOnce = function () { if (this.ok) this.renderer.render(this.scene, this.camera); };

  Scene3DManager.prototype._sync = function () {
    var should = this.ok && this._visible && !document.hidden && !this.reduced;
    if (should && !this._running) { this._running = true; this._clock.getDelta(); this._raf = root.requestAnimationFrame(this._frame.bind(this)); }
    else if (!should && this._running) { this._running = false; root.cancelAnimationFrame(this._raf); }
  };

  Scene3DManager.prototype.start = function () { this._sync(); if (this.reduced) this.renderOnce(); };
  Scene3DManager.prototype.stop = function () { this._running = false; root.cancelAnimationFrame(this._raf); };

  Scene3DManager.prototype.dispose = function () {
    if (!this.ok) return;
    this.stop();
    if (this._ro) this._ro.disconnect(); else root.removeEventListener('resize', this._onResize);
    if (this._io) this._io.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    if (this._mq) { (this._mq.removeEventListener ? this._mq.removeEventListener('change', this._onMq) : this._mq.removeListener(this._onMq)); }
    this.scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach(function (m) { m.dispose(); });
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    this.ok = false;
  };

  root.Scene3DManager = Scene3DManager;
})(typeof window !== 'undefined' ? window : this);
