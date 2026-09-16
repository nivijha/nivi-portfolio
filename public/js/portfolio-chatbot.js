(() => {
  const KB_URL = "/data/portfolio-kb.json";
  const KB_CACHE_KEY = "nivi-cb-kb-cache";
  let kb = null;
  let docs = [];
  let lastTopic = null;
  let stuckCount = 0;
  let turnLog = [];
  const els = {};
  const quickChips = ["hard skills", "soft skills", "projects", "hobbies", "contact"];
  const CAT_POOL = ["*purr* ", "*kneads* "];

  function q(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function catFlavor() { return Math.random() < 0.5 ? CAT_POOL[Math.floor(Math.random() * CAT_POOL.length)] : ""; }
  function normalize(s) { return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
  function tokens(s) { return normalize(s).split(" ").filter(Boolean); }
  function scoreDoc(qt, dt) { let sc = 0; for (const t of qt) { if (dt.includes(t)) sc += 2; else if (dt.some((d) => d.startsWith(t) || t.startsWith(d))) sc += 1; } return sc; }
  function link(href, label, internal) { return `<a href="${href}"${internal ? "" : ' target="_blank" rel="noopener"'}>${label}</a>`; }
  function stripHtml(s) { const d = document.createElement("div"); d.innerHTML = s; return d.textContent || ""; }
  function isAboutCat(qn) {
    return /^(who are you|what are you|are you a |are you (a )?(robot|bot|ai|real|cat|person|human)|what can you do|what do you do|your (name|self|role)|yourself|how are you|whats your name|what is your name|about you)\b/.test(qn);
  }
  const TOPIC_RE = /skill|project|medtracker|cardiovision|constellation|review|linux|security|education|cgpa|gpa|school|university|college|experience|intern|community|hackathon|hobby|photograph|music|contact|email|about|nivi|stack|coursework|pitch/;
  function isMoreQuery(qn) {
    if (!lastTopic) return false;
    if (TOPIC_RE.test(qn)) return false;
    return /^(tell me more|more|more about|and|yes|yeah|yep|elaborate|details|expand|go on|explain|ok|okay|sure|interesting|wait|so|really|how|why)\b/.test(qn) || /tell me more|expand|elaborate|more about/.test(qn);
  }

  // ---------- persistence ----------
  function saveState() {
    try {
      sessionStorage.setItem("nivi-cb-open", els.panel.hidden ? "0" : "1");
      sessionStorage.setItem("nivi-cb-history", els.body.innerHTML);
    } catch {}
  }
  function restoreState() {
    try {
      const h = sessionStorage.getItem("nivi-cb-history");
      if (h) { els.body.innerHTML = h; els.body.scrollTop = els.body.scrollHeight; return true; }
    } catch {}
    return false;
  }

  // ---------- rendering ----------
  function addBot() {
    const b = els.body;
    const w = document.createElement("div");
    w.className = "nivi-cb-msg bot";
    b.appendChild(w);
    b.scrollTop = b.scrollHeight;
    return w;
  }
  function renderUser(t) {
    const d = document.createElement("div");
    d.className = "nivi-cb-msg user";
    d.textContent = t;
    els.body.appendChild(d);
    els.body.scrollTop = els.body.scrollHeight;
  }
  function renderBot(html) {
    const w = addBot();
    w.innerHTML = html;
    bindLinks(w);
    saveState();
    return w;
  }
  function renderChips(list) {
    const r = document.createElement("div");
    r.className = "nivi-cb-chips";
    list.forEach((t) => {
      const b = document.createElement("button");
      b.className = "nivi-cb-chip";
      b.textContent = t;
      b.addEventListener("click", () => handleQuery(t, true));
      r.appendChild(b);
    });
    els.body.appendChild(r);
    els.body.scrollTop = els.body.scrollHeight;
    saveState();
  }
  function typing(on) {
    let t = q("nivi-cb-typing");
    if (on) {
      if (t) return;
      t = document.createElement("div");
      t.id = "nivi-cb-typing";
      t.className = "nivi-cb-typing";
      t.innerHTML = "<i></i><i></i><i></i> purr\u2026";
      els.body.appendChild(t);
      els.body.scrollTop = els.body.scrollHeight;
    } else if (t) t.remove();
  }
  function bindLinks(scope) {
    scope.querySelectorAll("a[href^='/']").forEach((a) => {
      a.addEventListener("click", async (e) => {
        const href = a.getAttribute("href");
        if (href === window.location.pathname) return;
        if (a.getAttribute("target") === "_blank") return;
        e.preventDefault();
        saveState();
        sessionStorage.setItem("nivi-cb-open", "1");
        try {
          const res = await fetch(href, { credentials: "same-origin" });
          const text = await res.text();
          const doc = new DOMParser().parseFromString(text, "text/html");
          const nm = doc.querySelector("main");
          const cm = document.querySelector("main");
          if (nm && cm) cm.innerHTML = nm.innerHTML;
          if (window.runPageInit) window.runPageInit();
          window.history.pushState({}, "", href);
          document.querySelectorAll(".nav-links a").forEach((l) => {
            const p = new URL(l.href).pathname;
            if (p === href) { l.classList.add("active"); l.setAttribute("aria-current", "page"); }
            else { l.classList.remove("active"); l.removeAttribute("aria-current"); }
          });
          saveState();
        } catch { window.location.href = href; }
      });
    });
  }
  function lockUI(on) {
    if (els.input) els.input.disabled = on;
    if (els.send) els.send.disabled = on;
    if (els.inputbar) els.inputbar.classList.toggle("busy", on);
  }

  // ---------- streaming ----------
  function scrollBottom() { els.body.scrollTop = els.body.scrollHeight; }
  async function typeInto(el, text) {
    el.classList.add("streaming");
    const it = 4;
    const steps = Math.max(1, Math.ceil(text.length / it));
    const base = Math.min(70, Math.max(10, 2400 / steps));
    let i = 0;
    while (i < text.length) {
      i = Math.min(text.length, i + it);
      el.textContent = text.slice(0, i);
      scrollBottom();
      await sleep(base * (0.8 + Math.random() * 0.4));
    }
    el.classList.remove("streaming");
  }
  async function readStream(res, el) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let acc = "";
    let hadText = false;
    let errored = false;
    el.classList.add("streaming");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        let obj = null;
        try { obj = JSON.parse(line.slice(5).trim()); } catch { continue; }
        if (obj.type === "chunk" && obj.text) {
          acc += obj.text;
          hadText = true;
          el.textContent = acc;
          scrollBottom();
        } else if (obj.type === "done") {
          errored = false;
        } else if (obj.type === "error") {
          errored = true;
        }
      }
    }
    el.classList.remove("streaming");
    return { ok: hadText && !errored, hadText };
  }
  async function apiStream(msg) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history: turnLog.slice(-6) })
    });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/event-stream")) {
      typing(false);
      const el = addBot();
      const r = await readStream(res, el);
      if (r.hadText) { finish(el); return el.textContent; }
      el.remove();
      throw new Error("empty-stream");
    }
    typing(false);
    const data = await res.json().catch(() => null);
    if (!data) throw new Error("bad-body");
    if (!res.ok && data.fallback) throw new Error("fallback");
    if (!res.ok) throw new Error(data.error || "error");
    if (typeof data.reply === "string" && data.reply) {
      const el = addBot();
      await typeInto(el, catFlavor() + data.reply.replace(/\n/g, "\n"));
      finish(el);
      return el.textContent;
    }
    throw new Error("no-reply");
  }
  function finish(el) { el.classList.remove("streaming"); saveState(); }

  // ---------- expand "tell me more" ----------
  function expandTopic(topic) {
    if (!kb || !topic) return null;
    switch (topic.kind) {
      case "hard": {
        const h = kb.hardSkills;
        return { html: `<b>Hard skills \u2014 full stack</b><br>\u2022 Languages: ${h.programming.join(", ")}<br>\u2022 Web/Backend: ${h.webBackend.join(", ")}<br>\u2022 DB: ${h.databases.join(", ")}<br>\u2022 Tools: ${h.systemsTools.join(", ")}<br>\u2022 ML/AI: ${h.mlAi.join(", ")}<br>\u2022 Cloud: ${h.cloud.join(", ")}<br><span class="nivi-cb-meta">${link("/skills", "View stack \u2192", true)}</span>`, topic: { kind: "hard" }, tech: true };
      }
      case "soft": {
        const soft = kb.softSkills.map((s) => s.name + " \u2014 " + s.evidence).join("<br>");
        return { html: `<b>Soft skills in action</b><br>${soft}<br><span class="nivi-cb-meta">${link("/about", "About \u2192", true)}</span>`, topic: { kind: "soft" }, emoji: true };
      }
      case "proj": {
        const p = kb.projects[topic.idx] || kb.projects[0];
        const feats = (p.features || []).slice(0, 4).map((f) => "\u2022 " + f).join("<br>");
        return { html: `<b>${p.name}</b><br>${p.overview}<br>${feats}${p.metrics ? `<br><span class="nivi-cb-meta">${p.metrics}</span>` : ""}${p.links?.github ? `<br>${link(p.links.github, "GitHub \u2197")}` : ""}`, topic: { kind: "proj", idx: topic.idx }, tech: true };
      }
      case "projs": {
        return { html: `<b>All 6 projects</b><br>${kb.projects.map((p) => `\u2022 <b>${p.name}</b> \u2014 ${p.impact}`).join("<br>")}<br><span class="nivi-cb-meta">${link("/projects", "Open projects \u2192", true)}</span>`, topic: { kind: "projs" }, tech: true };
      }
      case "edu": {
        const b = kb.education[topic.idx] || kb.education[0];
        const cw = (b.coursework || []).slice(0, 6).join(", ");
        return { html: `<b>${b.degree}</b><br>${b.school} \u00b7 ${b.location || ""}<br>${b.duration || b.year || ""} \u00b7 ${b.score}<br><span class="nivi-cb-meta">Coursework: ${cw}</span>`, topic: { kind: "edu", idx: topic.idx }, tech: true };
      }
      case "exp": {
        const e = kb.experience[topic.idx] || kb.experience[0];
        return { html: `<b>${e.role}</b><br>${e.org}<br>\u2022 ${(e.bullets || []).join("<br>\u2022 ")}<br><span class="nivi-cb-meta">${link("/about", "About \u2192", true)}</span>`, topic: { kind: "exp", idx: topic.idx }, tech: true };
      }
      case "com": {
        const c = kb.community[topic.idx] || kb.community[0];
        return { html: `<b>${c.title}</b><br>${c.org}<br>${c.detail}<br><span class="nivi-cb-meta">${link("/community", "View \u2192", true)}</span>`, topic: { kind: "com", idx: topic.idx }, emoji: true };
      }
      case "hobby": {
        return { html: `<b>Off the clock</b><br>She shoots on a budget Android with a bougie eye \u2014 cracked screen, clean shots, no Leica needed.<br>When the city noise gets loud she trades it for peaks and new streets.<br>And lo-fi keeps her company \u2014 tap the \u266a in the nav.<br><span class="nivi-cb-meta">${link("/hobbies", "Hobbies \u2192", true)}</span>`, topic: { kind: "hobby" }, emoji: true };
      }
      case "music": {
        return { html: `<b>Lo-fi on repeat</b><br>\u2022 ${kb.hobbies.playlists.slice(0, 4).map((p) => "\u266a " + p).join("<br>\u2022 ")}<br><span class="nivi-cb-meta">tap \u266a in the nav to play</span>`, topic: { kind: "music" }, emoji: true };
      }
      case "contact": {
        return { html: `<b>Reach Nivi</b><br>${link("mailto:" + kb.contact.email, kb.contact.email)}<br>${link(kb.contact.github, "GitHub \u2197")} \u00b7 ${link(kb.contact.linkedin, "LinkedIn \u2197")}<br><span class="nivi-cb-meta">${kb.availability}</span>`, topic: { kind: "contact" }, emoji: true };
      }
      case "about": {
        return { html: `<b>Nivi Jha</b><br>${kb.profile.bio}<br><span class="nivi-cb-meta">${kb.profile.location} \u00b7 ${link("/about", "About \u2192", true)}</span>`, topic: { kind: "about" }, emoji: true };
      }
    }
    return null;
  }

  // ---------- offline intent answers ----------
  function answerFor(query) {
    const qn = normalize(query);
    if (!qn) return null;
    if (/^(hi|hello|hey|hai|hii|yo|namaste)\b/.test(qn)) {
      return { html: `Hey! I'm Nivi's cat. Curious about what she's been building? Her skills, projects, hobbies \u2014 I've got stories for all of it. Just ask.`, emoji: false };
    }
    if (/^(yes|yeah|yep|yup|sure|ok|okay|alright|do tell)\b/.test(qn) && lastTopic?.followUp === "hobbies") {
      return expandTopic({ kind: "hobby" });
    }
    if (/what can.*(nivi|she)\b.*(do|offer)|hire.*nivi|work with nivi|why.*(hire|nivi)|elevator|pitch me|sell me/.test(qn)) {
      return { html: `<b>What Nivi can do for you</b><br>She builds end-to-end \u2014 full-stack (React/Node/Mongo, 36 REST endpoints), AI (YOLOv8 94.4% mAP, FastAPI), and cloud (Lambda/DynamoDB + Linux automation).<br><span class="nivi-cb-meta">Open to internships &amp; projects \u2014 ${link("/contact", "Contact \u2192", true)} \u00b7 ${link("/projects", "Projects \u2192", true)}</span>`, tech: true };
    }
    if (isMoreQuery(qn)) {
      const ex = expandTopic(lastTopic);
      if (ex) return ex;
    }
    if (isAboutCat(qn)) {
      return { html: `I'm Nivi's cat \u2014 I only know her portfolio. Ask me: skills, projects, hobbies.`, emoji: true };
    }
    if (/help|what can i (ask|type|say)|ideas|something to ask/.test(qn)) {
      return { html: `I can help with \u2014 skills, projects, hobbies, contact\u2026 try one below.`, chips: true, emoji: true };
    }
    if (/soft skill|non.?technical|apart from technical|what else.*(bring|nivi)|beyond tech|human skill|strengths/.test(qn)) {
      const s = kb.softSkills.slice(0, 3).map((x) => x.name).join(" \u00b7 ");
      return { html: `<b>Beyond tech</b><br>${s} \u2014 she leads teams (JYC/IEEE), ships with others (SIH/Murious), and owns her work (6 projects).<br><span class="nivi-cb-meta">She also loves photography + lo-fi \u2014 want to hear that story?</span>`, topic: { kind: "soft", followUp: "hobbies" }, emoji: true };
    }
    if (/hard skill|tech stack|stack|technolog|programming language|which (tech|language|tools)/.test(qn)) {
      const h = kb.hardSkills;
      return { html: `<b>Hard skills</b><br>She speaks ${h.coreStack.slice(0, 4).join(", ")} like a second language \u2014 plus Python and AWS.<br>\u2022 ${h.programming.slice(0, 3).join(", ")}<br>\u2022 ${h.webBackend.slice(0, 2).join(", ")} \u00b7 ${h.cloud.join(", ")}<br><span class="nivi-cb-meta">${link("/skills", "View stack \u2192", true)}</span>`, topic: { kind: "hard" }, tech: true };
    }
    if (/project|medtracker|cardiovision|chat constellation|review analyzer|linux monitor|security agent|what (has|did) she build|built anything/.test(qn)) {
      const m = kb.projects.find((p) => qn.includes(normalize(p.name)));
      if (m) {
        const i = kb.projects.indexOf(m);
        return { html: `<b>${m.name}</b><br>${m.impact} \u2014 and it actually runs. ${m.stack.slice(0, 3).join(", ")} under the hood.<br><span class="nivi-cb-meta">${m.links?.github ? link(m.links.github, "GitHub \u2197") + " \u00b7 " : ""}${link("/projects", "All \u2192", true)}</span>`, topic: { kind: "proj", idx: i }, tech: true };
      }
      return { html: `<b>6 projects, all end-to-end</b><br>${kb.projects.map((p) => `\u2022 ${p.name}`).join("<br>")}<br><span class="nivi-cb-meta">${link("/projects", "Open projects \u2192", true)}</span>`, topic: { kind: "projs" }, tech: true };
    }
    if (/education|b\.?tech|cgpa|gpa|school|juit|university|college|coursework|certificate|study/.test(qn)) {
      const b = kb.education[0];
      return { html: `<b>Her academic story</b><br>${b.degree} at ${b.school.split(",")[0]} \u2014 in the game since 2023.<br><span class="nivi-cb-meta">${b.duration} \u00b7 ${b.score}</span>`, topic: { kind: "edu", idx: 0 }, tech: true };
    }
    if (/experience|intern|iit delhi|work experience|what.*(done|worked|internship)/.test(qn)) {
      const e = kb.experience[0];
      return { html: `<b>${e.role}</b><br>${e.org.split(",")[0]} \u2014 ${e.duration}. Hands-on network automation, Linux, and Docker.<br><span class="nivi-cb-meta">${link("/about", "About \u2192", true)}</span>`, topic: { kind: "exp", idx: 0 }, tech: true };
    }
    if (/community|hackathon|sih|murious|gdg|azure|ieee|jyc|event|team lead|conduct/.test(qn)) {
      return { html: `<b>Community</b><br>She's been deep in the campus circuit \u2014 JYC &amp; IEEE lead, SIH + Murious organiser, GDG Cloud &amp; Azure Ignite attendee.<br><span class="nivi-cb-meta">${link("/community", "View \u2192", true)}</span>`, topic: { kind: "com", idx: 0 }, emoji: true };
    }
    if (/music|track|song|audio|spotify|playlist/.test(qn)) {
      return { html: `<b>\u266a 3 tracks</b> \u2014 tap \u266a in the nav<br>dancingCat \u00b7 goto-anthem \u00b7 me-currently<br><span class="nivi-cb-meta">lo-fi while you scroll</span>`, topic: { kind: "music" }, emoji: true };
    }
    if (/hobb|off the clock|photography|photo|android|travel|mountain|camera/.test(qn)) {
      return { html: `<b>Off the clock</b><br>Budget Android, bougie eye \u2014 cracked screen, clean shots.<br><span class="nivi-cb-meta">${link("/hobbies", "Hobbies \u2192", true)} \u00b7 \u266a 3 tracks</span>`, topic: { kind: "hobby" }, emoji: true };
    }
    if (/contact|email|linkedin|github|resume|reach|available|hire|talk to/.test(qn)) {
      return { html: `<b>Contact</b><br>${link("mailto:" + kb.contact.email, kb.contact.email)}<br><span class="nivi-cb-meta">${kb.availability}</span>`, topic: { kind: "contact" }, emoji: true };
    }
    if (/about nivi|who is nivi|about herself|about her\b|about yourself|tell me about (herself|her|yourself)|(tell me|tell) about (nivi|her|yourself)/.test(qn)) {
      return { html: `<b>Nivi Jha</b><br>She's a B.Tech CSE student at JUIT Solan, in the game since 2023 \u2014 8.5 CGPA and six full-stack builds to her name.<br>Full-stack builder, AI tinkerer, campus community lead (JYC &amp; IEEE), budget-photographer-by-night with a cracked Android and an eye for clean frames.<br><span class="nivi-cb-meta">${link("/about", "About \u2192", true)}</span>`, topic: { kind: "about" }, emoji: true };
    }
    let best = null, scv = -1;
    const qt = tokens(qn);
    for (const d of docs) { const s = scoreDoc(qt, d.toks); if (s > scv) { scv = s; best = d; } }
    if (best && scv >= 2) {
      if (best.kind === "hard") return { html: `<b>Hard skills</b><br>\u2022 ${kb.hardSkills.coreStack.join(", ")}<br><span class="nivi-cb-meta">${link("/skills", "View stack \u2192", true)}</span>`, topic: { kind: "hard" }, tech: true };
      if (best.kind === "soft") { const s = kb.softSkills.slice(0, 3).map((x) => x.name).join(" \u00b7 "); return { html: `<b>Soft skills</b><br>${s}`, topic: { kind: "soft" }, emoji: true }; }
      if (best.kind === "proj") { const p = kb.projects[best.idx]; return { html: `<b>${p.name}</b> \u2014 ${p.impact}<br><span class="nivi-cb-meta">[${p.stack.slice(0, 3).join(", ")}]</span>`, topic: { kind: "proj", idx: best.idx }, tech: true }; }
      if (best.kind === "edu") { const b = kb.education[best.idx] || kb.education[0]; return { html: `<b>${b.degree}</b><br>${b.school}`, topic: { kind: "edu", idx: best.idx }, tech: true }; }
      if (best.kind === "exp") { const e = kb.experience[best.idx] || kb.experience[0]; return { html: `<b>${e.role}</b><br>${e.org}`, topic: { kind: "exp", idx: best.idx }, tech: true }; }
      if (best.kind === "com") return { html: `<b>Community</b><br>${kb.community.slice(0, 2).map((c) => c.title).join(" \u00b7 ")}`, topic: { kind: "com" }, emoji: true };
      if (best.kind === "hobby") return { html: `<b>Off the clock</b><br>${kb.hobbies.tagline}`, topic: { kind: "hobby" }, emoji: true };
      if (best.kind === "about") return { html: `<b>Nivi Jha</b> \u2014 ${kb.profile.title}`, topic: { kind: "about" }, emoji: true };
      if (best.kind === "contact") return { html: `<b>Contact</b><br>${link("mailto:" + kb.contact.email, kb.contact.email)}`, topic: { kind: "contact" }, emoji: true };
    }
    return null;
  }
  function friendlyRefusal() { return `Only Nivi stuff, meow \u2014 I only know her portfolio. <span class="nivi-cb-meta">try: hard skills / projects / hobbies</span>`; }

  // ---------- chips policy ----------
  function maybeChips(a, query) {
    if (a.chips || /help|what can i (ask|type|say)/.test(normalize(query))) {
      renderChips(quickChips);
      return;
    }
    if (stuckCount >= 2) {
      stuckCount = 0;
      renderChips(quickChips);
    }
  }

  // ---------- main handler ----------
  async function handleQuery(raw, viaChip) {
    const t = raw.trim();
    if (!t) return;
    renderUser(t);
    els.input.value = "";
    if (viaChip) els.body.querySelectorAll(".nivi-cb-chips").forEach((n) => n.remove());
    lockUI(true);
    typing(true);
    let finalText = null;
    try { finalText = await apiStream(t); } catch (e) {}
    typing(false);
    if (finalText) {
      stuckCount = 0;
      turnLog.push({ role: "user", text: t });
      turnLog.push({ role: "model", text: finalText });
      lockUI(false);
      return;
    }
    let a = answerFor(t);
    if (!a) { a = { html: friendlyRefusal(), stuck: true }; }
    if (a.stuck) stuckCount = Math.min(stuckCount + 1, 9); else stuckCount = 0;
    if (a.topic) lastTopic = a.topic;
    const flavor = a.emoji ? catFlavor() : "";
    const plain = stripHtml(a.html);
    const el = addBot();
    await typeInto(el, flavor ? flavor + plain : plain);
    el.innerHTML = (flavor ? flavor : "") + a.html;
    bindLinks(el);
    el.classList.remove("streaming");
    saveState();
    maybeChips(a, t);
    turnLog.push({ role: "user", text: t });
    turnLog.push({ role: "model", text: stripHtml((flavor ? flavor : "") + a.html) });
    lockUI(false);
  }

  // ---------- KB loading ----------
  async function loadKBFromCache() {
    try {
      const c = sessionStorage.getItem(KB_CACHE_KEY);
      if (c) { kb = JSON.parse(c); docs = buildDocs(); return true; }
    } catch {}
    return false;
  }
  async function refreshKB() {
    try {
      const r = await fetch(KB_URL);
      if (!r.ok) throw 0;
      kb = await r.json();
      docs = buildDocs();
      sessionStorage.setItem(KB_CACHE_KEY, JSON.stringify(kb));
      return true;
    } catch { return !!kb; }
  }
  function buildDocs() {
    const d = [];
    const hs = kb.hardSkills;
    d.push({ id: "hard", text: `hard skills ${hs.programming.join(" ")} ${hs.webBackend.join(" ")} ${hs.databases.join(" ")} ${hs.systemsTools.join(" ")} ${hs.mlAi.join(" ")} ${hs.cloud.join(" ")} ${hs.coreStack.join(" ")}`, kind: "hard" });
    d.push({ id: "soft", text: kb.softSkills.map((s) => s.name + " " + s.evidence).join(" "), kind: "soft" });
    kb.projects.forEach((p, i) => d.push({ id: "proj" + i, text: `project ${p.name} ${p.impact} ${p.stack.join(" ")} ${p.overview}`, kind: "proj", idx: i }));
    kb.education.forEach((e, i) => d.push({ id: "edu" + i, text: `education ${e.degree} ${e.school} ${e.location || ""} ${e.duration || e.year || ""} ${e.score || ""} ${(e.coursework || []).join(" ")}`, kind: "edu", idx: i }));
    kb.experience.forEach((e, i) => d.push({ id: "exp" + i, text: `experience ${e.role} ${e.org} ${e.duration} ${e.bullets.join(" ")}`, kind: "exp", idx: i }));
    kb.community.forEach((c, i) => d.push({ id: "com" + i, text: `community ${c.title} ${c.org} ${c.kicker} ${c.detail}`, kind: "com", idx: i }));
    d.push({ id: "hobby", text: `hobbies ${kb.hobbies.polaroids.join(" ")} ${kb.hobbies.photographer || ""} ${kb.hobbies.music || ""} ${kb.hobbies.facts.join(" ")}`, kind: "hobby" });
    d.push({ id: "contact", text: `contact ${kb.contact.email} ${kb.contact.github} ${kb.contact.linkedin} ${kb.availability}`, kind: "contact" });
    d.push({ id: "about", text: `about ${kb.profile.name} ${kb.profile.title} ${kb.profile.bio} ${kb.profile.tagline}`, kind: "about" });
    return d.map((d) => ({ ...d, toks: tokens(d.text) }));
  }
  function initState() {
    if (restoreState()) return;
    renderBot(`Hey! I'm Nivi's cat. Curious about what she's been building? Her skills, projects, hobbies \u2014 I've got stories for all of it. Just ask.`);
    saveState();
  }

  // ---------- boot ----------
  async function boot() {
    els.btn = q("nivi-cb-btn");
    els.panel = q("nivi-cb-panel");
    els.body = q("nivi-cb-body");
    els.input = q("nivi-cb-input");
    els.send = q("nivi-cb-send");
    els.close = q("nivi-cb-close");
    els.clear = q("nivi-cb-clear");
    els.inputbar = document.querySelector(".nivi-cb-inputbar");
    if (!els.btn) return;
    const loaded = await loadKBFromCache();
    if (loaded) refreshKB();
    else {
      const ok = await refreshKB();
      if (!ok) { renderBot("Couldn't load the knowledge base. Refresh."); return; }
    }
    initState();
    try {
      if (sessionStorage.getItem("nivi-cb-open") === "1") {
        els.panel.hidden = false;
        els.btn.setAttribute("aria-expanded", "true");
        dockCatToPanel(true);
        const c = document.getElementById("oneko");
        if (c) c.setAttribute("aria-expanded", "true");
      }
    } catch {}
    let last = null;
    function dockCatToPanel(open) {
      const cat = document.getElementById("oneko");
      if (!cat) return;
      if (open) {
        cat.style.position = "fixed";
        cat.style.left = "auto";
        cat.style.top = "auto";
        cat.style.right = "42px";
        cat.style.bottom = "18px";
        cat.style.zIndex = "1005";
        cat.style.transition = "right .28s ease, bottom .28s ease";
      } else {
        cat.style.position = "";
        cat.style.left = "";
        cat.style.top = "";
        cat.style.right = "";
        cat.style.bottom = "";
        cat.style.zIndex = "";
        cat.style.transition = "";
        if (window.innerWidth <= 768 && typeof window.placeNavbarCat === "function") try { window.placeNavbarCat(); } catch {}
      }
    }
    function open(tr) { els.panel.hidden = false; els.btn.setAttribute("aria-expanded", "true"); last = tr || els.btn; const c = document.getElementById("oneko"); if (c) c.setAttribute("aria-expanded", "true"); dockCatToPanel(true); saveState(); els.input.focus(); els.body.scrollTop = els.body.scrollHeight; }
    function close() { els.panel.hidden = true; els.btn.setAttribute("aria-expanded", "false"); const c = document.getElementById("oneko"); if (c) c.setAttribute("aria-expanded", "false"); dockCatToPanel(false); saveState(); if (last && document.contains(last)) last.focus(); else { const co = document.getElementById("oneko"); if (co && co.dataset.cbBound) co.focus(); else els.btn.focus(); } last = null; }
    function toggle(tr) { els.panel.hidden ? open(tr) : close(); }
    els.btn.addEventListener("click", () => toggle(els.btn));
    els.close.addEventListener("click", close);
    els.clear.addEventListener("click", () => { els.body.innerHTML = ""; turnLog = []; lastTopic = null; stuckCount = 0; try { sessionStorage.removeItem("nivi-cb-history"); } catch {} initState(); });
    els.send.addEventListener("click", () => handleQuery(els.input.value));
    els.input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleQuery(els.input.value); } if (e.key === "Escape") close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !els.panel.hidden) close(); });
    function bindCat() {
      const cat = document.getElementById("oneko");
      if (!cat || cat.dataset.cbBound) return;
      cat.dataset.cbBound = "1";
      cat.setAttribute("role", "button");
      cat.setAttribute("tabindex", "0");
      cat.setAttribute("aria-label", "Chat with Nivi");
      cat.setAttribute("aria-controls", "nivi-cb-panel");
      cat.setAttribute("aria-expanded", "false");
      cat.style.cursor = "pointer";
      cat.addEventListener("click", () => toggle(cat));
      cat.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(cat); } });
    }
    bindCat();
    const obs = new MutationObserver(bindCat);
    obs.observe(document.body, { childList: true });
    setTimeout(bindCat, 800);
    setInterval(bindCat, 2000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
