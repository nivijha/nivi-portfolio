window.initSkillsPage = function () {
  const palette = document.querySelector(".command-palette");

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        palette.classList.add("visible");
        observer.disconnect();
      }
    },
    { threshold: 0.3 },
  );

  if (palette) observer.observe(palette);
};
