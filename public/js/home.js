/* ============================= */
/* GLOBAL HERO ANIMATION HANDLE */
/* ============================= */
let heroAnimationId = null;

window.initHomePage = function () {
  /* ============================= */
  /* SUBTITLE TYPING EFFECT       */
  /* ============================= */

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

  /* ============================= */
  /* GLITCH NAME EFFECT           */
  /* ============================= */

  const nameEl = document.getElementById("glitch-name");

  if (nameEl) {
    const leftText = "I'm Ni";
    const rightText = "vi Jha";
    const finalText = leftText + rightText;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_<>/\\!@#$%^&*():";

    let leftFrame = 0;
    let rightFrame = rightText.length - 1;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;

      if (leftFrame <= leftText.length) leftFrame++;
      if (tick % 2 === 0 && rightFrame >= 0) rightFrame--;

      const leftPart = leftText
        .split("")
        .map((char, idx) =>
          idx < leftFrame
            ? `<span class="glitch-final">${char}</span>`
            : `<span class="glitch-scramble">${chars[Math.floor(Math.random() * chars.length)]}</span>`,
        )
        .join("");

      const rightPart = rightText
        .split("")
        .map((char, idx) =>
          idx > rightFrame
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
  }

  /* ============================= */
  /* CANVAS NETWORK SYSTEM        */
  /* ============================= */

  const canvas = document.getElementById("network-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let particles = [];
  let mouse = { x: null, y: null };

  /* ---------- PARALLAX SYSTEM ---------- */
  let parallax = { x: 0, y: 0 };
  let targetParallax = { x: 0, y: 0 };

  /* ---------- RESIZE ---------- */
  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  /* ---------- PARTICLE CLASS ---------- */
  class Particle {
    constructor(layer) {
      this.layer = layer;

      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;

      const speed = layer === 1 ? 0.08 : layer === 2 ? 0.15 : 0.25;

      this.vx = (Math.random() - 0.5) * speed;
      this.vy = (Math.random() - 0.5) * speed;

      this.radius = layer === 3 ? 2.2 : 1.8;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

      // Cursor field interaction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const maxDist = 180;

        if (dist < maxDist && dist > 0) {
          const force = (maxDist - dist) / maxDist;

          const strength = 0.9; 

          const angle = Math.atan2(dy, dx);

          this.x += Math.cos(angle) * force * strength;
          this.y += Math.sin(angle) * force * strength;
        }
      }
    }

    draw(color) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  /* ---------- INIT ---------- */
  function init() {
    particles = [];

    const baseCount = window.innerWidth < 768 ? 40 : 90;

    for (let i = 0; i < baseCount; i++) {
      const layer = i < baseCount * 0.4 ? 1 : i < baseCount * 0.75 ? 2 : 3;

      particles.push(new Particle(layer));
    }
  }

  /* ---------- FROST COLORS ---------- */
  function getThemeColors() {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      return {
        isDark,
        particleRGB: { r: 190, g: 210, b: 255 },
        lineRGB: { r: 160, g: 190, b: 255 },
      };
    } else {
      return {
        isDark,
        particleRGB: { r: 90, g: 110, b: 140 },
        lineRGB: { r: 120, g: 140, b: 170 },
      };
    }
  }

  /* ---------- CONNECTIONS ---------- */
  function connect(theme) {
    const maxDist = 140;

    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDist * maxDist) {
          const dist = Math.sqrt(distSq);
          const fade = 1 - dist / maxDist;

          const alpha = theme.isDark ? 0.18 * fade + 0.05 : 0.25 * fade + 0.08;

          ctx.strokeStyle = `rgba(${theme.lineRGB.r}, ${theme.lineRGB.g}, ${theme.lineRGB.b}, ${alpha})`;
          ctx.lineWidth = 0.8;

          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  }

  /* ---------- ANIMATE ---------- */
  function animate() {
    const theme = getThemeColors();

    // Smooth parallax easing
    parallax.x += (targetParallax.x - parallax.x) * 0.05;
    parallax.y += (targetParallax.y - parallax.y) * 0.05;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(parallax.x, parallax.y);

    // Glow
    ctx.shadowBlur = theme.isDark ? 8 : 4;
    ctx.shadowColor = `rgba(${theme.lineRGB.r}, ${theme.lineRGB.g}, ${theme.lineRGB.b}, 0.25)`;

    // Update once
    particles.forEach((p) => p.update());

    // Blur depth layer
    ctx.save();
    ctx.filter = "blur(1px)";
    particles.forEach((p) => {
      p.draw(
        `rgba(${theme.particleRGB.r}, ${theme.particleRGB.g}, ${theme.particleRGB.b}, 0.6)`,
      );
    });
    ctx.restore();

    // Sharp layer
    particles.forEach((p) => {
      p.draw(
        `rgba(${theme.particleRGB.r}, ${theme.particleRGB.g}, ${theme.particleRGB.b}, 0.7)`,
      );
    });

    connect(theme);

    ctx.restore();

    heroAnimationId = requestAnimationFrame(animate);
  }

  /* ---------- MOUSE ---------- */
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    const offsetX = (mouse.x - centerX) / centerX;
    const offsetY = (mouse.y - centerY) / centerY;

    targetParallax.x = offsetX * 12; // drift strength
    targetParallax.y = offsetY * 12;
  });

  canvas.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
    targetParallax.x = 0;
    targetParallax.y = 0;
  });

  /* ---------- SPA SAFE ---------- */
  if (heroAnimationId) {
    cancelAnimationFrame(heroAnimationId);
  }

  requestAnimationFrame(() => {
    resizeCanvas();
    init();
    animate();
  });
};
