/* CyberHub Software: small progressive enhancements. No dependencies. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero entrance
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('loaded'); }); });

  // Nav: solid background after scrolling, mobile menu toggle
  var nav = document.querySelector('.nav');
  var btn = document.querySelector('.menu-btn');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  if (btn) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  }

  // Scroll reveal
  var targets = document.querySelectorAll('[data-reveal], .steps, .hl');
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // Before/after sliders
  document.querySelectorAll('.compare').forEach(function (c) {
    var input = c.querySelector('input[type=range]');
    function set(v) { c.style.setProperty('--pos', v + '%'); input.setAttribute('aria-valuetext', Math.round(v) + '% before, ' + Math.round(100 - v) + '% after'); }
    input.addEventListener('input', function () { set(input.value); });
    set(input.value);
    // One gentle "peek" the first time a slider scrolls into view, to show it can move
    if (!reduce && 'IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          seen.disconnect();
          var start = null, from = 50;
          function step(t) {
            if (input.dataset.touched) return;
            if (!start) start = t;
            var p = Math.min((t - start) / 1600, 1);
            var v = from + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
            input.value = v; set(v);
            if (p < 1) requestAnimationFrame(step);
          }
          setTimeout(function () { requestAnimationFrame(step); }, 300);
        });
      }, { threshold: 0.6 });
      seen.observe(c);
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      input.addEventListener(ev, function () { input.dataset.touched = '1'; }, { passive: true });
    });
  });

  // Hero phones: subtle pointer parallax (desktop pointers only)
  var phones = document.querySelector('.phones');
  if (phones && !reduce && window.matchMedia('(pointer: fine)').matches) {
    var a = phones.querySelector('.phone.after'), b = phones.querySelector('.phone.before');
    var raf = null;
    window.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        a.style.transform = 'rotate(5deg) translate(' + (x * 18) + 'px,' + (y * 14) + 'px) rotateY(' + (x * 8) + 'deg)';
        b.style.transform = 'rotate(-9deg) translate(' + (x * -10) + 'px,' + (y * -8) + 'px)';
      });
    }, { passive: true });
  }
})();

// Pause control for the scrolling band (WCAG 2.2.2)
(function () {
  var band = document.querySelector('.marquee');
  var btn = band && band.querySelector('.marquee-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var paused = band.classList.toggle('paused');
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    btn.setAttribute('aria-label', paused ? 'Play the scrolling band' : 'Pause the scrolling band');
    btn.querySelector('.mb-tx').textContent = paused ? 'Play' : 'Pause';
  });
})();

// Sticky "free review" banner: dismissible, hidden near the quote/contact area
(function () {
  var bar = document.getElementById('ready');
  if (!bar) return;
  var KEY = 'ch-ready-dismissed';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
  var shown = false, nearEnd = false, pastHero = false;
  function update() {
    var want = pastHero && !nearEnd;
    if (want === shown) return;
    shown = want;
    if (want) { bar.hidden = false; requestAnimationFrame(function () { bar.classList.add('on'); }); document.body.classList.add('has-ready'); }
    else { bar.classList.remove('on'); document.body.classList.remove('has-ready'); }
  }
  function onScroll() { pastHero = window.scrollY > window.innerHeight * 0.6; update(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  var end = document.getElementById('quote');
  if (end && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { nearEnd = es[0].isIntersecting || es[0].boundingClientRect.top < 0; update(); }, { threshold: 0 }).observe(end);
  }
  bar.querySelector('.ready-x').addEventListener('click', function () {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    bar.classList.remove('on'); bar.hidden = true; document.body.classList.remove('has-ready');
    window.removeEventListener('scroll', onScroll);
  });
})();
