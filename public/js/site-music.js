(function () {
  "use strict";

  var TRACKS = {
    dancingCat: { src: "/audio/dancingCat.mp3", cat: "dance", label: "Dancing Cat" },
    gotoAnthem: { src: "/audio/goto-anthem.mp3", cat: "formal", label: "GoTo Anthem" },
    meCurrently: { src: "/audio/me-currently.mp3", cat: "sleep", label: "Me Currently" },
  };

  var PLAYLISTS = [
    "https://open.spotify.com/playlist/4B5PuPSkHWXoxh5h5hKtDT",
    "https://open.spotify.com/playlist/4E2DUQK2Q9bgJt9kRpbxVL",
    "https://open.spotify.com/playlist/6FsScqbSTKOJnfCauIFtxQ",
    "https://open.spotify.com/playlist/38nsGjIuZgVzxEmf4NpxeN",
  ];

  var audio = {};
  var current = null;
  var vol = 0.4;

  function getAudio(name) {
    if (!audio[name]) {
      var a = new Audio(TRACKS[name].src);
      a.loop = true;
      a.preload = "none";
      a.volume = vol;
      audio[name] = a;
    }
    return audio[name];
  }

  function setCat(catState) {
    if (window.oneko) window.oneko.setCatState(catState || "roam");
  }

  function persist(name, time) {
    try {
      localStorage.setItem("siteMusicTrack", name || "");
      localStorage.setItem("siteMusicTime", String(time || 0));
    } catch (e) {}
  }

  function persistClear() {
    try {
      localStorage.removeItem("siteMusicTrack");
      localStorage.removeItem("siteMusicTime");
    } catch (e) {}
  }

  function syncUI() {
    var pill = document.getElementById("music-pill");
    var label = document.getElementById("music-pill-label");
    var nowTrack = document.getElementById("funky-now-track");
    var playing = !!current;

    if (pill) {
      pill.classList.toggle("playing", playing);
      var panel = document.getElementById("music-panel");
      pill.setAttribute(
        "aria-expanded",
        panel && panel.classList.contains("open") ? "true" : "false"
      );
    }
    if (label) label.textContent = playing ? "♪ " + TRACKS[current].label : "music // pick a track";
    if (nowTrack) nowTrack.textContent = playing ? TRACKS[current].label : "nothing yet — pick a track";

    document.querySelectorAll("[data-track]").forEach(function (el) {
      var on = el.getAttribute("data-track") === current;
      if (el.hasAttribute("aria-checked")) el.setAttribute("aria-checked", on ? "true" : "false");
      if (el.hasAttribute("aria-pressed")) el.setAttribute("aria-pressed", on ? "true" : "false");
      el.classList.toggle("is-active", on);
    });
  }

  function stopAll() {
    Object.keys(audio).forEach(function (k) {
      audio[k].pause();
    });
    current = null;
    setCat("roam");
  }

  function play(name) {
    if (!TRACKS[name]) return;
    var a = getAudio(name);
    if (current === name && !a.paused) {
      stopAll();
      persistClear();
      setCat("roam");
      syncUI();
      return;
    }
    stopAll();
    a.loop = true;
    a.volume = vol;
    current = name;
    a.play().then(function () {
      setCat(TRACKS[name].cat);
    }).catch(function () {});
    persist(name, a.currentTime);
    setCat(TRACKS[name].cat);
    syncUI();
  }

  function initPanel() {
    var pill = document.getElementById("music-pill");
    var panel = document.getElementById("music-panel");
    if (!pill || !panel) return;

    function openPanel() {
      panel.classList.add("open");
      pill.setAttribute("aria-expanded", "true");
      var first = panel.querySelector(".music-option");
      if (first) first.focus();
    }
    function closePanel() {
      panel.classList.remove("open");
      pill.setAttribute("aria-expanded", "false");
    }

    pill.addEventListener("click", function (e) {
      e.stopPropagation();
      if (panel.classList.contains("open")) {
        closePanel();
        // clicking the toggle again stops whatever is playing
        if (current) {
          stopAll();
          persistClear();
          syncUI();
        }
      } else {
        openPanel();
      }
    });

    panel.querySelectorAll(".music-option[data-track]").forEach(function (opt) {
      opt.addEventListener("click", function () {
        play(opt.getAttribute("data-track"));
      });
    });

    var shuffle = document.getElementById("music-shuffle");
    if (shuffle) {
      shuffle.addEventListener("click", function () {
        var url = PLAYLISTS[Math.floor(Math.random() * PLAYLISTS.length)];
        window.open(url, "_blank", "noopener");
      });
    }

    var volume = document.getElementById("music-volume");
    if (volume) {
      vol = parseFloat(volume.value);
      if (isNaN(vol)) vol = 0.4;
      volume.addEventListener("input", function () {
        vol = parseFloat(volume.value);
        if (isNaN(vol)) vol = 0;
        if (current && audio[current]) audio[current].volume = vol;
      });
    }

    panel.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var items = Array.prototype.slice.call(panel.querySelectorAll("button"));
      var idx = items.indexOf(document.activeElement);
      if (idx === -1) return;
      e.preventDefault();
      var next = e.key === "ArrowDown"
        ? (idx + 1) % items.length
        : (idx - 1 + items.length) % items.length;
      items[next].focus();
    });

    document.addEventListener("click", function (e) {
      if (panel.classList.contains("open") && !panel.contains(e.target) && !pill.contains(e.target)) {
        closePanel();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  function initTiles() {
    document.querySelectorAll(".funky-tile[data-track]").forEach(function (t) {
      t.addEventListener("click", function () {
        play(t.getAttribute("data-track"));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPanel();
    initTiles();
    // No auto-resume: a page refresh always starts idle (cat calm, no audio).
  });

  window.siteMusic = {
    play: play,
    toggle: play,
    stop: stopAll,
    get current() {
      return current;
    },
  };
})();
