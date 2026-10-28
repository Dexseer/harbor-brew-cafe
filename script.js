(() => {
  const cfg = window.CAFE_CONFIG || {};

  const $ = (selector) => document.querySelector(selector);
  const reduceMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  // One controlled scroll animation avoids competing browser and JavaScript scrolling.
  let scrollFrame = 0;
  let scrollToken = 0;
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function scrollToTarget(target) {
    if (!target) return;
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    const token = ++scrollToken;
    const header = $(".site-header");
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const startY = window.scrollY || window.pageYOffset;
    const targetY = Math.max(0, startY + target.getBoundingClientRect().top - headerHeight - 12);
    const distance = targetY - startY;

    if (reduceMotionQuery?.matches || Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      return;
    }

    const duration = Math.min(1050, Math.max(450, Math.abs(distance) * 0.45));
    let startTime = null;
    const step = (timestamp) => {
      if (token !== scrollToken) return;
      if (startTime === null) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) {
        scrollFrame = requestAnimationFrame(step);
      } else {
        scrollFrame = 0;
      }
    };
    scrollFrame = requestAnimationFrame(step);
  }

  // Stop the animation if the visitor takes control of scrolling.
  const cancelScrollOnInput = () => {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    scrollToken++;
  };
  ["wheel", "touchstart", "pointerdown"].forEach(type => {
    window.addEventListener(type, cancelScrollOnInput, { passive: true });
  });
  window.addEventListener("keydown", event => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
      cancelScrollOnInput();
    }
  });

  // Smoothly scroll every same-page section link (navigation, CTA links, footer links).
  // External links, email/phone links, and buttons that perform actions are left alone.
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;
    const rawHref = link.getAttribute("href");
    if (!rawHref || !rawHref.startsWith("#") || rawHref === "#") return;
    let target;
    try { target = document.querySelector(rawHref); } catch (_) { return; }
    if (!target) return;
    event.preventDefault();
    if (window.location.hash !== rawHref) window.history.pushState(null, "", rawHref);
    scrollToTarget(target);
  });

  window.addEventListener("popstate", () => {
    let target = $("#home");
    if (window.location.hash) {
      try { target = $(decodeURIComponent(window.location.hash)); } catch (_) { target = null; }
    }
    if (target) scrollToTarget(target);
  });
  const safeText = (value) => String(value ?? "");
  const menuToggle = $(".menu-toggle");
  const nav = $("#primary-nav");

  // Accessible mobile navigation
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      menuToggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("is-open"); menuToggle.setAttribute("aria-expanded", "false"); menuToggle.setAttribute("aria-label", "Open navigation");
    }));
    document.addEventListener("keydown", e => { if (e.key === "Escape") { nav.classList.remove("is-open"); menuToggle.setAttribute("aria-expanded", "false"); } });
  }

  // Scroll reveal: sections and cards ease into view as the visitor scrolls.
  // Elements remain visible if IntersectionObserver is unavailable.
  const reduceMotion = reduceMotionQuery?.matches ?? false;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealTargets = document.querySelectorAll(
      ".story .section-kicker, .story-layout, .story-image-caption, .menu-section .section-kicker, .section-heading, .menu-card, .visit .section-kicker, .visit-layout, .contact-section .section-kicker, .contact-layout, .quote-band > *"
    );
    revealTargets.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");
      if (element.classList.contains("menu-card")) {
        element.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);
      }
    });
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(element => revealObserver.observe(element));
  }

  // Editable menu data comes from config.js
  const menuGrid = $("#menu-grid");
  if (menuGrid && Array.isArray(cfg.menu)) {
    menuGrid.replaceChildren();
    cfg.menu.forEach(item => {
      const card = document.createElement("article"); card.className = "menu-card";
      const photo = document.createElement("div"); photo.className = "menu-photo"; photo.setAttribute("role", "img"); photo.setAttribute("aria-label", `${safeText(item.name)} product photo`);
      if (item.photo) photo.style.backgroundImage = `url("https://images.unsplash.com/${encodeURIComponent(item.photo)}?auto=format&fit=crop&w=900&q=80")`;
      const info = document.createElement("div"); info.className = "menu-card-info";
      const copy = document.createElement("div"); const title = document.createElement("h3"); title.textContent = safeText(item.name);
      const desc = document.createElement("p"); desc.textContent = safeText(item.description); copy.append(title, desc);
      const price = document.createElement("span"); price.textContent = safeText(item.price); info.append(copy, price); card.append(photo, info);
      if (item.tag) { const tag = document.createElement("div"); tag.className = "menu-tag"; tag.textContent = safeText(item.tag); card.append(tag); }
      menuGrid.append(card);
    });
  }

  const address = safeText(cfg.address).trim();
  const addressEl = $("#business-address");
  if (address && addressEl) addressEl.textContent = address;
  const directions = $("#directions-link");
  const mapsTarget = safeText(cfg.mapsQuery || cfg.address).trim();
  if (directions && mapsTarget) { directions.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsTarget)}`; directions.hidden = false; directions.target = "_blank"; directions.rel = "noopener noreferrer"; }

  const hoursEl = $("#business-hours");
  if (hoursEl && Array.isArray(cfg.hours)) {
    const populated = cfg.hours.filter(h => safeText(h.time).trim());
    hoursEl.replaceChildren();
    if (!populated.length) hoursEl.textContent = "Opening hours to be confirmed";
    else populated.forEach((h, i) => { if (i) hoursEl.append(document.createElement("br")); hoursEl.append(document.createTextNode(`${safeText(h.day)}: ${safeText(h.time)}`)); });
  }
  const emailLink = $("#email-link");
  if (emailLink) {
    const email = safeText(cfg.email).trim();
    if (email) emailLink.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Inquiry for ${cfg.name || "the café"}`)}`;
    else { emailLink.href = "#contact"; emailLink.textContent = "Send an inquiry ↓"; }
  }
  const messenger = $("#messenger-link");
  if (messenger && /^https:\/\/(m\.me|www\.facebook\.com|facebook\.com)\//i.test(safeText(cfg.messengerUrl))) { messenger.href = cfg.messengerUrl; messenger.hidden = false; messenger.target = "_blank"; messenger.rel = "noopener noreferrer"; }
  const phone = $("#phone-link");
  if (phone && safeText(cfg.phone).trim()) { phone.href = `tel:${safeText(cfg.phone).replace(/[^+\d]/g, "")}`; phone.textContent = `Call ${safeText(cfg.phone)}`; phone.hidden = false; }

  // Contact form: FormSubmit when configured; otherwise open a prefilled email draft.
  const form = $("#contact-form");
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = safeText(data.get("name")).trim(); const email = safeText(data.get("email")).trim(); const message = safeText(data.get("message")).trim();
    const status = $("#form-status");
    if (safeText(cfg.formSubmitEmail).trim()) {
      status.textContent = "Sending your inquiry…";
      try {
        const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cfg.formSubmitEmail.trim())}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name, email, message, _subject: `Website inquiry for ${cfg.name || "café"}`, _captcha: "true" }) });
        if (!response.ok) throw new Error("Submission failed");
        status.textContent = "Inquiry submitted. If this is the first submission, the inbox owner may need to confirm FormSubmit activation."; form.reset();
      } catch (_) { status.textContent = "We couldn't submit the form. Please email or message the café directly."; }
    } else {
      if (!safeText(cfg.email).trim()) { status.textContent = "Demo mode: configure the café's real email in config.js before using this form with customers."; return; }
      const subject = `Website inquiry for ${cfg.name || "café"}`;
      const body = `Name: ${name}\nReply email: ${email}\n\nMessage:\n${message}`;
      window.location.href = `mailto:${encodeURIComponent(cfg.email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = "Your email app should open with the inquiry prepared. If it doesn't, configure FormSubmit in config.js.";
    }
  });
})();
