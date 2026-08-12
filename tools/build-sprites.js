// tools/build-sprites.js
// Dependency-free PNG sprite generator for the oneko.js fork.
// Produces: oneko-dance.png (4-frame cycle), oneko-formal.png (transparent
// overlay: white shirt + red tie + brown briefcase), oneko-sleep-fx.png
// (2-frame transparent nose/whisker twitch). Run: node tools/build-sprites.js
//
// NOTE: overlay alignment to oneko.gif's cat is heuristic. Tune OVERLAY_OFFSET
// (and the chest/face guesses) if the shirt or whiskers sit off-target.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SIZE = 32;

// Palette (char -> [r,g,b,a]). "." = transparent.
const PAL = {
  ".": [0, 0, 0, 0],
  K: [43, 43, 43, 255], // outline
  g: [154, 160, 166, 255], // gray body
  G: [122, 128, 134, 255], // gray shade
  w: [232, 234, 237, 255], // belly / white
  p: [231, 166, 181, 255], // ear pink
  n: [231, 154, 176, 255], // nose
  e: [43, 43, 43, 255], // eye
  W: [245, 245, 245, 255], // shirt white
  T: [192, 57, 43, 255], // tie red
  B: [107, 79, 42, 255], // briefcase
  b: [79, 58, 30, 255], // briefcase shade
};

// Tuning handle for overlay alignment (in 32-grid units).
const OVERLAY_OFFSET = { x: 0, y: 0 };

function newFrame() {
  return { w: SIZE, h: SIZE, data: new Uint8ClampedArray(SIZE * SIZE * 4) };
}

function px(f, x, y, c) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= f.w || y >= f.h) return;
  const col = PAL[c];
  if (!col || col[3] === 0) return;
  const i = (y * f.w + x) * 4;
  f.data[i] = col[0];
  f.data[i + 1] = col[1];
  f.data[i + 2] = col[2];
  f.data[i + 3] = 255;
}

function disc(f, cx, cy, r, c) {
  const rr = Math.ceil(r);
  const r2 = r * r;
  for (let dy = -rr; dy <= rr; dy++)
    for (let dx = -rr; dx <= rr; dx++)
      if (dx * dx + dy * dy <= r2) px(f, cx + dx, cy + dy, c);
}

function ellipse(f, cx, cy, rx, ry, c) {
  const rr = Math.ceil(Math.max(rx, ry));
  for (let dy = -rr; dy <= rr; dy++)
    for (let dx = -rr; dx <= rr; dx++)
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1)
        px(f, cx + dx, cy + dy, c);
}

function rect(f, x, y, w, h, c) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) px(f, x + xx, y + yy, c);
}

function tri(f, ax, ay, bx1, bx2, by, c) {
  for (let y = Math.round(ay); y <= by; y++) {
    const t = (y - ay) / (by - ay);
    const l = ax + (bx1 - ax) * t;
    const r = ax + (bx2 - ax) * t;
    const x0 = Math.round(l), x1 = Math.round(r);
    for (let x = x0; x <= x1; x++) px(f, x, y, c);
  }
}

// outline = slightly larger dark shape, then fill on top
function oDisc(f, cx, cy, r, c) { disc(f, cx, cy, r + 0.8, "K"); disc(f, cx, cy, r, c); }
function oEllipse(f, cx, cy, rx, ry, c) { ellipse(f, cx, cy, rx + 0.8, ry + 0.8, "K"); ellipse(f, cx, cy, rx, ry, c); }
function oTri(f, ax, ay, bx1, bx2, by, c) { tri(f, ax, ay - 0.8, bx1 - 0.8, bx2 + 0.8, by + 0.8, "K"); tri(f, ax, ay, bx1, bx2, by, c); }

// ---- Dance cat (full gray cat, 4 frames) ----
function drawCat(f, p) {
  const oy = p.bob || 0;
  // tail (right side, waving)
  const segs = [[0, 0], [3, 1], [5, 3], [6, 5], [5, 8], [3, 10], [1, 11]];
  const ang = p.tail || 0;
  const bx = 25, by = 20 + oy;
  for (let i = 0; i < segs.length; i++) {
    const lx = segs[i][0], ly = segs[i][1];
    const x = bx + (lx * Math.cos(ang) - ly * Math.sin(ang));
    const y = by + (lx * Math.sin(ang) + ly * Math.cos(ang));
    let r = 2.2 - i * 0.16; if (r < 1) r = 1;
    disc(f, x, y, r + 0.6, "K"); disc(f, x, y, r, "g");
  }
  // body
  oEllipse(f, 16, 20 + oy, 8.5, 8, "g");
  // belly
  ellipse(f, 16, 22 + oy, 5, 5, "w");
  // head
  oEllipse(f, 16, 9 + oy, 6.5, 6, "g");
  // ears
  oTri(f, 11, 2 + oy, 7, 14, 7 + oy, "g");
  oTri(f, 21, 2 + oy, 18, 25, 7 + oy, "g");
  tri(f, 11, 3 + oy, 9.5, 13, 6 + oy, "p");
  tri(f, 21, 3 + oy, 19, 22.5, 6 + oy, "p");
  // eyes
  disc(f, 13, 9 + oy, 1.3, "e");
  disc(f, 19, 9 + oy, 1.3, "e");
  // nose
  disc(f, 16, 12 + oy, 1.1, "n");
  // whiskers
  rect(f, 7, 11 + oy, 4, 0.6, "w");
  rect(f, 21, 11 + oy, 4, 0.6, "w");
  // front paws (lift = how far up)
  const pawL = 27 - (p.pawL || 0);
  const pawR = 27 - (p.pawR || 0);
  oDisc(f, 12, pawL, 2.2, "g");
  oDisc(f, 20, pawR, 2.2, "g");
  // feet
  oDisc(f, 12, 28, 1.8, "g");
  oDisc(f, 20, 28, 1.8, "g");
}

// ---- Formal overlay (transparent: shirt + tie + briefcase) ----
function drawFormal(f) {
  const ox = OVERLAY_OFFSET.x, oy = OVERLAY_OFFSET.y;
  // shirt over torso (heuristic chest region)
  rect(f, 10 + ox, 15 + oy, 13, 11, "K"); // outline
  rect(f, 10.8 + ox, 15.8 + oy, 11.4, 9.4, "W");
  // collar
  rect(f, 10.8 + ox, 15.8 + oy, 11.4, 1.4, "w");
  // tie (red, vertical center)
  rect(f, 15 + ox, 17 + oy, 2.2, 7, "T");
  disc(f, 16 + ox, 17.5 + oy, 1.3, "T");
  // briefcase at the cat's side
  rect(f, 23 + ox, 17 + oy, 6, 6, "K");
  rect(f, 23.6 + ox, 17.6 + oy, 4.8, 4.8, "B");
  rect(f, 23.6 + ox, 20 + oy, 4.8, 2.4, "b");
  disc(f, 26 + ox, 17 + oy, 1.4, "K"); // handle
}

// ---- Sleep twitch overlay (transparent: nose/whisker 2-frame) ----
function drawSleepFX(f, frame) {
  const ox = OVERLAY_OFFSET.x, oy = OVERLAY_OFFSET.y + 8; // near face in 32-grid
  const twitch = frame === 1 ? 1 : 0;
  // nose
  disc(f, 16 + ox, 4 + oy, 1.1, "n");
  // whiskers (twitch shifts lower on frame 1)
  rect(f, 8 + ox, 4 + oy + twitch, 5, 0.6, "w");
  rect(f, 19 + ox, 4 + oy + twitch, 5, 0.6, "w");
  rect(f, 8 + ox, 6 + oy + twitch, 5, 0.6, "w");
  rect(f, 19 + ox, 6 + oy + twitch, 5, 0.6, "w");
}

// ---- PNG encoding (RGBA, filter 0) ----
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function combine(frames) {
  const fw = frames[0].w, fh = frames[0].h;
  const W = fw * frames.length, H = fh;
  const out = Buffer.alloc(W * H * 4);
  for (let fr = 0; fr < frames.length; fr++) {
    const src = frames[fr].data;
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        const si = (y * fw + x) * 4;
        const di = (y * W + (fr * fw + x)) * 4;
        out[di] = src[si]; out[di + 1] = src[si + 1]; out[di + 2] = src[si + 2]; out[di + 3] = src[si + 3];
      }
  }
  return { W, H, data: out };
}

function encodePNG(img) {
  const { W, H, data } = img;
  const raw = Buffer.alloc(H * (W * 4 + 1));
  let o = 0;
  for (let y = 0; y < H; y++) {
    raw[o++] = 0;
    for (let i = 0; i < W * 4; i++) raw[o++] = data[y * W * 4 + i];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Front-facing sitting cat (face front, paws in, tail out) ----
function drawSitCat(f, clothes) {
  // tail curling out to the right side
  const tx = 24, ty = 21;
  const segs = [[0, 0], [2, 1], [3, 2], [3, 4], [2, 6], [0, 7], [-2, 7]];
  for (let i = 0; i < segs.length; i++) {
    const x = tx + segs[i][0], y = ty + segs[i][1];
    let r = 2.2 - i * 0.12; if (r < 1.2) r = 1.2;
    disc(f, x, y, r + 0.6, "K"); disc(f, x, y, r, "g");
  }
  // body (sitting, wider at bottom)
  oEllipse(f, 16, 22, 8, 8, "g");
  ellipse(f, 16, 23, 5, 5, "w"); // belly
  // hind feet
  oEllipse(f, 12, 29, 2.4, 1.8, "g");
  oEllipse(f, 20, 29, 2.4, 1.8, "g");
  // front paws "in" (together at center front)
  oDisc(f, 14, 28, 2.2, "g");
  oDisc(f, 18, 28, 2.2, "g");
  // head
  oEllipse(f, 16, 10, 7, 6.5, "g");
  // ears
  oTri(f, 9, 2, 5, 13, 8, "g");
  oTri(f, 23, 2, 19, 27, 8, "g");
  tri(f, 10, 3, 7, 11, 7, "p");
  tri(f, 22, 3, 21, 25, 7, "p");
  // eyes
  disc(f, 12, 10, 1.4, "e");
  disc(f, 20, 10, 1.4, "e");
  // nose
  disc(f, 16, 13, 1.1, "n");
  // whiskers
  rect(f, 7, 12, 4, 0.6, "w");
  rect(f, 21, 12, 4, 0.6, "w");
  rect(f, 7, 14, 4, 0.6, "w");
  rect(f, 21, 14, 4, 0.6, "w");

  if (clothes) {
    // white shirt on chest
    oEllipse(f, 16, 21, 5.2, 5, "W");
    rect(f, 11.5, 16.5, 9, 1.4, "w"); // collar
    // tie (red) down the center
    rect(f, 15, 18, 2.2, 7, "T");
    disc(f, 16, 18.4, 1.3, "T");
    // briefcase on the left side (tail is on the right)
    rect(f, 3, 20, 6, 6, "K");
    rect(f, 3.6, 20.6, 4.8, 4.8, "B");
    rect(f, 3.6, 23, 4.8, 2.4, "b");
    disc(f, 6, 20, 1.4, "K");
  }
}

// ---- Build ----
function buildDance() {
  const frames = [];
  const cfg = [
    { bob: 0, pawL: 4, pawR: 0, tail: 0.35 },
    { bob: 1, pawL: 2, pawR: 2, tail: -0.35 },
    { bob: 0, pawL: 0, pawR: 4, tail: 0.35 },
    { bob: 1, pawL: 2, pawR: 2, tail: -0.35 },
  ];
  cfg.forEach((p) => { const f = newFrame(); drawCat(f, p); frames.push(f); });
  return frames;
}

function buildSit() {
  const f = newFrame();
  drawSitCat(f, false);
  return [f];
}

function buildFormal() {
  const f = newFrame();
  drawSitCat(f, true); // full front-facing cat + shirt + tie + briefcase
  return [f];
}

function buildSleepFX() {
  const frames = [];
  [0, 1].forEach((frame) => { const f = newFrame(); drawSleepFX(f, frame); frames.push(f); });
  return frames;
}

const out = path.join(__dirname, "..", "public", "images");
function write(name, frames) {
  const png = encodePNG(combine(frames));
  fs.writeFileSync(path.join(out, name), png);
  console.log("wrote", name, png.length, "bytes");
}

write("oneko-sit.png", buildSit());
write("oneko-formal.png", buildFormal());
write("oneko-dance.png", buildDance());
write("oneko-sleep-fx.png", buildSleepFX());
console.log("done");
