/* Agency Gogh — comportamento do site. Sem coleta de dados, sem biblioteca externa. */
(function () {
  // Números comerciais do WhatsApp, só dígitos com DDI e DDD (ex.: "5534999999999").
  // Todo botão de contato abre uma escolha com os dois: a pessoa decide com quem falar.
  // Sem JavaScript, os links do HTML vão direto para o primeiro.
  var WHATSAPPS = [
    { numero: '5516993947715', rotulo: '(16) 99394-7715' },
    { numero: '5516993129924', rotulo: '(16) 99312-9924' }
  ];
  var MENSAGEM = 'Olá! Vim pelo site da Gogh e quero falar com um especialista sobre a minha loja.';

  var escolha = document.createElement('dialog');
  escolha.className = 'escolha-whats';
  escolha.setAttribute('aria-labelledby', 'escolha-whats-titulo');
  escolha.innerHTML =
    '<button type="button" class="escolha-fechar" aria-label="Fechar">×</button>' +
    '<p class="escolha-selo">WhatsApp</p>' +
    '<h2 id="escolha-whats-titulo">Fale com um especialista</h2>' +
    '<p class="escolha-texto">Os dois atendem. Escolha um número.</p>' +
    '<div class="escolha-numeros"></div>';
  var lista = escolha.querySelector('.escolha-numeros');
  var links = WHATSAPPS.map(function (w) {
    var a = document.createElement('a');
    a.className = 'btn btn-ouro';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'WhatsApp ' + w.rotulo;
    a.addEventListener('click', function () { escolha.close(); });
    lista.appendChild(a);
    return { a: a, numero: w.numero };
  });
  document.body.appendChild(escolha);
  escolha.querySelector('.escolha-fechar').addEventListener('click', function () { escolha.close(); });
  escolha.addEventListener('click', function (e) {  // clique fora do quadro fecha; dentro, mesmo errando o botão, não
    if (e.target !== escolha) return;
    var r = escolha.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) escolha.close();
  });

  // abre a escolha já com o texto que vai na conversa (o formulário de diagnóstico manda o dele)
  window.goghEscolheWhatsApp = function (texto) {
    links.forEach(function (l) {
      l.a.href = 'https://wa.me/' + l.numero + '?text=' + encodeURIComponent(texto || MENSAGEM);
    });
    if (typeof escolha.showModal === 'function') escolha.showModal();
    else location.href = links[0].a.href;          // navegador sem <dialog>: vai para o primeiro
  };

  document.querySelectorAll('[data-especialista]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.goghEscolheWhatsApp(MENSAGEM);
    });
  });
  document.querySelectorAll('[data-canal-texto]').forEach(function (s) {
    s.textContent = 'WhatsApp';
  });

  var topo = document.querySelector('.topo');
  var barra = document.querySelector('.barra-celular');
  var abertura = document.querySelector('#abertura');
  var final = document.querySelector('#contato');

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


/* Abertura: transforma a rolagem em --p (0 a 1). O CSS faz o resto.
   Sem biblioteca, sem dependencia: uma variavel e uma conta. */
(function abertura(){
  var secao = document.querySelector('.abre');
  if (!secao) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { secao.style.setProperty('--p', 1); return; }

  var p = 0, alvo = 0, correndo = false;

  function medir(){
    var curso = secao.offsetHeight - window.innerHeight;
    alvo = Math.min(Math.max((window.scrollY - secao.offsetTop) / Math.max(curso, 1), 0), 1);
    if (!correndo) { correndo = true; requestAnimationFrame(seguir); }
  }
  /* suavizacao: sem ela a marca "pula" a cada evento de rolagem */
  function seguir(){
    p += (alvo - p) * 0.14;
    if (Math.abs(alvo - p) < 0.0015) { p = alvo; correndo = false; }
    secao.style.setProperty('--p', p.toFixed(4));
    if (correndo) requestAnimationFrame(seguir);
  }
  addEventListener('scroll', medir, { passive: true });
  addEventListener('resize', medir);
  medir();
})();
