window.initAboutPage = function () {
  /* Career wrapper reveal */
  const careerWrapper = document.querySelector(".career-wrapper");
  if (careerWrapper) {
    new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          careerWrapper.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    ).observe(careerWrapper);
  }

  /* Career tabs */
  const tabs = document.querySelectorAll(".career-tab");
  const panels = document.querySelectorAll(".career-tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const target = document.querySelector(
        `[data-panel="${tab.dataset.tab}"]`
      );
      if (target) target.classList.add("active");
    });
  });
};
