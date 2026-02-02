// Terminal Typing
const commandText = "stack --list";
const outputLines = [
  "<span class='terminal-section'>Languages</span>",
  "  C, C++, Java, Python, JavaScript",
  "",
  "<span class='terminal-section'>Frontend</span>",
  "  React, Next.js, HTML, CSS, Bootstrap",
  "",
  "<span class='terminal-section'>Backend & Database</span>",
  "  Node.js, Express, MongoDB, MySQL",
  "",
  "<span class='terminal-section'>Tools</span>",
  "  Git, GitHub, Linux, Docker, AWS",
];

const typedCommand = document.getElementById("typed-command");
const output = document.getElementById("terminal-output");
const nextPrompt = document.getElementById("next-prompt");

let charIndex = 0;
let lineIndex = 0;

function typeCommand() {
  if (charIndex < commandText.length) {
    typedCommand.textContent += commandText.charAt(charIndex);
    charIndex++;
    setTimeout(typeCommand, 45);
  } else {
    setTimeout(printOutput, 400);
  }
}

function printOutput() {
  if (lineIndex < outputLines.length) {
    const p = document.createElement("p");
    p.innerHTML = outputLines[lineIndex];
    output.appendChild(p);
    lineIndex++;
    setTimeout(printOutput, 120);
  } else {
    setTimeout(() => {
      const caret = document.getElementById("caret");
      if (caret) caret.style.display = "none";

      nextPrompt.style.display = "block";
    }, 400);
  }
}

window.addEventListener("load", () => {
  setTimeout(typeCommand, 500);
});

// Terminal Last Login
function formatDate(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const d = days[date.getDay()];
  const m = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");

  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${d} ${m} ${day} ${h}:${min}:${s}`;
}

const lastLoginEl = document.getElementById("last-login");
const previousLogin = localStorage.getItem("lastLogin");

if (previousLogin) {
  lastLoginEl.textContent = `Last login: ${previousLogin} on ttys001`;
} else {
  lastLoginEl.style.display = "none";
}

// store current login for next visit
const now = new Date();
localStorage.setItem("lastLogin", formatDate(now));

const projectButtons = document.querySelectorAll(".projects-index button");
const projectCards = document.querySelectorAll(".project-card");

projectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;

    projectCards.forEach((card) => {
      if (card.id === targetId) {
        card.classList.toggle("active");
      } else {
        card.classList.remove("active");
      }
    });
  });
});
