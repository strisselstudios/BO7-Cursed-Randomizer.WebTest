/* ==========================================================
   1. HIGH STEAKS NAMESPACE
========================================================== */

window.HighSteaks = window.HighSteaks || {};

/* ==========================================================
   2. INTERFACE SCREENS
========================================================== */

HighSteaks.SCREEN_LOBBY = "lobby";
HighSteaks.SCREEN_DEALER_SELECT = "dealer-select";
HighSteaks.SCREEN_TABLE = "table";
HighSteaks.SCREEN_RESULTS = "results";

HighSteaks.SCREENS = Object.freeze([
  HighSteaks.SCREEN_LOBBY,
  HighSteaks.SCREEN_DEALER_SELECT,
  HighSteaks.SCREEN_TABLE,
  HighSteaks.SCREEN_RESULTS
]);

/* ==========================================================
   3. MATCH PHASES
========================================================== */

HighSteaks.PHASE_IDLE = "idle";
HighSteaks.PHASE_DEALING = "dealing";
HighSteaks.PHASE_PLAYER_TURN = "player-turn";
HighSteaks.PHASE_DEALER_TURN = "dealer-turn";
HighSteaks.PHASE_REVEAL = "reveal";
HighSteaks.PHASE_ROUND_RESULT = "round-result";
HighSteaks.PHASE_MATCH_RESULT = "match-result";

/* ==========================================================
   4. MATCH SETTINGS
========================================================== */

HighSteaks.MATCH_SETTINGS = Object.freeze({
  openingHandSize: 10,
  cardsPerPlay: 2,
  maximumRounds: 5,
  winsRequired: 3
});

/* ==========================================================
   5. OPENING DEAL SETTINGS
========================================================== */

HighSteaks.DEAL_SETTINGS = Object.freeze({
  openingDelayMs: 1000,
  intervalMs: 72,
  cardDurationMs: 330,
  offscreenPaddingPx: 90
});

/* ==========================================================
   6. DIFFICULTY DEFINITIONS
========================================================== */

HighSteaks.DIFFICULTY_DEFINITIONS = Object.freeze({
  standard: Object.freeze({
    id: "standard",
    label: "STANDARD",
    description:
      "T.E.D.D. plays a balanced game without seeing your selected cards."
  })
});

/* ==========================================================
   7. DEALER DEFINITIONS
========================================================== */

HighSteaks.DEALER_DEFINITIONS = Object.freeze({
  tedd: Object.freeze({
    id: "tedd",
    name: "T.E.D.D.",
    image:
      "meat/features/high-steaks/images/opponents/dealer-1.png",
    difficultyIds: Object.freeze([
      "standard"
    ])
  })
});

/* ==========================================================
   8. STANDARD CARD DEFINITIONS
========================================================== */

HighSteaks.CARD_SUITS = Object.freeze([
  Object.freeze({
    id: "spades",
    symbol: "♠",
    color: "black"
  }),

  Object.freeze({
    id: "hearts",
    symbol: "♥",
    color: "red"
  }),

  Object.freeze({
    id: "clubs",
    symbol: "♣",
    color: "black"
  }),

  Object.freeze({
    id: "diamonds",
    symbol: "♦",
    color: "red"
  })
]);

HighSteaks.CARD_RANKS = Object.freeze([
  Object.freeze({ rank: "2", value: 2 }),
  Object.freeze({ rank: "3", value: 3 }),
  Object.freeze({ rank: "4", value: 4 }),
  Object.freeze({ rank: "5", value: 5 }),
  Object.freeze({ rank: "6", value: 6 }),
  Object.freeze({ rank: "7", value: 7 }),
  Object.freeze({ rank: "8", value: 8 }),
  Object.freeze({ rank: "9", value: 9 }),
  Object.freeze({ rank: "10", value: 10 }),
  Object.freeze({ rank: "J", value: 11 }),
  Object.freeze({ rank: "Q", value: 12 }),
  Object.freeze({ rank: "K", value: 13 }),
  Object.freeze({ rank: "A", value: 14 })
]);
