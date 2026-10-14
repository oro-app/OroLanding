import { useEffect, useRef } from 'react'

export default function CtaSparkles() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const button = canvas.parentElement
    const GAP = 5, CLEAR = 4, REVEAL_SPEED = .9
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
  function sparkle(n, x, y, r, a) {
    n.save(); n.translate(x, y); n.rotate(a); n.beginPath();
    n.moveTo(0, -r);
    n.quadraticCurveTo(0, 0, r, 0);
    n.quadraticCurveTo(0, 0, 0, r);
    n.quadraticCurveTo(0, 0, -r, 0);
    n.quadraticCurveTo(0, 0, 0, -r);
    n.fill(); n.restore();
  }

    function attach(btn) {
    var cv = canvas;
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    var dots = [], w = 0, h = 0, dpr = 1;
    var hot = false, t0 = 0, ox = 0, oy = 0, fade = 0, raf = 0, last = 0;

    function size() {
      var r = btn.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);

      var keep = [];
      btn.querySelectorAll(":scope > span, :scope > svg").forEach(function (el) {
        var b = el.getBoundingClientRect();
        keep.push({ l: b.left - r.left - CLEAR, t: b.top - r.top - CLEAR,
                    r: b.right - r.left + CLEAR, b: b.bottom - r.top + CLEAR });
      });
      dots = [];
      for (var y = GAP / 2; y < h; y += GAP)
        for (var x = GAP / 2; x < w; x += GAP) {
          if (keep.some(function (k) { return x > k.l && x < k.r && y > k.t && y < k.b; })) continue;

          var mid = 1 - Math.min(1, Math.abs(x - w / 2) / (w / 2));
          dots.push({ x: x, y: y, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.8,
                      r: 1.1 + Math.random() * 0.5, a: Math.random() * Math.PI, w: (Math.random() - 0.5) * 0.006,
                      k: Math.random() < 0.35 + mid * 0.45 ? 0.35 + mid * 0.65 : 0 });
        }
    }

    function frame(now) {
      var dt = Math.min(50, now - (last || now)); last = now;
      fade = hot ? Math.min(1, fade + dt / 220) : Math.max(0, fade - dt / 380);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var radius = (now - t0) * REVEAL_SPEED;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (!d.k) continue;
        var dist = Math.hypot(d.x - ox, d.y - oy);
        var edge = hot ? Math.max(0, Math.min(1, (radius - dist) / 40)) : 1;
        if (!edge) continue;
        var tw = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(now / 1000 * d.s * 3 + d.p);
        var a = d.k * tw * edge * fade * 0.9;
        if (a < 0.02) continue;
        ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
        ctx.shadowColor = "rgba(255,255,255," + (a * 0.6).toFixed(3) + ")";
        ctx.shadowBlur = 3;
        sparkle(ctx, d.x, d.y, d.r, reduced ? d.a : d.a + d.w * now);
      }
      ctx.shadowBlur = 0;
      raf = hot || fade > 0 ? requestAnimationFrame(frame) : 0;
      if (!raf) ctx.clearRect(0, 0, w, h);
    }

    function start(e) {
      if (!w) size();
      var r = btn.getBoundingClientRect();
      ox = e && e.clientX != null ? e.clientX - r.left : w / 2;
      oy = e && e.clientY != null ? e.clientY - r.top : h / 2;
      hot = true; t0 = performance.now();
      btn.classList.add("oro-cta-hot");
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }
    function stop() {
      hot = false;
      btn.classList.remove("oro-cta-hot");
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }

    size();
    var observer = new ResizeObserver(size);
    observer.observe(btn);
    btn.addEventListener("pointerenter", start);
    btn.addEventListener("pointerleave", stop);
    var focus = function () { start(null); };
    btn.addEventListener("focus", focus);
    btn.addEventListener("blur", stop);
    return function () {
      cancelAnimationFrame(raf);
      observer.disconnect();
      btn.removeEventListener("pointerenter", start);
      btn.removeEventListener("pointerleave", stop);
      btn.removeEventListener("focus", focus);
      btn.removeEventListener("blur", stop);
      btn.classList.remove("oro-cta-hot");
    };
  }

    return attach(button)
  }, [])
  return <canvas className="oro-cta-pixels" aria-hidden="true" ref={ref} />
}
