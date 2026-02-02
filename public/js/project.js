// Project Terminal Show Cards
const buttons = document.querySelectorAll(".projects-index button");
const cards = document.querySelectorAll(".project-card");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;

    // hide all cards
    cards.forEach((card) => card.classList.remove("active"));

    // show selected
    const activeCard = document.getElementById(targetId);
    if (activeCard) {
      activeCard.classList.add("active");
      activeCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
