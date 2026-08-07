window.initAboutPage = function () {
  /* Career wrapper reveal */
  const careerWrapper = document.querySelector(".career-wrapper");
  if (careerWrapper) {
    const show = () => {
      careerWrapper.classList.add("visible");
      try {
        io.disconnect();
      } catch (e) {}
    };
    let io;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            careerWrapper.classList.add("visible");
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      io.observe(careerWrapper);
      // Fallback: reveal after a delay even if observer never fires
      setTimeout(show, 1200);
    } else {
      show();
    }
  }

  /* Career tabs */
  const careerTabs = document.querySelector(".career-tabs");
  const tabs = document.querySelectorAll(".career-tab");
  const panels = document.querySelectorAll(".career-tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      if (careerTabs) {
        careerTabs.classList.toggle(
          "is-experience",
          tab.dataset.tab === "experience"
        );
      }
      const target = document.querySelector(
        `[data-panel="${tab.dataset.tab}"]`
      );
      if (target) target.classList.add("active");
    });
  });
};
