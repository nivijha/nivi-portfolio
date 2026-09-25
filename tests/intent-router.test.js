const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'public', 'data', 'portfolio-kb.json');
const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

require('../public/js/chatbot/intents.js');
require('../public/js/chatbot/entities.js');
require('../public/js/chatbot/context.js');
require('../public/js/chatbot/retrieval.js');
require('../public/js/chatbot/personality.js');
require('../public/js/chatbot/responses.js');
require('../public/js/chatbot/chatbot.js');
const N = globalThis.NiviCB;

function run(input, state) {
  return N.run({ input, kb, state: state || N.createState() });
}

describe('detectIntent - project facet intents', () => {
  it('tell me about MedTracker -> PROJECT_SPECIFIC + MedTracker', () => {
    const p = run('Tell me about MedTracker.');
    assert.equal(p.intent.name, 'PROJECT_SPECIFIC');
    assert.equal(p.project, 'MedTracker');
    assert.equal(p.isUnknown, false);
  });

  it('what is MedTracker -> PROJECT_SPECIFIC (via promotion)', () => {
    const p = run('What is MedTracker?');
    assert.equal(p.intent.name, 'PROJECT_SPECIFIC');
    assert.equal(p.project, 'MedTracker');
  });

  it('how does MedTracker work -> PROJECT_ARCHITECTURE', () => {
    const p = run('How does MedTracker work?');
    assert.equal(p.intent.name, 'PROJECT_ARCHITECTURE');
    assert.equal(p.project, 'MedTracker');
  });

  it('what technologies does MedTracker use -> PROJECT_TECHNICAL', () => {
    const p = run('What technologies does MedTracker use?');
    assert.equal(p.intent.name, 'PROJECT_TECHNICAL');
    assert.equal(p.project, 'MedTracker');
    assert.ok(p.html.length > 0);
  });

  it('why did Nivi build MedTracker -> PROJECT_MOTIVATION', () => {
    const p = run('Why did Nivi build MedTracker?');
    assert.equal(p.intent.name, 'PROJECT_MOTIVATION');
    assert.equal(p.project, 'MedTracker');
  });

  it('what was difficult about MedTracker -> PROJECT_CHALLENGE', () => {
    const p = run('What was difficult about MedTracker?');
    assert.equal(p.intent.name, 'PROJECT_CHALLENGE');
    assert.equal(p.project, 'MedTracker');
  });

  it('what did she learn from MedTracker -> PROJECT_LEARNINGS', () => {
    const p = run('What did she learn from MedTracker?');
    assert.equal(p.intent.name, 'PROJECT_LEARNINGS');
    assert.equal(p.project, 'MedTracker');
  });

  it('what were the results of MedTracker -> PROJECT_RESULTS', () => {
    const p = run('What were the results of MedTracker?');
    assert.equal(p.intent.name, 'PROJECT_RESULTS');
    assert.equal(p.project, 'MedTracker');
  });

  it('tell me about CardioVision -> PROJECT_SPECIFIC + CardioVision', () => {
    const p = run('Tell me about CardioVision.');
    assert.equal(p.intent.name, 'PROJECT_SPECIFIC');
    assert.equal(p.project, 'CardioVision');
  });

  it('what about constellation -> Chat Constellation', () => {
    const p = run('What about constellation?');
    assert.equal(p.project, 'Chat Constellation');
    assert.equal(p.intent.name, 'PROJECT_SPECIFIC');
  });

  it('tell me about the security agent -> Security Event Collection', () => {
    const p = run('Tell me about the security agent.');
    assert.equal(p.project, 'Security Event Collection & Analysis Agent');
  });
});

describe('projects list / tech / category', () => {
  it('what projects use aws -> PROJECTS + Cloud/AWS', () => {
    const p = run('What projects use AWS?');
    assert.ok(p.intent.name === 'PROJECTS' || p.intent.name === 'CATEGORY_SPECIFIC', 'got ' + p.intent.name);
    assert.deepEqual(p.categories, ['Cloud/AWS']);
    assert.ok(p.html.indexOf('AI Product Review Analyzer') !== -1);
  });

  it('does she know react -> TECHNOLOGY_SPECIFIC + react', () => {
    const p = run('Does she know React?');
    assert.equal(p.intent.name, 'TECHNOLOGY_SPECIFIC');
    assert.ok(p.technologies.indexOf('react') !== -1);
    assert.equal(p.isUnknown, false);
  });

  it('what ml projects does she have -> CATEGORY_SPECIFIC + ML', () => {
    const p = run('What ML projects does she have?');
    assert.equal(p.intent.name, 'CATEGORY_SPECIFIC');
    assert.ok(p.categories.indexOf('ML') !== -1);
  });

  it('which project is relevant to backend -> PROJECT_COMPARISON + Backend', () => {
    const p = run('Which project is relevant to backend development?');
    assert.equal(p.intent.name, 'PROJECT_COMPARISON');
    assert.ok(p.categories.indexOf('Backend') !== -1);
  });

  it('recommend a healthcare project -> PROJECT_COMPARISON + Healthcare', () => {
    const p = run('Recommend a project for healthcare.');
    assert.equal(p.intent.name, 'PROJECT_COMPARISON');
    assert.ok(p.categories.indexOf('Healthcare') !== -1);
  });

  it('what full stack projects -> CATEGORY_SPECIFIC + Full-Stack', () => {
    const p = run('What full stack projects has she built?');
    assert.equal(p.intent.name, 'CATEGORY_SPECIFIC');
    assert.ok(p.categories.indexOf('Full-Stack') !== -1 || p.categories.indexOf('Full Stack') !== -1);
  });
});

describe('personal intents', () => {
  const cases = [
    ['Why should I hire her?', 'WHY_HIRE'],
    ['What are her soft skills?', 'SOFT_SKILLS'],
    ['What is her tech stack?', 'SKILLS'],
    ['Where did she study?', 'EDUCATION'],
    ['Does she have work experience?', 'EXPERIENCE'],
    ['Did she do an internship?', 'INTERNSHIP'],
    ['What does she do off the clock?', 'OFF_CLOCK'],
    ['What community work does she do?', 'COMMUNITY'],
    ['How do I contact her?', 'CONTACT'],
    ['Can I see her resume?', 'RESUME'],
    ['What is her GitHub?', 'GITHUB'],
    ['Show me her LinkedIn.', 'LINKEDIN'],
    ['Are you hiring?', 'HIRING'],
    ['Who are you?', 'ROLE'],
    ['What is your name?', 'ROLE'],
    ['Hello!', 'GREETING'],
    ['What can you help with?', 'HELP'],
    ['Give me a fun fact.', 'FUN_FACT'],
  ];
  for (const [input, expected] of cases) {
    it(input + ' -> ' + expected, () => {
      const p = run(input);
      assert.equal(p.intent.name, expected, 'for input: ' + input);
      assert.equal(p.isUnknown, false);
    });
  }
});

describe('unknown / no-hallucination guard', () => {
  const cases = [
    'What is the weather in Paris?',
    'Can you recommend a movie?',
    'Who won the 2026 World Cup?',
  ];
  for (const input of cases) {
    it(input + ' -> UNKNOWN with whiskers fallback', () => {
      const p = run(input);
      assert.equal(p.isUnknown, true);
      assert.ok(p.plain.indexOf('whiskers') !== -1, 'expected whiskers fallback, got: ' + p.plain);
    });
  }

  it('unknown technology does not invent stack presence', () => {
    const p = run('Does she know COBOL?');
    assert.ok(p.plain.toLowerCase().indexOf('cobol') !== -1, 'should name the queried tech');
    assert.ok(/don.t see it/.test(p.plain.toLowerCase()), 'should not claim she knows it');
  });
});

describe('conversation context', () => {
  it('facet after project name binds to currentProject', () => {
    const state = N.createState();
    run('Tell me about CardioVision.', state);
    const p2 = run('What model did she use?', state);
    assert.equal(p2.intent.name, 'PROJECT_TECHNICAL');
    assert.equal(p2.project, 'CardioVision');
  });

  it('results follow-up binds to currentProject', () => {
    const state = N.createState();
    run('Tell me about CardioVision.', state);
    const p2 = run('What were the results?', state);
    assert.equal(p2.intent.name, 'PROJECT_RESULTS');
    assert.equal(p2.project, 'CardioVision');
    assert.ok(p2.plain.indexOf('94') !== -1, 'should return real metrics, got: ' + p2.plain);
  });

  it('challenge follow-up binds to currentProject', () => {
    const state = N.createState();
    run('Tell me about CardioVision.', state);
    const p2 = run('What was difficult?', state);
    assert.equal(p2.project, 'CardioVision');
    assert.deepEqual(p2.chips, ['How was it trained?', 'What were the results?', 'What was challenging?']);
  });

  it('switch project mid-conversation', () => {
    const state = N.createState();
    run('Tell me about CardioVision.', state);
    run('What about MedTracker?', state);
    const p = run('What technologies did it use?', state);
    assert.equal(p.project, 'MedTracker');
    assert.equal(p.intent.name, 'PROJECT_TECHNICAL');
  });

  it('pronoun "it" binds to currentProject', () => {
    const state = N.createState();
    run('Tell me about MedTracker.', state);
    const p = run('How does it work?', state);
    assert.equal(p.project, 'MedTracker');
    assert.equal(p.intent.name, 'PROJECT_ARCHITECTURE');
  });

  it('RAG mention after MedTracker stays on MedTracker', () => {
    const state = N.createState();
    run('Tell me about MedTracker.', state);
    const p = run('How does the RAG system work?', state);
    assert.equal(p.project, 'MedTracker');
    assert.equal(p.intent.name, 'PROJECT_ARCHITECTURE');
  });

  it('facet intent with no context is ambiguous', () => {
    const state = N.createState();
    const p = run('What were the results?', state);
    assert.equal(p.ambiguous, true);
    assert.ok(p.plain.indexOf('Which one') !== -1, 'should ask for clarification');
  });

  it('what was challenging with no context is ambiguous', () => {
    const state = N.createState();
    const p = run('What was challenging?', state);
    assert.equal(p.ambiguous, true);
  });
});

describe('entities + grounding', () => {
  it('detectEntities finds project alias', () => {
    const e = N.detectEntities('Tell me about MedTracker', kb);
    assert.ok(e.projects.indexOf('MedTracker') !== -1);
  });

  it('detectEntities finds tech', () => {
    const e = N.detectEntities('Does she know React?', kb);
    assert.ok(e.technologies.indexOf('react') !== -1);
  });

  it('detectEntities finds category', () => {
    const e = N.detectEntities('What ML projects does she have?', kb);
    assert.ok(e.categories.indexOf('ML') !== -1);
  });

  it('groundFacts carries project.stack for technical route', () => {
    const state = N.createState();
    const p = run('What technologies does MedTracker use?', state);
    assert.ok(p.grounded.projectFacts.stack.length >= 3, 'stack facts should be present');
    assert.equal(p.grounded.project, 'MedTracker');
  });

  it('groundFacts is null-safe for unknown intent', () => {
    const p = run('What is the weather in Paris?');
    assert.equal(p.isUnknown, true);
    assert.equal(p.grounded.project, null);
  });

  it('plain text contains no HTML tags', () => {
    const state = N.createState();
    run('Tell me about MedTracker.', state);
    const p = run('What technologies did it use?', state);
    assert.ok(/<[a-z]/.test(p.plain) === false, 'plain should be tag-free: ' + p.plain);
  });
});

describe('suggestion chips', () => {
  it('per-project chips for MedTracker', () => {
    const state = N.createState();
    run('Tell me about MedTracker.', state);
    const p = run('How does the RAG system work?', state);
    assert.ok(p.chips.indexOf('How does the RAG system work?') !== -1);
    assert.ok(p.chips.length === 3);
  });

  it('chips for projects list include project deep-dive', () => {
    const p = run('What ML projects does she have?');
    assert.ok(p.chips.length > 0);
    assert.ok(p.chips.some(function (c) { return /CardioVision/.test(c); }));
  });
});

describe('edge cases', () => {
  it('empty / whitespace input is UNKNOWN and safe', () => {
    const p = run('   ');
    assert.equal(p.isUnknown, true);
    assert.ok(p.plain.length > 0);
  });

  it('normalization handles mixed punctuation', () => {
    const p = run('TELL ME ABOUT MEDTRACKER!!!');
    assert.equal(p.intent.name, 'PROJECT_SPECIFIC');
    assert.equal(p.project, 'MedTracker');
  });

  it('hyphenated alias resolves', () => {
    const p = run('Tell me about Med-Tracker.');
    assert.equal(p.project, 'MedTracker');
  });

  it('typied variant resolves through alias', () => {
    const p = run('what is med tracker?');
    assert.equal(p.project, 'MedTracker');
  });

  it('project comparison never claims a single best', () => {
    const p = run('Compare CardioVision and MedTracker');
    assert.equal(p.intent.name, 'PROJECT_COMPARISON');
    assert.ok(/don.t rank/i.test(p.plain) || /I don.t rank/i.test(p.plain));
  });
});

describe('acceptance: what does she do / routing fixes', () => {
  const cases = [
    ['what does she do?', 'ABOUT'],
    ['What does Nivi do?', 'ABOUT'],
    ['what does she work on?', 'ABOUT'],
    ['what is she doing?', 'ABOUT'],
    ['what did she work on?', 'PROJECTS'],
    ['where does Nivi live?', 'LOCATION'],
    ['where is she based?', 'LOCATION'],
    ['what is her location?', 'LOCATION'],
  ];
  for (const [input, expected] of cases) {
    it(input + ' -> ' + expected, () => {
      const p = run(input);
      assert.equal(p.intent.name, expected, 'for input: ' + input);
      assert.equal(p.isUnknown, false);
    });
  }

  it('ABOUT response is grounded in KB profile', () => {
    const p = run('what does she do?');
    assert.ok(p.plain.indexOf('JUIT') !== -1 || p.plain.indexOf('Nivi') !== -1, 'expected KB profile content, got: ' + p.plain);
    assert.ok(/IIT Delhi|Summer Intern/.test(p.plain), 'expected KB experience role, got: ' + p.plain);
  });

  it('LOCATION only from KB profile.location', () => {
    const p = run('where does Nivi live?');
    assert.ok(/Solan/i.test(p.plain) && /Ghaziabad/i.test(p.plain), 'expected KB location, got: ' + p.plain);
  });
});

describe('acceptance: medical / healthcare ambiguity', () => {
  it('tell me about that medical project -> ambiguous with both candidates', () => {
    const p = run('Tell me about that medical project.');
    assert.equal(p.ambiguous, true);
    assert.equal(p.intent.name, 'PROJECT_SPECIFIC');
    assert.ok(p.plain.indexOf('MedTracker') !== -1, 'should list MedTracker');
    assert.ok(p.plain.indexOf('CardioVision') !== -1, 'should list CardioVision');
    assert.ok(p.plain.indexOf('Which one') !== -1, 'should ask which one');
    assert.equal(p.project, null, 'must NOT set project on ambiguity');
  });

  it('healthcare project -> ambiguous', () => {
    const p = run('Tell me about her healthcare project.');
    assert.equal(p.ambiguous, true);
    assert.ok(p.plain.indexOf('MedTracker') !== -1);
    assert.ok(p.plain.indexOf('CardioVision') !== -1);
  });

  it('medical project (bare noun) -> ambiguous without guessing', () => {
    const p = run('What about the medical project?');
    assert.equal(p.ambiguous, true);
    assert.equal(p.project, null);
    assert.ok(p.plain.indexOf('CardioVision') !== -1);
  });

  it('computer vision project -> CardioVision (unique)', () => {
    const p = run('Tell me about the computer vision project.');
    assert.equal(p.ambiguous, false);
    assert.equal(p.project, 'CardioVision');
  });

  it('medical document project -> MedTracker (unique via KB)', () => {
    const p = run('Tell me about the medical document project.');
    assert.equal(p.ambiguous, false);
    assert.equal(p.project, 'MedTracker');
  });
});

describe('acceptance: "the other" reference resolution', () => {
  it('the other medical project after CardioVision -> MedTracker', () => {
    const state = N.createState();
    run('Tell me about CardioVision.', state);
    const p = run('What about the other medical project?', state);
    assert.equal(p.project, 'MedTracker');
    assert.equal(p.ambiguous, false);
    assert.equal(p.intent.name, 'PROJECT_SPECIFIC');
  });

  it('the other medical project after MedTracker -> CardioVision', () => {
    const state = N.createState();
    run('Tell me about MedTracker.', state);
    const p = run('What about the other medical project?', state);
    assert.equal(p.project, 'CardioVision');
    assert.equal(p.ambiguous, false);
  });

  it('"the other project" without a defined candidate set must NOT guess', () => {
    const state = N.createState();
    run('Tell me about MedTracker.', state);
    const p = run('What about the other project?', state);
    assert.equal(p.ambiguous, true);
    assert.equal(p.project, null);
    assert.ok(p.plain.indexOf('Which one') !== -1, 'should ask for clarification, got: ' + p.plain);
  });

  it('the other project after two visited projects -> resolved', () => {
    const state = N.createState();
    run('Tell me about MedTracker.', state);
    run('Tell me about CardioVision.', state);
    const p = run('What about the other project?', state);
    assert.equal(p.project, 'MedTracker');
    assert.equal(p.ambiguous, false);
  });
});

describe('acceptance: clarification then follow-up context', () => {
  it('ambiguous -> pick CardioVision -> challenge -> learnings', () => {
    const state = N.createState();
    const a = run('Tell me about that medical project.', state);
    assert.equal(a.ambiguous, true);
    const b = run('CardioVision', state);
    assert.equal(b.project, 'CardioVision');
    const c = run('What was difficult?', state);
    assert.equal(c.project, 'CardioVision');
    const d = run('What did she learn?', state);
    assert.equal(d.project, 'CardioVision');
    assert.ok(d.plain.indexOf('Explainability') !== -1, 'should return CardioVision learnings, got: ' + d.plain);
  });

  it('ambiguity wins over context binding', () => {
    const state = N.createState();
    run('Tell me about CardioVision.', state);
    const p = run('What was difficult about the medical project?', state);
    assert.equal(p.ambiguous, true);
    assert.equal(p.project, null, 'medical ambiguity should override CardioVision binding');
  });
});

describe('acceptance: no invented favorites / personal info', () => {
  it('favorite programming language -> NOT inferred from skills', () => {
    const p = run('What is her favorite programming language?');
    assert.ok(/don't have a documented favorite/i.test(p.plain), 'should say no documented favorite, got: ' + p.plain);
    assert.ok(/works with|work with/i.test(p.plain), 'should offer actual stack instead, got: ' + p.plain);
    assert.equal(p.isUnknown, false);
  });

  it('favorite movie -> unknown / no fabricated answer', () => {
    const p = run('What is her favorite movie?');
    assert.ok(p.isUnknown || /documented favorite/i.test(p.plain), 'got: ' + p.plain);
  });

  it('salary question -> unknown, no invented number', () => {
    const p = run('What is Nivi\'s salary?');
    assert.equal(p.isUnknown, true);
    assert.ok(p.plain.indexOf('whiskers') !== -1);
  });

  it('preferred tech -> no favorite inference', () => {
    const p = run('What is her preferred tech?');
    assert.ok(/don't have a documented favorite/i.test(p.plain), 'got: ' + p.plain);
  });
});

describe('acceptance: category / ML listing', () => {
  it('what about ML -> lists BOTH medical & vision with reasons, no ranking', () => {
    const p = run('What about ML?');
    assert.equal(p.intent.name, 'CATEGORY_SPECIFIC');
    assert.ok(p.plain.indexOf('MedTracker') !== -1, 'MedTracker should appear via KB ML tag');
    assert.ok(p.plain.indexOf('CardioVision') !== -1, 'CardioVision should appear');
    assert.ok(/Projects that fit/.test(p.plain), 'should show category list, got: ' + p.plain);
    assert.ok(/don't rank|don.t rank/i.test(p.plain) === false, 'no ranking in category list');
  });

  it('ML projects include MedTracker via ai/llm KB term', () => {
    const p = run('What ML projects does she have?');
    assert.ok(p.plain.indexOf('MedTracker') !== -1, 'MedTracker should match ML via ai/llm, got: ' + p.plain);
    assert.ok(p.plain.indexOf('CardioVision') !== -1);
  });

  it('which project is relevant to backend -> dimensional, no single best', () => {
    const p = run('Which project is relevant to backend development?');
    assert.equal(p.intent.name, 'PROJECT_COMPARISON');
    assert.ok(p.categories.indexOf('Backend') !== -1);
    assert.ok(/don't rank|don.t rank/i.test(p.plain), 'should refuse ranking, got: ' + p.plain);
  });

  it('favorite project not chosen even in context', () => {
    const state = N.createState();
    run('Tell me about CardioVision.', state);
    const p = run('What is her favorite project?', state);
    assert.ok(/don't have a documented favorite/i.test(p.plain), 'got: ' + p.plain);
  });
});

describe('acceptance: no duplicate technologies', () => {
  it('detectTechnologies dedupes across lists', () => {
    const e1 = N.detectEntities('Does she know React and Python and MongoDB?', kb);
    const names = e1.technologies;
    const unique = names.filter(function (t, i) { return names.indexOf(t) === i; });
    assert.equal(names.length, unique.length, 'duplicates: ' + JSON.stringify(names));
  });

  it('stack response has no duplicate tech terms', () => {
    const p = run('Does she know React and Python and MongoDB?');
    const words = p.plain.toLowerCase().split(/[^a-z0-9.#-]+/).filter(Boolean);
    const seen = {};
    let dup = null;
    words.forEach(function (w) {
      if (w.length > 2) {
        if (seen[w] && seen[w] > 0) dup = w;
        seen[w] = (seen[w] || 0) + 1;
      }
    });
    assert.equal(dup, null, 'duplicate tech term in response: ' + dup);
  });
});
