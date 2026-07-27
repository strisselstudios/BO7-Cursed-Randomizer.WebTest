/* ==========================================================
   1. HIGH STEAKS PROTOTYPE NAMESPACE
   ----------------------------------------------------------
   Keeps temporary scene data isolated from the future match
   engine, AI, economy, card registry, and persistent state.
========================================================== */
window.HighSteaks = window.HighSteaks || {};

/* ==========================================================
   2. PLACEHOLDER CARD DEFINITIONS
========================================================== */
HighSteaks.PLACEHOLDER_PLAYER_HAND = Object.freeze([
  Object.freeze({ id: "prototype-1-bone", value: 1, suit: "BONE", symbol: "I" }),
  Object.freeze({ id: "prototype-2-blood", value: 2, suit: "BLOOD", symbol: "II" }),
  Object.freeze({ id: "prototype-3-steel", value: 3, suit: "STEEL", symbol: "III" }),
  Object.freeze({ id: "prototype-4-aether", value: 4, suit: "AETHER", symbol: "IV" }),
  Object.freeze({ id: "prototype-5-bone", value: 5, suit: "BONE", symbol: "V" }),
  Object.freeze({ id: "prototype-6-blood", value: 6, suit: "BLOOD", symbol: "VI" }),
  Object.freeze({ id: "prototype-7-steel", value: 7, suit: "STEEL", symbol: "VII" }),
  Object.freeze({ id: "prototype-8-aether", value: 8, suit: "AETHER", symbol: "VIII" }),
  Object.freeze({ id: "prototype-9-bone", value: 9, suit: "BONE", symbol: "IX" }),
  Object.freeze({ id: "prototype-10-blood", value: 10, suit: "BLOOD", symbol: "X" })
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
    deckCount: 20,
    wagerLabel: "NO WAGER",
    opponent: { name: "THE DRIFTER", wins: 0, handSize: 10, playedCards: [] },
    player: { wins: 0, hand: HighSteaks.PLACEHOLDER_PLAYER_HAND.map((card) => ({ ...card })), selectedCardIds: [] },
    history: [],
    locked: false
  };
};
