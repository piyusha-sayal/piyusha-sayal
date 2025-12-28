/* =========================================================
   app.js (MULTI-PAGE FINAL)
   - Mobile menu (toggle + outside click)
   - ✅ Lock background scroll on phone when menu open
   - Smooth scroll for in-page links (index.html#... works without reload on index)
   - Active nav highlight:
       - ✅ index: highlight based on scroll, none at very top
       - ✅ experience.html: experience active
       - ✅ projects.html: projects active
   - Back to top button (smooth)
   - Contact form via FormSubmit (AJAX)
   - Hero rotating word
========================================================= */

(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  const toggle = qs(".nav__toggle");
  const menu = qs(".nav__menu");
  const links = qsa(".nav__link");

  const isMobile = () => window.matchMedia("(max-width: 980px)").matches;

  /* =========================
     ✅ Scroll lock (mobile menu)
  ========================= */
  let lockY = 0;

  function lockScroll() {
    lockY = window.scrollY || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function unlockScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, lockY);
  }

  function openMenu() {
    if (!menu) return;
    menu.classList.add("open");
    toggle?.setAttribute("aria-expanded", "true");
    if (isMobile()) lockScroll();
  }

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    if (isMobile()) unlockScroll();
  }

  toggle?.addEventListener("click", () => {
    if (!menu) return;
    const open = !menu.classList.contains("open");
    open ? openMenu() : closeMenu();
  });

  // close on outside click
  document.addEventListener("click", (e) => {
    if (!menu || !toggle) return;
    if (!menu.classList.contains("open")) return;
    const inside = menu.contains(e.target) || toggle.contains(e.target);
    if (!inside) closeMenu();
  });

  // close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu?.classList.contains("open")) closeMenu();
  });

  /* =========================
     Smooth scroll (index only)
     - Works for href="#x"
     - Works for href="index.html#x" without reloading when already on index
  ========================= */
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const onIndex = page === "index.html" || page === "";

  function smoothToHash(hash) {
    const id = (hash || "").replace("#", "");
    if (!id) return false;
    const target = qs(`#${CSS.escape(id)}`);
    if (!target) return false;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    return true;
  }

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "";

      // on index: intercept both "#x" AND "index.html#x"
      if (onIndex) {
        if (href.startsWith("#")) {
          if (smoothToHash(href)) {
            e.preventDefault();
            if (isMobile()) closeMenu();
          }
          return;
        }
        if (href.startsWith("index.html#")) {
          const hash = "#" + href.split("#")[1];
          if (smoothToHash(hash)) {
            e.preventDefault();
            if (isMobile()) closeMenu();
          }
          return;
        }
      }

      // on other pages: allow normal navigation
      if (isMobile()) closeMenu();
    });
  });

  /* =========================
     Active nav highlight (multi-page)
  ========================= */
  const navEls = qsa(".nav__link[data-nav]");
  const navByKey = new Map(navEls.map((el) => [el.dataset.nav, el]));
  const clearActive = () => navByKey.forEach((el) => el.classList.remove("is-active"));

  const setActive = (key) => {
    clearActive();
    if (key && navByKey.get(key)) navByKey.get(key).classList.add("is-active");
  };

  // ✅ Static highlight for dedicated pages
  if (!onIndex) {
    if (page.includes("experience")) setActive("experience");
    if (page.includes("projects")) setActive("projects");
  }

  // ✅ Scroll-based highlight for index (none at top)
  if (onIndex) {
    const ids = ["about", "skills", "education", "contact"];
    const sections = ids.map((id) => qs(`#${id}`)).filter(Boolean);

    const TOP_CLEAR_PX = 140;

    const pickByScroll = () => {
      if (window.scrollY <= TOP_CLEAR_PX) {
        clearActive();
        return;
      }
      const y = window.scrollY + 160;
      let current = "";
      for (const sec of sections) {
        if (sec.offsetTop <= y) current = sec.id;
      }
      if (current) setActive(current);
    };

    if (sections.length) {
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
        { root: null, rootMargin: "-35% 0px -55% 0px", threshold: [0.12, 0.2, 0.35, 0.55] }
      );

      sections.forEach((s) => observer.observe(s));
    }

    pickByScroll();
    window.addEventListener("scroll", pickByScroll, { passive: true });
    window.addEventListener("resize", pickByScroll, { passive: true });
  }

  /* =========================
     Back to top (smooth)
  ========================= */
  const toTop = qs(".toTop");

  const toggleTop = () => {
    if (!toTop) return;
    toTop.classList.toggle("show", window.scrollY > 700);
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
     (runs only if element exists)
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
