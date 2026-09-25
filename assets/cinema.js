/* Campo do fecho: a mesma poeira de luz da abertura, agora calma e ja
   organizada -- o site abre com o campo e fecha com o campo. */
(function campoFim() {
  var cv = document.querySelector('.campo-fim');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = cv.getContext('2d'), L = 0, A = 0, dpr = 1, visivel = false;
  var N = innerWidth < 860 ? 420 : 950;
  var pts = [];
  for (var i = 0; i < N; i++) {
    pts.push({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75,
               r: 0.7 + Math.random() * 1.9, fase: Math.random() * 6.28,
               vel: 0.6 + Math.random() * 1.6 });
  }
  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    L = cv.clientWidth; A = cv.clientHeight;
    cv.width = Math.round(L * dpr); cv.height = Math.round(A * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function quadro() {
    if (!visivel) return;
    var t = performance.now() / 1000;
    ctx.clearRect(0, 0, L, A);
    for (var i = 0; i < N; i++) {
      var q = pts[i];
      q.y -= q.vel * 0.00022;                /* sobe devagar: a conta subindo */
      if (q.y < -0.05) { q.y = 1.05; q.x = Math.random(); }
      var px = (q.x + Math.sin(t * 0.22 + q.fase) * 0.012) * L;
      var py = q.y * A;
      var brilho = (0.24 + q.z * 0.62) * (0.7 + Math.sin(t * 0.9 + q.fase) * 0.3);
      var raio = q.r * q.z;
      ctx.fillStyle = 'rgba(214,173,110,' + brilho.toFixed(3) + ')';
      if (raio < 1.1) { ctx.fillRect(px, py, raio * 1.7, raio * 1.7); }
      else { ctx.beginPath(); ctx.arc(px, py, raio, 0, 6.2832); ctx.fill(); }
    }
    requestAnimationFrame(quadro);
  }
  medir();
  addEventListener('resize', medir);
  /* so gasta quadro quando a secao esta na tela */
  new IntersectionObserver(function (es) {
    var antes = visivel;
    visivel = es[0].isIntersecting;
    if (visivel && !antes) requestAnimationFrame(quadro);
  }, { threshold: 0 }).observe(cv);
})();
