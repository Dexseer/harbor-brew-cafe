
(() => {
  "use strict";

  // ==========================================
  // HARBOR BREW CAFE - COMPLETE WEBSITE SCRIPT
  // ==========================================

  const cfg = window.CAFE_CONFIG || {};

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const safeText = (value) => String(value ?? "");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // ==========================================
  // 1. EXTRA-SMOOTH SCROLLING
  // ==========================================

  let scrollAnimationFrame = null;
  let cancelScroll = false;

  function smoothScrollTo(target, updateHash = true) {
    if (!target) return;

    // Respect accessibility preferences.
    if (reduceMotion.matches) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    // Stop any previous scrolling animation.
    if (scrollAnimationFrame !== null) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }

    cancelScroll = false;

    const header = $(".site-header");
    const headerHeight = header
      ? header.getBoundingClientRect().height
      : 0;

    const targetTop =
      window.scrollY +
      target.getBoundingClientRect().top -
      headerHeight -
      16;

    const startY = window.scrollY;
    const distance = targetTop - startY;

    // Avoid unnecessary animation for tiny movements.
    if (Math.abs(distance) < 3) {
      window.scrollTo(0, targetTop);
      return;
    }

    // Long journeys take longer, but never feel excessively slow.
    const duration = Math.min(
      1400,
      Math.max(550, Math.abs(distance) * 0.55)
    );

    let startTime = null;

    function animateScroll(time) {
      if (cancelScroll) {
        scrollAnimationFrame = null;
        return;
      }

      if (startTime === null) startTime = time;

      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-in-out curve.
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(
        0,
        startY + distance * eased
      );

      if (progress < 1) {
        scrollAnimationFrame =
          requestAnimationFrame(animateScroll);
      } else {
        scrollAnimationFrame = null;

        if (updateHash && target.id) {
          const newHash = "#" + encodeURIComponent(target.id);

          if (window.location.hash !== newHash) {
            history.pushState(null, "", newHash);
          }
        }
      }
    }

    scrollAnimationFrame = requestAnimationFrame(animateScroll);
  }

  // Cancel the animation if the visitor manually takes control.
  function stopSmoothScroll() {
    if (scrollAnimationFrame !== null) {
      cancelScroll = true;
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }
  }

  window.addEventListener("wheel", stopSmoothScroll, {
    passive: true
  });

  window.addEventListener("touchstart", stopSmoothScroll, {
    passive: true
  });

  window.addEventListener("keydown", (event) => {
    const scrollingKeys = [
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
      " "
    ];

    if (scrollingKeys.includes(event.key)) {
      const tag = event.target.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        event.target.isContentEditable;

      if (!isTyping) stopSmoothScroll();
    }
  });

  // Handle internal section links across the entire website.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");

    if (!link) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;

    // Keep open-in-new-tab and modifier-click behavior working.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    if (link.target && link.target !== "_self") return;

    const href = link.getAttribute("href");

    if (!href || !href.startsWith("#") || href === "#") {
      return;
    }

    let id;

    try {
      id = decodeURIComponent(href.slice(1));
    } catch {
      id = href.slice(1);
    }

    const target = document.getElementById(id);

    if (!target) return;

    event.preventDefault();

    // Close the mobile menu after selecting a section.
    closeMobileMenu();

    smoothScrollTo(target, true);
  });

  // Keep browser Back and Forward navigation working.
  window.addEventListener("popstate", () => {
    const id = decodeURIComponent(
      window.location.hash.slice(1)
    );

    const target = id
      ? document.getElementById(id)
      : null;

    if (target) {
      smoothScrollTo(target, false);
    } else if (!window.location.hash) {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    }
  });

  // ==========================================
  // 2. MOBILE NAVIGATION MENU
  // ==========================================

  const menuToggle = $(".menu-toggle");
  const nav = $("#primary-nav");

  function closeMobileMenu() {
    if (!menuToggle || !nav) return;

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("is-open");
  }

  function openMobileMenu() {
    if (!menuToggle || !nav) return;

    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation");
    nav.classList.add("is-open");
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen =
        menuToggle.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMobileMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    });

    // Reset mobile navigation when returning to desktop width.
    window.addEventListener("resize", () => {
      if (window.innerWidth > 650) {
        closeMobileMenu();
      }
    });
  }

  // ==========================================
  // 3. REVEAL ANIMATIONS WHILE SCROLLING
  // ==========================================

  const revealSelectors = [
    ".story .section-kicker",
    ".story-layout",
    ".story-image",
    ".story-image-caption",
    ".menu-section .section-kicker",
    ".section-heading",
    ".menu-card",
    ".visit .section-kicker",
    ".visit-layout",
    ".contact-section .section-kicker",
    ".contact-layout",
    ".quote-band > *"
  ].join(", ");

  const revealTargets = $$(revealSelectors);

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => {
      element.classList.add("is-visible");
    });
  } else {
    revealTargets.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");

      if (element.classList.contains("menu-card")) {
        element.style.setProperty(
          "--reveal-delay",
          `${(index % 3) * 100}ms`
        );
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -35px 0px"
      }
    );

    revealTargets.forEach((element) => {
      revealObserver.observe(element);
    });
  }

  // ==========================================
  // 4. RENDER EDITABLE MENU FROM CONFIG.JS
  // ==========================================

  const menuGrid = $("#menu-grid");

  if (menuGrid && Array.isArray(cfg.menu)) {
    menuGrid.replaceChildren();

    cfg.menu.forEach((item) => {
      const card = document.createElement("article");
      card.className = "menu-card";

      const photo = document.createElement("div");
      photo.className = "menu-photo";
      photo.setAttribute("role", "img");
      photo.setAttribute(
        "aria-label",
        `${safeText(item.name)} product photo`
      );

      if (item.photo) {
        photo.style.backgroundImage =
          `url("https://images.unsplash.com/${encodeURIComponent(
            item.photo
          )}?auto=format&fit=crop&w=900&q=80")`;
      }

      const info = document.createElement("div");
      info.className = "menu-card-info";

      const copy = document.createElement("div");

      const title = document.createElement("h3");
      title.textContent = safeText(item.name);

      const description = document.createElement("p");
      description.textContent = safeText(item.description);

      copy.append(title, description);

      const price = document.createElement("span");
      price.textContent = safeText(item.price);

      info.append(copy, price);
      card.append(photo, info);

      if (item.tag) {
        const tag = document.createElement("div");
        tag.className = "menu-tag";
        tag.textContent = safeText(item.tag);
        card.append(tag);
      }

      menuGrid.append(card);
    });
  }

  // ==========================================
  // 5. ADDRESS AND GOOGLE MAPS DIRECTIONS
  // ==========================================

  const address = safeText(cfg.address).trim();
  const addressElement = $("#business-address");

  if (address && addressElement) {
    addressElement.textContent = address;
  }

  const directionsLink = $("#directions-link");
  const mapsTarget = safeText(
    cfg.mapsQuery || cfg.address
  ).trim();

  if (directionsLink && mapsTarget) {
    directionsLink.href =
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(mapsTarget);

    directionsLink.hidden = false;
    directionsLink.target = "_blank";
    directionsLink.rel = "noopener noreferrer";
  }

  // ==========================================
  // 6. BUSINESS OPENING HOURS
  // ==========================================

  const hoursElement = $("#business-hours");

  if (hoursElement && Array.isArray(cfg.hours)) {
    const populatedHours = cfg.hours.filter((hour) =>
      safeText(hour.time).trim()
    );

    hoursElement.replaceChildren();

    if (!populatedHours.length) {
      hoursElement.textContent =
        "Opening hours to be confirmed";
    } else {
      populatedHours.forEach((hour, index) => {
        if (index > 0) {
          hoursElement.append(document.createElement("br"));
        }

        hoursElement.append(
          document.createTextNode(
            `${safeText(hour.day)}: ${safeText(hour.time)}`
          )
        );
      });
    }
  }

  // ==========================================
  // 7. EMAIL, MESSENGER AND PHONE LINKS
  // ==========================================

  const emailLink = $("#email-link");
  const email = safeText(cfg.email).trim();
  const cafeName = safeText(cfg.name || "the café");

  if (emailLink) {
    if (email) {
      emailLink.href =
        `mailto:${email}?subject=${encodeURIComponent(
          `Inquiry for ${cafeName}`
        )}`;
    } else {
      emailLink.href = "#contact";
      emailLink.textContent = "Send an inquiry ↓";
    }
  }

  const messengerLink = $("#messenger-link");
  const messengerUrl = safeText(cfg.messengerUrl);

  if (
    messengerLink &&
    /^https:\/\/(m\.me|www\.facebook\.com|facebook\.com)\//i.test(
      messengerUrl
    )
  ) {
    messengerLink.href = messengerUrl;
    messengerLink.hidden = false;
    messengerLink.target = "_blank";
    messengerLink.rel = "noopener noreferrer";
  }

  const phoneLink = $("#phone-link");
  const phone = safeText(cfg.phone).trim();

  if (phoneLink && phone) {
    phoneLink.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    phoneLink.textContent = `Call ${phone}`;
    phoneLink.hidden = false;
  }

  // ==========================================
  // 8. CONTACT FORM
  // ==========================================

  const form = $("#contact-form");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const data = new FormData(form);

      const name = safeText(data.get("name")).trim();
      const senderEmail = safeText(data.get("email")).trim();
      const message = safeText(data.get("message")).trim();

      const status = $("#form-status");

      if (!status) return;

      // Use FormSubmit if a destination email is configured.
      if (safeText(cfg.formSubmitEmail).trim()) {
        status.textContent = "Sending your inquiry…";

        const submitButton = $('button[type="submit"]', form);

        if (submitButton) submitButton.disabled = true;

        try {
          const response = await fetch(
            `https://formsubmit.co/ajax/${encodeURIComponent(
              cfg.formSubmitEmail.trim()
            )}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
              },
              body: JSON.stringify({
                name,
                email: senderEmail,
                message,
                _subject: `Website inquiry for ${cafeName}`,
                _captcha: "true"
              })
            }
          );

          if (!response.ok) {
            throw new Error("Form submission failed");
          }

          status.textContent =
            "Your inquiry was submitted. The café inbox may need to confirm FormSubmit activation.";

          form.reset();
        } catch (error) {
          status.textContent =
            "We couldn't submit the form. Please email or message the café directly.";
        } finally {
          if (submitButton) submitButton.disabled = false;
        }

        return;
      }

      // Fallback: open a prefilled email draft.
      if (!email) {
        status.textContent =
          "Demo mode: configure the café's real email in config.js before using this form with customers.";
        return;
      }

      const subject = `Website inquiry for ${cafeName}`;

      const body =
        `Name: ${name}\n` +
        `Reply email: ${senderEmail}\n\n` +
        `Message:\n${message}`;

      status.textContent =
        "Opening your email app with the inquiry prepared…";

      window.location.href =
        `mailto:${email}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
    });
  }

  // ==========================================
  // 9. CURRENT YEAR IN FOOTER, IF AVAILABLE
  // ==========================================

  const yearElement = $("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

})();
