(function (root) {
  var N = root.NiviCB = root.NiviCB || {};

  var CAT_FLAVOR = ["*purr* ", "*kneads* "];

  var OPENERS = {
    STORY: [
      "Ah, this one has a story.",
      "This one is my favourite to tell.",
      "Now this is a good one."
    ],
    TECHNICAL: [
      "Now we're getting into the nerdy part.",
      "My whiskers are picking up a technical question.",
      "Under the hood, it gets interesting."
    ],
    RECRUITER: [
      "Here's the honest pitch.",
      "She's genuinely good at this.",
      "Put it on your radar:"
    ],
    CAT: [
      "Oh, easy one.",
      "Right, so —",
      "Happy to help."
    ],
    TOUR_GUIDE: [
      "Follow me — I know the way.",
      "I keep a map of all six in my head.",
      "Right this way."
    ],
    UNKNOWN: [
      "Hmm.",
      "My whiskers twitch on that one."
    ]
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function apply(mode, text) {
    var flavor = "";
    var roll = Math.random();
    var openers = OPENERS[mode] || OPENERS.CAT;
    if (roll < 0.55) {
      if (Math.random() < 0.5) flavor = pick(CAT_FLAVOR);
      else flavor = pick(openers) + " ";
    }
    return flavor + text;
  }

  N.CAT_FLAVOR = CAT_FLAVOR;
  N.personalityApply = apply;
})(typeof window !== "undefined" ? window : globalThis);
