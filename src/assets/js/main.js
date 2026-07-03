// Chris Carlson Art: light progressive enhancement. The site works without JS;
// this adds the mobile menu, a scroll-aware header, scroll reveals, and a lightbox.
(function () {
  "use strict";

  /* ---- Mobile navigation ---- */
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Scroll-aware header ---- */
  const header = document.querySelector("[data-header]");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Scroll reveal ---- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px 12% 0px", threshold: 0.01 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---- Contact form: submit via fetch so the visitor stays on the page ---- */
  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    const status = contactForm.querySelector(".form-status");
    const submit = contactForm.querySelector("button[type=submit]");
    const email = "Chris@ChrisCarlsonArt.com";
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const action = contactForm.getAttribute("action") || "";
      // Guard against the un-configured placeholder endpoint.
      if (action.includes("YOUR_FORM_ID") || !action) {
        status.className = "form-status is-error";
        status.textContent = "The form isn't connected yet. Please email me at " + email + ".";
        return;
      }
      const data = new FormData(contactForm);
      submit.disabled = true;
      status.className = "form-status is-sending";
      status.textContent = "Sending…";
      try {
        const res = await fetch(action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          contactForm.reset();
          status.className = "form-status is-success";
          status.textContent = "Thanks! Your message is on its way. I'll get back to you soon.";
        } else {
          const json = await res.json().catch(() => ({}));
          const msg =
            json && json.errors && json.errors.length
              ? json.errors.map((x) => x.message).join(" ")
              : "Something went wrong. Please email me at " + email + ".";
          status.className = "form-status is-error";
          status.textContent = msg;
        }
      } catch (err) {
        status.className = "form-status is-error";
        status.textContent = "Network error. Please email me at " + email + ".";
      } finally {
        submit.disabled = false;
      }
    });
  }

  /* ---- YouTube facades: load the player only when clicked ----
     The thumbnail button is replaced by a bare iframe, so nothing sits on top
     of the player and YouTube's own controls (play/pause/etc.) work normally. */
  document.querySelectorAll(".video-thumb[data-youtube]").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const id = thumb.dataset.youtube;
      const wrap = document.createElement("div");
      wrap.className = "video-thumb video-thumb--playing";
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = thumb.getAttribute("aria-label") || "Video player";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      wrap.appendChild(iframe);
      thumb.replaceWith(wrap);
    });
  });

  /* ---- Lightbox for gallery pieces ---- */
  const pieces = document.querySelectorAll("[data-lightbox]");
  if (pieces.length) {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Artwork viewer");
    box.innerHTML =
      '<button class="lightbox-close" aria-label="Close viewer">&times;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(box);

    const lbImg = box.querySelector("img");
    const lbCap = box.querySelector("figcaption");
    const closeBtn = box.querySelector(".lightbox-close");
    let lastFocused = null;

    const open = (src, alt, caption) => {
      lastFocused = document.activeElement;
      lbImg.src = src;
      lbImg.alt = alt || "";
      lbCap.innerHTML = caption || "";
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };
    const close = () => {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    };

    pieces.forEach((p) => {
      const activate = (e) => {
        e.preventDefault();
        open(p.dataset.full || p.querySelector("img")?.src, p.dataset.alt, p.dataset.caption);
      };
      p.addEventListener("click", activate);
      // Native <button> already fires click on Enter/Space; only role="button" needs this.
      if (p.tagName !== "BUTTON") {
        p.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") activate(e);
        });
      }
    });

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });
  }
})();
