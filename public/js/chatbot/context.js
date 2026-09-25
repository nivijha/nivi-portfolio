(function (root) {
  var N = root.NiviCB = root.NiviCB || {};

  var PROJECT_FACETS = {
    "PROJECT_RESULTS": 1, "PROJECT_CHALLENGE": 1, "PROJECT_LEARNINGS": 1,
    "PROJECT_MOTIVATION": 1, "PROJECT_ARCHITECTURE": 1, "PROJECT_TECHNICAL": 1,
    "PROJECT_SPECIFIC": 1
  };

  function createState() {
    return {
      currentProject: null,
      currentCategory: null,
      currentIntent: null,
      lastIntent: null,
      turnLog: [],
      stuckCount: 0,
      recentProjects: []
    };
  }

  function resolveContext(opts) {
  var qn = opts.qn, intent = opts.intent, entities = opts.entities, kb = opts.kb, state = opts.state;
  var project = null, boundVia = null, candidateNames = null;

  if (entities.projects && entities.projects.length) {
    project = entities.projects[0];
    boundVia = "entity";
  } else if (entities.reference) {
    var ref = entities.reference;
    if (ref.kind === "project" && ref.idx != null) {
      var pool = state.recentProjects && state.recentProjects.length
        ? state.recentProjects
        : (kb.projects || []).map(function (p) { return p.name; });
      if (pool[ref.idx]) { project = pool[ref.idx]; boundVia = "reference"; }
    } else if (ref.kind === "current") {
      if (state.currentProject) { project = state.currentProject; boundVia = "reference"; }
    } else if (ref.kind === "other") {
      var candidates = ref.categories && ref.categories.length
        ? categoryProjects(ref.categories, kb)
        : (state.recentProjects && state.recentProjects.length
            ? state.recentProjects.slice()
            : (kb.projects || []).map(function (p) { return p.name; }));
      var drest = candidates.filter(function (c) { return c !== state.currentProject; });
      candidateNames = drest.length ? drest : null;
      if (drest.length === 1 && candidates.indexOf(state.currentProject) !== -1) {
        project = drest[0]; boundVia = "reference";
      }
    }
  }

  var isFacet = !!PROJECT_FACETS[intent.name];
  var generalStack = /(tech stack|stack|skill|skills|language|languages|tool|tools|technolog)/.test(qn);
  var catAmbiguous = false;
  var refAmbiguous = false;

  if (!project) {
    if (entities.reference && entities.reference.kind === "other") {
      refAmbiguous = true;
    } else if (entities.categories && entities.categories.length) {
      var wantsList =
        intent.name === "CATEGORY_SPECIFIC" ||
        intent.name === "PROJECT_COMPARISON" ||
        (intent.name === "PROJECTS" && (/\b(list|show|all|every|which|any|many)\b/.test(qn) || /(what|has|have|did|does) .*projects?/.test(qn)));
      if (!wantsList) {
        var cps = categoryProjects(entities.categories, kb);
        if (cps.length === 1) { project = cps[0]; boundVia = "category"; candidateNames = cps; }
        else if (cps.length > 1) { catAmbiguous = true; candidateNames = cps; }
      }
    }
  }

  if (!project && !catAmbiguous && !refAmbiguous && isFacet && state.currentProject) {
    project = state.currentProject;
    boundVia = "context";
  }

  var ambiguous = catAmbiguous || refAmbiguous || (isFacet && !project);
  if (ambiguous && generalStack && !catAmbiguous && !refAmbiguous) ambiguous = false;

  var explicit = boundVia === "entity" || boundVia === "category" || boundVia === "reference";
  if (project && explicit) {
    state.currentProject = project;
    if (state.recentProjects.indexOf(project) === -1) state.recentProjects.push(project);
    if (state.recentProjects.length > 6) state.recentProjects.shift();
  }
  if (entities.categories && entities.categories.length) state.currentCategory = entities.categories[0];
  state.lastIntent = state.currentIntent;
  state.currentIntent = intent.name;

  return { project: project, ambiguous: ambiguous, boundVia: boundVia, candidateNames: candidateNames };
}

  function categoryProjects(cats, kb) {
  var out = [];
  if (!cats || !cats.length || !kb) return out;
  (kb.projects || []).forEach(function (p) {
    var hit = cats.some(function (c) { return N.projectMatchesCategory(p, c); });
    if (hit) out.push(p.name);
  });
  return out;
}

function pushTurn(state, role, text) {
    state.turnLog.push({ role: role, text: text });
    if (state.turnLog.length > 30) state.turnLog.splice(0, state.turnLog.length - 30);
  }

  N.createState = createState;
  N.resolveContext = resolveContext;
  N.pushTurn = pushTurn;
})(typeof window !== "undefined" ? window : globalThis);
