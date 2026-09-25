/* ============================================================================
   O RAIO-X — a abertura do site da Gogh.

   A espinha: "a gente enxerga a sua conta por dentro".
   O heroi nao e produto nem marca nem tela de celular: e a CONTA, desenhada
   como um campo de pontos de luz no escuro. Cada ponto e um anuncio.

   A jornada, conforme a pessoa rola:
     caos   -> a camera mergulha no campo bagunçado (a conta dela hoje)
     alerta -> alguns pontos acendem em vermelho: e por ali que o dinheiro sai
     varredura -> uma lamina de luz desce e, ATRAS dela, o campo se organiza
     curva  -> o que sobrou vira uma curva que sobe, em ouro

   Tudo em canvas 2D com projecao de perspectiva propria: sem three.js, sem
   dependencia nova, sem esbarrar na CSP do site, e leve no celular.
   ========================================================================== */
(function raiox() {
  var secao = document.querySelector('.raiox');
  var cv = document.querySelector('.campo');
  if (!secao || !cv) return;

  var ctx = cv.getContext('2d');
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var L = 0, A = 0, dpr = 1;
  var p = 0, alvo = 0;          // progresso da rolagem, com amortecimento
  var mx = 0, my = 0, mxs = 0, mys = 0;  // parallax do ponteiro

  /* ---- o campo ---- */
  var N = innerWidth < 860 ? 900 : 2300;
  var pts = new Array(N);

  function ruido(s) { return (Math.random() * 2 - 1) * s; }

  /* a curva de destino: sobe da esquerda para a direita, com corpo de fita */
  function alturaDaCurva(x) {      // x em [-1,1] -> y em [-1,1], y negativo = em cima
    var t = (x + 1) / 2;
    var e = t * t * (3 - 2 * t);   // suave nas pontas, firme no meio
    return 0.46 - e * 1.02;
  }

  for (var i = 0; i < N; i++) {
    var cx = ruido(1.65), cy = ruido(1.2), cz = Math.random() * 1.15;
    var ox = ruido(1.12);
    /* 12% dos pontos sao o vazamento: acendem em vermelho e nao entram na curva */
    var vaza = Math.random() < 0.15;
    pts[i] = {
      cx: cx, cy: cy, cz: cz,                       // onde esta no caos
      ox: ox, oy: alturaDaCurva(ox) + ruido(0.085), // onde vai parar na curva
      oz: 0.18 + Math.random() * 0.3,
      vaza: vaza,
      brilho: 0.5 + Math.random() * 0.5,
      fase: Math.random() * 6.28,
      r: 0.95 + Math.random() * 2.3
    };
  }

  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    L = cv.clientWidth; A = cv.clientHeight;
    cv.width = Math.round(L * dpr); cv.height = Math.round(A * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerProgresso() {
    var curso = secao.offsetHeight - innerHeight;
    var y = scrollY - secao.offsetTop;
    alvo = Math.min(Math.max(y / Math.max(curso, 1), 0), 1);
  }

  /* facilitadores de faixa: 0 antes de a, 1 depois de b */
  function faixa(v, a, b) { return Math.min(Math.max((v - a) / (b - a), 0), 1); }
  function suave(t) { return t * t * (3 - 2 * t); }

  function desenhar() {
    ctx.clearRect(0, 0, L, A);
    var meioX = L / 2, meioY = A / 2;
    var escala = Math.min(L, A) * (innerWidth < 860 ? 0.62 : 0.52);
    var t = performance.now() / 1000;

    /* a camera mergulha no campo */
    /* mergulha ate 74% e volta a abrir para compor o quadro final: sem isso
       a camera atravessava a curva e o ultimo quadro ficava preto */
    var camZ = 1.62 - suave(faixa(p, 0, 0.74)) * 0.82 + suave(faixa(p, 0.76, 1)) * 0.6;
    var giro = (p - 0.45) * 0.42 + mxs * 0.16;
    var incl = mys * 0.1;

    /* a lamina de luz desce entre 36% e 72% da rolagem */
    var varre = suave(faixa(p, 0.34, 0.74));
    var laminaY = -1.35 + varre * 2.75;

    /* o vermelho acende, e no fim apaga */
    var alerta = faixa(p, 0.15, 0.3) * (1 - faixa(p, 0.6, 0.8));

    for (var i = 0; i < N; i++) {
      var q = pts[i];

      /* quanto este ponto ja foi organizado: depende de a lamina ter passado por ele */
      var org = q.vaza ? faixa(varre, 0.86, 1) * 0.35
                       : Math.min(Math.max((laminaY - q.cy) / 0.5, 0), 1);
      org = suave(org);

      /* deriva lenta enquanto esta no caos: o campo respira */
      var dr = (1 - org) * 0.055;
      var x = (q.cx + Math.sin(t * 0.32 + q.fase) * dr) * (1 - org) + q.ox * org;
      var y = (q.cy + Math.cos(t * 0.27 + q.fase) * dr) * (1 - org) + q.oy * org;
      var z = q.cz * (1 - org) + q.oz * org;

      /* gira o campo e projeta */
      var xr = x * Math.cos(giro) - z * Math.sin(giro);
      var zr = x * Math.sin(giro) + z * Math.cos(giro);
      var yr = y + zr * incl;
      var prof = camZ + zr;
      if (prof < 0.05) continue;
      var f = 1.9 / prof;
      var px = meioX + xr * escala * f;
      var py = meioY + yr * escala * f;
      if (px < -60 || px > L + 60 || py < -60 || py > A + 60) continue;

      var raio = q.r * f * (0.8 + org * 0.5);
      var vis = q.brilho * Math.min(f * 0.8, 1.3);

      var cor;
      if (q.vaza && alerta > 0.01) {
        var pulso = 0.66 + Math.sin(t * 2.6 + q.fase) * 0.34;
        cor = 'rgba(240,92,60,' + Math.min(vis * alerta * pulso * 1.9, 1).toFixed(3) + ')';
        raio *= 1.5 + pulso * 0.55;
      } else if (org > 0.02) {
        /* organizado = ouro; quanto mais alto na curva, mais claro */
        var alto = Math.min(Math.max((0.5 - y) / 1.3, 0), 1);
        var r = 199 + alto * 36, g = 154 + alto * 49, b = 90 + alto * 52;
        cor = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + (vis * (0.45 + org * 0.55)).toFixed(3) + ')';
      } else {
        cor = 'rgba(163,153,138,' + (vis * 0.9).toFixed(3) + ')';
      }

      ctx.fillStyle = cor;
      if (raio < 1.15) {
        var d = Math.max(raio * 1.7, 0.8);
        ctx.fillRect(px - d / 2, py - d / 2, d, d);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, raio, 0, 6.2832);
        ctx.fill();
      }

      /* halo: da o brilho de neon sem custar caro. no vazamento tambem, para
         o vermelho pesar na tela no momento do "nao sobra" */
      if (raio > 1.25 && (org > 0.5 || (q.vaza && alerta > 0.15))) {
        ctx.beginPath();
        ctx.arc(px, py, raio * 2.9, 0, 6.2832);
        ctx.fillStyle = q.vaza
          ? 'rgba(240,92,60,' + (vis * alerta * 0.065).toFixed(3) + ')'
          : 'rgba(199,154,90,' + (vis * org * 0.07).toFixed(3) + ')';
        ctx.fill();
      }
    }

    /* a lamina: a linha que a Gogh passa na conta */
    if (varre > 0.001 && varre < 0.999) {
      var ly = meioY + (laminaY / (camZ + 0.3)) * escala * 1.9;
      var g = ctx.createLinearGradient(0, ly - 88, 0, ly + 88);
      g.addColorStop(0, 'rgba(235,203,142,0)');
      g.addColorStop(0.46, 'rgba(235,203,142,.30)');
      g.addColorStop(0.5, 'rgba(255,240,214,.85)');
      g.addColorStop(0.54, 'rgba(235,203,142,.30)');
      g.addColorStop(1, 'rgba(235,203,142,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, ly - 88, L, 176);
    }
  }

  var rodando = false;
  function quadro() {
    p += (alvo - p) * 0.12;
    mxs += (mx - mxs) * 0.06;
    mys += (my - mys) * 0.06;
    secao.style.setProperty('--p', p.toFixed(4));
    desenhar();
    if (Math.abs(alvo - p) > 0.0004 || Math.abs(mx - mxs) > 0.002 || !reduz) {
      requestAnimationFrame(quadro);
    } else { rodando = false; }
  }

  medir();
  if (reduz) {                       /* quem pediu menos movimento ve o quadro final */
    p = alvo = 1; secao.style.setProperty('--p', 1); desenhar();
  } else {
    lerProgresso(); p = alvo;
    rodando = true; requestAnimationFrame(quadro);
    addEventListener('scroll', lerProgresso, { passive: true });
    addEventListener('pointermove', function (e) {
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }
  addEventListener('resize', function () { medir(); lerProgresso(); if (reduz) desenhar(); });
})();
