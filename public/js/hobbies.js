window.initHobbiesPage = function () {
  (function () {
    // Dim film-photo backdrop distributed evenly down the whole page,
    // pinned to the left and right gutters beside the centered content.
    const bg = document.getElementById("hobby-bg");
    if (bg) {
      const M = 8;
      const bgRect = bg.getBoundingClientRect();
      const W = bg.offsetWidth;
      const H = bg.offsetHeight; // full scrollable page height

      const local = (r) => ({
        left: r.left - bgRect.left,
        top: r.top - bgRect.top,
        right: r.right - bgRect.left,
        bottom: r.bottom - bgRect.top
      });

      // Regions that must stay clear (text blocks, wall, pins, sections)
      const protectedRects = [];
      document.querySelectorAll(
        ".hobbies-head,.wall-section,.music-section,.facts-section,.vibes-tape"
      ).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > bgRect.left && r.left < bgRect.right) {
          protectedRects.push(local(r));
        }
      });

      // Side gutters: the area on each side of the centered content column.
      const section = bg.parentElement;
      const inner = section.querySelector(".section-inner");
      const contentRect = inner ? inner.getBoundingClientRect() : null;
      const contentLeft = contentRect ? contentRect.left - bgRect.left : W * 0.3;
      const contentRight = contentRect ? contentRect.right - bgRect.left : W * 0.7;

      // Available gutter width on each side (before content).
      const gutterLeft = Math.max(0, contentLeft - 2 * M);
      const gutterRight = Math.max(0, (W - contentRight) - 2 * M);
      const MAX_W = 140;
      const MIN_W = 60;
      const MAX_H = 150;

      const overlaps = (a, b) =>
        !(a.right - 4 < b.left || a.left + 4 > b.right ||
          a.bottom - 4 < b.top || a.top + 4 > b.bottom);

      const placed = [];
      const leftN = 5;   // total 11 photos: 5 on the left, 6 on the right
      const rightN = 6;
      const spacingLY = H / (leftN + 1);
      const spacingRY = H / (rightN + 1);

      function addTile(x, y, src, tw) {
        const th = Math.round(tw * 0.7) + 48;
        const cand = { left: x, top: y, right: x + tw, bottom: y + th };
        for (const p of protectedRects) if (overlaps(cand, p)) return;
        for (const p of placed) if (overlaps(cand, p)) return;

        const tile = document.createElement("div");
        tile.className = "hobby-bg-tile";
        tile.style.width = tw + "px";
        tile.style.left = x + "px";
        tile.style.top = y + "px";
        tile.style.transform = "rotate(" + (Math.random() * 14 - 7).toFixed(1) + "deg)";
        tile.style.opacity = (0.6 + Math.random() * 0.1).toFixed(2);

        const top = document.createElement("span");
        top.className = "film-perf top";
        const bottom = document.createElement("span");
        bottom.className = "film-perf bottom";

        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.style.height = (tw - 26) + "px";

        tile.appendChild(top);
        tile.appendChild(img);
        tile.appendChild(bottom);
        bg.appendChild(tile);

        placed.push(cand);
      }

// Even vertical spacing down BOTH gutters: 5 tiles on the left, 6 on
      // the right, each side evenly paced. Right is offset by half a gap so
      // the two columns interleave instead of mirroring.
      for (let i = 0; i < Math.max(leftN, rightN); i++) {
        if (i < leftN && gutterLeft >= MIN_W) {
          const y = M + spacingLY * (i + 1) + (Math.random() * 2 - 1) * spacingLY * 0.15;
          if (y < M || y > H - M - MAX_H) continue;
          const tw = Math.min(MAX_W, gutterLeft);
          const x = M + Math.random() * Math.max(1, contentLeft - M - tw - M);
          addTile(x, y, "/images/hobbies/photo" + (i + 1) + ".jpeg", tw);
        }

        if (i < rightN && gutterRight >= MIN_W) {
          const y = M + spacingRY * (i + 0.5) + (Math.random() * 2 - 1) * spacingRY * 0.15;
          if (y < M || y > H - M - MAX_H) continue;
          const tw = Math.min(MAX_W, gutterRight);
          const x = contentRight + M + Math.random() * Math.max(1, W - M - tw - (contentRight + M));
          addTile(x, y, "/images/hobbies/photo" + (i + 6) + ".jpeg", tw);
        }
      }

      requestAnimationFrame(() => bg.classList.add("in-view"));
    }

    // Pinboard stagger: pins settle when the wall scrolls into view
    const wall = document.getElementById("polaroid-wall");
    if (wall) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              wall.classList.add("in-view");
              observer.unobserve(wall);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
      );
      observer.observe(wall);
    }

    // Live "now looping" status if the site music is playing
    const status = document.getElementById("music-status");
    if (status) {
      const audio = window.globalAudio;
      const wasPlaying = localStorage.getItem("musicPlaying") === "true";
      const isPlaying = (audio && !audio.paused) || (!audio && wasPlaying);

      if (isPlaying) {
        status.textContent = "looping now";
        status.hidden = false;
      }
    }
  })();
};