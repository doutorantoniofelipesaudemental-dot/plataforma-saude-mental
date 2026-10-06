/*
 * AudioPlayer: BGM em loop + voiceover por slide, com ducking automatico.
 * Script classico (sem import), funciona em file:// e em servidor. Expoe window.AudioPlayer.
 *
 *   var audio = new AudioPlayer({
 *     bgm: 'assets/audio/bgm/suave.mp3',
 *     voiceovers: { 0: 'assets/audio/voiceover/pacote-031/slide-01.mp3' }   // indice do slide -> arquivo
 *   });
 *   audio.playSlide(i);   // ao trocar de slide
 *
 * Regras: inicia mutado (politica de autoplay); BGM a 15% (-22 dB); 8% durante o voiceover;
 * sem fontes configuradas o botao fica desabilitado ("indisponivel"), sem erro.
 */
(function (root) {
  'use strict';

  var BGM_VOLUME = 0.15;   // ~ -16 dBFS de ganho; trilha final deve ser masterizada para -22 dB no conjunto
  var DUCK_VOLUME = 0.08;
  var RAMP_MS = 400;

  function AudioPlayer(opts) {
    opts = opts || {};
    this.bgmUrl = opts.bgm || null;
    this.voiceovers = opts.voiceovers || {};
    this.bgmVolume = opts.bgmVolume != null ? opts.bgmVolume : BGM_VOLUME;
    this.duckVolume = opts.duckVolume != null ? opts.duckVolume : DUCK_VOLUME;
    this.muted = true;
    this._slide = -1;
    this._voice = null;
    this._ramp = null;
    this._bgm = null;
    this.available = !!this.bgmUrl || Object.keys(this.voiceovers).length > 0;

    if (this.bgmUrl) {
      this._bgm = new Audio(this.bgmUrl);
      this._bgm.loop = true;
      this._bgm.preload = 'none';
      this._bgm.volume = this.bgmVolume;
      this._bgm.addEventListener('error', this._fail.bind(this));
    }
    this._buildButton(opts.container || document.body);
    this._onVis = function () { if (document.hidden) this._pauseAll(); else if (!this.muted) this._resume(); }.bind(this);
    document.addEventListener('visibilitychange', this._onVis);
  }

  AudioPlayer.prototype._buildButton = function (container) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-audio-toggle', '');
    b.style.cssText = 'position:fixed;top:8px;right:8px;z-index:50;min-width:48px;min-height:48px;padding:0 18px;' +
      'border-radius:24px;border:2px solid #fff;background:#25493A;color:#fff;font:700 17px system-ui,sans-serif;cursor:pointer';
    b.addEventListener('click', this.toggle.bind(this));
    b.addEventListener('focus', function () { b.style.outline = '4px solid #F7C95E'; b.style.outlineOffset = '2px'; });
    b.addEventListener('blur', function () { b.style.outline = ''; });
    container.appendChild(b);
    this.button = b;
    this._render();
  };

  AudioPlayer.prototype._render = function () {
    var b = this.button;
    if (!this.available) {
      b.disabled = true;
      b.textContent = '🔇 Áudio: indisponível';
      b.setAttribute('aria-label', 'Áudio indisponível neste carrossel');
      b.style.opacity = '1'; b.style.background = '#4A4A4A';
      return;
    }
    b.setAttribute('aria-pressed', String(!this.muted));
    b.textContent = this.muted ? '🔇 Áudio: DESLIGADO' : '🔊 Áudio: LIGADO';
    b.setAttribute('aria-label', this.muted ? 'Ligar o áudio' : 'Desligar o áudio');
  };

  AudioPlayer.prototype._fail = function () { this.available = false; this.muted = true; this._pauseAll(); this._render(); };

  AudioPlayer.prototype._rampTo = function (target) {
    var a = this._bgm; if (!a) return;
    clearInterval(this._ramp);
    var from = a.volume, steps = Math.max(1, Math.round(RAMP_MS / 30)), i = 0;
    this._ramp = setInterval(function () {
      i++; a.volume = Math.min(1, Math.max(0, from + (target - from) * (i / steps)));
      if (i >= steps) clearInterval(this._ramp);
    }.bind(this), 30);
  };

  AudioPlayer.prototype._play = function (el) {
    var p = el.play();
    if (p && p.catch) p.catch(function () { /* bloqueado ate haver gesto do usuario */ });
  };

  AudioPlayer.prototype._resume = function () {
    if (this._bgm) { this._play(this._bgm); this._rampTo(this._voice && !this._voice.ended ? this.duckVolume : this.bgmVolume); }
    if (this._voice && !this._voice.ended) this._play(this._voice);
  };

  AudioPlayer.prototype._pauseAll = function () {
    if (this._bgm) this._bgm.pause();
    if (this._voice) this._voice.pause();
  };

  AudioPlayer.prototype.unmute = function () {
    if (!this.available) return;
    this.muted = false; this._render();
    if (this._bgm) this._bgm.volume = 0;
    this._resume();
    if (!this._voice) this._startVoice(this._slide);
  };

  AudioPlayer.prototype.mute = function () {
    this.muted = true; this._render(); this._pauseAll();
  };

  AudioPlayer.prototype.toggle = function () { if (this.muted) this.unmute(); else this.mute(); };

  AudioPlayer.prototype.stopVoiceover = function () {
    if (this._voice) { this._voice.pause(); this._voice.onended = null; this._voice = null; }
    this._rampTo(this.bgmVolume);
  };

  AudioPlayer.prototype._startVoice = function (i) {
    var url = this.voiceovers[i];
    if (!url || this.muted) return;
    var v = new Audio(url);
    var self = this;
    v.addEventListener('error', function () { if (self._voice === v) self.stopVoiceover(); });
    v.onended = function () { if (self._voice === v) { self._voice = null; self._rampTo(self.bgmVolume); } };
    this._voice = v;
    this._rampTo(this.duckVolume);   // ducking: BGM cai para 8% enquanto a narracao toca
    this._play(v);
  };

  /** Troca o mapa de narracoes (ex.: modo de revisao, voz alternativa) e, com o audio ligado, refaz a fala do slide ativo. */
  AudioPlayer.prototype.setVoiceovers = function (mapa) {
    this.voiceovers = mapa || {};
    if (!this.muted) { this.stopVoiceover(); this._startVoice(this._slide); }
  };

  /** Chamar a cada troca de slide: encerra a narracao anterior e inicia a do slide ativo. */
  AudioPlayer.prototype.playSlide = function (i) {
    this._slide = i;
    this.stopVoiceover();
    this._startVoice(i);
  };

  AudioPlayer.prototype.destroy = function () {
    this._pauseAll(); clearInterval(this._ramp);
    document.removeEventListener('visibilitychange', this._onVis);
    if (this.button && this.button.parentNode) this.button.parentNode.removeChild(this.button);
  };

  AudioPlayer.BGM_VOLUME = BGM_VOLUME;
  AudioPlayer.DUCK_VOLUME = DUCK_VOLUME;
  root.AudioPlayer = AudioPlayer;
})(typeof window !== 'undefined' ? window : this);
