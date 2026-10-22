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

// Old single-page links (e.g. /#pricing) now live on their own pages
(function () {
  if (document.body.getAttribute('data-page') !== 'home' || !location.hash) return;
  var map = { '#services': 'services/', '#process': 'services/#process', '#work': 'work/', '#reviews': 'work/#reviews', '#pricing': 'pricing/', '#faq': 'pricing/#faq', '#apps': 'apps/', '#quote': 'contact/', '#contact': 'contact/' };
  var to = map[location.hash];
  if (to) location.replace(to);
})();

// Free review form: modal on most pages, inline on Contact. Sends via the service in form-config.js.
(function () {
  var form = document.getElementById('review-form');
  if (!form) return;
  var cfg = window.CYBERHUB_FORM || {};
  var modal = document.getElementById('qmodal');
  var card = modal ? modal.querySelector('.qcard') : document.getElementById('rf-inline');
  var done = card.querySelector('.qdone');
  var sum = form.querySelector('.qerr-sum');
  var urlIn = form.querySelector('#rf-url'), noSite = form.querySelector('#rf-nosite');
  var opener = null;
  var EMAIL = 'contact@cyberhubsoftware.com';

  noSite.addEventListener('change', function () {
    urlIn.disabled = noSite.checked;
    if (noSite.checked) { urlIn.value = ''; clearErr(urlIn); }
  });

  // Open / close
  function focusables() {
    return Array.prototype.filter.call(card.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select,textarea'), function (el) { return el.offsetParent !== null; });
  }
  function open(e) {
    if (e) e.preventDefault();
    if (!modal) { // Contact page: jump to the inline form
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { (form.hidden ? done : form.querySelector('#rf-name')).focus({ preventScroll: true }); }, 350);
      return;
    }
    opener = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add('q-open');
    requestAnimationFrame(function () { modal.classList.add('on'); });
    var first = form.hidden ? done : form.querySelector('#rf-name');
    setTimeout(function () { first.focus(); }, 30);
    document.addEventListener('keydown', onKey);
  }
  function close() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('on');
    modal.hidden = true;
    if (!done.hidden) { done.hidden = true; form.hidden = false; var hd = card.querySelector('.qhead'); if (hd) hd.hidden = false; }
    document.documentElement.classList.remove('q-open');
    document.removeEventListener('keydown', onKey);
    if (opener && opener.focus) opener.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !card.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.querySelectorAll('[data-review]').forEach(function (a) { a.addEventListener('click', open); });
  if (modal) modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });

  // Validation
  function setErr(el, msg) {
    var e = document.getElementById(el.getAttribute('aria-describedby'));
    el.setAttribute('aria-invalid', 'true'); if (e) e.textContent = msg;
  }
  function clearErr(el) {
    var e = document.getElementById(el.getAttribute('aria-describedby'));
    el.removeAttribute('aria-invalid'); if (e) e.textContent = '';
  }
  function validate() {
    var bad = [];
    var name = form.elements.name, biz = form.elements.business, em = form.elements.email, ph = form.elements.phone;
    [name, biz, em, ph, urlIn].forEach(clearErr);
    if (!name.value.trim()) { setErr(name, 'Please enter your name.'); bad.push(name); }
    if (!biz.value.trim()) { setErr(biz, 'Please enter your business name.'); bad.push(biz); }
    if (!em.value.trim()) { setErr(em, 'Please enter your email address.'); bad.push(em); }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) { setErr(em, 'Please check your email address, e.g. name@example.com.'); bad.push(em); }
    var method = (form.querySelector('input[name=contact_method]:checked') || {}).value;
    var digits = ph.value.replace(/\D/g, '');
    if (ph.value.trim() && (digits.length < 10 || digits.length > 15)) { setErr(ph, 'Please enter a full phone number with area code.'); bad.push(ph); }
    else if ((method === 'Phone' || method === 'Text') && !digits) { setErr(ph, 'Add a phone number so we can ' + (method === 'Text' ? 'text' : 'call') + ' you, or choose Email.'); bad.push(ph); }
    if (!urlIn.disabled && urlIn.value.trim() && !/^(https?:\/\/)?[^\s.\/]+(\.[^\s.\/]+)+(\/\S*)?$/i.test(urlIn.value.trim())) { setErr(urlIn, 'Please enter a web address like yourbusiness.com, or tick "No website yet".'); bad.push(urlIn); }
    if (bad.length) {
      sum.hidden = false;
      sum.textContent = bad.length === 1 ? 'Please fix 1 field below.' : 'Please fix ' + bad.length + ' fields below.';
      bad[0].focus();
    } else { sum.hidden = true; sum.textContent = ''; }
    return !bad.length;
  }
  ['name', 'business', 'email', 'phone'].forEach(function (n) {
    form.elements[n].addEventListener('input', function () { if (this.getAttribute('aria-invalid')) clearErr(this); });
  });
  urlIn.addEventListener('input', function () { if (this.getAttribute('aria-invalid')) clearErr(this); });

  function collect() {
    var d = {}, goals = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled || el.name === 'botcheck' || el.name === 'text_consent') return;
      if (el.type === 'checkbox') { if (el.checked) { if (el.name === 'goals') goals.push(el.value); else d[el.name] = el.value; } return; }
      if (el.type === 'radio') { if (el.checked) d[el.name] = el.value; return; }
      if (el.value.trim()) d[el.name] = el.value.trim();
    });
    if (goals.length) d.goals = goals.join(', ');
    // Web3Forms prints only the keys we send, and an unticked checkbox is not a
    // successful control, so omitting it left the consent line out of the email.
    var consent = form.elements.text_consent;
    d.text_consent = consent && consent.checked ? 'Yes' : 'No';
    return d;
  }
  var LABELS = { name: 'Name', business: 'Business', email: 'Email', phone: 'Phone', website: 'Website', no_website: 'No website yet', business_type: 'Business type', budget: 'Budget', goals: 'Wants most', timeline: 'Timeline', contact_method: 'Preferred contact', message: 'Anything else', text_consent: 'OK to text' };
  function mailto(d) {
    var lines = Object.keys(LABELS).filter(function (k) { return d[k]; }).map(function (k) { return LABELS[k] + ': ' + d[k]; });
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Free website review: ' + (d.business || '')) + '&body=' + encodeURIComponent(lines.join('\n'));
  }
  function show(h, p, actions) {
    form.hidden = true;
    var head = card.querySelector('.qhead'); if (head) head.hidden = true;
    done.hidden = false;
    done.querySelector('.qd-h').textContent = h;
    done.querySelector('.qd-p').innerHTML = p;
    var box = done.querySelector('.qd-actions'); box.innerHTML = '';
    actions.forEach(function (a) { box.appendChild(a); });
    done.classList.toggle('warn', h.indexOf('Thanks') !== 0);
    done.focus();
  }
  function btn(text, href, primary) {
    var el = document.createElement(href ? 'a' : 'button');
    el.className = 'btn ' + (primary ? 'btn-lime' : 'btn-ghost');
    if (href) el.href = href; else { el.type = 'button'; if (modal) el.addEventListener('click', close); else el.hidden = true; }
    el.textContent = text; return el;
  }
  var mailLink = '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.botcheck.checked) return; // honeypot: quietly ignore bots
    if (!validate()) return;
    var d = collect();
    var key = String(cfg.accessKey || '');
    if (!cfg.endpoint || !key || key === 'REPLACE_ME') {
      show('Almost there: please email us', 'Our online form isn\u2019t switched on yet, so nothing was sent. Please email your details to ' + mailLink + ' and we\u2019ll reply within 1\u20132 business days.', [btn('Email these details \u2192', mailto(d), true), btn('Close')]);
      return;
    }
    var sb = form.querySelector('.qsubmit'), tx = sb.querySelector('.qs-tx');
    sb.disabled = true; tx.textContent = 'Sending\u2026';
    var payload = Object.assign({ access_key: key, subject: 'Free review request: ' + d.business, from_name: 'CyberHub website form', botcheck: false }, d);
    // Names are forwarded as-is, so this is the email line "OK to text: Yes" or "OK to text: No".
    payload[LABELS.text_consent] = d.text_consent;
    delete payload.text_consent;
    fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.success === false) throw new Error(j.message || r.status); }); })
      .then(function () {
        form.reset(); urlIn.disabled = false;
        show('Thanks! We\u2019ll reply within 1\u20132 business days.', 'We sent your request to ' + EMAIL + '. Keep an eye on your inbox.', [btn('Close')]);
      })
      .catch(function () {
        show('That didn\u2019t go through', 'Sorry, the form couldn\u2019t send just now. Please email your details to ' + mailLink + ' instead.', [btn('Email these details \u2192', mailto(d), true), btn('Close')]);
      })
      .then(function () { sb.disabled = false; tx.textContent = 'Send my free review request'; });
  });
})();

// Apple-style segmented tabs. Markup: a [data-tabs="Label"] group holding [data-tab="Tab name"] panels.
// Optional data-tabs-below="980" turns tabs on only at or below that width (side by side above it).
// Without JS no tab bar is built and every panel shows (progressive enhancement).
(function () {
  var groups = document.querySelectorAll('[data-tabs]');
  if (!groups.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var all = [];
  Array.prototype.forEach.call(groups, function (g, gi) {
    var panels = Array.prototype.filter.call(g.querySelectorAll('[data-tab]'), function (p) { return p.parentNode.closest('[data-tabs]') === g; });
    if (panels.length < 2) return;
    var mq = g.getAttribute('data-tabs-below') ? window.matchMedia('(max-width:' + g.getAttribute('data-tabs-below') + 'px)') : null;
    var list = document.createElement('div');
    list.className = 'seg-list';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', g.getAttribute('data-tabs') || 'Sections');
    var current = 0;
    var tabs = panels.map(function (p, i) {
      if (!p.id) p.id = 'tp-' + gi + '-' + i;
      if (p.hasAttribute('data-tab-default')) current = i;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-tab'; b.id = 'tab-' + p.id;
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', p.id);
      b.textContent = p.getAttribute('data-tab');
      b.addEventListener('click', function () { select(i, false, true); });
      list.appendChild(b);
      return b;
    });
    var anchor = panels[0].parentNode === g ? panels[0] : panels[0].parentNode;
    anchor.parentNode.insertBefore(list, anchor);
    function on() { return !mq || mq.matches; }
    function select(i, focus, animate) {
      current = i;
      var live = on();
      tabs.forEach(function (t, j) {
        var sel = j === i;
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
        t.tabIndex = sel ? 0 : -1;
        if (live) {
          panels[j].hidden = !sel;
          if (sel && animate && !reduce) { panels[j].classList.remove('tab-in'); void panels[j].offsetWidth; panels[j].classList.add('tab-in'); }
        }
      });
      if (focus) tabs[i].focus();
      // keep the chosen tab in view if the bar scrolls sideways
      var t = tabs[i], l = list;
      if (l.scrollWidth > l.clientWidth) l.scrollLeft = t.offsetLeft - (l.clientWidth - t.offsetWidth) / 2;
    }
    function apply() {
      var live = on();
      list.hidden = !live;
      g.classList.toggle('tabs-on', live);
      panels.forEach(function (p, j) {
        if (live) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', tabs[j].id); }
        else { p.removeAttribute('role'); p.removeAttribute('aria-labelledby'); p.hidden = false; }
      });
      select(current, false, false);
    }
    list.addEventListener('keydown', function (e) {
      var n = tabs.length, i = current;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (current + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (current - 1 + n) % n;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = n - 1;
      else return;
      e.preventDefault();
      select(i, true, true);
    });
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply); }
    apply();
    all.push({ panels: panels, select: select, on: on });
  });

  // Links to something inside a hidden tab (e.g. /pricing/#faq, /services/#add-ons) open that tab first
  function reveal(el) {
    var hit = false;
    all.forEach(function (grp) {
      if (!grp.on()) return;
      grp.panels.forEach(function (p, i) { if (p === el || p.contains(el)) { grp.select(i, false, false); hit = true; } });
    });
    return hit;
  }
  window.CyberHubReveal = reveal;
  function fromHash(scroll) {
    var id = location.hash.slice(1);
    if (!id) return;
    var el = null;
    try { el = document.getElementById(decodeURIComponent(id)); } catch (e) {}
    if (el && reveal(el) && scroll) requestAnimationFrame(function () { el.scrollIntoView({ block: 'start' }); });
  }
  fromHash(true);
  window.addEventListener('hashchange', function () { fromHash(true); });
})();

// Mobile page strip: keep the current page's link in view
(function () {
  var ul = document.querySelector('.nav-links');
  var cur = ul && ul.querySelector('[aria-current="page"]');
  if (!cur || ul.scrollWidth <= ul.clientWidth) return;
  ul.scrollLeft = cur.parentNode.offsetLeft - (ul.clientWidth - cur.parentNode.offsetWidth) / 2;
})();
