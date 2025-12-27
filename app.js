/* =========================================================
   app.js (FINAL)
   - Mobile menu (toggle + outside click)
   - Smooth scroll for in-page links
   - Active nav highlight (FIXED: none highlighted at top)
   - Back to top button
   - Contact form via FormSubmit (AJAX + inline toast + loading state)
   - Hero rotating word
========================================================= */

(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  /* =========================
     Mobile menu
  ========================= */
  const toggle = qs(".nav__toggle");
  const menu = qs(".nav__menu");
  const links = qsa(".nav__link");

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  }

  toggle?.addEventListener("click", () => {
    if (!menu) return;
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.forEach((a) =>
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 980px)").matches) closeMenu();
    })
  );

  document.addEventListener("click", (e) => {
    if (!menu || !toggle) return;
    if (!menu.classList.contains("open")) return;
    const inside = menu.contains(e.target) || toggle.contains(e.target);
    if (!inside) closeMenu();
  });

  /* =========================
     Smooth scroll
  ========================= */
  const navLinks = links.filter((a) => (a.getAttribute("href") || "").startsWith("#"));

  navLinks.forEach((a) => {
    const href = a.getAttribute("href");
    a.addEventListener("click", (e) => {
      const target = qs(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const TOP_CLEAR_PX = 140; // tweak if needed (bigger = clears highlight longer)

  const pickByScroll = () => {
    if (window.scrollY <= TOP_CLEAR_PX) {
      clearActive(); // ✅ nothing highlighted on top
      return;
    }
    const y = window.scrollY + 160; // bias for fixed navbar
    let current = "";

    for (const sec of sections) {
      if (sec.offsetTop <= y) current = sec.id;
    }
    if (current) setActive(current);
  };

  // Observer: tracks the most “visible” section, but still respects top-clear rule
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
     Back to top
  ========================= */
  const toTop = qs(".toTop");

  const toggleTop = () => {
    if (!toTop) return;
    toTop.classList.toggle("show", window.scrollY > 700);
  };

  window.addEventListener("scroll", toggleTop, { passive: true });
  toggleTop();

 toTop?.addEventListener("click", (e) => {
  e.preventDefault(); // ✅ prevents instant jump if it's an <a href="#top">
  closeMenu?.();

  window.scrollTo({ top: 0, behavior: "smooth" });

  // clear highlight after the scroll starts
  setTimeout(() => clearActive?.(), 350);
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
      } catch (err) {
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
