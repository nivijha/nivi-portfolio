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

  /* Timeline scroll animation */
  document.querySelectorAll(".career-timeline").forEach((timeline) => {
    const progress = timeline.querySelector(".timeline-progress");
    const dot = timeline.querySelector(".timeline-active-dot");

    if (!progress || !dot) return;

    const onScroll = () => {
      const rect = timeline.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const start = windowHeight * 0.3;
      const end = rect.height + windowHeight * 0.3;

      const progressRaw = (start - rect.top) / end;
      const progressClamped = Math.min(Math.max(progressRaw, 0), 1);

      const percent = progressClamped * 100;

      progress.style.height = `${percent}%`;
      dot.style.transform = `translateY(${rect.height * progressClamped}px)`;
    };

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    onScroll();
  });
};
