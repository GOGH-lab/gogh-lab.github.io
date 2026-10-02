/* Agency Gogh — v9. O filme do sistema e os dois caminhos de contato.
   Nada sai do navegador para servidor nosso: o formulario so monta o link do WhatsApp. */

/* ---------- o sistema em acao ---------- */
(function filme(){
  var caixa = document.querySelector('.tela-caixa');
  if (!caixa) return;
  var tela = caixa.querySelector('.tela');
  var v = tela.querySelector('video');
  var som = tela.querySelector('[data-som]');
  var pausa = tela.querySelector('[data-pausa]');
  var cheia = tela.querySelector('[data-cheia]');
  var play = tela.querySelector('.tela-play');
  var fim = caixa.querySelector('.tela-fim');
  var deNovo = caixa.querySelector('[data-de-novo]');

  var querMenos = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var poupaDados = !!(navigator.connection && navigator.connection.saveData);
  var sozinho = !querMenos && !poupaDados;   // pode comecar sozinho, sem som
  var acabou = false;
  var pausadoPelaPessoa = false;             // a pessoa pausou: o site nao retoma sozinho
  var pausaDoSite = false;                   // a pausa veio do site (saiu da tela), nao da pessoa

  function mostraPlay(sim){ play.hidden = !sim; }

  function atualizaSom(){
    var ligado = !v.muted;
    som.setAttribute('aria-pressed', String(ligado));
    som.setAttribute('aria-label', ligado ? 'Desligar o som' : 'Ligar o som');
    som.querySelector('.rotulo').textContent = ligado ? 'Desligar o som' : 'Ligar o som';
    som.querySelector('.ic-mudo').hidden = ligado;
    som.querySelector('.ic-som').hidden = !ligado;
  }
  function atualizaPausa(){
    var parado = v.paused;
    pausa.setAttribute('aria-label', parado ? 'Continuar o filme' : 'Pausar o filme');
    pausa.querySelector('.ic-pausa').hidden = parado;
    pausa.querySelector('.ic-segue').hidden = !parado;
  }

  function tocar(){
    pausadoPelaPessoa = false;
    var p = v.play();
    if (p && p.catch) p.catch(function(){ mostraPlay(true); });  // navegador barrou: a pessoa aperta o play
  }
  function pausaDaPessoa(){ pausadoPelaPessoa = true; v.pause(); }

  function recomeca(){
    acabou = false;
    caixa.classList.remove('acabou');
    fim.hidden = true;
    v.currentTime = 0;
    tocar();
  }

  v.addEventListener('play', function(){ mostraPlay(false); atualizaPausa(); });
  // qualquer pausa que nao veio do site (clique, teclado, controle nativo da tela cheia) e da pessoa
  v.addEventListener('pause', function(){
    atualizaPausa();
    if (v.ended || acabou) return;
    if (pausaDoSite) { pausaDoSite = false; if (!sozinho) mostraPlay(true); return; }
    pausadoPelaPessoa = true;
    mostraPlay(true);
  });
  v.addEventListener('ended', function(){
    acabou = true;
    caixa.classList.add('acabou');
    fim.hidden = false;
    mostraPlay(false);
    if (document.fullscreenElement === tela && document.exitFullscreen) document.exitFullscreen().catch(function(){});
  });
  // o som pode mudar fora do nosso botao (controle nativo na tela cheia do iPhone)
  v.addEventListener('volumechange', atualizaSom);

  // play explicito = a pessoa quer ver; liga o som junto
  play.addEventListener('click', function(){
    v.muted = false;
    if (acabou) recomeca(); else tocar();
  });
  v.addEventListener('click', function(){
    if (acabou) return;
    if (v.paused) tocar(); else pausaDaPessoa();
  });
  pausa.addEventListener('click', function(){
    if (v.paused) tocar(); else pausaDaPessoa();
  });
  som.addEventListener('click', function(){
    v.muted = !v.muted;
    if (!v.muted && v.paused && !acabou) tocar();
  });

  // tela cheia: no computador e no Android vai a moldura inteira, com os nossos botoes;
  // no iPhone so existe a tela cheia do proprio player
  if (cheia) cheia.addEventListener('click', function(){
    if (document.fullscreenElement) { document.exitFullscreen().catch(function(){}); return; }
    if (document.fullscreenEnabled && tela.requestFullscreen) tela.requestFullscreen().catch(function(){});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    else if (document.webkitFullscreenEnabled && tela.webkitRequestFullscreen) tela.webkitRequestFullscreen();
    if (v.paused && !acabou) tocar();
  });

  if (deNovo) deNovo.addEventListener('click', recomeca);

  // chega na secao: toca sem som; sai: pausa. Depois que acabou, nao recomeca sozinho.
  // Quem pediu economia de dados ou menos movimento so baixa o filme se apertar o play.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(itens){
      var r = itens[0].intersectionRatio;
      if (r >= 0.5) {
        if (sozinho) {
          if (v.preload !== 'auto') v.preload = 'auto';
          if (!acabou && !pausadoPelaPessoa && v.paused) tocar();
        }
      } else if (r < 0.25 && !v.paused) {
        pausaDoSite = true;
        v.pause();
      }
    }, { threshold: [0, 0.25, 0.5, 0.75] }).observe(tela);
  }

  if (!sozinho) mostraPlay(true);
  atualizaSom();
  atualizaPausa();
})();


/* ---------- contato: os dois caminhos caem no WhatsApp ---------- */
(function contato(){
  var WHATSAPP = '5516991366741';

  // texto da pessoa: uma linha so, sem espaco sobrando, com limite
  function limpa(s, max){
    return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max || 120);
  }
  function marcados(form, nome){
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + nome + '"]:checked'),
      function(i){ return i.value; });
  }
  function lista(arr){
    if (arr.length < 2) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1];
  }

  function abreWhatsApp(texto){
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) {} }
    else { location.href = url; }               // bloqueador de janela: abre na mesma aba
  }

  // marca/desmarca o campo e devolve se esta ok
  function confere(el, ok){
    if (el.classList.contains('fichas')) el.classList.toggle('invalido', !ok);
    else el.setAttribute('aria-invalid', String(!ok));
    return ok;
  }

  // "Ainda nao vendo" / "Ainda nao sei" sao exclusivos: marcar um limpa os outros
  document.querySelectorAll('.fichas[data-exclusivo]').forEach(function(grupo){
    var unico = grupo.getAttribute('data-exclusivo');
    grupo.addEventListener('change', function(e){
      var alvo = e.target;
      if (!alvo.checked) return;
      grupo.querySelectorAll('input').forEach(function(i){
        if (i === alvo) return;
        if (alvo.value === unico || i.value === unico) i.checked = false;
      });
    });
  });

  // ao corrigir, o aviso some
  document.querySelectorAll('.pedido').forEach(function(form){
    form.addEventListener('input', function(e){
      var f = e.target.closest('.fichas');
      if (f) f.classList.remove('invalido');
      else if (e.target.hasAttribute('aria-invalid')) e.target.setAttribute('aria-invalid', 'false');
      var erro = form.querySelector('.pedido-erro');
      if (erro) erro.textContent = '';
    });
  });

  function falha(form, faltam, primeiro){
    var erro = form.querySelector('.pedido-erro');
    erro.textContent = 'Falta preencher: ' + lista(faltam) + '.';
    var foco = primeiro.querySelector ? (primeiro.querySelector('input') || primeiro) : primeiro;
    foco.focus();
  }

  // a) curto: nome e onde vende
  var curto = document.getElementById('form-diagnostico');
  if (curto) curto.addEventListener('submit', function(e){
    e.preventDefault();
    var nomeEl = curto.querySelector('[name="nome"]');
    var ondeEl = curto.querySelector('[data-campo="onde"]');
    var nome = limpa(nomeEl.value, 80);
    var onde = marcados(curto, 'onde');
    var faltam = [], primeiro = null;
    if (!confere(nomeEl, !!nome)) { faltam.push('seu nome'); primeiro = primeiro || nomeEl; }
    if (!confere(ondeEl, onde.length > 0)) { faltam.push('onde você vende'); primeiro = primeiro || ondeEl; }
    if (faltam.length) return falha(curto, faltam, primeiro);

    abreWhatsApp([
      'Olá, Gogh! Vim pelo site e quero um diagnóstico da minha loja.',
      '',
      '*Nome:* ' + nome,
      '*Onde vendo:* ' + onde.join(', ')
    ].join('\n'));
  });

  // b) completo: para quem quer contratar
  var completo = document.getElementById('form-contratar');
  if (completo) completo.addEventListener('submit', function(e){
    e.preventDefault();
    var campo = function(n){ return completo.querySelector('[name="' + n + '"]'); };
    var grupo = function(n){ return completo.querySelector('[data-campo="' + n + '"]'); };

    var nome = limpa(campo('nome').value, 80);
    var loja = limpa(campo('loja').value, 100);
    var ramo = limpa(campo('ramo').value, 120);
    var onde = marcados(completo, 'onde');
    var fat = marcados(completo, 'faturamento');
    var servico = marcados(completo, 'servico-onde');
    var precisa = marcados(completo, 'precisa');
    var link = limpa(campo('link').value, 120);

    var faltam = [], primeiro = null;
    function exige(el, ok, rotulo){ if (!confere(el, ok)) { faltam.push(rotulo); primeiro = primeiro || el; } }
    exige(campo('nome'), !!nome, 'seu nome');
    exige(campo('loja'), !!loja, 'nome da loja ou empresa');
    exige(campo('ramo'), !!ramo, 'o que você vende');
    exige(grupo('onde'), onde.length > 0, 'onde vende hoje');
    exige(grupo('faturamento'), fat.length > 0, 'faturamento por mês');
    exige(grupo('servico-onde'), servico.length > 0, 'onde quer o nosso serviço');
    exige(grupo('precisa'), precisa.length > 0, 'o que você precisa');
    if (faltam.length) return falha(completo, faltam, primeiro);

    var linhas = [
      'Olá, Gogh! Vim pelo site e quero contratar o serviço de vocês.',
      '',
      '*Nome:* ' + nome,
      '*Loja/empresa:* ' + loja,
      '*O que vendo:* ' + ramo,
      '*Onde vendo hoje:* ' + onde.join(', '),
      '*Faturamento por mês:* ' + fat[0],
      '*Onde quero o serviço:* ' + servico.join(', '),
      '*O que preciso:* ' + precisa.join(', ')
    ];
    if (link) linhas.push('*Instagram/site:* ' + link);
    abreWhatsApp(linhas.join('\n'));
  });

  // o fundo do fecho e um canvas: quando o completo abre, a secao cresce e ele precisa se remedir
  var det = document.querySelector('.completo');
  if (det) det.addEventListener('toggle', function(){
    window.dispatchEvent(new Event('resize'));
    if (det.open) { var p = det.querySelector('input'); if (p) p.focus({ preventScroll: true }); }
  });
})();
