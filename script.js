(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(pointer: fine)').matches;
  var html = document.documentElement;

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
  }

  /* ------------------------------------------------------------------
     Theme toggle
  ------------------------------------------------------------------ */
  var btnTheme = document.getElementById('btn-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      store('pshinde-theme', next);
    });
  }

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  var btnHamburger = document.getElementById('btn-hamburger');
  var mobileMenu   = document.getElementById('mobile-menu');

  if (btnHamburger && mobileMenu) {
    var mobileLinks = mobileMenu.querySelectorAll('a');

    var openMenu = function () {
      mobileMenu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      btnHamburger.setAttribute('aria-expanded', 'true');
      btnHamburger.setAttribute('aria-label', 'Close navigation menu');
      if (mobileLinks.length) mobileLinks[0].focus();
    };

    var closeMenu = function () {
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
      btnHamburger.setAttribute('aria-expanded', 'false');
      btnHamburger.setAttribute('aria-label', 'Open navigation menu');
    };

    btnHamburger.addEventListener('click', function () {
      mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    mobileLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMenu();
        btnHamburger.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll-driven bits: progress rail, header, back-to-top
  ------------------------------------------------------------------ */
  var rail       = document.getElementById('scroll-progress');
  var siteHeader = document.querySelector('.site-header');
  var btnTop     = document.getElementById('btn-top');
  var ticking    = false;

  function onScroll() {
    var y   = window.scrollY || html.scrollTop;
    var max = html.scrollHeight - window.innerHeight;
    if (rail) rail.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (siteHeader) siteHeader.classList.toggle('scrolled', y > 30);
    if (btnTop) btnTop.classList.toggle('show', y > window.innerHeight * 0.8);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (btnTop) {
    btnTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------
     Pointer glow on the page background + card spotlights
  ------------------------------------------------------------------ */
  var bgGlow = document.querySelector('.bg-glow');
  if (bgGlow && finePointer && !reduceMotion) {
    var gx = 0, gy = 0, glowQueued = false;
    document.addEventListener('mousemove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (glowQueued) return;
      glowQueued = true;
      requestAnimationFrame(function () {
        bgGlow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
        glowQueued = false;
      });
    }, { passive: true });
  }

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.project-card, .cert-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ------------------------------------------------------------------
     Photo: 3D tilt, light reflection and tag parallax on hover
  ------------------------------------------------------------------ */
  var photoStage = document.querySelector('.photo-stage');
  if (photoStage && finePointer && !reduceMotion) {
    var photoFrame = photoStage.querySelector('.photo-frame');
    photoStage.addEventListener('mousemove', function (e) {
      var r  = photoStage.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width  - 0.5; // -0.5 … 0.5
      var ny = (e.clientY - r.top)  / r.height - 0.5;
      photoFrame.style.setProperty('--rx', (-ny * 14) + 'deg');
      photoFrame.style.setProperty('--ry', (nx * 16) + 'deg');
      photoFrame.style.setProperty('--px', ((nx + 0.5) * 100) + '%');
      photoFrame.style.setProperty('--py', ((ny + 0.5) * 100) + '%');
      photoStage.style.setProperty('--tx', (nx * -18) + 'px');
      photoStage.style.setProperty('--ty', (ny * -18) + 'px');
    });
    photoStage.addEventListener('mouseleave', function () {
      ['--rx', '--ry'].forEach(function (k) { photoFrame.style.setProperty(k, '0deg'); });
      ['--tx', '--ty'].forEach(function (k) { photoStage.style.setProperty(k, '0px'); });
    });
  }

  /* ------------------------------------------------------------------
     Hero canvas — particle network that reacts to the pointer
  ------------------------------------------------------------------ */
  var canvas = document.getElementById('hero-canvas');

  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, particles = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;
    var LINK = 130;

    var colors = function () {
      return html.getAttribute('data-theme') === 'light'
        ? ['8,145,178', '124,58,237']
        : ['34,211,238', '139,92,246'];
    };

    var resize = function () {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(80, Math.max(30, (W * H) / 16000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.4 + 0.6,
          c: Math.random() < 0.7 ? 0 : 1
        });
      }
    };

    var draw = function () {
      if (!running) return;
      var pal = colors();
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // gentle pull toward the pointer
        var mdx = mouse.x - p.x, mdy = mouse.y - p.y;
        var md  = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 180) {
          p.x += mdx * 0.004;
          p.y += mdy * 0.004;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = 'rgba(' + pal[0] + ',' + (1 - md / 180) * 0.35 + ')';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + pal[p.c] + ',0.75)';
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(' + pal[p.c] + ',' + (1 - Math.sqrt(d) / LINK) * 0.22 + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize, { passive: true });

    var hero = canvas.parentElement;
    hero.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });

    // Pause when the hero is off screen
    new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (visible && !running) { running = true; draw(); }
      else if (!visible) { running = false; }
    }).observe(hero);
  }

  /* ------------------------------------------------------------------
     Hero entrance: typed status, headline lines, then the rest
  ------------------------------------------------------------------ */
  var eyebrowText = document.querySelector('#hero-eyebrow .eyebrow-text');
  var heroLines   = document.querySelectorAll('.hero-line-inner');
  var heroTail    = [
    document.querySelector('.hero-sub'),
    document.querySelector('.hero-actions'),
    document.querySelector('.hero-meta'),
    document.querySelector('.terminal')
  ].filter(Boolean);

  heroTail.forEach(function (el) { el.dataset.heroManaged = '1'; });

  function revealHeroTail() {
    heroTail.forEach(function (el, i) {
      el.style.transitionDelay = (i * 120) + 'ms';
      el.classList.add('is-visible');
    });
  }

  if (reduceMotion) {
    heroLines.forEach(function (el) { el.classList.add('reveal-line'); });
    revealHeroTail();
  } else {
    if (eyebrowText) {
      var full = eyebrowText.textContent;
      var idx = 0;
      eyebrowText.textContent = '';
      eyebrowText.classList.add('typing');
      setTimeout(function typeChar() {
        if (idx < full.length) {
          eyebrowText.textContent += full[idx++];
          setTimeout(typeChar, 26);
        } else {
          eyebrowText.classList.remove('typing');
          eyebrowText.classList.add('done');
        }
      }, 200);
    }

    heroLines.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('reveal-line'); }, 450 + i * 180);
    });

    setTimeout(revealHeroTail, 1000);
  }

  /* ------------------------------------------------------------------
     Terminal: type each command, then show its output
  ------------------------------------------------------------------ */
  var termBody = document.getElementById('terminal-body');

  if (termBody) {
    var rows = Array.prototype.slice.call(termBody.children);

    if (reduceMotion) {
      rows.forEach(function (r) { r.classList.add('is-shown'); });
    } else {
      var cmds = termBody.querySelectorAll('[data-type]');
      cmds.forEach(function (c) { c.dataset.full = c.textContent; c.textContent = ''; });

      var step = 0;
      var next = function () {
        if (step >= rows.length) return;
        var row = rows[step++];
        row.classList.add('is-shown');
        var cmd = row.querySelector('[data-type]');
        if (!cmd) { setTimeout(next, 260); return; }
        var text = cmd.dataset.full, k = 0;
        (function type() {
          if (k < text.length) {
            cmd.textContent += text[k++];
            setTimeout(type, 45 + Math.random() * 40);
          } else {
            setTimeout(next, 280);
          }
        })();
      };
      setTimeout(next, 1500);
    }
  }

  /* ------------------------------------------------------------------
     Live IST clock
  ------------------------------------------------------------------ */
  var clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch (e) { fmt = null; }
    var tick = function () {
      var t = fmt ? fmt.format(new Date()) : new Date().toLocaleTimeString();
      clocks.forEach(function (c) { c.textContent = t; });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------
     Scroll reveal
  ------------------------------------------------------------------ */
  var reveals = document.querySelectorAll('.reveal');

  document.querySelectorAll('.reveal-group').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.transitionDelay = (i * 80) + 'ms';
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target.dataset.heroManaged) { revealObserver.unobserve(entry.target); return; }
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     Stat counters
  ------------------------------------------------------------------ */
  var statValues = document.querySelectorAll('.stat-value[data-counter]');

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-counter'));
    var suffix = el.getAttribute('data-suffix') || '';
    var isFloat = String(target).indexOf('.') !== -1;
    var start = performance.now();
    (function frame(now) {
      var p = Math.min((now - start) / 1200, 1);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = (isFloat ? v.toFixed(1) : Math.round(v)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  if (!reduceMotion && statValues.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statValues.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     Staggered pills in skill modules
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    var pillObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.pill').forEach(function (pill, i) {
          pill.style.animationDelay = (i * 50) + 'ms';
          pill.classList.add('pill-animate');
        });
        pillObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.skill-module').forEach(function (m) { pillObserver.observe(m); });
  }

  /* ------------------------------------------------------------------
     Projects: LIVE badges + filters
     A card counts as live when its data-tags include "live".
  ------------------------------------------------------------------ */
  var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));

  function tagsOf(card) { return (card.getAttribute('data-tags') || '').split(/\s+/); }

  cards.forEach(function (card) {
    if (tagsOf(card).indexOf('live') === -1) return;
    var top = card.querySelector('.project-card-top');
    if (!top) return;
    var wrap = top.querySelector('.project-badges');
    if (!wrap) {
      wrap = document.createElement('span');
      wrap.className = 'project-badges';
      Array.prototype.slice.call(top.querySelectorAll('.badge')).forEach(function (b) { wrap.appendChild(b); });
      top.appendChild(wrap);
    }
    var badge = document.createElement('span');
    badge.className = 'badge badge-live';
    badge.innerHTML = '<span class="live-dot" aria-hidden="true"></span>Live';
    wrap.insertBefore(badge, wrap.firstChild);
  });

  var filterBtns = document.querySelectorAll('.filter-btn');
  var emptyMsg   = document.querySelector('.filter-empty');

  filterBtns.forEach(function (btn) {
    var f = btn.getAttribute('data-filter');
    var n = f === 'all' ? cards.length : cards.filter(function (c) { return tagsOf(c).indexOf(f) !== -1; }).length;
    var countEl = btn.querySelector('.filter-count');
    if (countEl) countEl.textContent = n;

    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      var shown = 0;
      cards.forEach(function (card) {
        var match = f === 'all' || tagsOf(card).indexOf(f) !== -1;
        card.classList.toggle('is-hidden', !match);
        if (match) { shown++; card.classList.add('is-visible'); }
      });
      if (emptyMsg) emptyMsg.hidden = shown !== 0;
    });
  });

  /* ------------------------------------------------------------------
     Copy email
  ------------------------------------------------------------------ */
  var btnCopy = document.getElementById('btn-copy');
  if (btnCopy) {
    var label = btnCopy.querySelector('.copy-label');
    btnCopy.addEventListener('click', function () {
      var value = btnCopy.getAttribute('data-copy');
      var done = function (msg) {
        label.textContent = msg;
        setTimeout(function () { label.textContent = 'Copy email'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { done('Copied ✓'); }, function () { done(value); });
      } else {
        done(value);
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll spy for nav
  ------------------------------------------------------------------ */
  var navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
  var sections = document.querySelectorAll('section[id], .hero');

  if (navLinks.length && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id; // hero has no id, so nothing is highlighted there
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

})();
