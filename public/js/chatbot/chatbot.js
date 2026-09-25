(function (root) {
  var N = root.NiviCB = root.NiviCB || {};

  function run(opts) {
    var input = opts.input, kb = opts.kb, state = opts.state;
    if (!kb) return null;
    if (!state) state = N.createState();
    var qn = N.normalize(input);

    var entities = N.detectEntities(qn, kb);
    var intent = N.detectIntent(qn);

    if (intent.name === "PROJECT_CHALLENGE" && /skill/.test(qn)) {
      intent = { name: "SKILLS", mode: "CAT" };
    }

    if (intent.name === "UNKNOWN" && entities.projects.length) {
      intent = { name: "PROJECT_SPECIFIC", mode: "STORY" };
    }

    var resolved = N.resolveContext({ qn: qn, intent: intent, entities: entities, kb: kb, state: state });

    if (intent.name === "PROJECTS" && resolved.project && resolved.boundVia !== "context") {
      intent = { name: "PROJECT_SPECIFIC", mode: "STORY" };
    } else if (intent.name === "CATEGORY_SPECIFIC" && resolved.project && resolved.boundVia === "reference") {
      intent = { name: "PROJECT_SPECIFIC", mode: "STORY" };
    }

    var route = {
      intent: intent,
      project: resolved.project,
      categories: entities.categories,
      technologies: entities.technologies,
      ambiguous: resolved.ambiguous,
      candidateNames: resolved.candidateNames,
      favorite: /\bfavorite|preferred\b/.test(qn),
      favoriteSubject: (qn.match(/\b(favorite|preferred)\b\s+([a-z]{2,12}(?: [a-z]{2,12}){0,2})/) || [])[2] || ""
    };

    var retrieval = N.retrieve({ kb: kb, route: route, qn: qn });
    var response = N.generate({ kb: kb, state: state, route: route, retrieval: retrieval });

    var grounded = N.groundFacts({ kb: kb, route: route, retrieval: retrieval });

    return {
      input: input,
      qn: qn,
      intent: intent,
      project: route.project,
      categories: route.categories,
      technologies: route.technologies,
      mode: response.mode,
      html: response.html,
      plain: response.plain,
      chips: response.chips,
      grounded: grounded,
      isUnknown: intent.name === "UNKNOWN",
      ambiguous: route.ambiguous,
      boundVia: resolved.boundVia
    };
  }

  function groundFacts(opts) {
    var kb = opts.kb, route = opts.route, retrieval = opts.retrieval;
    var prj = retrieval && retrieval.project ? retrieval.project : (route.project ? N.findProject(kb, route.project) : null);
    var g = {
      intent: route.intent.name,
      mode: route.intent.mode,
      project: route.project || null,
      categories: route.categories || [],
      technologies: route.technologies || []
    };
    if (prj) {
      g.projectFacts = {
        impact: prj.impact || null,
        overview: prj.overview || null,
        stack: prj.stack || null,
        category: prj.category || null,
        architecture: prj.architecture || null,
        motivation: prj.motivation || null,
        challenges: prj.challenges || null,
        results: prj.results || null,
        learnings: prj.learnings || null,
        metrics: prj.metrics || null,
        links: prj.links || null
      };
    }
    return g;
  }

  function suggest(signals) {
    return N.suggestions(signals);
  }

  function decorate(packet) {
    if (!packet) return packet;
    if (!packet.isUnknown && !packet.ambiguous) {
      packet.html = N.personalityApply(packet.mode, packet.html);
      packet.plain = N.stripTags(packet.html);
    }
    return packet;
  }

  N.run = run;
  N.decorate = decorate;  N.run = run;
  N.groundFacts = groundFacts;
  N.suggest = suggest;
})(typeof window !== "undefined" ? window : globalThis);
