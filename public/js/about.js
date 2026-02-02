// Career Wapper
const careerSection = document.querySelector(".career-wrapper");

if (careerSection) {
  const careerObserver = new IntersectionObserver(
    ([entry], observer) => {
      if (entry.isIntersecting) {
        careerSection.classList.add("visible");
        observer.unobserve(entry.target);
      }
    },
    {
      threshold: 0.25,
    },
  );

  careerObserver.observe(careerSection);
}
