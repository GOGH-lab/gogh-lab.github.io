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
