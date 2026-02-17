window.initProjectsPage = function () {
  document.querySelectorAll(".project-item").forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;

      document
        .querySelectorAll(".project-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      document
        .querySelectorAll(".project-card")
        .forEach((card) => card.classList.remove("active"));

      document.getElementById(target).classList.add("active");
    });
  });

  document.querySelectorAll(".project-image").forEach((container) => {
    const video = container.querySelector(".project-video");
    if (!video) return;

    container.addEventListener("mouseenter", () => {
      video.play();
    });

    container.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
  });
};
