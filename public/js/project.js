window.initProjectsPage = function () {
  const cards = document.querySelectorAll("[data-card]");
  if (!cards.length) return;

  // Sequential reveal on scroll
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const index = Array.from(cards).indexOf(card);
          setTimeout(() => {
            card.classList.add("revealed");
          }, index * 100);
          revealObserver.unobserve(card);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  cards.forEach((card) => revealObserver.observe(card));

  // Expand / collapse
  function toggleCard(card) {
    const isExpanded = card.classList.contains("is-expanded");
    const toggle = card.querySelector(".project-card-toggle");

    // Close others
    cards.forEach((c) => {
      if (c !== card && c.classList.contains("is-expanded")) {
        c.classList.remove("is-expanded");
        const t = c.querySelector(".project-card-toggle");
        if (t) t.setAttribute("aria-expanded", "false");
      }
    });

    card.classList.toggle("is-expanded", !isExpanded);
    if (toggle) toggle.setAttribute("aria-expanded", String(!isExpanded));
  }

  cards.forEach((card) => {
    const toggle = card.querySelector(".project-card-toggle");

    // Click on toggle button
    if (toggle) {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleCard(card);
      });
    }

    // Desktop: hover expand
    let hoverTimeout;
    card.addEventListener("mouseenter", () => {
      if (window.innerWidth <= 768) return;
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        if (!card.classList.contains("is-expanded")) {
          toggleCard(card);
        }
      }, 200);
    });

    card.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimeout);
    });

    // Mobile: tap to expand
    card.addEventListener("click", (e) => {
      if (window.innerWidth > 768) return;
      // Don't double-fire if toggle was clicked
      if (e.target.closest(".project-card-toggle")) return;
      // Don't expand when clicking links
      if (e.target.closest("a")) return;
      toggleCard(card);
    });
  });
};
