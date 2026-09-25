(function (root) {
  var N = root.NiviCB = root.NiviCB || {};

  var INTENTS = [
    { name: "PROJECT_RESULTS", mode: "STORY", patterns: [
      /\b(what|what.?s|were|was|did)\b.{0,28}\b(result[s]?|metric[s]?|outcome[s]?|accuracy|f[- ]?measure|f1[- ]?score|mAP|performance|impact|achievement[s]?)\b|how (well|did) (it|she|thing) (perform|work|do)|what did she (achiev|produce|ship)/
    ] },
    { name: "PROJECT_CHALLENGE", mode: "STORY", patterns: [
      /\bchalleng|struggl|tricky|bottleneck|obstacle|hardest|difficult|pain point|was (it|that|this|the) hard|was hard\b|(what|why)\b.{0,24}\b(challeng|hard|hardest|difficult|struggl|problem|issue)\b/
    ] },
    { name: "PROJECT_LEARNINGS", mode: "STORY", patterns: [
      /\b(what|did|learn|learned|learnt|lesson|takeaway|take away)\b.{0,28}\b(learn|lesson|takeaway|gain|gained|improve|improvement)\b|what did (she|nivi|it) (learn|take)/
    ] },
    { name: "PROJECT_MOTIVATION", mode: "STORY", patterns: [
      /\b(why|what.*reason|reason behind|what motivated|inspir)\b.{0,28}(build|make|create|start|project|it)\b|\b(motivat|inspir)\b/
    ] },
    { name: "PROJECT_ARCHITECTURE", mode: "TECHNICAL", patterns: [
      /\b(architecture|architect|system design|under the hood|internals|workflow|pipeline|data flow|design decision)\b|how (is|was|does|did) (it|the|this|that)\b.{0,24}\b(work|built|design|structur|construct|function|implement|architect|train)\b|how (is|was) (it|the app|the system)\b.{0,20}\b(built|designed|constructed|structured|architected|trained|implemented|developed)\b|how (is|was|does|did) [a-z0-9]+.{0,24}\b(work|built|design|structur|construct|function|implement|architect|train)\b/
    ] },
    { name: "PROJECT_TECHNICAL", mode: "TECHNICAL", patterns: [
      /\b(what|which|what.?s|was)\b.{0,3}\b(technology|technologies|tech stack|stack|framework[s]?|tool[s]?|librar[a-z]+|language[s]?|model[s]?|api[s]?|database[s]?)\b(.{0,30}(use|used|behind|for|power|built|in))?|(technology|technologies|tech stack|stack|framework|tool|model|language)\b.{0,16}\b(use|used|behind|for|in|power|built)\b|how was (it|the project|cardio) trained/
    ] },
    { name: "PROJECT_COMPARISON", mode: "CAT", patterns: [
      /\bcompare|comparison|best project|recommend.{0,24}\b(project|which|best|suitable|for|one)\b|top project|strongest|most relevant|suitable for|best fit|good project|which project (would|should|is better|best)|(which|what) project.{0,24}\b(best|relevant|suitable|good fit|matches|recommend)\b|which one (is|fits|suits)\b/
    ] },
    { name: "PROJECT_SPECIFIC", mode: "STORY", patterns: [
      /\b(what is|what.?s|tell me about|describe|summarize|explain|show me|overview|talk about|about)\b.{0,36}\b(project|it|this|that|one|the first|the second|the third)\b|what (is|does|was) (this|that|it)\b/
    ] },
    { name: "CATEGORY_SPECIFIC", mode: "CAT", patterns: [
      /\b(what|which|has|does|have)\b.{0,24}\b(ml|machine learning|ai|artificial intelligence|computer vision|cv|nlp|llm|generative ai|genai|rag|cloud|aws|serverless|full.?stack|frontend|backend|devops|linux|security|healthcare|graph|database)\w*\b( projects?| work| build| experience| skills?)?\b/
    ] },
    { name: "PROJECTS", mode: "TOUR_GUIDE", patterns: [
      /\bprojects?|what (has|did|does) (she|nivi) (built|build|made|create|worked on|done)|show me her work|show me.*projects|her projects|portfolio projects|project list|case stud|what.*built\b/,
      /\bwhat (did|has) (she|nivi) (work on|do|build|built|made|create|created|worked on)\b/
    ] },
    { name: "SOFT_SKILLS", mode: "RECRUITER", patterns: [
      /\bsoft skills?|non.?technical|beyond tech|apart from tech|human skill|strengths?|leadership|collaboration|communication|teamwork|problem solving|ownership|reliability|adaptability|soft side\b/
    ] },
    { name: "SKILLS", mode: "CAT", patterns: [
      /\b(technical skills?|hard skills?|skills?|what does she know|what can she do|technologies|tech stack|programming language|what is she good at|tools?)\b/
    ] },
    { name: "TECHNOLOGY_SPECIFIC", mode: "TECHNICAL", patterns: [
      /\b(does|is|can|would|are)\b.{0,20}\b(know|knows|use|uses|familiar|proficient|good with|good at|work with|worked with|code in|write)\b|what.*\b(stack|tech|languag|framework)\b|which.*\b(stack|tech|languag|framework)\b/
    ] },
    { name: "EDUCATION", mode: "CAT", patterns: [
      /\b(education|b\.?tech|cgpa|gpa|school|juit|university|college|coursework|certificate|study|academic|grades?)\b/
    ] },
    { name: "EXPERIENCE", mode: "CAT", patterns: [
      /\b(experience|work experience|worked|career|professional|industry)\b/
    ] },
    { name: "INTERNSHIP", mode: "CAT", patterns: [
      /\b(intern|internship|iit delhi|summer program)\b/
    ] },
    { name: "OFF_CLOCK", mode: "STORY", patterns: [
      /\b(hobb|off the clock|outside coding|outside work|free time|photography|photographer|travel|camera|music|playlist|lo.?fi|passion)\b/
    ] },
    { name: "COMMUNITY", mode: "CAT", patterns: [
      /\b(community|hackathon|club|ieee|jyc|gdg|azure ignit|sih|murious|sustainathon|organis|volunteer)\b/
    ] },
    { name: "CONTACT", mode: "CAT", patterns: [
      /\b(contact|email|mail|reach out|get in touch|talk to|message|ping)\b/
    ] },
    { name: "RESUME", mode: "CAT", patterns: [
      /\b(resume|cv|curriculum vitae|pdf)\b/
    ] },
    { name: "GITHUB", mode: "CAT", patterns: [
      /\b(github|repositories|repos|source code|open source)\b/
    ] },
    { name: "LINKEDIN", mode: "CAT", patterns: [
      /\b(linkedin|professional profile)\b/
    ] },
    { name: "LOCATION", mode: "RECRUITER", patterns: [
      /\b(where does nivi live|where is nivi|where does she live|where is she based|whereabouts|location)\b/
    ] },
    { name: "WHY_HIRE", mode: "RECRUITER", patterns: [
      /\b(why.*(hire|nivi)|hire.*why|what makes.*(great|good|candidate)|elevator|pitch me|sell me|should.*hire)\b/
    ] },
    { name: "HIRING", mode: "RECRUITER", patterns: [
      /\b(hire|hiring|recruit|recruiter|candidate|job|opportunity|apply)\b/
    ] },
    { name: "WHY_CAT", mode: "CAT", patterns: [
      /\b(why.*(cat|are you)|what.*(cat|are you)|who.*(cat|made you)|are you.*(cat|real|ai|bot))\b/
    ] },
    { name: "HELP", mode: "CAT", patterns: [
      /\b(help|help me|can you help|what can (i|you) (ask|do|say|help)|how do i use|how to use|start|guide me|what should i ask)\b/
    ] },
    { name: "ROLE", mode: "CAT", patterns: [
      /\b(who are you|what are you|what is this|your name|whats your name|about you|yourself|how are you|how.*doing|can you (do|help))\b/
    ] },
    { name: "ABOUT", mode: "CAT", patterns: [
      /\b(what does (she|nivi) (do|work on)|what (is|was) she (doing|up to)|what.{0,4}her role)\b/
    ] },
    { name: "IDENTITY", mode: "STORY", patterns: [
      /\b(about nivi|who is nivi|who.?s nivi|about herself|about her|tell me about (her|yourself|nivi)|who is she)\b/
    ] },
    { name: "GREETING", mode: "CAT", patterns: [
      /^(hi|hello|hey|hii|hiya|yo|sup|good morning|good afternoon|good evening|namaste|hola)\b/
    ] },
    { name: "FUN_FACT", mode: "CAT", patterns: [
      /\b(fun fact|interesting fact|tell me something|surprise me|joke|something fun)\b/
    ] }
  ];
  var UNKNOWN = { name: "UNKNOWN", mode: "CAT" };

  function normalize(s) {
    return String(s || "").toLowerCase()
      .replace(/\bbout\b/g, " about ")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectIntent(qn) {
    for (var i = 0; i < INTENTS.length; i++) {
      var it = INTENTS[i];
      for (var j = 0; j < it.patterns.length; j++) {
        if (it.patterns[j].test(qn)) return { name: it.name, mode: it.mode };
      }
    }
    return { name: UNKNOWN.name, mode: UNKNOWN.mode };
  }

  N.INTENTS = INTENTS;
  N.UNKNOWN = UNKNOWN;
  N.normalize = normalize;
  N.detectIntent = detectIntent;
})(typeof window !== "undefined" ? window : globalThis);
