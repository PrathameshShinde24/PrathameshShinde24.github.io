/* =============================================================================
   Prathamesh Shinde — portfolio interactions
   Plain JavaScript, no libraries. Everything degrades gracefully: with JS off
   or reduced motion on, all content is visible and usable.
   ============================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------------------------------------------------------------------------
     Theme toggle
     ------------------------------------------------------------------------- */
  var themeBtn = $('#btn-theme');
  function syncThemeLabel() {
    if (!themeBtn) return;
    var isLight = root.getAttribute('data-theme') === 'light';
    themeBtn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  }
  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('pshinde-theme', next); } catch (e) { /* private mode */ }
      syncThemeLabel();
    });
  }

  /* ---------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------- */
  var burger = $('#btn-hamburger');
  var menu = $('#mobile-menu');

  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1040 && menu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------------------------------------------------------------------------
     Seamless marquees: duplicate each track's children once
     ------------------------------------------------------------------------- */
  $$('[data-loop]').forEach(function (track) {
    var kids = Array.prototype.slice.call(track.children);
    kids.forEach(function (kid) {
      var copy = kid.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });
  });

  /* ---------------------------------------------------------------------------
     Hero: split headline into words, then play the entrance
     ------------------------------------------------------------------------- */
  var hero = $('.hero');
  (function splitHeadline() {
    var index = 0;
    $$('[data-split]').forEach(function (el) {
      var out = document.createDocumentFragment();
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', index++);
            w.textContent = part;
            out.appendChild(w);
          });
        } else if (node.nodeType === 1) {
          // Gradient-text elements animate as one piece (Safari clips them badly when split)
          node.classList.add('w');
          node.style.setProperty('--i', index++);
          out.appendChild(node);
        }
      });
      el.textContent = '';
      el.appendChild(out);
    });
  })();

  if (hero) {
    // Two frames so the starting state is painted before the transition begins
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('is-ready'); });
    });
    // Safety net for tabs opened in the background, where frames are paused
    setTimeout(function () { hero.classList.add('is-ready'); }, 900);
  }

  /* ---------------------------------------------------------------------------
     Role rotator (typewriter)
     ------------------------------------------------------------------------- */
  (function roleRotator() {
    var el = $('#role-rotator');
    if (!el) return;
    var roles = (el.getAttribute('data-roles') || '').split('|').filter(Boolean);
    if (!roles.length) return;
    if (reduceMotion) { el.textContent = roles[0]; return; }

    var r = 0, c = roles[0].length, deleting = true;
    el.textContent = roles[0];

    function tick() {
      var word = roles[r];
      if (deleting) {
        c--;
        el.textContent = word.slice(0, c);
        if (c === 0) { deleting = false; r = (r + 1) % roles.length; return setTimeout(tick, 320); }
        return setTimeout(tick, 28);
      }
      c++;
      el.textContent = roles[r].slice(0, c);
      if (c === roles[r].length) { deleting = true; return setTimeout(tick, 2100); }
      setTimeout(tick, 58);
    }
    setTimeout(tick, 2600);
  })();

  /* ---------------------------------------------------------------------------
     Portrait: 3D tilt that follows the pointer
     ------------------------------------------------------------------------- */
  (function portraitTilt() {
    var wrap = $('#portrait');
    if (!wrap || !finePointer || reduceMotion) return;
    var card = $('.portrait-card', wrap);
    var shine = $('.portrait-shine', wrap);
    if (!card) return;
    var raf = 0, px = 0.5, py = 0.5;

    function apply() {
      raf = 0;
      var rx = (0.5 - py) * 14;
      var ry = (px - 0.5) * 16;
      card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      card.style.setProperty('--rz', '0deg');
      if (shine) {
        shine.style.setProperty('--px', (px * 100).toFixed(1) + '%');
        shine.style.setProperty('--py', (py * 100).toFixed(1) + '%');
      }
      wrap.style.setProperty('--tx', ((px - 0.5) * 22).toFixed(1) + 'px');
      wrap.style.setProperty('--ty', ((py - 0.5) * 22).toFixed(1) + 'px');
    }
    wrap.addEventListener('mousemove', function (e) {
      var b = wrap.getBoundingClientRect();
      px = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width));
      py = Math.min(1, Math.max(0, (e.clientY - b.top) / b.height));
      if (!raf) raf = requestAnimationFrame(apply);
    });
    wrap.addEventListener('mouseleave', function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      ['--rx', '--ry', '--rz'].forEach(function (p) { card.style.removeProperty(p); });
      wrap.style.removeProperty('--tx');
      wrap.style.removeProperty('--ty');
    });
  })();

  /* ---------------------------------------------------------------------------
     Magnetic buttons + card spotlight
     ------------------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var b = btn.getBoundingClientRect();
        var x = (e.clientX - b.left - b.width / 2) * 0.22;
        var y = (e.clientY - b.top - b.height / 2) * 0.32;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }
  if (finePointer) {
    $$('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var b = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - b.left).toFixed(0) + 'px');
        card.style.setProperty('--my', (e.clientY - b.top).toFixed(0) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------------------------
     Live clock (India Standard Time)
     ------------------------------------------------------------------------- */
  (function clock() {
    var targets = $$('[data-clock]');
    if (!targets.length) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    } catch (e) { return; }
    function paint() {
      var t = fmt.format(new Date());
      targets.forEach(function (el) { el.textContent = t; });
    }
    paint();
    setInterval(paint, 1000);
  })();

  /* ---------------------------------------------------------------------------
     Scroll reveals (with a small stagger between siblings) + counters
     ------------------------------------------------------------------------- */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-counter'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    var decimals = (String(target).split('.')[1] || '').length;
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var start = null, dur = 1500;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  (function reveals() {
    var items = $$('.reveal');
    function show(el) {
      el.classList.add('is-visible');
      $$('[data-counter]', el).forEach(runCounter);
    }
    if (!('IntersectionObserver' in window) || reduceMotion) { items.forEach(show); return; }

    // Stagger: each element waits a little longer than the reveal sibling before it
    items.forEach(function (el) {
      var i = 0, prev = el.previousElementSibling;
      while (prev && i < 6) { if (prev.classList.contains('reveal')) i++; prev = prev.previousElementSibling; }
      if (i) el.style.setProperty('--d', (i * 80) + 'ms');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        show(el);
        io.unobserve(el);
        // Drop the stagger delay afterwards so hover transitions respond instantly
        setTimeout(function () { el.style.removeProperty('--d'); }, 1600);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------------------
     Projects: live badges + filters
     ------------------------------------------------------------------------- */
  (function projects() {
    var cards = $$('.project');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var tags = (card.getAttribute('data-tags') || '').split(/\s+/);
      if (tags.indexOf('live') === -1) return;
      var top = $('.project-top', card);
      if (!top) return;
      var badges = $('.project-badges', top);
      if (!badges) {
        badges = document.createElement('div');
        badges.className = 'project-badges';
        top.appendChild(badges);
      }
      var badge = document.createElement('span');
      badge.className = 'badge badge-live';
      badge.innerHTML = '<span class="live-dot" aria-hidden="true"></span>Live';
      badges.insertBefore(badge, badges.firstChild);
    });

    var buttons = $$('.filter-btn');
    var empty = $('.filter-empty');

    function matches(card, filter) {
      if (filter === 'all') return true;
      return (card.getAttribute('data-tags') || '').split(/\s+/).indexOf(filter) !== -1;
    }

    buttons.forEach(function (btn) {
      var filter = btn.getAttribute('data-filter');
      var count = $('.filter-count', btn);
      if (count) count.textContent = cards.filter(function (c) { return matches(c, filter); }).length;
      btn.setAttribute('aria-pressed', btn.classList.contains('is-active') ? 'true' : 'false');

      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var shown = 0;
        cards.forEach(function (card) {
          var ok = matches(card, filter);
          card.classList.toggle('is-hidden', !ok);
          card.classList.remove('pop');
          if (ok) {
            shown++;
            card.classList.add('is-visible');
            if (!reduceMotion) {
              void card.offsetWidth;            // restart the animation
              card.style.animationDelay = (shown - 1) * 60 + 'ms';
              card.classList.add('pop');
            }
          }
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });

    cards.forEach(function (card) {
      card.addEventListener('animationend', function (e) {
        if (e.target === card) { card.classList.remove('pop'); card.style.animationDelay = ''; }
      });
    });
  })();

  /* ---------------------------------------------------------------------------
     Navigation: sliding pill + scroll spy
     ------------------------------------------------------------------------- */
  var nav = $('.site-nav');
  var navPill = $('.nav-pill');
  var navLinks = nav ? $$('a', nav) : [];
  var activeLink = null;

  function movePill(link) {
    if (!navPill || !nav) return;
    if (!link || !nav.offsetWidth) { navPill.style.opacity = '0'; return; }
    navPill.style.width = link.offsetWidth + 'px';
    navPill.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    navPill.style.opacity = '1';
  }
  navLinks.forEach(function (link) {
    link.addEventListener('mouseenter', function () { movePill(link); });
    link.addEventListener('focus', function () { movePill(link); });
  });
  if (nav) {
    nav.addEventListener('mouseleave', function () { movePill(activeLink); });
    nav.addEventListener('focusout', function () { movePill(activeLink); });
  }

  var sections = navLinks.map(function (link) {
    return { link: link, el: document.getElementById((link.getAttribute('href') || '').slice(1)) };
  }).filter(function (s) { return s.el; });

  function updateSpy() {
    var line = window.innerHeight * 0.35;
    var current = null;
    sections.forEach(function (s) {
      if (s.el.getBoundingClientRect().top <= line) current = s.link;
    });
    // At the very bottom the last section may be too short to cross the line
    if (sections.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].link;
    }
    if (current === activeLink) return;
    activeLink = current;
    navLinks.forEach(function (l) {
      var on = l === current;
      l.classList.toggle('active', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
    if (!nav || !nav.matches(':hover')) movePill(activeLink);
  }

  /* ---------------------------------------------------------------------------
     Scroll-driven bits (one rAF-throttled handler)
     ------------------------------------------------------------------------- */
  var header = $('.site-header');
  var progress = $('#scroll-progress');
  var topBtn = $('#btn-top');
  var timeline = $('#timeline');
  var timelineFill = $('#timeline-fill');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    if (header) header.classList.toggle('scrolled', y > 30);
    if (topBtn) topBtn.classList.toggle('show', y > window.innerHeight * 0.9);

    if (timeline && timelineFill) {
      var b = timeline.getBoundingClientRect();
      var p = b.height ? (window.innerHeight * 0.6 - b.top) / b.height : 0;
      timelineFill.style.transform = 'scaleY(' + Math.min(1, Math.max(0, p)).toFixed(4) + ')';
    }
    updateSpy();
  }
  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', function () { requestTick(); movePill(activeLink); });
  window.addEventListener('load', function () { onScroll(); movePill(activeLink); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { movePill(activeLink); });
  }
  onScroll();

  if (topBtn) {
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------------------------
     Copy email
     ------------------------------------------------------------------------- */
  (function copyEmail() {
    var btn = $('#btn-copy');
    if (!btn) return;
    var label = $('.copy-label', btn);
    var original = label ? label.textContent : '';
    var timer;

    function done(ok) {
      if (!label) return;
      label.textContent = ok ? 'Copied ✓' : 'Press Ctrl/Cmd + C';
      clearTimeout(timer);
      timer = setTimeout(function () { label.textContent = original; }, 2200);
    }
    function fallback(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(text); });
      } else {
        fallback(text);
      }
    });
  })();

  /* -------------------------------------------------------------------------
     Case studies
     A card's "Case study" button opens the matching <article class="case">
     inside <dialog id="case-study">. The address gets "#case-<name>", so a
     case study can be linked to directly and the Back button closes it.
     ------------------------------------------------------------------------- */
  (function () {
    var dialog = $('#case-study');
    if (!dialog) return;

    var scroller = $('.case-scroll', dialog);
    var cases = $$('.case', dialog);
    var stepEl = $('#case-step');
    var bar = $('.case-progress', dialog);
    var prevLabel = $('[data-case-prev] b', dialog);
    var nextLabel = $('[data-case-next] b', dialog);
    var current = -1;
    var closeTimer;

    if (!scroller || !cases.length) return;

    function nameOf(i) { return cases[i].getAttribute('data-case'); }
    function titleOf(i) { var t = $('.case-title', cases[i]); return t ? t.textContent : ''; }
    function indexOfName(name) {
      for (var i = 0; i < cases.length; i++) { if (nameOf(i) === name) return i; }
      return -1;
    }
    function two(n) { return (n < 10 ? '0' : '') + n; }
    function isOpen() { return dialog.hasAttribute('open'); }
    function hashName() {
      var m = /^#case-([\w-]+)$/.exec(window.location.hash);
      return m ? m[1] : null;
    }
    function setHash(name, push) {
      try {
        if (push) window.history.pushState({ caseStudy: true }, '', '#case-' + name);
        else window.history.replaceState(window.history.state, '', '#case-' + name);
      } catch (e) { /* history not available: the case study still opens */ }
    }
    function clearHash() {
      try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
    }

    // The banner reuses the illustration from the project card
    function fillVisual(article) {
      var slot = $('.case-visual-slot', article);
      if (!slot) return;
      var trigger = $('[data-case-open="' + article.getAttribute('data-case') + '"]');
      var card = trigger ? trigger.closest('.project') : null;
      var visual = card ? $('.project-visual', card) : null;
      if (visual) slot.parentNode.replaceChild(visual.cloneNode(true), slot);
      else slot.parentNode.removeChild(slot);
    }

    function setProgress() {
      if (!bar) return;
      var max = scroller.scrollHeight - scroller.clientHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }

    function render(i) {
      current = i;
      cases.forEach(function (c, n) {
        c.hidden = n !== i;
        c.classList.remove('is-active');
      });
      fillVisual(cases[i]);
      void cases[i].offsetWidth;            // restart the entrance animation
      cases[i].classList.add('is-active');
      dialog.setAttribute('aria-label', titleOf(i) + ' case study');
      if (stepEl) stepEl.textContent = two(i + 1) + ' / ' + two(cases.length);
      if (prevLabel) prevLabel.textContent = titleOf((i - 1 + cases.length) % cases.length);
      if (nextLabel) nextLabel.textContent = titleOf((i + 1) % cases.length);
      scroller.scrollTop = 0;
      setProgress();
    }

    function open(i) {
      clearTimeout(closeTimer);
      dialog.classList.remove('is-closing');
      render(i);
      if (isOpen()) return;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
      scroller.scrollTop = 0;
    }

    function cleanUp() {
      clearTimeout(closeTimer);
      dialog.classList.remove('is-closing');
      document.body.style.overflow = '';
      current = -1;
    }

    function hide(instant) {
      if (!isOpen()) return;
      function finish() {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
        cleanUp();
      }
      clearTimeout(closeTimer);
      if (instant || reduceMotion) { finish(); return; }
      dialog.classList.add('is-closing');
      closeTimer = setTimeout(finish, 190);
    }

    // Close the way the user expects: step back if we added a history entry
    function requestClose() {
      if (window.history.state && window.history.state.caseStudy) {
        window.history.back();              // "popstate" below does the closing
      } else {
        clearHash();
        hide();
      }
    }

    function sync() {
      var name = hashName();
      var i = name ? indexOfName(name) : -1;
      if (i > -1) open(i);
      else hide();
    }

    function step(delta) {
      if (current < 0) return;
      var i = (current + delta + cases.length) % cases.length;
      setHash(nameOf(i), false);
      render(i);
      try { scroller.focus({ preventScroll: true }); } catch (e) { scroller.focus(); }
    }

    // Open from a project card
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-case-open]') : null;
      if (!t) return;
      var i = indexOfName(t.getAttribute('data-case-open'));
      if (i < 0) return;
      e.preventDefault();
      setHash(nameOf(i), true);
      open(i);
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) { requestClose(); return; }      // click on the dimmed backdrop
      var t = e.target.closest ? e.target.closest('[data-case-close], [data-case-prev], [data-case-next], [data-case-jump]') : null;
      if (!t) return;
      if (t.hasAttribute('data-case-close')) { requestClose(); return; }
      if (t.hasAttribute('data-case-prev')) { step(-1); return; }
      if (t.hasAttribute('data-case-next')) { step(1); return; }

      // A link to another part of the page: close first, then go there
      var href = t.getAttribute('href') || '';
      var target = href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
      if (!target) return;
      e.preventDefault();
      try { window.history.replaceState(null, '', href); } catch (err) {}
      hide(true);
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    // Esc key
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      requestClose();
    });

    // If the browser closes the dialog by itself, tidy up the page and the address
    dialog.addEventListener('close', function () {
      if (isOpen()) return;
      cleanUp();
      if (hashName()) {
        if (window.history.state && window.history.state.caseStudy) window.history.back();
        else clearHash();
      }
    });

    scroller.addEventListener('scroll', setProgress, { passive: true });
    window.addEventListener('resize', setProgress, { passive: true });
    window.addEventListener('popstate', sync);

    // Direct link, e.g. …/#case-krushiai
    if (hashName()) sync();
  })();
})();
