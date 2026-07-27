/* ==========================================================
   1. PLAYER CARD SELECTION
========================================================== */

HighSteaks.togglePrototypeCardSelection = function togglePrototypeCardSelection(cardId) {
  const state = HighSteaks.prototypeState;
  if (!state || state.locked) return false;

  const selectedCardIndex = state.player.selectedCardIds.indexOf(cardId);

  if (selectedCardIndex >= 0) {
    state.player.selectedCardIds.splice(selectedCardIndex, 1);
    state.phaseText = "CHOOSE EXACTLY TWO CARDS";
    HighSteaks.renderPrototype();
    return true;
  }

  if (state.player.selectedCardIds.length >= 2) {
    state.phaseText = "ONLY TWO CARDS MAY BE PLAYED";
    HighSteaks.renderPrototype();
    return false;
  }

  state.player.selectedCardIds.push(cardId);
  state.phaseText = state.player.selectedCardIds.length === 2
    ? "PAIR READY. LOCK IN YOUR PLAY"
    : "CHOOSE ONE MORE CARD";
  HighSteaks.renderPrototype();
  return true;
};

/* ==========================================================
   2. PROTOTYPE PAIR CONTROLS
========================================================== */

HighSteaks.clearPrototypeSelection = function clearPrototypeSelection() {
  const state = HighSteaks.prototypeState;
  if (!state) return;

  state.player.selectedCardIds = [];
  state.locked = false;
  state.sceneState = "table";
  state.phaseText = "CHOOSE EXACTLY TWO CARDS";
  HighSteaks.renderPrototype();
};

HighSteaks.confirmPrototypeSelection = function confirmPrototypeSelection() {
  const state = HighSteaks.prototypeState;
  if (!state || state.locked || state.player.selectedCardIds.length !== 2) return false;

  state.locked = true;
  state.sceneState = "reveal";
  state.phaseText = "PAIR LOCKED. REVEAL ENGINE COMES NEXT";
  HighSteaks.renderPrototype();
  document.dispatchEvent(new CustomEvent("high-steaks:prototype-pair-locked"));
  return true;
};

/* ==========================================================
   3. PROTOTYPE INPUT BINDINGS
========================================================== */

highSteaksPlayerHand?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const cardButton = event.target.closest("[data-high-steaks-card-id]");
  if (!(cardButton instanceof HTMLButtonElement) || !highSteaksPlayerHand.contains(cardButton)) return;

  event.preventDefault();
  HighSteaks.togglePrototypeCardSelection(cardButton.dataset.highSteaksCardId);
});

highSteaksClearButton?.addEventListener("click", (event) => {
  event.preventDefault();
  HighSteaks.clearPrototypeSelection();
});

highSteaksConfirmButton?.addEventListener("click", (event) => {
  event.preventDefault();
  HighSteaks.confirmPrototypeSelection();
});
