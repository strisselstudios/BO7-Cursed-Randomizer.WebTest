/* ==========================================================
   1. HIGH STEAKS PROTOTYPE NAMESPACE
   ----------------------------------------------------------
   Keeps temporary scene data isolated from the future match
   engine, AI, economy, and persistent progression.
========================================================== */
window.HighSteaks = window.HighSteaks || {};

/* ==========================================================
   2. STANDARD PLAYING-CARD DEFINITIONS
   ----------------------------------------------------------
   These are real ranks and suits used only for the prototype.
   Final themed card art can replace the renderer later without
   changing card identity or match data.
========================================================== */
HighSteaks.PLACEHOLDER_PLAYER_HAND = Object.freeze([
  Object.freeze({ id: "prototype-5-spades", rank: "5", value: 5, suit: "spades", symbol: "♠", color: "black" }),
  Object.freeze({ id: "prototype-6-hearts", rank: "6", value: 6, suit: "hearts", symbol: "♥", color: "red" }),
  Object.freeze({ id: "prototype-2-clubs", rank: "2", value: 2, suit: "clubs", symbol: "♣", color: "black" }),
  Object.freeze({ id: "prototype-j-diamonds", rank: "J", value: 11, suit: "diamonds", symbol: "♦", color: "red" }),
  Object.freeze({ id: "prototype-8-hearts", rank: "8", value: 8, suit: "hearts", symbol: "♥", color: "red" }),
  Object.freeze({ id: "prototype-q-clubs", rank: "Q", value: 12, suit: "clubs", symbol: "♣", color: "black" }),
  Object.freeze({ id: "prototype-7-clubs", rank: "7", value: 7, suit: "clubs", symbol: "♣", color: "black" }),
  Object.freeze({ id: "prototype-k-diamonds", rank: "K", value: 13, suit: "diamonds", symbol: "♦", color: "red" }),
  Object.freeze({ id: "prototype-10-diamonds", rank: "10", value: 10, suit: "diamonds", symbol: "♦", color: "red" }),
  Object.freeze({ id: "prototype-a-spades", rank: "A", value: 14, suit: "spades", symbol: "♠", color: "black" })
]);

/* ==========================================================
   3. PLACEHOLDER STATE FACTORY
========================================================== */
HighSteaks.createPlaceholderState = function createPlaceholderState() {
  return {
    sceneState: "table",
    round: 1,
    maximumRounds: 5,
    winsRequired: 3,
    ruleName: "STANDARD DUEL",
    phaseText: "CHOOSE EXACTLY TWO CARDS",
    opponent: { name: "THE DRIFTER", wins: 0, handSize: 10, playedCards: [] },
    player: {
  wins: 0,
  hand: HighSteaks.PLACEHOLDER_PLAYER_HAND.map((card) => ({ ...card })),
  selectedCardIds: [],
  playedCards: []
},
    history: [],
    locked: false
  };
};

HighSteaks.prototypeState = HighSteaks.createPlaceholderState();
