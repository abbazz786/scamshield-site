/* ═══════════════════════════════════════════════════════
   ScamShield UK — Shared JS v2.0
   Handles: nav overlay, dark mode, scrollspy, animations,
            reading progress, stats counters, newsletter,
            inline postcode search
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. DARK MODE ─────────────────────────────────── */
  const THEME_KEY = 'ss_theme';

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    document.querySelectorAll('[data-dm-icon]').forEach(el => {
      el.textContent = t === 'dark' ? '☀️' : '🌙';
    });
    document.querySelectorAll('[data-dm-label]').forEach(el => {
      el.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
    });
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }

  // Init — default dark
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

  document.addEventListener('click', e => {
    if (e.target.closest('[data-dm-toggle]')) toggleTheme();
  });

  /* ── 2. STICKY HEADER ─────────────────────────────── */
  const header = document.querySelector('.site-header');
  if (header) {
    const tick = () => header.classList.toggle('site-header--scrolled', window.scrollY > 20);
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ── 3. PILL NAV BUTTONS ───────────────────── */
  document.querySelectorAll('.pill-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => window.switchView?.(btn.dataset.view));
  });

  /* ── Dark mode toggle in header ── */
  document.querySelector('.nav-dm-btn')?.addEventListener('click', () => {
    document.querySelector('[data-dm-toggle]:not(.nav-dm-btn)')?.click();
  });

  /* ── 4. SMOOTH SCROLL (anchor links) ─────────────── */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = (header?.offsetHeight || 64) + 16;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    closeNav();
  });

  /* ── 5. SCROLLSPY ─────────────────────────────────── */
  const spyLinks = document.querySelectorAll(
    '.site-nav a[href^="#"], .nav-overlay-links a[href^="#"]'
  );
  const spySections = [];
  spyLinks.forEach(a => {
    const id = a.getAttribute('href');
    const sec = document.querySelector(id);
    if (sec) spySections.push({ sec, id });
  });

  if (spySections.length) {
    function updateSpy() {
      const y = window.scrollY + (header?.offsetHeight || 64) + 80;
      let active = spySections[0].id;
      spySections.forEach(({ sec, id }) => {
        if (sec.offsetTop <= y) active = id;
      });
      document.querySelectorAll('.site-nav a, .nav-overlay-links a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === active);
      });
    }
    window.addEventListener('scroll', updateSpy, { passive: true });
    updateSpy();
  }

  /* ── 6. SCROLL ANIMATIONS ─────────────────────────── */
  const animEls = document.querySelectorAll('.animate-on-scroll');
  if (animEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    animEls.forEach(el => io.observe(el));
  } else {
    animEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ── 7. STATS COUNTER ─────────────────────────────── */
  function countUp(el, target, suffix, prefix) {
    const dur = 1800, t0 = performance.now();
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(ease * target).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const statEls = document.querySelectorAll('[data-stat]');
  if (statEls.length && 'IntersectionObserver' in window) {
    const sio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el     = e.target;
          const target = parseInt(el.getAttribute('data-stat'), 10);
          const suffix = el.getAttribute('data-stat-suffix') || '';
          const prefix = el.getAttribute('data-stat-prefix') || '';
          countUp(el, target, suffix, prefix);
          sio.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => sio.observe(el));
  }

  /* ── 8. READING PROGRESS BAR ──────────────────────── */
  const bar = document.querySelector('.reading-progress');
  if (bar) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ── 9. NEWSLETTER FORM ───────────────────────────── */
  const nlForm = document.querySelector('.newsletter-form');
  if (nlForm) {
    nlForm.addEventListener('submit', e => {
      e.preventDefault();
      const suc = document.querySelector('.newsletter-success');
      if (suc) { nlForm.style.display = 'none'; suc.style.display = 'block'; }
    });
  }

  /* ── 10. INLINE POSTCODE SEARCH ───────────────────── */
  window.runPostcodeSearch = async function () {
    const inp  = document.getElementById('sectionPostcodeInput');
    const res  = document.getElementById('postcodeResults');
    const btn  = document.getElementById('sectionPostcodeBtn');
    if (!inp || !res) return;

    const raw = inp.value.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(raw)) {
      res.innerHTML = `<p style="color:var(--warn);font-size:13px;padding:8px 0;">
        Please enter a valid UK postcode (e.g. SW1A 1AA)</p>`;
      res.classList.add('visible');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Searching…';
    res.innerHTML = `<div style="text-align:center;padding:32px 0;">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <div style="font-size:14px;color:var(--text-3);">Loading your area report…</div>
    </div>`;
    res.classList.add('visible');

    try {
      // 1. Postcode → lat/lng
      const pc = await fetch('https://api.postcodes.io/postcodes/' + raw).then(r => r.json());
      if (pc.status !== 200 || !pc.result) throw new Error('Invalid postcode. Please check and try again.');
      const { latitude: lat, longitude: lng, admin_district: district } = pc.result;
      const area = district || raw;

      // 2. Crime data
      let crimes = [];
      try {
        const cr = await fetch(
          `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (cr.ok) crimes = await cr.json();
      } catch (_) { /* non-fatal */ }

      // 3. Local police force
      let forceName = '', forceUrl = '';
      try {
        const nh = await fetch(`https://data.police.uk/api/locate-neighbourhood?q=${lat},${lng}`).then(r => r.json());
        if (nh?.force) {
          const f = await fetch(`https://data.police.uk/api/forces/${nh.force}`).then(r => r.json());
          forceName = f.name || '';
          forceUrl  = f.url || '';
        }
      } catch (_) { /* non-fatal */ }

      // 4. Process crimes
      const total = crimes.length;
      let score = 95;
      if (total > 200) score = 20;
      else if (total > 150) score = 35;
      else if (total > 100) score = 50;
      else if (total > 60)  score = 65;
      else if (total > 30)  score = 78;
      else if (total > 10)  score = 88;

      const scoreColor = score >= 80 ? '#2ED573' : score >= 60 ? '#F5C518' : score >= 40 ? '#FF6B35' : '#FF4757';
      const scoreLabel = score >= 80 ? 'Generally Safe' : score >= 60 ? 'Moderate Risk' : score >= 40 ? 'High Risk' : 'Very High Risk';

      const grouped = {};
      crimes.forEach(c => {
        const cat = (c.category || 'other').replace(/-/g, ' ');
        grouped[cat] = (grouped[cat] || 0) + 1;
      });
      const topCrimes = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const maxCount  = topCrimes[0]?.[1] || 1;

      res.innerHTML = `
        <div class="pc-tabs">
          <button class="pc-tab active" onclick="window.switchPcTab(0)">📍 Local Alerts</button>
          <button class="pc-tab"        onclick="window.switchPcTab(1)">📞 Contacts</button>
        </div>

        <div class="pc-tab-content active" id="pcTab0">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:16px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid var(--glass-bd);">
            <div style="text-align:center;flex-shrink:0;min-width:60px;">
              <div style="font-size:36px;font-weight:900;color:${scoreColor};line-height:1;">${score}</div>
              <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;">Safety</div>
            </div>
            <div>
              <div style="font-size:16px;font-weight:700;color:var(--text-1);">${area}</div>
              <div style="font-size:13px;font-weight:600;color:${scoreColor};margin-top:2px;">${scoreLabel}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:3px;">${total.toLocaleString()} incidents reported nearby</div>
            </div>
          </div>
          ${topCrimes.length ? `
            <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Top Crime Categories</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${topCrimes.map(([cat, cnt]) => `
                <div style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;">
                  <div>
                    <div style="font-size:13px;color:var(--text-2);text-transform:capitalize;margin-bottom:4px;">${cat}</div>
                    <div style="height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;">
                      <div style="width:${Math.round(cnt/maxCount*100)}%;height:100%;background:linear-gradient(90deg,#667EEA,#764BA2);border-radius:3px;"></div>
                    </div>
                  </div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-1);flex-shrink:0;">${cnt}</div>
                </div>
              `).join('')}
            </div>
          ` : '<p style="font-size:13px;color:var(--text-3);">No recent crime data found for this area.</p>'}
        </div>

        <div class="pc-tab-content" id="pcTab1">
          ${forceName ? `
            <a href="${forceUrl || '#'}" target="_blank" rel="noopener" class="pc-contact-link">
              <span class="pc-contact-icon">👮</span>
              <div><div class="pc-contact-name">${forceName}</div><div class="pc-contact-desc">Local Police Force</div></div>
            </a>` : ''}
          <a href="https://www.actionfraud.police.uk/reporting-fraud-and-cyber-crime" target="_blank" rel="noopener" class="pc-contact-link">
            <span class="pc-contact-icon">🛡️</span>
            <div><div class="pc-contact-name">Action Fraud</div><div class="pc-contact-desc">National Fraud &amp; Cyber Crime Reporting Centre</div></div>
          </a>
          <a href="https://www.tradingstandards.uk/consumers/" target="_blank" rel="noopener" class="pc-contact-link">
            <span class="pc-contact-icon">⚖️</span>
            <div><div class="pc-contact-name">Trading Standards</div><div class="pc-contact-desc">Consumer protection &amp; scam reporting</div></div>
          </a>
          <a href="https://www.citizensadvice.org.uk/consumer/scams/reporting-a-scam/" target="_blank" rel="noopener" class="pc-contact-link">
            <span class="pc-contact-icon">📞</span>
            <div><div class="pc-contact-name">Citizens Advice</div><div class="pc-contact-desc">Free advice and scam reporting support</div></div>
          </a>
        </div>
      `;
    } catch (err) {
      res.innerHTML = `<div style="color:var(--warn);font-size:13px;background:rgba(255,71,87,.1);border-radius:8px;padding:14px;">
        ${err.message || 'Could not load data. Please try again.'}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Search';
    }
  };

  window.switchPcTab = function (idx) {
    document.querySelectorAll('.pc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('.pc-tab-content').forEach((c, i) => c.classList.toggle('active', i === idx));
  };

  // Enter key on postcode input
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('sectionPostcodeInput');
    el?.addEventListener('keydown', e => { if (e.key === 'Enter') window.runPostcodeSearch(); });
  });

  /* ── 11. AUTO-GENERATE TOC (blog pages) ───────────── */
  const tocEl = document.getElementById('articleToc');
  if (tocEl) {
    const article = document.querySelector('.article-prose');
    if (article) {
      const headings = article.querySelectorAll('h2');
      if (headings.length) {
        let items = '';
        headings.forEach((h, i) => {
          if (!h.id) h.id = 'section-' + i;
          items += `<li><a href="#${h.id}">${h.textContent}</a></li>`;
        });
        tocEl.innerHTML = `<h3>Contents</h3><ol class="toc-list">${items}</ol>`;
      } else {
        tocEl.closest('.article-toc')?.remove();
      }
    }
  }

  /* ── 12. SHARE BUTTONS (blog pages) ──────────────── */
  window.shareArticle = function (type) {
    const url   = encodeURIComponent(location.href);
    const title = encodeURIComponent(document.title);
    const text  = encodeURIComponent('Useful article from ScamShield UK: ');
    const map   = {
      x:    `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      wa:   `https://wa.me/?text=${text}${url}`,
      copy: null
    };
    if (type === 'copy') {
      navigator.clipboard?.writeText(location.href).then(() => {
        const btn = document.querySelector('.share-btn--copy');
        if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = '🔗 Copy link', 2000); }
      });
    } else if (map[type]) {
      window.open(map[type], '_blank', 'noopener,noreferrer');
    }
  };

})();

/* ── VIEW SWITCHER ────────────────────────────────── */
(function () {
  function switchView(id) {
    document.querySelectorAll('.tool-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tool-tab, .pill-btn').forEach(t => t.classList.remove('active'));
    const view = document.getElementById('view-' + id);
    if (view) view.classList.add('active');
    document.querySelectorAll('[data-view="' + id + '"]').forEach(t => t.classList.add('active'));
    document.body.style.overflow = '';
  }

  // Expose globally
  window.switchView = switchView;

  // Bind tab buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-view]');
    if (btn) switchView(btn.getAttribute('data-view'));
  });

  // Default: show check view
  switchView('check');
})();

/* ── AREA SAFETY POPUP ────────────────────────────── */
(function () {
  const AS_KEY = 'ss_area_safety_unlocked';
  const popup = document.getElementById('areaPopup');
  const headerBtn = document.getElementById('areaSafetyHeaderBtn');
  const content = document.getElementById('areaPopupContent');

  function isUnlocked() {
    try { return localStorage.getItem(AS_KEY) === '1'; } catch (e) { return false; }
  }

  function openAreaPopup() {
    if (isUnlocked()) showUnlockedState();
    popup?.classList.add('is-open');
  }

  function closeAreaPopup() {
    popup?.classList.remove('is-open');
  }
  window.closeAreaPopup = closeAreaPopup;

  function showUnlockedState() {
    if (!content) return;
    if (headerBtn) headerBtn.textContent = '🔓 Area Safety Check';
    content.innerHTML = `
      <div style="font-size:36px;margin-bottom:12px;">🔓</div>
      <h2 class="area-popup-title">Postcode Area Safety Check</h2>
      <p class="area-popup-desc">✅ Unlocked! Enter your postcode below.</p>
      <p class="area-popup-sub">Get your local safety score, crime data, and reporting contacts.</p>
      <div class="area-popup-input-row">
        <input type="text" id="areaPopupPostcode" placeholder="E.G. SW1A 1AA" maxlength="8" oninput="this.value=this.value.toUpperCase()" />
        <button onclick="window.runAreaSafetyFromPopup()">Search</button>
      </div>
      <div id="areaPopupResults"></div>
    `;
    // Focus input
    setTimeout(() => document.getElementById('areaPopupPostcode')?.focus(), 100);
  }

  // Header button opens popup
  headerBtn?.addEventListener('click', function (e) {
    e.stopPropagation();
    openAreaPopup();
  });

  // Subscribe button — opens YouTube + unlocks
  document.getElementById('areaPopupSubscribe')?.addEventListener('click', function () {
    window.open('https://www.youtube.com/@ScamShieldUK?sub_confirmation=1', '_blank', 'noopener');
    try { localStorage.setItem(AS_KEY, '1'); } catch (e) {}
    showUnlockedState();
  });

  // Verify button — triggers Google OAuth verification (uses existing verifySubscription)
  document.getElementById('areaPopupVerify')?.addEventListener('click', function () {
    if (typeof verifySubscription === 'function') {
      verifySubscription();
    } else {
      // Fallback: just unlock
      try { localStorage.setItem(AS_KEY, '1'); } catch (e) {}
      showUnlockedState();
    }
  });

  // Close on overlay click
  popup?.addEventListener('click', function (e) {
    if (e.target === popup) closeAreaPopup();
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAreaPopup();
  });

  // Bridge to existing runAreaSafety from popup
  window.runAreaSafetyFromPopup = function () {
    const input = document.getElementById('areaPopupPostcode');
    const pc = input?.value?.trim();
    if (!pc) return;
    // Use existing postcode modal if available
    const asInput = document.getElementById('asPostcodeInput');
    if (asInput && typeof runAreaSafety === 'function') {
      asInput.value = pc;
      closeAreaPopup();
      showPostcodeModal();
      runAreaSafety();
    }
  };

  // Update header button text if already unlocked
  if (isUnlocked() && headerBtn) {
    headerBtn.textContent = '🔓 Area Safety Check';
  }
})();
