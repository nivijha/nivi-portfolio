(function (root) {
  var N = root.NiviCB = root.NiviCB || {};

  var CATEGORY_KB = {
    "ML": ["ml/ai", "machine", "ai/llm"],
    "AI": ["ml/ai", "ai/llm", "generative"],
    "Computer Vision": ["vision"],
    "NLP": ["nlp"],
    "LLM/GenAI": ["ai/llm", "llm", "generative"],
    "RAG": ["rag"],
    "Cloud/AWS": ["cloud", "aws", "serverless"],
    "Full-Stack": ["full-stack", "fullstack"],
    "Frontend": ["frontend", "front-end"],
    "Backend": ["backend", "back-end"],
    "Databases": ["database"],
    "DevOps": ["devops", "automation"],
    "Linux": ["linux"],
    "Security": ["security"],
    "Healthcare": ["healthcare", "health"],
    "Graph": ["graph"],
    "Serverless": ["serverless"]
  };

  function normalizeTech(t) {
    return String(t || "").toLowerCase().replace(/\((strong|intermediate|beginner)\)/g, "").replace(/[^a-z0-9]/g, "").trim();
  }

  function findProject(kb, name) {
    for (var i = 0; i < (kb.projects || []).length; i++) {
      if (kb.projects[i].name === name) return kb.projects[i];
    }
    if (name) {
      var n = name.toLowerCase();
      for (var j = 0; j < (kb.projects || []).length; j++) {
        if (kb.projects[j].name.toLowerCase().indexOf(n) !== -1) return kb.projects[j];
      }
    }
    return null;
  }

  function projectMatchesCategory(proj, cat) {
    var cats = (proj.category || []).map(function (c) { return String(c).toLowerCase(); }).join(" ");
    var terms = CATEGORY_KB[cat] || [cat.toLowerCase()];
    for (var i = 0; i < terms.length; i++) {
      if (cats.indexOf(terms[i]) !== -1) return true;
    }
    return false;
  }

  function projectHasTech(proj, tech) {
    var wanted = normalizeTech(tech);
    var stack = (proj.stack || []).map(normalizeTech);
    for (var i = 0; i < stack.length; i++) {
      var s = stack[i];
      if (wanted && (s.indexOf(wanted) !== -1 || wanted.indexOf(s) !== -1)) return true;
    }
    return false;
  }

  function buildDocs(kb) {
    var d = [];
    if (!kb) return d;
    function push(id, kind, text, idx) {
      d.push({ id: id, kind: kind, idx: idx, text: text, toks: text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean) });
    }
    var hs = kb.hardSkills || {};
    push("hard", "hard", "hard skills " + (hs.programming || []).join(" ") + " " + (hs.webBackend || []).join(" ") + " " + (hs.databases || []).join(" ") + " " + (hs.systemsTools || []).join(" ") + " " + (hs.mlAi || []).join(" ") + " " + (hs.cloud || []).join(" ") + " " + (hs.coreStack || []).join(" "));
    push("soft", "soft", (kb.softSkills || []).map(function (s) { return s.name + " " + s.evidence; }).join(" "));
    (kb.projects || []).forEach(function (p, i) {
      push("proj" + i, "proj", "project " + p.name + " " + p.impact + " " + (p.stack || []).join(" ") + " " + (p.overview || "") + " " + ((p.category || []).join(" ")), i);
    });
    (kb.education || []).forEach(function (e, i) {
      push("edu" + i, "edu", "education " + e.degree + " " + e.school + " " + (e.location || "") + " " + (e.duration || e.year || "") + " " + (e.score || "") + " " + (e.coursework || []).join(" "), i);
    });
    (kb.experience || []).forEach(function (e, i) {
      push("exp" + i, "exp", "experience " + e.role + " " + e.org + " " + (e.duration || "") + " " + (e.bullets || []).join(" "), i);
    });
    (kb.community || []).forEach(function (c, i) {
      push("com" + i, "com", "community " + c.title + " " + c.org + " " + (c.kicker || "") + " " + (c.detail || ""), i);
    });
    if (kb.hobbies) {
      push("hobby", "hobby", "hobbies " + (kb.hobbies.polaroids || []).join(" ") + " " + (kb.hobbies.tagline || "") + " " + (kb.hobbies.photographer || "") + " " + (kb.hobbies.facts || []).join(" "));
      push("music", "hobby", "music playlists " + (kb.hobbies.playlists || []).join(" "));
    }
    if (kb.contact) push("contact", "contact", "contact " + kb.contact.email + " " + kb.contact.github + " " + kb.contact.linkedin + " " + (kb.availability || ""));
    if (kb.profile) push("about", "about", "about " + kb.profile.name + " " + kb.profile.title + " " + kb.profile.bio + " " + kb.profile.tagline);
    return d;
  }

  function fuzzyTop(docs, qn, n) {
    var qt = qn.split(/[^a-z0-9]+/).filter(Boolean);
    if (!qt.length) return [];
    var scored = docs.map(function (d) {
      var sc = 0;
      qt.forEach(function (t) {
        if (d.toks.indexOf(t) !== -1) sc += 2;
        else if (d.toks.some(function (dt) { return dt.indexOf(t) === 0 || t.indexOf(dt) === 0; })) sc += 1;
      });
      return { doc: d, sc: sc };
    }).filter(function (x) { return x.sc >= 2; }).sort(function (a, b) { return b.sc - a.sc; });
    return (n == null ? scored.slice(0, 1) : scored.slice(0, n)).map(function (x) { return x.doc; });
  }

  function retrieve(opts) {
    var kb = opts.kb, route = opts.route, qn = opts.qn;
    var docs = buildDocs(kb);

    if (route.project) {
      var prj = findProject(kb, route.project);
      return { kind: "project", project: prj, projects: prj ? [prj] : [], docs: docs };
    }
    var cats = route.categories || [];
    var techs = route.technologies || [];
    if (cats.length) {
      var byCat = (kb.projects || []).filter(function (p) {
        return cats.some(function (c) { return projectMatchesCategory(p, c); });
      });
      return { kind: "projects-cat", project: null, projects: byCat, categories: cats, docs: docs };
    }
    if (techs.length) {
      var byTech = (kb.projects || []).filter(function (p) {
        return techs.some(function (t) { return projectHasTech(p, t); });
      });
      return { kind: "projects-tech", project: null, projects: byTech, technologies: techs, docs: docs };
    }
    if (route.intent && route.intent.name === "PROJECTS") {
      return { kind: "projects-all", project: null, projects: kb.projects.slice(), docs: docs };
    }
    if (route.intent && route.intent.name === "PROJECT_COMPARISON") {
      return { kind: "comparison", project: null, projects: kb.projects.slice(), docs: docs };
    }
    var top = fuzzyTop(docs, qn);
    return { kind: top.length ? "fuzzy" : "none", project: null, projects: [], docs: docs, fuzzyDocs: top };
  }

  N.retrieve = retrieve;
  N.CATEGORY_KB = CATEGORY_KB;
  N.findProject = findProject;
  N.projectMatchesCategory = projectMatchesCategory;
  N.projectHasTech = projectHasTech;
})(typeof window !== "undefined" ? window : globalThis);
