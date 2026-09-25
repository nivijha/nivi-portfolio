(function (root) {
  var N = root.NiviCB = root.NiviCB || {};

  var PROJECT_ALIASES = {
    "MedTracker": ["medtracker", "med tracker", "medtracker app", "medical document"],
    "CardioVision": ["cardiovision", "cardio vision", "cardio", "angiography"],
    "Chat Constellation": ["chat constellation", "constellation", "graph chat", "chatconstellation"],
    "AI Product Review Analyzer": ["review analyzer", "product review", "review analyser", "product review analyzer", "aws product review"],
    "Linux System Monitor & Automation Suite": ["system monitor", "linux monitor", "automation suite", "linux system monitor", "linux system", "infra monitor"],
    "Security Event Collection & Analysis Agent": ["security agent", "security event", "event collection", "audit agent", "security monitoring", "collection agent"]
  };

  var CATEGORY_TERMS = [
    { cat: "ML", terms: ["ml", "machine learning", "deep learning"] },
    { cat: "AI", terms: ["ai", "artificial intelligence"] },
    { cat: "Computer Vision", terms: ["computer vision", "vision", "object detection", "segmentation", "grad cam"] },
    { cat: "NLP", terms: ["nlp", "natural language", "sentiment", "key phrase", "comprehend"] },
    { cat: "LLM/GenAI", terms: ["llm", "generative ai", "genai", "gpt", "large language", "rag"] },
    { cat: "RAG", terms: ["rag", "retrieval augmented", "embedding", "vector"] },
    { cat: "Cloud/AWS", terms: ["aws", "lambda", "serverless", "dynamodb", "api gateway", "cloud"] },
    { cat: "Full-Stack", terms: ["full stack", "fullstack", "mern", "end to end"] },
    { cat: "Frontend", terms: ["frontend", "front end", "ui", "react"] },
    { cat: "Backend", terms: ["backend", "back end", "rest api", "api"] },
    { cat: "Databases", terms: ["database", "mongodb", "mongo", "redis", "mysql"] },
    { cat: "DevOps", terms: ["devops", "docker", "automation", "cron", "ci cd"] },
    { cat: "Linux", terms: ["linux", "bash"] },
    { cat: "Security", terms: ["security", "auth", "agent"] },
    { cat: "Healthcare", terms: ["healthcare", "health", "medical", "clinical"] },
    { cat: "Graph", terms: ["graph"] }
  ];


  function termBoundary(text, term) {
    var start = 0, idx;
    while ((idx = text.indexOf(term, start)) !== -1) {
      var before = idx === 0 ? " " : text.charAt(idx - 1);
      var after = idx + term.length >= text.length ? " " : text.charAt(idx + term.length);
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
      start = idx + 1;
    }
    return false;
  }
  var STOPWORDS = ["the", "a", "an", "and", "or", "of", "for", "with", "about", "her", "his", "my", "your", "she", "he", "i", "it", "this", "that", "their", "on", "in", "at", "to", "from", "by", "me", "us", "them", "you", "how", "what", "why", "who", "new", "any", "things", "thing", "stuff", "answer", "all", "more", "some", "there", "been"];

  function detectTargetTech(qn) {
    var m = qn.match(/\b(know|knows|use|uses|used|familiar with|good with|good at|work with|worked with|code in|write|writes|proficient in|experienced with)\s+([a-z0-9][a-z0-9 ]*)/);
    if (!m) return null;
    var t = m[2].split(" ")[0];
    if (t && STOPWORDS.indexOf(t) !== -1) return null;
    return t;
  }

  var TECH_VARIANTS = {
    "javascript": ["js", "javascript"],
    "node.js": ["node js", "node"],
    "express.js": ["express js", "express"],
    "jsx": ["jsx"]
  };

  var _techCache = null;
  function buildTechList(kb) {
    if (_techCache) return _techCache;
    var map = {};
    function add(t) {
      if (!t) return;
      var cleaned = String(t).toLowerCase().replace(/\((strong|intermediate|beginner)\)/g, "").replace(/\([^)]*\)/g, "").trim();
      if (!cleaned) return;
      var tokens = [cleaned, cleaned.replace(/[^a-z0-9 ]/g, " ").replace(/ {2,}/g, " ").trim()];
      var v = TECH_VARIANTS[cleaned] || [];
      tokens = tokens.concat(v);
      var key = cleaned.split(" ")[0].slice(0, 12);
      map[key] = map[key] || { name: cleaned, tokens: [] };
      tokens.forEach(function (tk) { if (tk && map[key].tokens.indexOf(tk) === -1) map[key].tokens.push(tk); });
    }
    var hs = kb.hardSkills || {};
    ["coreStack", "programming", "webBackend", "databases", "systemsTools", "mlAi", "cloud"].forEach(function (k) {
      (hs[k] || []).forEach(add);
    });
    (kb.projects || []).forEach(function (p) { (p.stack || []).forEach(add); });
    var out = [];
    Object.keys(map).forEach(function (k) { out.push(map[k]); });
    _techCache = out;
    return out;
  }

  function detectProjects(qn, kb) {
    var found = [];
    (kb.projects || []).forEach(function (p) {
      var aliases = PROJECT_ALIASES[p.name] || [p.name.toLowerCase()];
      for (var i = 0; i < aliases.length; i++) {
        if (qn.indexOf(aliases[i]) !== -1) { found.push(p.name); break; }
      }
    });
    return found;
  }

  function detectTechnologies(qn, kb) {
    var techs = buildTechList(kb);
    var found = [];
    techs.forEach(function (t) {
      for (var i = 0; i < t.tokens.length; i++) {
        var tk = t.tokens[i];
        if (tk.length > 1 && termBoundary(qn, tk)) { var dn = String(t.name).toLowerCase(); if (found.indexOf(dn) === -1) found.push(dn); break; }
      }
    });
    return found;
  }

  function detectCategories(qn) {
    var found = [];
    for (var i = 0; i < CATEGORY_TERMS.length; i++) {
      var c = CATEGORY_TERMS[i];
      for (var j = 0; j < c.terms.length; j++) {
        if (termBoundary(qn, c.terms[j])) { found.push(c.cat); break; }
      }
    }
    return found;
  }

    var THE_OTHER_RE = /(the other|other project|other one)/;

  function detectReference(qn) {
    if (THE_OTHER_RE.test(qn)) return { kind: "other", categories: detectCategories(qn) };

    if (/\b(first|first one|the first)\b/.test(qn)) return { kind: "project", idx: 0 };
    if (/\b(second one|the second|second)\b/.test(qn)) return { kind: "project", idx: 1 };
    if (/\b(third one|the third|third)\b/.test(qn)) return { kind: "project", idx: 2 };
    if (/\b(it|this project|that project|the project|that one|this one|the same|same thing|that thing)\b/.test(qn)) return { kind: "current" };
    return null;
  }

  function detectEntities(qn, kb) {
    qn = N.normalize(qn);
    var projects = detectProjects(qn, kb);
    var technologies = detectTechnologies(qn, kb);
    var categories = detectCategories(qn);
    var tgt = detectTargetTech(qn);
    if (tgt && technologies.indexOf(tgt) === -1) technologies.push(tgt);
    return {
      projects: projects,
      technologies: technologies,
      categories: categories,
      mentionsNivi: /\b(nivi|she|her|herself)\b/.test(qn),
      reference: detectReference(qn)
    };
  }

  N.PROJECT_ALIASES = PROJECT_ALIASES;
  N.CATEGORY_TERMS = CATEGORY_TERMS;
  N.detectEntities = detectEntities;
  N.buildTechList = buildTechList;
})(typeof window !== "undefined" ? window : globalThis);
