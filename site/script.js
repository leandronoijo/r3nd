(function () {
  const progressBar = document.getElementById("page-progress-bar");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const revealItems = document.querySelectorAll(".reveal");
  const snippetButtons = document.querySelectorAll("[data-snippet-target]");
  const snippetPanels = document.querySelectorAll("[data-snippet-panel]");
  const yearTargets = document.querySelectorAll("[data-current-year]");

  function setProgress() {
    if (!progressBar) {
      return;
    }

    const scrollTop = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
    progressBar.style.width = percent + "%";
  }

  function setYear() {
    const year = String(new Date().getFullYear());
    yearTargets.forEach((node) => {
      node.textContent = year;
    });
  }

  function bindNav() {
    if (!navToggle || !nav) {
      return;
    }

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function bindSnippets() {
    if (!snippetButtons.length || !snippetPanels.length) {
      return;
    }

    snippetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-snippet-target");

        snippetButtons.forEach((candidate) => {
          const active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-selected", String(active));
        });

        snippetPanels.forEach((panel) => {
          const active = panel.getAttribute("data-snippet-panel") === target;
          panel.classList.toggle("is-active", active);
          panel.hidden = !active;
        });
      });
    });
  }

  function bindReveal() {
    if (!revealItems.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  setYear();
  setProgress();
  bindNav();
  bindSnippets();
  bindReveal();

  window.addEventListener("scroll", setProgress, { passive: true });
  window.addEventListener("resize", setProgress);
})();
