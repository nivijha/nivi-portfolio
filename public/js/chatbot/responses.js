(function (root) {
  var N = root.NiviCB = root.NiviCB || {};

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stripTags(html) {
    return String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }

  function link(href, label, internal) {
    var target = internal ? "" : ' target="_blank" rel="noopener"';
    return '<a href="' + esc(href) + '"' + target + ">" + esc(label) + "</a>";
  }

  function meta(s) {
    return '<span class="nivi-cb-meta">' + s + "</span>";
  }

  function projectChips(name) {
    switch (name) {
      case "MedTracker": return ["How does the RAG system work?", "What technologies were used?", "What was the hardest part?"];
      case "CardioVision": return ["How was it trained?", "What were the results?", "What was challenging?"];
      case "Chat Constellation": return ["How does the graph work?", "What technologies were used?", "What was challenging?"];
      case "AI Product Review Analyzer": return ["How does the AWS pipeline work?", "What technologies were used?", "What were the results?"];
      case "Linux System Monitor & Automation Suite": return ["How does it work?", "What technologies were used?", "What were the results?"];
      case "Security Event Collection & Analysis Agent": return ["How does it work?", "What technologies were used?", "What was challenging?"];
      default: return ["How was it built?", "What were the results?", "What was challenging?"];
    }
  }

  function suggestions(opts) {
    var intent = opts.intent, project = opts.project, categories = opts.categories;
    if (opts.ambiguous) {
    var cands = opts.candidates || [];
    if (cands.length) {
      var chips2 = cands.slice(0, 3);
      if (chips2.indexOf("Show me her projects") === -1) chips2.push("Show me her projects");
      return chips2;
    }
    return ["Show me her projects", "What's her tech stack?", "Why should I hire her?"];
  }
    if (project) return projectChips(project);
    if (categories && categories.length) {
      var c = String(categories[0]);
      if (c === "ML" || c === "AI" || c === "Computer Vision") return ["What ML projects does she have?", "Tell me about CardioVision", "What's her tech stack?"];
      if (c === "Cloud/AWS" || c === "Serverless") return ["What projects use AWS?", "Tell me about the AWS pipeline", "What's her tech stack?"];
      return ["Show me her projects", "What's her tech stack?", "Why should I hire her?"];
    }
    if (intent === "SKILLS" && /hard|stack|tech/i.test(opts.rawIntent)) return ["Show me her projects", "Tell me about CardioVision", "Why should I hire her?"];
    switch (intent) {
      case "SKILLS": return ["Show me her projects", "Tell me about CardioVision", "Why should I hire her?"];
      case "PROJECTS": return ["Tell me about CardioVision", "What's her tech stack?", "Why should I hire her?"];
      case "HIRING":
      case "WHY_HIRE": return ["Show me her projects", "What's her tech stack?", "Contact Nivi"];
      case "ROLE":
      case "WHY_CAT":
      case "GREETING":
      case "HELP": return ["Show me her projects", "What's her tech stack?", "Why should I hire her?"];
      case "EDUCATION": return ["Show me her projects", "What's her tech stack?", "Why should I hire her?"];
      default: return ["Show me her projects", "What's her tech stack?", "Why should I hire her?"];
    }
  }
  function projectStory(prj, kb) {
    var out = "<b>" + esc(prj.name) + "</b> — " + esc(prj.impact) + ".";
    if (prj.problem) out += "<br>" + esc(prj.problem);
    if (prj.motivation) out += "<br>" + esc(prj.motivation);
    if (prj.stack && prj.stack.length) out += "<br>Built with " + esc(prj.stack.slice(0, 4).join(", ")) + ".";
    if (prj.challenges && prj.challenges.length) out += "<br>Hardest bit: " + esc(prj.challenges[0]);
    if (prj.results) out += "<br>" + esc(prj.results);
    if (prj.learnings) out += "<br>" + esc(prj.learnings);
    var links = "";
    if (prj.links && prj.links.github) links += link(prj.links.github, "GitHub ↗");
    if (prj.links && prj.links.demo) links += (links ? " · " : "") + link(prj.links.demo, "Demo ↗");
    out += meta((links ? links + " · " : "") + link("/projects", "all projects →", true));
    return out;
  }

  function projectTechnical(prj) {
    var out = "<b>" + esc(prj.name) + "</b> — tech under the hood.";
    if (prj.stack && prj.stack.length) out += "<br>" + esc(prj.stack.join(" · "));
    if (prj.architecture) out += "<br>" + esc(prj.architecture);
    if (prj.features && prj.features.length) out += "<br>" + prj.features.slice(0, 4).map(function (f) { return "• " + esc(f); }).join("<br>");
    if (prj.metrics) out += meta(esc(prj.metrics));
    var links = "";
    if (prj.links && prj.links.github) links += link(prj.links.github, "GitHub ↗");
    if (prj.links && prj.links.demo) links += (links ? " · " : "") + link(prj.links.demo, "Demo ↗");
    out += meta((links ? links + " · " : "") + link("/projects", "project page →", true));
    return out;
  }

  function projectList(projects, kb) {
    if (!projects || !projects.length) return null;
    var out = "<b>Projects that fit</b>";
    projects.forEach(function (p) {
      out += "<br><b>" + esc(p.name) + "</b> — " + esc(p.impact);
    });
    out += meta(link("/projects", "Open projects →", true));
    return out;
  }

  function projectCompare(projects, routes, kb) {
    var out = "<b>Project, by dimension</b>";
    (projects || []).forEach(function (p) {
      var dims = (p.category || []).join(" / ");
      out += "<br><b>" + esc(p.name) + "</b> — " + esc(p.impact) + "<br><span class=\"nivi-cb-meta\">" + esc(dims) + "</span>";
    });
    out += meta("I don't rank them — each wins on a different axis. " + link("/projects", "Details →", true));
    return out;
  }
  function categoryReasons(projects, cats, kb) {
    var out = "<b>Projects that fit</b>";
    (projects || []).forEach(function (p) {
      var why = (p.category || []).slice(0, 3).join(" · ");
      out += "<br><b>" + esc(p.name) + "</b> — " + esc(p.impact) + "<br><span class=\"nivi-cb-meta\">" + esc(why) + "</span>";
    });
    out += meta("Match reasons drawn from " + link("/projects", "projects →", true));
    return out;
  }
  function generate(opts) {
    var kb = opts.kb, route = opts.route, retrieval = opts.retrieval, state = opts.state;
    var intent = route.intent, name = intent.name;
    var chips = suggestions({ intent: name, project: route.project, categories: route.categories, ambiguous: route.ambiguous, candidates: route.candidateNames, rawIntent: name });

    function out(html) {
      return { html: html, plain: stripTags(html), chips: chips, mode: intent.mode };
    }

    if (route.favorite && route.favoriteSubject) {
      var fv = route.favoriteSubject;
      var hsF = kb.hardSkills || {};
      var stackFav = (hsF.programming || []).concat(hsF.coreStack || []);
      var cleanFav = [];
      stackFav.forEach(function (tp) {
        if (!tp) return;
        var c = String(tp).replace(/\((?:strong|intermediate|beginner)\)/i, "").trim();
        if (c && cleanFav.indexOf(c) === -1) cleanFav.push(c);
      });
      return out("Hmm... I don't have a documented favorite <b>" + esc(fv) + "</b>. But I can tell you what she works with: <b>" + esc(cleanFav.slice(0, 10).join(", ")) + "</b>." + meta(link("/skills", "Full stack →", true)));
    }
    var prj = retrieval && retrieval.project ? retrieval.project : (route.project ? N.findProject(kb, route.project) : null);
    if (name === "PROJECT_COMPARISON") {
      var compareProjs = retrieval && (retrieval.projects || []);
      return out(projectCompare(compareProjs, route, kb));
    }
    if (!prj && (name === "PROJECT_TECHNICAL" || name === "PROJECT_ARCHITECTURE")) {
      var stackList = ((kb.hardSkills && kb.hardSkills.coreStack) || []).slice(0, 5);
      var mlList = ((kb.hardSkills && kb.hardSkills.mlAi) || []).slice(0, 3);
      return out("<b>Tech stack</b><br>She speaks " + esc(stackList.join(", ")) + (mlList.length ? ", plus " + esc(mlList.join(", ")) : "") + "." + meta(link("/skills", "Full stack ->", true)));
    }


    if (route.ambiguous) {
      var poolNames = route.candidateNames
        || (retrieval && retrieval.projects && retrieval.projects.length ? retrieval.projects.map(function (q) { return q.name; }) : null)
        || (kb.projects || []).map(function (q) { return q.name; });
      var bullets = poolNames.map(function (nm) {
        var q = N.findProject(kb, nm);
        return "• <b>" + esc(nm) + "</b> — " + esc((q && q.impact) || "");
      }).join("<br>");
      return out("<b>Which one do you mean?</b><br>" + bullets + meta(link("/projects", "Open projects →", true)));
    }



    if (prj) {
      switch (name) {
        case "PROJECT_SPECIFIC": return out(projectStory(prj, kb));
        case "PROJECT_TECHNICAL": return out(projectTechnical(prj));
        case "PROJECT_ARCHITECTURE": return out(projectTechnical(prj));
        case "PROJECT_RESULTS":
          if (prj.results) return out("<b>" + esc(prj.name) + " — results</b><br>" + esc(prj.results) + (prj.metrics ? meta(esc(prj.metrics)) : ""));
          return out("<b>" + esc(prj.name) + "</b> didn't publish hard metrics — " + link("/projects", "see the page →", true));
        case "PROJECT_CHALLENGE":
          if (prj.challenges && prj.challenges.length) return out("<b>The hard part of " + esc(prj.name) + "</b><br>" + prj.challenges.slice(0, 2).map(function (c) { return "• " + esc(c); }).join("<br>"));
          return out("<b>" + esc(prj.name) + "</b> — nothing I can point to reliably on that one.");
        case "PROJECT_LEARNINGS":
          if (prj.learnings) return out("<b>What came out of " + esc(prj.name) + "</b><br>" + esc(prj.learnings));
          return out("I don't have a documented takeaway for <b>" + esc(prj.name) + "</b>.");
        case "PROJECT_MOTIVATION":
          if (prj.motivation) return out("<b>Why " + esc(prj.name) + "?</b><br>" + esc(prj.motivation) + (prj.problem ? "<br>" + esc(prj.problem) : ""));
          if (prj.problem) return out("<b>Why " + esc(prj.name) + "?</b><br>" + esc(prj.problem));
          return out("I don't have her written motivation for <b>" + esc(prj.name) + "</b>.");
        default:
          if (name.indexOf("PROJECT_") === 0) return out(projectStory(prj, kb));
          break;
      }
    }

    if (name === "PROJECT_RESULTS" || name === "PROJECT_CHALLENGE" || name === "PROJECT_LEARNINGS" || name === "PROJECT_MOTIVATION") {
      if (retrieval && retrieval.projects && retrieval.projects.length) return out(projectList(retrieval.projects, kb));
    }

    if (name === "PROJECTS" || name === "PROJECT_COMPARISON" || name === "CATEGORY_SPECIFIC") {
      var projs = retrieval && (retrieval.projects || []);
      if (name === "PROJECT_COMPARISON") return out(projectCompare(projs, route, kb));
      if (projs && projs.length) return out(name === "CATEGORY_SPECIFIC" ? categoryReasons(projs, route.categories, kb) : projectList(projs, kb));
      if (name === "CATEGORY_SPECIFIC") {
        var all = kb.projects || [];
        return out(projectList(all, kb) || "<b>No projects</b> match that one.");
      }
      return out("<b>All " + (kb.projects || []).length + " projects</b><br>" + (kb.projects || []).map(function (p) { return "• <b>" + esc(p.name) + "</b> — " + esc(p.impact); }).join("<br>") + meta(link("/projects", "Open projects →", true)));
    }
    if (name === "TECHNOLOGY_SPECIFIC") {
      var techs = route.technologies || (retrieval && retrieval.technologies) || [];
      if (techs.length) {
        var t0 = techs[0];
        var where = (kb.projects || []).filter(function (p) { return N.projectHasTech(p, t0); }).map(function (p) { return p.name; });
        var yes = /^(node|express|react|next|mongodb|mongo|mysql|postgres|redis|java|javascript|python|docker|git|github|aws|dynamodb|lambda|linux|c|cpp|fastapi|yolov|yolov8|opencv|numpy|pandas|comprehend|llama|gemini)$/i.test(t0) || where.length > 0;
        var out2 = "<b>" + esc(t0) + "</b>";
        if (where.length) out2 += "<br>She's used it in " + esc(where.slice(0, 3).join(", ")) + ".";
        else out2 += yes ? "<br>It's on her stack." : "<br>I don't see it on her stack.";
        return out(out2 + meta(link("/skills", "Full stack →", true)));
      }
      return out("<b>Tech stack</b><br>She speaks " + esc((kb.hardSkills && kb.hardSkills.coreStack || []).slice(0, 4).join(", ")) + " like a second language, plus Python and AWS." + meta(link("/skills", "Full stack →", true)));
    }

    switch (name) {
      case "SKILLS":
        var h = kb.hardSkills || {};
        return out("<b>Hard skills</b><br>• " + esc((h.programming || []).slice(0, 3).join(", ")) + "<br>• " + esc((h.webBackend || []).slice(0, 3).join(", ")) + "<br>• " + esc((h.databases || []).join(", ")) + "<br>• " + esc((h.mlAi || []).join(", ")) + "<br>• " + esc((h.cloud || []).join(", ")) + meta(link("/skills", "View stack →", true)));
      case "SOFT_SKILLS":
        var s = (kb.softSkills || []).slice(0, 4).map(function (x) { return "<b>" + esc(x.name) + "</b> — " + esc(x.evidence); }).join("<br>");
        return out("<b>Beyond tech</b><br>" + s + meta(link("/about", "About →", true)));
      case "EDUCATION":
        var e = (kb.education || [])[0];
        if (!e) return out("I don't have her education in my notes.");
        return out("<b>Her academic story</b><br>" + esc(e.degree) + " — " + esc(e.school) + "<br>" + esc(e.duration || "") + " · " + esc(e.score || "") + meta("Coursework: " + esc((e.coursework || []).slice(0, 5).join(", "))));
      case "EXPERIENCE":
      case "INTERNSHIP":
        var xp = (kb.experience || [])[0];
        if (!xp) return out("I don't have work experience in my notes.");
        return out("<b>" + esc(xp.role) + "</b><br>" + esc(xp.org) + " — " + esc(xp.duration || "") + "<br>• " + (xp.bullets || []).map(function (b) { return esc(b); }).join("<br>• ") + meta(link("/about", "About →", true)));
      case "OFF_CLOCK":
        var hob = kb.hobbies || {};
        return out("<b>Off the clock</b><br>" + esc(hob.tagline || "") + "<br>" + esc((hob.polaroids || []).slice(0, 4).join(" · ")) + "<br>" + esc(hob.photographer || "") + meta(link("/hobbies", "Hobbies →", true)));
      case "COMMUNITY":
        var coms = (kb.community || []).slice(0, 3).map(function (c) { return "<b>" + esc(c.title) + "</b> — " + esc(c.org); }).join("<br>");
        return out("<b>Community</b><br>" + coms + meta(link("/community", "View →", true)));
      case "CONTACT":
        var c = kb.contact || {};
        return out("<b>Reach Nivi</b><br>" + link("mailto:" + c.email, c.email) + "<br>" + link(c.github, "GitHub ↗") + " · " + link(c.linkedin, "LinkedIn ↗") + meta(esc(kb.availability || "")));
      case "RESUME":
        return out("<b>Resume</b><br>" + link("/resume", "Open resume PDF ↗", true));
      case "GITHUB":
        var g = (kb.contact || {}).github;
        if (!g) return out("I don't have her GitHub handy.");
        return out("<b>GitHub</b><br>" + link(g, "nivijha on GitHub ↗") + meta("6 project repos + more"));
      case "LINKEDIN":
        var l = (kb.contact || {}).linkedin;
        if (!l) return out("I don't have her LinkedIn handy.");
        return out("<b>LinkedIn</b><br>" + link(l, "Nivi Jha on LinkedIn ↗"));
      case "LOCATION":
        var lc = ((kb.profile || {}).location) || "";
        if (!lc) return out("I don't have her location in my notes.");
        return out("<b>Where's home</b><br>" + esc(lc) + meta(link("/about", "About →", true)));
      case "HIRING":
        return out("<b>She's open to work</b><br>" + esc(kb.availability || "") + "<br>Full-stack (React/Node/Mongo, 36-endpoint REST APIs), vision (YOLOv8, 94.4% mAP), serverless (Lambda/DynamoDB)." + meta(link("/contact", "Contact →", true)));
      case "WHY_HIRE":
        return out("<b>Why hire Nivi</b><br>She ships end-to-end — from UI to API to infra — with tests and monitoring. Six projects, one IIT Delhi internship, campus leads (JYC/IEEE)." + meta(link("/contact", "Contact →", true) + " · " + link("/projects", "Projects →", true)));
      case "WHY_CAT":
        return out("Because a portfolio is just a resume unless someone is there to tell the stories. I keep her facts straight, her projects vivid, and the tone purr-able.");
      case "ROLE":
        return out("I'm Nivi's cat — the only one allowed to sleep on her keyboard. I know her portfolio inside out. Ask me about skills, projects, hobbies.");
      case "ABOUT":
        var pfA = kb.profile || {};
        var xpA = (kb.experience || [])[0];
        var abLine = "<b>" + esc(pfA.name || "Nivi Jha") + "</b><br>" + esc(pfA.title || "");
        if (xpA) abLine += "<br>" + esc(xpA.role) + " at " + esc(xpA.org) + (xpA.duration ? " (" + esc(xpA.duration) + ")" : "");
        abLine += "<br>" + esc(pfA.tagline || "");
        return out(abLine + meta(esc(pfA.location || "") + " · " + link("/about", "About →", true)));
      case "IDENTITY":
        var pf = kb.profile || {};
        return out("<b>" + esc(pf.name || "Nivi Jha") + "</b><br>" + esc(pf.title || "") + "<br>" + esc(pf.tagline || "") + meta(esc(pf.location || "") + " · " + link("/about", "About →", true)));
      case "GREETING":
        return out("Hey! I'm Nivi's cat. Ask me about her skills, projects, hobbies, or why she built what she built.");
      case "HELP":
        return out("Ask me about her stack, projects, education, internship, community work, hobbies — or why you should hire her. Try one." + meta("e.g. \"What ML projects has she built?\""));
      case "FUN_FACT":
        var facts = (kb.hobbies && kb.hobbies.facts) || [];
        if (facts.length) return out("<b>Fun fact</b><br>" + esc(facts[Math.floor(Math.random() * facts.length)]));
        return out("I've got nothing fun in my notes right now.");
      case "UNKNOWN":
      default:
        return out("Hmm... my whiskers aren't picking up anything reliable on that one. I know quite a bit about Nivi's projects, skills, and portfolio — but I don't want to make something up.");
    }
  }

  N.generate = generate;
  N.suggestions = suggestions;
  N.esc = esc;
  N.stripTags = stripTags;
})(typeof window !== "undefined" ? window : globalThis);
