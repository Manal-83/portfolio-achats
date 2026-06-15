/* ============================================================
   PORTFOLIO — MANAL MAAZOUZI
   JS vanilla, zéro dépendance.
   Sécurité : aucun innerHTML, aucun script inline (CSP stricte),
   email assemblé à l'exécution pour limiter le scraping.
   Performance : IntersectionObserver + requestAnimationFrame,
   écouteurs passifs, respect de prefers-reduced-motion.
   ============================================================ */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover      = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Barre de navigation + progression ---------- */

  const navbar      = $('#navbar');
  const progressBar = $('#progress-bar');
  let scrollTicking = false;

  const onScroll = () => {
    const y = window.scrollY;

    if (navbar) navbar.classList.toggle('scrolled', y > 40);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progressBar.style.transform = 'scaleX(' + ratio + ')';
    }
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- 2. Menu mobile ---------- */

  const toggle = $('#nav-toggle');
  const menu   = $('#nav-menu');

  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    $$('.nav-links a', menu).forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && menu.classList.contains('open')) setMenu(false);
    }, { passive: true });
  }

  /* ---------- 3. Révélation au défilement ---------- */

  const revealEls = $$('.rv');
  if (revealEls.length && 'IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- 4. Compteurs animés ---------- */

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (reducedMotion) { el.textContent = String(target); return; }

    const duration = 1300;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(easeOut(t) * target));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counters = $$('.count');
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => { el.textContent = el.dataset.count || '0'; });
  }

  /* ---------- 5. Lien actif selon la section visible ---------- */

  const sections = $$('main section[id], header[id]');
  const navLinks = $$('.nav-links a[href^="#"]');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const byHref = new Map(navLinks.map((l) => [l.getAttribute('href'), l]));
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.remove('active'));
        const link = byHref.get('#' + entry.target.id);
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -52% 0px' });
    sections.forEach((s) => sio.observe(s));
  }

  /* ---------- 6. Copie de l'email ---------- */
  /* L'adresse est assemblée ici (et non écrite en dur dans le HTML)
     pour compliquer la collecte automatisée par les robots spammeurs. */

  const copyBtn   = $('#copy-email');
  const emailText = $('#email-text');
  const address   = ['manalmaazouzi83', 'gmail.com'].join('\u0040');

  if (copyBtn && emailText) {
    emailText.textContent = address;

    const fallbackCopy = (text) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) { /* silencieux */ }
      ta.remove();
    };

    let resetTimer = null;
    copyBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(address);
        } else {
          fallbackCopy(address);
        }
        copyBtn.classList.add('copied');
        emailText.textContent = 'Adresse copiée';
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          copyBtn.classList.remove('copied');
          emailText.textContent = address;
        }, 2200);
      } catch (err) {
        emailText.textContent = address; // au pire, l'adresse reste lisible
      }
    });
  }

  /* ---------- 7. Halo qui suit le pointeur (hero) ---------- */

  const hero = $('.hero');
  const glow = $('.hero-glow');

  if (hero && glow && canHover && !reducedMotion) {
    let gx = 0, gy = 0, glowTicking = false;

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      gx = e.clientX - rect.left;
      gy = e.clientY - rect.top;
      if (!glowTicking) {
        glowTicking = true;
        requestAnimationFrame(() => {
          glow.style.setProperty('--mx', gx + 'px');
          glow.style.setProperty('--my', gy + 'px');
          glowTicking = false;
        });
      }
    }, { passive: true });
  }

  /* ---------- 8. Photo absente → monogramme ---------- */

  const photo = $('#photo');
  const frame = $('#photo-frame');

  if (photo && frame) {
    const showMonogram = () => frame.classList.add('no-photo');
    photo.addEventListener('error', showMonogram);
    if (photo.complete && photo.naturalWidth === 0) showMonogram();
  }

  /* ---------- 9. Année du pied de page ---------- */

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

})();
