// Protótipo: busca no índice local (sem /api), vídeo só ao clicar, legenda VTT.
(function () {
  var busca = document.getElementById('busca');
  var lista = document.getElementById('sugestoes');
  var indice = [];
  fetch('assets/indice.json').then(function (r) { return r.json(); }).then(function (j) { indice = j; }).catch(function () {});
  if (busca) busca.addEventListener('input', function () {
    var q = busca.value.trim().toLowerCase();
    lista.innerHTML = '';
    if (q.length < 2) return;
    indice.filter(function (p) { return p.titulo.toLowerCase().indexOf(q) !== -1; }).slice(0, 6).forEach(function (p) {
      var li = document.createElement('li'); var a = document.createElement('a');
      a.href = p.url; a.textContent = p.titulo; a.style.cssText = 'display:block;min-height:44px;line-height:44px;color:#fff;font-weight:600';
      li.appendChild(a); lista.appendChild(li);
    });
  });
  var botao = document.getElementById('play-bv'), area = document.getElementById('bv-area'), status = document.getElementById('bv-status');
  if (botao) botao.addEventListener('click', function () {
    botao.disabled = true;
    var v = document.createElement('video');
    v.controls = true; v.preload = 'metadata'; v.style.width = '100%'; v.style.maxWidth = '720px';
    v.setAttribute('aria-label', 'Vídeo de boas-vindas');
    var tr = document.createElement('track'); tr.kind = 'captions'; tr.srclang = 'pt-BR'; tr.label = 'Português'; tr.src = 'assets/boas-vindas.vtt'; tr.default = true;
    v.appendChild(tr);
    v.addEventListener('error', function () { status.textContent = 'Vídeo indisponível neste protótipo. A legenda e a transcrição estão no roteiro.'; });
    var s = document.createElement('source'); s.src = 'assets/video/bv-16x9.mp4'; s.type = 'video/mp4'; v.appendChild(s);
    area.appendChild(v);
    status.textContent = 'Carregando o vídeo.';
  });
})();
