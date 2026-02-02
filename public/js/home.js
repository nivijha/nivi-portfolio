// SUBTITLE TYPING EFFECT
const words = [
  "Full Stack Developer",
  "Competitive Programmer",
  "Developer who ships.",
];

let i = 0,
  j = 0,
  isDeleting = false;
const typingSpeed = 90;
const deletingSpeed = 50;
const pause = 1200;

const el = document.getElementById("typing-text");
if (el) {
  function type() {
    const current = words[i];
    if (!isDeleting) {
      el.textContent = current.slice(0, j++);
      if (j === current.length) {
        setTimeout(() => (isDeleting = true), pause);
      }
    } else {
      el.textContent = current.slice(0, j--);
      if (j === 0) {
        isDeleting = false;
        i = (i + 1) % words.length;
      }
    }
    setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
  }

  type();
}

// Glitch Typing
const nameEl = document.getElementById("glitch-name");

const leftText = "I'm Ni";
const rightText = "vi Jha";
const finalText = leftText + rightText;

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_<>/\\!@#$%^&*():";

let leftFrame = 0;
let rightFrame = rightText.length - 1;

let tick = 0;

const interval = setInterval(() => {
  tick++;

  if (leftFrame <= leftText.length) {
    leftFrame++;
  }

  if (tick % 2 === 0 && rightFrame >= 0) {
    rightFrame--;
  }

  const leftPart = leftText
    .split("")
    .map((char, i) =>
      i < leftFrame
        ? `<span class="glitch-final">${char}</span>`
        : `<span class="glitch-scramble">${chars[Math.floor(Math.random() * chars.length)]}</span>`,
    )
    .join("");

  const rightPart = rightText
    .split("")
    .map((char, i) =>
      i > rightFrame
        ? `<span class="glitch-final">${char}</span>`
        : `<span class="glitch-scramble">${chars[Math.floor(Math.random() * chars.length)]}</span>`,
    )
    .join("");

  nameEl.innerHTML = leftPart + rightPart;

  if (leftFrame > leftText.length && rightFrame < 0) {
    clearInterval(interval);
    nameEl.innerHTML = finalText
      .split("")
      .map((c) => `<span class="glitch-final">${c}</span>`)
      .join("");
  }
}, 70);