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

  /* ===================================== */
  /* CANVAS NETWORK SYSTEM (ENHANCED)      */
  /* ===================================== */

  const canvas = document.getElementById("network-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let particles = [];
  let mouse = { x: null, y: null };
  let smoothMouse = { x: null, y: null };

  let parallax = { x: 0, y: 0 };
  let targetParallax = { x: 0, y: 0 };

  /* ---------- AMBIENT ORBS ---------- */
  // Three large, slowly drifting glows that breathe in the background
  const orbs = [
    { rx: 0.25, ry: 0.35, phase: 0,      speed: 0.00018, size: 0.38, hue: 220 },
    { rx: 0.72, ry: 0.55, phase: 2.1,    speed: 0.00014, size: 0.32, hue: 260 },
    { rx: 0.50, ry: 0.75, phase: 4.3,    speed: 0.00022, size: 0.28, hue: 200 },
  ];

  /* ---------- RESIZE ---------- */
  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  /* ---------- PARTICLE ---------- */
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.baseX = Math.random() * canvas.width;
      this.baseY = Math.random() * canvas.height;

      this.x = this.baseX;
      this.y = this.baseY;

      // Varied sizes: small background + medium layer
      this.radius = 0.8 + Math.random() * 1.6;
      this.baseRadius = this.radius;

      this.phaseX = Math.random() * Math.PI * 2;
      this.phaseY = Math.random() * Math.PI * 2;

      this.speedX = 0.00045 + Math.random() * 0.00055;
      this.speedY = 0.00045 + Math.random() * 0.00055;

      this.amplitude = 10 + Math.random() * 14;

      // Base opacity varies per particle for depth
      this.baseAlpha = 0.35 + Math.random() * 0.45;
    }

    update(time) {
      const offsetX = Math.sin(time * this.speedX + this.phaseX) * this.amplitude;
      const offsetY = Math.cos(time * this.speedY + this.phaseY) * this.amplitude;

      this.x = this.baseX + offsetX;
      this.y = this.baseY + offsetY;

      // Mouse attraction: particles near cursor drift slightly toward it
      if (smoothMouse.x !== null) {
        const dx = smoothMouse.x - this.x;
        const dy = smoothMouse.y - this.y;
        const distSq = dx * dx + dy * dy;
        const attractRadius = 130;
        if (distSq < attractRadius * attractRadius) {
          const pull = (1 - distSq / (attractRadius * attractRadius)) * 0.018;
          this.x += dx * pull;
          this.y += dy * pull;
        }
      }
    }

    draw(theme, time) {
      let alpha = this.baseAlpha;
      let r = this.radius;

      // Boost particles near mouse: brighter + slightly larger
      if (smoothMouse.x !== null) {
        const dx = this.x - smoothMouse.x;
        const dy = this.y - smoothMouse.y;
        const distSq = dx * dx + dy * dy;
        const boostR = 160;
        if (distSq < boostR * boostR) {
          const t = 1 - distSq / (boostR * boostR);
          alpha = Math.min(1, alpha + t * 0.5);
          r = this.radius + t * 1.2;
        }
      }

      // Subtle breathing glow per particle
      const breathe = 0.5 + 0.5 * Math.sin(time * 0.0008 + this.phaseX);
      const glowAlpha = theme.isDark
        ? alpha * (0.7 + 0.3 * breathe)
        : alpha * (0.55 + 0.2 * breathe);

      // Draw glow halo
      if (r > 1.2) {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 3.5);
        grad.addColorStop(0,   `rgba(${theme.particleRGB.r}, ${theme.particleRGB.g}, ${theme.particleRGB.b}, ${glowAlpha * 0.4})`);
        grad.addColorStop(1,   `rgba(${theme.particleRGB.r}, ${theme.particleRGB.g}, ${theme.particleRGB.b}, 0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${theme.particleRGB.r}, ${theme.particleRGB.g}, ${theme.particleRGB.b}, ${glowAlpha})`;
      ctx.fill();
    }
  }

  /* ---------- INIT ---------- */
  function init() {
    particles = [];
    const baseCount = window.innerWidth < 768 ? 40 : 85;
    for (let k = 0; k < baseCount; k++) {
      particles.push(new Particle());
    }
  }

  /* ---------- COLORS ---------- */
  function getThemeColors() {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      return {
        isDark,
        particleRGB: { r: 160, g: 190, b: 255 },
        lineRGB:     { r: 130, g: 170, b: 255 },
        orbColor:    [100, 130, 255],
        spotColor:   [130, 160, 255],
      };
    } else {
      return {
        isDark,
        particleRGB: { r: 80,  g: 100, b: 140 },
        lineRGB:     { r: 90,  g: 110, b: 155 },
        orbColor:    [120, 140, 200],
        spotColor:   [100, 120, 180],
      };
    }
  }

  /* ---------- AMBIENT ORBS ---------- */
  function drawOrbs(theme, time) {
    const [r, g, b] = theme.orbColor;
    const w = canvas.width;
    const h = canvas.height;
    const globalAlpha = theme.isDark ? 0.055 : 0.04;

    orbs.forEach((orb) => {
      // Drift the orb center slowly
      const cx = orb.rx * w + Math.sin(time * orb.speed + orb.phase) * w * 0.07;
      const cy = orb.ry * h + Math.cos(time * orb.speed * 1.3 + orb.phase) * h * 0.06;
      const size = orb.size * Math.max(w, h);

      // Breathing pulse
      const pulse = 0.85 + 0.15 * Math.sin(time * orb.speed * 4 + orb.phase);
      const finalSize = size * pulse;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, finalSize);
      grad.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${globalAlpha})`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${globalAlpha * 0.5})`);
      grad.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(cx, cy, finalSize, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });
  }

  /* ---------- MOUSE SPOTLIGHT ---------- */
  function drawSpotlight(theme) {
    if (smoothMouse.x === null) return;

    const [r, g, b] = theme.spotColor;
    const alpha = theme.isDark ? 0.065 : 0.05;
    const radius = Math.min(canvas.width, canvas.height) * 0.28;

    const grad = ctx.createRadialGradient(
      smoothMouse.x, smoothMouse.y, 0,
      smoothMouse.x, smoothMouse.y, radius,
    );
    grad.addColorStop(0,    `rgba(${r}, ${g}, ${b}, ${alpha})`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
    grad.addColorStop(1,    `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.beginPath();
    ctx.arc(smoothMouse.x, smoothMouse.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ---------- CONNECTIONS ---------- */
  function connect(theme) {
    const maxDist = 130;
    const maxDistSq = maxDist * maxDist;

    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const fade = 1 - distSq / maxDistSq;
          let alpha = theme.isDark
            ? 0.22 * fade + 0.04
            : 0.26 * fade + 0.05;

          // Strong boost near mouse
          if (smoothMouse.x !== null) {
            const mxA = particles[a].x - smoothMouse.x;
            const myA = particles[a].y - smoothMouse.y;
            const mdSqA = mxA * mxA + myA * myA;

            const boostRadius = 180;
            const boostRadiusSq = boostRadius * boostRadius;

            if (mdSqA < boostRadiusSq) {
              const boostFade = 1 - mdSqA / boostRadiusSq;
              alpha += boostFade * (theme.isDark ? 0.28 : 0.22);
            }
          }

          alpha = Math.min(alpha, theme.isDark ? 0.7 : 0.55);

          ctx.strokeStyle = `rgba(${theme.lineRGB.r}, ${theme.lineRGB.g}, ${theme.lineRGB.b}, ${alpha})`;
          ctx.lineWidth = 0.5 + fade * 0.5;

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
  const targetFps = 48;
  const fpsInterval = 1000 / targetFps;

  function animate(time = 0) {
    const delta = time - lastTime;

    if (delta > fpsInterval) {
      lastTime = time - (delta % fpsInterval);

      const theme = getThemeColors();

      // Smooth mouse lerp
      if (mouse.x !== null) {
        if (smoothMouse.x === null) {
          smoothMouse.x = mouse.x;
          smoothMouse.y = mouse.y;
        } else {
          smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
          smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
        }
      } else {
        if (smoothMouse.x !== null) {
          smoothMouse.x += (canvas.width / 2 - smoothMouse.x) * 0.04;
          smoothMouse.y += (canvas.height / 2 - smoothMouse.y) * 0.04;
          // Fade out when far enough from center
          const dx = smoothMouse.x - canvas.width / 2;
          const dy = smoothMouse.y - canvas.height / 2;
          if (dx * dx + dy * dy < 4) {
            smoothMouse.x = null;
            smoothMouse.y = null;
          }
        }
      }

      // Smooth parallax
      parallax.x += (targetParallax.x - parallax.x) * 0.05;
      parallax.y += (targetParallax.y - parallax.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(parallax.x, parallax.y);

      // Layer 1: ambient orbs (deepest)
      drawOrbs(theme, time);

      // Layer 2: mouse spotlight
      drawSpotlight(theme);

      // Layer 3: particle update
      particles.forEach((p) => p.update(time));

      // Layer 4: connections
      connect(theme);

      // Layer 5: particles on top
      particles.forEach((p) => p.draw(theme, time));

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

    targetParallax.x = offsetX * 14;
    targetParallax.y = offsetY * 14;
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
