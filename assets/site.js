/* Agency Gogh — comportamento do site. Sem coleta de dados, sem biblioteca externa. */
(function () {
  // Número comercial do WhatsApp, só dígitos com DDI e DDD (ex.: "5534999999999").
  // Vazio: os botões "Falar com especialista" abrem o Direct do Instagram.
  var WHATSAPP = '5516991366741';
  var MENSAGEM = 'Olá! Vim pelo site da Gogh e quero falar com um especialista sobre a minha loja.';

  if (/^\d{12,13}$/.test(WHATSAPP)) {
    var destino = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(MENSAGEM);
    document.querySelectorAll('[data-especialista]').forEach(function (a) {
      a.setAttribute('href', destino);
    });
    document.querySelectorAll('[data-canal-texto]').forEach(function (s) {
      s.textContent = 'WhatsApp';
    });
  }

  var topo = document.querySelector('.topo');
  var barra = document.querySelector('.barra-celular');
  var abertura = document.querySelector('.abertura');
  var final = document.querySelector('.final');

  function aoRolar() {
    if (topo) topo.classList.toggle('rolou', window.scrollY > 12);
  }
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  // A barra fixa aparece depois da abertura e some quando a chamada final está na tela.
  if (barra && abertura && final && 'IntersectionObserver' in window) {
    var passouAbertura = false, vendoFinal = false;
    var atualiza = function () { barra.classList.toggle('visivel', passouAbertura && !vendoFinal); };
    new IntersectionObserver(function (e) { passouAbertura = !e[0].isIntersecting; atualiza(); }).observe(abertura);
    new IntersectionObserver(function (e) { vendoFinal = e[0].isIntersecting; atualiza(); }).observe(final);
  }

  var ano = document.querySelector('[data-ano]');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();

/* v4 — aparecer ao rolar.
   Navegador com scroll-driven animation (Chrome/Edge novos) ja faz pelo CSS.
   Aqui e o plano B, para Safari e Firefox: mesma aparencia, sem depender do CSS novo. */
(function aparecerAoRolar(){
  var blocos = document.querySelectorAll('[data-surge]');
  if (!blocos.length) return;

  var temNativo = CSS.supports && CSS.supports('animation-timeline', 'view()');
  var querMenos = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (temNativo || querMenos) {
    if (querMenos) blocos.forEach(function(b){ b.classList.add('dentro'); });
    return;
  }
  if (!('IntersectionObserver' in window)) {           // navegador antigo: mostra tudo
    blocos.forEach(function(b){ b.classList.add('dentro'); });
    return;
  }
  var olho = new IntersectionObserver(function(itens){
    itens.forEach(function(i){
      if (i.isIntersecting){ i.target.classList.add('dentro'); olho.unobserve(i.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  blocos.forEach(function(b){ olho.observe(b); });
})();

/* Abertura: a rolagem toca o filme e acende os capitulos.
   O video nunca toca sozinho — quem manda no tempo dele e o scroll. */
(function filmeDeAbertura(){
  var secao = document.querySelector('.filme');
  var video = document.querySelector('.filme-video');
  var caps  = Array.prototype.slice.call(document.querySelectorAll('.filme-cap'));
  if (!secao || !video || !caps.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    caps.forEach(function(c){ c.classList.add('aceso'); });
    return;
  }

  var duracao = 0, alvo = 0, atual = 0, correndo = false;

  function pegarDuracao(){
    if (duracao) return;
    duracao = video.duration || 0;
    if (duracao) medir();
  }
  video.addEventListener('loadedmetadata', pegarDuracao);
  video.addEventListener('durationchange', pegarDuracao);
  video.addEventListener('canplay', pegarDuracao);
  // o video pode ja estar pronto (cache): o evento nao dispara de novo
  if (video.readyState >= 1) pegarDuracao(); else video.load();

  function medir(){
    if (!duracao) return;
    var topo = secao.offsetTop;
    var curso = secao.offsetHeight - window.innerHeight;          // quanto da para rolar dentro da secao
    var andado = Math.min(Math.max((window.scrollY - topo) / Math.max(curso, 1), 0), 1);
    alvo = andado * (duracao - 0.04);
    if (andado > 0.02) secao.classList.add('andou');
    if (!correndo) { correndo = true; requestAnimationFrame(seguir); }

    // acende o capitulo que esta no meio da tela
    var meio = window.innerHeight * 0.5;
    caps.forEach(function(c){
      var r = c.getBoundingClientRect();
      if (r.top <= meio && r.bottom >= meio * 0.2) c.classList.add('aceso');
    });
  }

  /* segue o alvo com suavidade: sem isso o filme "pula" a cada evento de rolagem */
  function seguir(){
    atual += (alvo - atual) * 0.15;
    if (Math.abs(alvo - atual) < 0.004) { atual = alvo; correndo = false; }
    if (video.readyState >= 1) { try { video.currentTime = atual; } catch (e) {} }
    if (correndo) requestAnimationFrame(seguir);
  }

  addEventListener('scroll', medir, { passive: true });
  addEventListener('resize', medir);
  medir();
})();
