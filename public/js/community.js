window.initCommunityPage = function () {
  var grid = document.getElementById("community-grid");
  var empty = document.getElementById("community-empty");
  if (!grid) return;

  var cards = grid.querySelectorAll(".community-card");
  var filters = document.querySelectorAll(".community-filter");

  function applyFilter(key) {
    var visible = 0;
    cards.forEach(function (c) {
      var cat = (c.getAttribute("data-category") || "").split(/\s+/);
      var show = key === "all" || cat.indexOf(key) !== -1;
      c.classList.toggle("is-hidden", !show);
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      applyFilter(btn.getAttribute("data-filter"));
    });
  });

  (function sortByDate() {
    var sorted = Array.prototype.slice.call(cards).sort(function (a, b) {
      var sa = a.getAttribute("data-sort") || "";
      var sb = b.getAttribute("data-sort") || "";
      if (sa < sb) return 1;
      if (sa > sb) return -1;
      return 0;
    });
    sorted.forEach(function (c) { grid.appendChild(c); });
    cards = grid.querySelectorAll(".community-card");
  })();

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var idx = Array.prototype.indexOf.call(cards, e.target);
        setTimeout(function () {
          e.target.classList.add("revealed");
        }, idx * 80);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach(function (c) { observer.observe(c); });

  try { if (window.lucide) window.lucide.createIcons(); } catch (e) {}

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var heroBtn = document.querySelector(".community-postcard--hero");
  var isLightboxOpen = false;
  var heroTimer = null;
  var heroPaused = false;
  var heroIdx = 0;
  var heroGallery = null;

  if (heroBtn) {
    try { heroGallery = JSON.parse(heroBtn.getAttribute("data-gallery") || "[]"); } catch (e) { heroGallery = []; }
    if (!Array.isArray(heroGallery)) heroGallery = [];
    if (heroGallery.length > 12) heroGallery = heroGallery.slice(0, 12);
    var heroFrame = heroBtn.querySelector(".community-postcard-frame");
    var heroImg = heroFrame ? heroFrame.querySelector("img") : null;
    var heroCount = heroBtn.querySelector(".community-postcard-count");

    function heroShow(n) {
      heroIdx = (n + heroGallery.length) % heroGallery.length;
      var item = heroGallery[heroIdx];
      if (!item || !heroImg) return;
      if (item.type === "video") {
        var tries = 0;
        while (item.type === "video" && tries < heroGallery.length) {
          heroIdx = (heroIdx + 1) % heroGallery.length;
          item = heroGallery[heroIdx];
          tries++;
        }
        if (item.type === "video") return;
      }
      heroImg.style.opacity = "0";
      setTimeout(function () {
        heroImg.src = item.src;
        heroImg.alt = item.caption || "";
        heroImg.style.opacity = "1";
      }, 120);
      if (heroCount) heroCount.textContent = (heroIdx + 1) + " / " + heroGallery.length;
    }

    function heroStart() {
      if (reduceMotion || isLightboxOpen || heroPaused || heroGallery.length <= 1) return;
      heroStop();
      heroTimer = setInterval(function () { heroShow(heroIdx + 1); }, 3000);
    }

    function heroStop() {
      if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
    }

    heroBtn.addEventListener("mouseenter", function () { heroPaused = true; heroStop(); });
    heroBtn.addEventListener("mouseleave", function () { heroPaused = false; heroStart(); });
    heroBtn.addEventListener("focusin", function () { heroPaused = true; heroStop(); });
    heroBtn.addEventListener("focusout", function () { heroPaused = false; heroStart(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) heroStop();
      else if (!heroPaused && !isLightboxOpen) heroStart();
    });

    heroBtn._heroStart = heroStart;
    heroBtn._heroStop = heroStop;
    heroStart();

    var hintSeen = false;
    try { hintSeen = localStorage.getItem("community_hint_seen") === "1"; } catch (e2) {}
    if (!reduceMotion && !hintSeen && heroGallery.length) {
      var hint = document.createElement("span");
      hint.className = "community-postcard-hint";
      hint.setAttribute("aria-hidden", "true");
      hint.innerHTML = '<i data-lucide="expand"></i> tap to view';
      heroBtn.appendChild(hint);
      setTimeout(function () { heroBtn.classList.add("has-hint"); }, 1200);
      heroBtn.addEventListener("click", function onFirst() {
        heroBtn.classList.remove("has-hint");
        try { localStorage.setItem("community_hint_seen", "1"); } catch (e3) {}
        heroBtn.removeEventListener("click", onFirst);
      });
      try { if (window.lucide) window.lucide.createIcons(); } catch (e4) {}
    }
  }

  var lightbox = document.getElementById("community-lightbox");
  var lbMedia = document.getElementById("lb-media");
  var lbCaption = document.getElementById("lb-caption");
  var lbCounter = document.getElementById("lb-counter");
  var lbThumbs = document.getElementById("lb-thumbs");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var lbClose = document.getElementById("lb-close");
  if (!lightbox || !lbMedia) return;

  if (lightbox.parentNode !== document.body) document.body.appendChild(lightbox);

  var progressBar = document.getElementById("lb-progress-bar");
  if (!progressBar) {
    var progWrap = document.createElement("div");
    progWrap.className = "community-lightbox-progress";
    progWrap.setAttribute("aria-hidden", "true");
    progressBar = document.createElement("div");
    progressBar.className = "community-lightbox-progress-bar";
    progressBar.id = "lb-progress-bar";
    progWrap.appendChild(progressBar);
    var card = lightbox.querySelector(".community-lightbox-card");
    var stage = lightbox.querySelector(".community-lightbox-stage");
    if (card && stage && stage.nextSibling) card.insertBefore(progWrap, stage.nextSibling);
    else if (card) card.appendChild(progWrap);
  }

  var gallery = [];
  var idx = 0;
  var galleryTimer = null;
  var galleryPaused = false;

  function renderThumb(item, i) {
    var b = document.createElement("button");
    b.className = "community-lightbox-thumb" + (i === idx ? " active" : "");
    b.setAttribute("aria-label", "Go to item " + (i + 1));
    if (item.type === "video") {
      var v = document.createElement("video");
      v.src = item.src;
      v.muted = true;
      v.preload = "metadata";
      b.appendChild(v);
    } else {
      var im = document.createElement("img");
      im.src = item.src;
      im.alt = "";
      im.loading = "lazy";
      b.appendChild(im);
    }
    b.addEventListener("click", function () { go(i, true); });
    return b;
  }

  function renderMedia() {
    lbMedia.innerHTML = "";
    var item = gallery[idx];
    if (!item) return;
    if (item.type === "video") {
      var v = document.createElement("video");
      v.src = item.src;
      v.controls = true;
      v.playsInline = true;
      v.setAttribute("controlsList", "nodownload");
      v.addEventListener("play", function () { pauseGallery(); });
      v.addEventListener("pause", function () { resumeGallery(); });
      lbMedia.appendChild(v);
    } else {
      var img = document.createElement("img");
      img.src = item.src;
      img.alt = item.caption || "";
      lbMedia.appendChild(img);
    }
    if (lbCaption) lbCaption.textContent = item.caption || "";
    if (lbCounter) lbCounter.textContent = (idx + 1) + " / " + gallery.length;
    if (lbThumbs) {
      lbThumbs.innerHTML = "";
      gallery.forEach(function (it, i) {
        lbThumbs.appendChild(renderThumb(it, i));
      });
    }
    if (lbPrev) lbPrev.disabled = gallery.length <= 1;
    if (lbNext) lbNext.disabled = gallery.length <= 1;
    restartProgress();
  }

  function go(n, isManual) {
    if (!gallery.length) return;
    idx = (n + gallery.length) % gallery.length;
    renderMedia();
    if (isManual) {
      pauseGallery();
      setTimeout(function () { resumeGallery(); }, 1200);
    }
  }

  function restartProgress() {
    if (!progressBar || reduceMotion) return;
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    void progressBar.offsetWidth;
    progressBar.style.transition = "width 4s linear";
    progressBar.style.width = "100%";
  }

  function startGallery() {
    if (reduceMotion || gallery.length <= 1 || galleryPaused) return;
    stopGallery();
    galleryTimer = setInterval(function () { go(idx + 1); }, 4000);
    restartProgress();
  }

  function stopGallery() {
    if (galleryTimer) { clearInterval(galleryTimer); galleryTimer = null; }
    if (progressBar) {
      progressBar.style.transition = "none";
      progressBar.style.width = "0%";
    }
  }

  function pauseGallery() {
    galleryPaused = true;
    stopGallery();
  }

  function resumeGallery() {
    galleryPaused = false;
    if (!lightbox.hidden && !reduceMotion && gallery.length > 1) {
      var cur = gallery[idx];
      if (cur && cur.type === "video") return;
      startGallery();
    }
  }

  var savedY = 0;
  var savedBodyTop = "";
  var savedOverflow = "";
  var savedHtmlOverflow = "";

  function lockScroll() {
    savedY = window.scrollY;
    savedOverflow = document.body.style.overflow;
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyTop = document.body.style.top;
    var sbW = window.innerWidth - document.documentElement.clientWidth;
    if (sbW > 0) document.body.style.paddingRight = sbW + "px";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
  }

  function unlockScroll() {
    document.documentElement.style.overflow = savedHtmlOverflow;
    document.body.style.overflow = savedOverflow;
    document.body.style.top = savedBodyTop;
    document.body.style.paddingRight = "";
    document.body.style.overscrollBehavior = "";
    window.scrollTo(0, savedY);
  }

  function open(g) {
    gallery = g.slice(0, 12);
    idx = 0;
    isLightboxOpen = true;
    if (heroBtn && heroBtn._heroStop) heroBtn._heroStop();
    renderMedia();
    lockScroll();
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    galleryPaused = false;
    var cur = gallery[idx];
    if (cur && cur.type !== "video" && gallery.length > 1) startGallery();
    try { if (window.lucide) window.lucide.createIcons(); } catch (e) {}
    if (lbClose) lbClose.focus();
  }

  function close() {
    stopGallery();
    galleryPaused = false;
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    var v = lbMedia.querySelector("video");
    if (v) v.pause();
    gallery = [];
    unlockScroll();
    isLightboxOpen = false;
    if (!reduceMotion && heroBtn && heroBtn._heroStart) heroBtn._heroStart();
  }

  if (heroBtn) {
    heroBtn.addEventListener("click", function () {
      var raw = heroBtn.getAttribute("data-gallery");
      if (!raw) return;
      try {
        var g = JSON.parse(raw);
        if (!Array.isArray(g) || !g.length) return;
        open(g);
      } catch (e) {}
    });
  }

  if (lbPrev) lbPrev.addEventListener("click", function () { go(idx - 1, true); });
  if (lbNext) lbNext.addEventListener("click", function () { go(idx + 1, true); });
  if (lbClose) lbClose.addEventListener("click", close);
  lightbox.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", close);
  });

  var lbStage = lightbox.querySelector(".community-lightbox-stage");
  if (lbStage) {
    lbStage.addEventListener("mouseenter", pauseGallery);
    lbStage.addEventListener("mouseleave", resumeGallery);
    lbStage.addEventListener("touchstart", pauseGallery, { passive: true });
    lbStage.addEventListener("touchend", function () { setTimeout(resumeGallery, 800); }, { passive: true });
  }
  if (lbThumbs) {
    lbThumbs.addEventListener("mouseenter", pauseGallery);
    lbThumbs.addEventListener("mouseleave", resumeGallery);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pauseGallery();
    else if (!lightbox.hidden) resumeGallery();
  });

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") go(idx - 1, true);
    if (e.key === "ArrowRight") go(idx + 1, true);
  });
};
