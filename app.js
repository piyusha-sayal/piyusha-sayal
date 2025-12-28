/* =========================================================
   app.js (FINAL)
   - Mobile menu (toggle + outside click + ESC)
   - ✅ Phone: lock background scroll when hamburger is open
   - Smooth scroll for in-page links (offset-aware)
   - Active nav highlight (FIXED: none highlighted at top)
   - Back to top button (supports .toTop OR .back-to-top)
   - Contact form via FormSubmit (AJAX + inline toast + loading state)
   - Hero rotating word
========================================================= */

(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  const isPhone = () => window.matchMedia("(max-width: 980px)").matches;

  /* =========================
     Mobile menu + ✅ body scroll lock on phone
  ========================= */
  const toggle = qs(".nav__toggle");
  const menu = qs("#navMenu") || qs(".nav__menu");
  const links = qsa(".nav__link");
  const nav = qs(".nav");

  // Robust scroll lock (works well on iOS too)
  let __scrollY = 0;
  const lockScroll = () => {
    if (!isPhone()) return;
    __scrollY = window.scrollY || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${__scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  };

  const unlockScroll = () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    if (isPhone()) window.scrollTo(0, __scrollY || 0);
  };

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    unlockScroll();
  }

  function openMenu() {
    if (!menu) return;
    menu.classList.add("open");
    toggle?.setAttribute("aria-expanded", "true");
    lockScroll();
  }

  function toggleMenu() {
    if (!menu || !toggle) return;
    const willOpen = !menu.classList.contains("open");
    willOpen ? openMenu() : closeMenu();
  }

  toggle?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu();
  });

  // close when clicking any link (phone)
  links.forEach((a) =>
    a.addEventListener("click", () => {
      if (isPhone()) closeMenu();
    })
  );

  // close on outside click
  document.addEventListener("click", (e) => {
    if (!menu || !toggle) return;
    if (!menu.classList.contains("open")) return;
    const inside = menu.contains(e.target) || toggle.contains(e.target);
    if (!inside) closeMenu();
  });

  // close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (menu?.classList.contains("open")) closeMenu();
  });

  // if resized to desktop, ensure unlocked + menu closed
  window.addEventListener(
    "resize",
    () => {
      if (!isPhone()) {
        closeMenu();
        unlockScroll();
      }
    },
    { passive: true }
  );

  /* =========================
     Smooth scroll (offset-aware)
  ========================= */
  const navLinks = links.filter((a) => (a.getAttribute("href") || "").startsWith("#"));

  const getNavH = () => {
    // Prefer CSS var if present, otherwise measure actual nav height
    const cssVar = getComputedStyle(document.documentElement).getPropertyValue("--navH").trim();
    const parsed = parseInt(cssVar, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return nav ? Math.round(nav.getBoundingClientRect().height) : 68;
  };

  function smoothScrollToTarget(targetEl) {
    const navH = getNavH();
    const y = targetEl.getBoundingClientRect().top + window.scrollY - navH + 8; // +8 for breathing room
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  navLinks.forEach((a) => {
    const href = a.getAttribute("href");
    a.addEventListener("click", (e) => {
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      smoothScrollToTarget(target);
      history.replaceState(null, "", href);
    });
  });

  /* =========================
     Active nav highlight (none at top)
  ========================= */
  const sections = ["about", "skills", "experience", "education", "projects", "contact"]
    .map((id) => qs(`#${id}`))
    .filter(Boolean);

  const navById = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));

  const clearActive = () => navById.forEach((el) => el.classList.remove("is-active"));

  const setActive = (id) => {
    clearActive();
    if (id && navById.get(id)) navById.get(id).classList.add("is-active");
  };

  // Click: update immediately
  navLinks.forEach((a) => {
    a.addEventListener("click", () => setActive(a.getAttribute("href").slice(1)));
  });

  // Rule: if you're near the very top, nothing is highlighted
  const TOP_CLEAR_PX = 140;

  const pickByScroll = () => {
    if (window.scrollY <= TOP_CLEAR_PX) {
      clearActive();
      return;
    }
    const y = window.scrollY + getNavH() + 80; // bias for fixed navbar
    let current = "";

    for (const sec of sections) {
      if (sec.offsetTop <= y) current = sec.id;
    }
    if (current) setActive(current);
  };

  if (sections.length && navById.size) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (window.scrollY <= TOP_CLEAR_PX) {
          clearActive();
          return;
        }
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActive(best.target.id);
      },
      {
        root: null,
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0.12, 0.2, 0.3, 0.45, 0.6],
      }
    );
    sections.forEach((s) => observer.observe(s));
  }

  pickByScroll();
  window.addEventListener("scroll", pickByScroll, { passive: true });
  window.addEventListener("resize", pickByScroll, { passive: true });

  /* =========================
     Back to top (supports both class names)
  ========================= */
  const toTop = qs(".toTop") || qs(".back-to-top");

  const toggleTop = () => {
    if (!toTop) return;
    const show = window.scrollY > 700;

    // support both styles
    toTop.classList.toggle("show", show);
    toTop.classList.toggle("is-visible", show);
  };

  window.addEventListener("scroll", toggleTop, { passive: true });
  toggleTop();

  toTop?.addEventListener("click", (e) => {
    e.preventDefault();
    closeMenu();

    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => clearActive(), 350);
  });

  /* =========================
     FormSubmit (AJAX)
  ========================= */
  qsa('form[data-ajax="true"]').forEach((form) => {
    const btn = qs('button[type="submit"]', form);
    const toast = qs(".formToast", form);

    const setToast = (text, type) => {
      if (!toast) return;
      toast.className = "formToast" + (type ? ` is-${type}` : "");
      toast.textContent = text || "";
    };

    const setLoading = (isLoading) => {
      if (!btn) return;
      btn.classList.toggle("is-loading", !!isLoading);
      btn.disabled = !!isLoading;
      btn.setAttribute("aria-busy", String(!!isLoading));
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity?.();
        setToast("Please fill all required fields.", "err");
        return;
      }

      setToast("", "");
      setLoading(true);

      try {
        const fd = new FormData(form);
        const res = await fetch(form.action, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          form.reset();
          setToast("Message sent! I’ll get back to you soon.", "ok");
        } else {
          setToast("Something went wrong. Please try again or email me directly.", "err");
        }
      } catch {
        setToast("Network error. Please try again or email me directly.", "err");
      } finally {
        setLoading(false);
      }
    });
  });

  /* =========================
     Hero rotating word
  ========================= */
  const rotateEl = document.getElementById("rotateWord");

  if (rotateEl) {
    const words = ["scalable", "reliable", "robust", "efficient", "modern"];
    let index = 0;
    rotateEl.textContent = words[index];

    setInterval(() => {
      rotateEl
        .animate(
          [
            { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
            { opacity: 0, transform: "translateY(8px)", filter: "blur(2px)" },
          ],
          { duration: 250, easing: "ease" }
        )
        .onfinish = () => {
          index = (index + 1) % words.length;
          rotateEl.textContent = words[index];

          rotateEl.animate(
            [
              { opacity: 0, transform: "translateY(-8px)", filter: "blur(2px)" },
              { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
            ],
            { duration: 320, easing: "cubic-bezier(.2,.9,.2,1)" }
          );
        };
    }, 2200);
  }
})();
