(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Reduced motion check — gate all animations behind this
  ------------------------------------------------------------------ */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Theme toggle
  ------------------------------------------------------------------ */
  const THEME_KEY = 'pshinde-theme';
  const html = document.documentElement;
  const btnTheme = document.getElementById('btn-theme');

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  if (btnTheme) {
    btnTheme.addEventListener('click', function () {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  const btnHamburger = document.getElementById('btn-hamburger');
  const mobileMenu   = document.getElementById('mobile-menu');
  const mobileLinks  = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  function openMenu() {
    mobileMenu.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    btnHamburger.setAttribute('aria-expanded', 'true');
    if (mobileLinks.length) mobileLinks[0].focus();
  }

  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    document.body.style.overflow = '';
    btnHamburger.setAttribute('aria-expanded', 'false');
    btnHamburger.focus();
  }

  if (btnHamburger && mobileMenu) {
    btnHamburger.addEventListener('click', function () {
      mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    mobileLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
    });
  }

  /* ------------------------------------------------------------------
     Scroll progress rail
  ------------------------------------------------------------------ */
  const rail = document.getElementById('scroll-progress');

  function updateProgress() {
    if (!rail) return;
    const scrollTop  = window.scrollY || document.documentElement.scrollTop;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    rail.style.width = pct + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ------------------------------------------------------------------
     Smooth scroll for anchor links
  ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    history.pushState(null, '', id);
  });

  /* ------------------------------------------------------------------
     Custom cursor (desktop only)
  ------------------------------------------------------------------ */
  const cursorDot  = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (cursorDot && cursorRing && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    let mx = -100, my = -100; // mouse position
    let rx = -100, ry = -100; // ring lagged position

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top  = my + 'px';
    });

    document.addEventListener('mousedown', function () { document.body.classList.add('cursor-click'); });
    document.addEventListener('mouseup',   function () { document.body.classList.remove('cursor-click'); });

    // Toggle hover state on interactive elements
    const hoverTargets = 'a, button, [role="button"], input, textarea, select, label, .project-card, .skill-pill';
    document.querySelectorAll(hoverTargets).forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });

    // Ring follows with lerp
    function animateCursor() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top  = ry + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  /* ------------------------------------------------------------------
     Hero canvas — particle network
  ------------------------------------------------------------------ */
  const canvas = document.getElementById('hero-canvas');

  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const PARTICLE_COUNT = 55;
    const LINK_DIST      = 130;
    const COLOR          = '125,211,252';
    let W, H, particles;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function createParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x:  rand(0, W),
          y:  rand(0, H),
          vx: rand(-0.25, 0.25),
          vy: rand(-0.25, 0.25),
          r:  rand(1, 2.2)
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Move
        p.x += p.vx;
        p.y += p.vy;
        // Bounce
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + COLOR + ',0.55)';
        ctx.fill();
        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(' + COLOR + ',' + alpha + ')';
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawParticles);
    }

    resize();
    createParticles();
    drawParticles();

    window.addEventListener('resize', function () {
      resize();
      createParticles();
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Hero entrance sequence
  ------------------------------------------------------------------ */
  const eyebrowEl   = document.getElementById('hero-eyebrow');
  const eyebrowText = eyebrowEl ? eyebrowEl.querySelector('.eyebrow-text') : null;
  const heroLines   = document.querySelectorAll('.hero-line-inner');
  const heroSub     = document.querySelector('.hero-sub');
  const heroActions = document.querySelector('.hero-actions');
  const heroMeta    = document.querySelector('.hero-meta');

  function revealHeroTail() {
    [heroSub, heroActions, heroMeta].forEach(function (el, i) {
      if (!el) return;
      el.style.transitionDelay = (i * 120) + 'ms';
      el.classList.add('is-visible');
    });
  }

  if (reduceMotion) {
    // Show everything immediately
    heroLines.forEach(function (el) { el.classList.add('reveal-line'); });
    if (eyebrowText) {
      eyebrowText.textContent = eyebrowEl.getAttribute('aria-label') || '';
      eyebrowText.classList.add('done');
    }
    revealHeroTail();
  } else {
    // 1. Typewriter eyebrow (starts after 180ms)
    const EYEBROW_TEXT = 'Available for SDE / Data Analyst internships — Summer 2026';
    if (eyebrowText) {
      eyebrowText.textContent = '';
      eyebrowText.classList.add('typing');
      let charIdx = 0;
      setTimeout(function typeChar() {
        if (charIdx < EYEBROW_TEXT.length) {
          eyebrowText.textContent += EYEBROW_TEXT[charIdx++];
          setTimeout(typeChar, 32);
        } else {
          eyebrowText.classList.remove('typing');
          eyebrowText.classList.add('done');
        }
      }, 180);
    }

    // 2. Headline line reveals (line 1 → 680ms, line 2 → 880ms)
    heroLines.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add('reveal-line');
      }, 680 + i * 200);
    });

    // 3. Sub / actions / meta after last line
    setTimeout(revealHeroTail, 1300);
  }

  /* ------------------------------------------------------------------
     Scroll reveal — IntersectionObserver (.reveal → .is-visible)
  ------------------------------------------------------------------ */
  const reveals = document.querySelectorAll('.reveal');

  // Mark hero tail elements so the reveal observer skips them (handled by entrance sequence)
  var heroRevealEls = [heroSub, heroActions, heroMeta].filter(Boolean);
  heroRevealEls.forEach(function (el) { el.dataset.heroManaged = '1'; });

  if (reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    document.querySelectorAll('.reveal-group').forEach(function (group) {
      Array.from(group.children).forEach(function (child, i) {
        child.style.transitionDelay = (i * 80) + 'ms';
      });
    });

    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.target.dataset.heroManaged) {
            revealObserver.unobserve(entry.target);
            return;
          }
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '-8% 0px', threshold: 0.08 }
    );

    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     Stat counters (count from 0 to target on scroll-into-view)
  ------------------------------------------------------------------ */
  const statValues = document.querySelectorAll('.stat-value[data-counter]');

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el) {
    const target   = parseFloat(el.getAttribute('data-counter'));
    const suffix   = el.getAttribute('data-suffix') || '';
    const isFloat  = String(target).includes('.');
    const duration = 1200;
    const start    = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      const value    = target * eased;
      el.textContent = (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (!reduceMotion && statValues.length) {
    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statValues.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     3D card tilt on project cards
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    document.querySelectorAll('.project-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);
        const dy   = (e.clientY - cy) / (rect.height / 2);
        const rotX = -dy * 6;
        const rotY =  dx * 6;
        card.style.transform = 'perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateZ(6px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      });
    });
  }

  /* ------------------------------------------------------------------
     Magnetic button effect on .btn-primary
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) * 0.3;
        const dy   = (e.clientY - cy) * 0.3;
        btn.style.transform    = 'translate(' + dx + 'px,' + dy + 'px)';
        btn.style.transition   = 'transform 0.1s ease';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform  = 'translate(0,0)';
        btn.style.transition = 'transform 0.6s cubic-bezier(0.175,0.885,0.32,1.275)';
      });
    });
  }

  /* ------------------------------------------------------------------
     Scroll spy — active nav link
  ------------------------------------------------------------------ */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.site-nav a[href^="#"], #mobile-menu a[href^="#"]');

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === '#' + id);
    });
  }

  if (sections.length && navLinks.length) {
    const spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveNav(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach(function (sec) { spyObserver.observe(sec); });
  }

  /* ------------------------------------------------------------------
     Staggered pill entrance — when skill rows enter view
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    const pillObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const pills = entry.target.querySelectorAll('.pill');
          pills.forEach(function (pill, i) {
            pill.style.animationDelay = (i * 55) + 'ms';
            pill.classList.add('pill-animate');
          });
          pillObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.skill-row').forEach(function (row) {
      pillObserver.observe(row);
    });
  }

  /* ------------------------------------------------------------------
     Navbar shrink on scroll
  ------------------------------------------------------------------ */
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    window.addEventListener('scroll', function () {
      siteHeader.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

})();
