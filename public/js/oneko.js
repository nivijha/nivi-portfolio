// oneko.js (fork of https://github.com/adryd325/oneko.js — MIT / public-domain lineage)
// Adapted for Nivi's portfolio:
//  - sits statically at the bottom-right corner of the footer
//  - setCatState("roam"|"dance"|"formal"|"sleep")
//  - dance animates (paws move); sleep weeps; other states are static
//  - uses upstream oneko.gif + generated PNGs (sit / formal / dance / sleep-fx)
// Dependency-free vanilla JS. Fixed to bottom, z-index above content, click-through.

(function oneko() {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var NEKO_FILE = "/images/oneko.gif";
  var curScript = document.currentScript;
  if (curScript && curScript.dataset.cat) NEKO_FILE = curScript.dataset.cat;

  // Sprite sheets (frame grids are 32px each; displayed size = cat.clientWidth).
  var SHEETS = {
    gif: { url: NEKO_FILE, cols: 8, rows: 4 },
    dance: { url: "/images/oneko-dance.png", cols: 4, rows: 1 },
    sit: { url: "/images/oneko-sit.png", cols: 1, rows: 1 },
    formal: { url: "/images/oneko-formal.png", cols: 1, rows: 1 },
    sleepfx: { url: "/images/oneko-sleep-fx.png", cols: 2, rows: 1 },
  };

  // Per-state layers. Frame coords are [col,row] from the TOP-LEFT of each sheet.
  // Layer order = paint order (first listed is on top).
  var STATES = {
    dance: { layers: [{ sheet: "dance", frames: [[0, 0], [1, 0], [2, 0], [3, 0]] }] },
    formal: {
      layers: [{ sheet: "formal", frames: [[0, 0]] }], // full front-facing cat + outfit
    },
    sleep: {
      layers: [
        { sheet: "sleepfx", frames: [[0, 0], [1, 0]] }, // nose/whisker twitch
        { sheet: "gif", frames: [[2, 0], [2, 1]] }, // sleeping base
      ],
    },
  };

  var cat = document.createElement("div");
  cat.id = "oneko";
  cat.setAttribute("aria-hidden", "true");

  // zzz particle container (shown only while sleeping)
  var zzz = document.createElement("div");
  zzz.id = "oneko-zzz";
  zzz.innerHTML = "<span>z</span><span>z</span><span>z</span>";
  cat.appendChild(zzz);

  // "purr" thought bubble, revealed on hover or via .cloud-show (state bubble)
  var purr = document.createElement("div");
  purr.id = "oneko-purr";
  purr.textContent = "purr ♡";
  cat.appendChild(purr);

  // weeping tear, shown only while sleeping (.sleeping)
  var tear = document.createElement("div");
  tear.id = "oneko-tear";
  cat.appendChild(tear);

  // Mount on the body; positioning (incl. pinning beside the brand on mobile)
  // is handled by CSS + placeNavbarCat().
  document.body.appendChild(cat);

  function placeNavbarCat() {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    var brand = document.querySelector(".nav-brand");
    if (!brand) return;
    var r = brand.getBoundingClientRect();
    cat.style.position = "fixed";
    cat.style.right = "auto";
    cat.style.bottom = "auto";
    cat.style.left = r.right + 12 + "px";
    cat.style.top = r.top + (r.height - cat.offsetHeight) / 2 + "px";
    cat.style.zIndex = "1002";
  }

  var state = "roam";
  var tick = 0;        // dance frame counter
  var lastDance = 0;   // timestamp throttle for dance frames
  var cloudTimer = null;

  function disp() { return cat.clientWidth || 96; }

  function setSitSprite() {
    var d = disp();
    cat.style.backgroundImage = "url(" + SHEETS.sit.url + ")";
    cat.style.backgroundSize = SHEETS.sit.cols * d + "px " + SHEETS.sit.rows * d + "px";
    cat.style.backgroundPosition = "0px 0px";
  }

  function setLayered(stateName, idx) {
    var layers = STATES[stateName].layers;
    var imgs = [], sizes = [], poss = [];
    var d = disp();
    for (var L = 0; L < layers.length; L++) {
      var ly = layers[L];
      var sh = SHEETS[ly.sheet];
      var fr = ly.frames[idx % ly.frames.length];
      imgs.push("url(" + sh.url + ")");
      sizes.push(sh.cols * d + "px " + sh.rows * d + "px");
      poss.push(-fr[0] * d + "px " + -fr[1] * d + "px");
    }
    cat.style.backgroundImage = imgs.join(", ");
    cat.style.backgroundSize = sizes.join(", ");
    cat.style.backgroundPosition = poss.join(", ");
  }

  function render(idx) {
    if (state === "roam" || state === "idle") setSitSprite();
    else if (state === "dance") setLayered("dance", idx);
    else if (state === "formal") setLayered("formal", idx);
    else if (state === "sleep") setLayered("sleep", idx);
  }

  function setCatState(s) {
    if (["roam", "idle", "dance", "formal", "sleep"].indexOf(s) === -1) s = "roam";
    state = s;
    cat.classList.toggle("sleeping", s === "sleep");
    if (cloudTimer) { clearTimeout(cloudTimer); cloudTimer = null; }
    cat.classList.remove("cloud-show");
    if (s === "dance") {
      purr.textContent = "let's dance";
      cat.classList.add("cloud-show");
      cloudTimer = setTimeout(function () { cat.classList.remove("cloud-show"); }, 4000);
    } else if (s === "formal") {
      purr.textContent = "work mode on";
      cat.classList.add("cloud-show");
      cloudTimer = setTimeout(function () { cat.classList.remove("cloud-show"); }, 4000);
    } else if (s === "sleep") {
      purr.textContent = "zzz";
      cat.classList.add("cloud-show");
      cloudTimer = setTimeout(function () { cat.classList.remove("cloud-show"); }, 4000);
    } else {
      purr.textContent = "purr ♡";
    }
    render(0);
  }

  // Dance animation loop — only the "dance" state cycles frames (paws move).
  // Other states stay static (cat sits still). Skipped entirely under reduced motion.
  function loop(timestamp) {
    if (!cat.isConnected) return;
    if (state === "dance" && !reduced) {
      if (!lastDance) lastDance = timestamp;
      if (timestamp - lastDance >= 110) {
        lastDance = timestamp;
        tick++;
        setLayered("dance", tick);
      }
    }
    requestAnimationFrame(loop);
  }

  // initial first paint — static (position handled by CSS); start dance loop if allowed
  render(0);
  placeNavbarCat();
  window.addEventListener("resize", placeNavbarCat);
  window.addEventListener("load", placeNavbarCat);
  if (!reduced) requestAnimationFrame(loop);

  window.oneko = { setCatState: setCatState };
})();
