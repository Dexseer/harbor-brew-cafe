(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const cfg = window.CAFE_CONFIG || {};
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loader = $("#loader");

  // Visitors who prefer reduced motion get the plain site: no loader, no effects.
  if (reduce) { if (loader) loader.remove(); return; }
  root.classList.add("js-motion");

  /* ---------- Intro: progress curtain, then staged hero reveal ---------- */
  const startReveal = () => {
    root.classList.add("is-ready");
    setTimeout(() => root.classList.add("intro-done"), 3600);
  };

  if (!loader) {
    root.classList.add("intro-open");
    startReveal();
  } else {
    const countEl = $(".loader-count", loader);
    const nameEl = $(".loader-name", loader);
    if (nameEl && cfg.name) nameEl.textContent = String(cfg.name).toUpperCase();

    let seen = false;
    try { seen = sessionStorage.getItem("hb-intro") === "1"; } catch (_) {}
    const minTime = seen ? 500 : 1600; // repeat visits get a quicker intro

    const pageReady = new Promise(resolve => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    });
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const capped = Promise.race([Promise.all([pageReady, fontsReady]), new Promise(r => setTimeout(r, 3500))]);

    let loaded = false;
    capped.then(() => { loaded = true; });

    const t0 = performance.now();
    let shown = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      loader.style.setProperty("--p", "1");
      if (countEl) countEl.textContent = "100";
      try { sessionStorage.setItem("hb-intro", "1"); } catch (_) {}
      setTimeout(() => {
        loader.classList.add("is-done");
        setTimeout(startReveal, 450);
        setTimeout(() => root.classList.add("intro-open"), 900);
        setTimeout(() => loader.remove(), 1500);
      }, 250);
    };

    const tick = now => {
      if (finished) return;
      const timeP = Math.min(1, (now - t0) / minTime);
      const target = loaded ? timeP : Math.min(timeP, 0.88);
      shown += (target - shown) * 0.18;
      loader.style.setProperty("--p", shown.toFixed(3));
      if (countEl) countEl.textContent = String(Math.round(shown * 100)).padStart(2, "0");
      if (loaded && timeP >= 1 && shown > 0.995) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Heading line reveals + image wipes ---------- */
  const splitTargets = $$("h2, .quote-band p");
  splitTargets.forEach(el => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i).map(s => s.trim());
    el.setAttribute("aria-label", parts.map(p => p.replace(/<[^>]+>/g, "")).join(" ").replace(/\s+/g, " ").trim());
    el.innerHTML = parts.map((p, i) => `<span class="line"><span style="--i:${i}">${p}</span></span>`).join("");
    el.classList.add("split-heading");
  });

  const wipeTargets = $$(".story-image, .visit-image");
  wipeTargets.forEach(el => el.classList.add("img-wipe"));

  // Menu photos get an inner layer so they can zoom inside their frame.
  $$(".menu-photo").forEach(photo => {
    const bg = photo.style.backgroundImage;
    if (!bg) return;
    const inner = document.createElement("div");
    inner.className = "menu-photo-inner";
    inner.style.backgroundImage = bg;
    photo.style.backgroundImage = "none";
    photo.append(inner);
  });

  if ("IntersectionObserver" in window) {
    const reveal = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    [...splitTargets, ...wipeTargets].forEach(el => reveal.observe(el));
  } else {
    [...splitTargets, ...wipeTargets].forEach(el => el.classList.add("is-in"));
  }

  /* ---------- Active nav link (scroll spy) ---------- */
  const links = $$('.nav a[href^="#"]:not(.nav-cta)');
  const byHash = new Map(links.map(a => [a.getAttribute("href"), a]));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(l => { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
        const link = byHash.get("#" + e.target.id);
        if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["#home", "#story", "#menu", "#visit", "#contact"].forEach(h => { const s = $(h); if (s) spy.observe(s); });
  }

  /* ---------- Scroll-linked: progress bar, header, parallax ---------- */
  const header = $(".site-header");
  const bar = $(".scroll-progress");
  const heroImg = $(".hero-image");
  const star = $(".quote-star");
  const quote = $(".quote-band");
  const nav = $("#primary-nav");
  let lastY = window.scrollY || 0;
  let accum = 0;
  let hideLockUntil = 0;
  let ticking = false;

  // Don't hide the header while a nav link is smooth-scrolling.
  document.addEventListener("click", e => {
    if (e.target.closest('a[href^="#"]')) {
      hideLockUntil = performance.now() + 1600;
      if (header) header.classList.remove("is-hidden");
    }
  });

  const update = () => {
    ticking = false;
    const y = window.scrollY || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : "0");

    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      const dy = y - lastY;
      if (Math.sign(dy) !== Math.sign(accum)) accum = 0;
      accum += dy;
      const navOpen = nav && nav.classList.contains("is-open");
      if (performance.now() < hideLockUntil || navOpen || y < 240) header.classList.remove("is-hidden");
      else if (accum > 30) header.classList.add("is-hidden");
      else if (accum < -12) header.classList.remove("is-hidden");
    }
    lastY = y;

    if (heroImg && y < window.innerHeight * 1.3) heroImg.style.setProperty("--py", (y * 0.08).toFixed(1) + "px");
    if (star && quote) {
      const r = quote.getBoundingClientRect();
      star.style.setProperty("--rot", ((r.top / window.innerHeight) * -90).toFixed(1) + "deg");
    }
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
