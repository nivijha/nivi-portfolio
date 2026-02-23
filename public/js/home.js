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
  /* CANVAS NETWORK SYSTEM (OPTIMIZED) */
  /* ============================= */

  const canvas = document.getElementById("network-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let particles = [];
  let mouse = { x: null, y: null };

  let parallax = { x: 0, y: 0 };
  let targetParallax = { x: 0, y: 0 };

  /* ---------- RESIZE ---------- */
  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  /* ---------- PARTICLE ---------- */
  class Particle {
    constructor(layer) {
      this.layer = layer;

      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;

      const speed = layer === 1 ? 0.06 : layer === 2 ? 0.12 : 0.18;

      this.vx = (Math.random() - 0.5) * speed;
      this.vy = (Math.random() - 0.5) * speed;

      this.radius = layer === 3 ? 2 : 1.6;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

      // Repulsion field (stable)
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distSq = dx * dx + dy * dy;

        const maxDist = 160;
        const maxDistSq = maxDist * maxDist;

        if (distSq < maxDistSq && distSq > 0) {
          const force = 1 - distSq / maxDistSq;
          const strength = 0.18;

          this.x += dx * force * strength;
          this.y += dy * force * strength;
        }
      }

      // damping
      this.vx *= 0.99;
      this.vy *= 0.99;
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

    const baseCount = window.innerWidth < 768 ? 30 : 60;

    for (let i = 0; i < baseCount; i++) {
      const layer = i < baseCount * 0.4 ? 1 : i < baseCount * 0.75 ? 2 : 3;

      particles.push(new Particle(layer));
    }
  }

  /* ---------- COLORS ---------- */
  function getThemeColors() {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      return {
        isDark,
        particleRGB: { r: 170, g: 200, b: 255 },
        lineRGB: { r: 140, g: 180, b: 255 },
      };
    } else {
      return {
        isDark,
        particleRGB: { r: 70, g: 90, b: 120 },
        lineRGB: { r: 100, g: 120, b: 150 },
      };
    }
  }

  /* ---------- CONNECTIONS (NO SQRT) ---------- */
  function connect(theme) {
    const maxDist = 110;
    const maxDistSq = maxDist * maxDist;

    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const fade = 1 - distSq / maxDistSq;
          const alpha = theme.isDark ? 0.22 * fade + 0.06 : 0.28 * fade + 0.08;

          ctx.strokeStyle = `rgba(${theme.lineRGB.r}, ${theme.lineRGB.g}, ${theme.lineRGB.b}, ${alpha})`;
          ctx.lineWidth = theme.isDark ? 0.7 : 0.8;

          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  }

  /* ---------- ANIMATION WITH FPS LIMIT ---------- */
  let lastTime = 0;
  const fps = 45;
  const interval = 1000 / fps;

  function animate(time = 0) {
    const delta = time - lastTime;

    if (delta > interval) {
      lastTime = time;

      const theme = getThemeColors();

      // smooth parallax
      parallax.x += (targetParallax.x - parallax.x) * 0.05;
      parallax.y += (targetParallax.y - parallax.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(parallax.x, parallax.y);

      particles.forEach((p) => p.update());

      particles.forEach((p) => {
        p.draw(
          `rgba(${theme.particleRGB.r}, ${theme.particleRGB.g}, ${theme.particleRGB.b},${
            theme.isDark ? 0.75 : 0.65
          })`,
        );
      });

      connect(theme);

      ctx.restore();
    }

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

    targetParallax.x = offsetX * 10;
    targetParallax.y = offsetY * 10;
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
