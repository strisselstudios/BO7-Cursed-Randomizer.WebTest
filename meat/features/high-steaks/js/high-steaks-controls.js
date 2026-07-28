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
  ? "PAIR READY. PLACE CARDS"
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

  const playedCards = Array.isArray(state.player.playedCards)
    ? state.player.playedCards
    : [];

  if (playedCards.length > 0) {
    const originalCardOrder = new Map(
      HighSteaks.PLACEHOLDER_PLAYER_HAND.map(
        (card, index) => [card.id, index]
      )
    );

    state.player.hand = [
      ...state.player.hand,
      ...playedCards
    ].sort((firstCard, secondCard) => {
      return (
        (originalCardOrder.get(firstCard.id) ?? Number.MAX_SAFE_INTEGER) -
        (originalCardOrder.get(secondCard.id) ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }

  state.player.selectedCardIds = [];
  state.player.playedCards = [];
  state.locked = false;
  state.sceneState = "table";
  state.phaseText = "CHOOSE EXACTLY TWO CARDS";

  HighSteaks.renderPrototype();
};

HighSteaks.confirmPrototypeSelection = function confirmPrototypeSelection() {
  const state = HighSteaks.prototypeState;

  if (
    !state ||
    state.locked ||
    state.player.selectedCardIds.length !== 2
  ) {
    return false;
  }

  const selectedCardIds = new Set(
    state.player.selectedCardIds
  );

  const selectedCards = state.player.hand.filter(
    (card) => selectedCardIds.has(card.id)
  );

  if (selectedCards.length !== 2) {
    return false;
  }

  state.player.playedCards = selectedCards;

  state.player.hand = state.player.hand.filter(
    (card) => !selectedCardIds.has(card.id)
  );

  state.player.selectedCardIds = [];
  state.locked = true;
  state.sceneState = "reveal";
  state.phaseText = "CARDS PLACED. AWAITING OPPONENT";

  HighSteaks.renderPrototype();

  document.dispatchEvent(
    new CustomEvent(
      "high-steaks:prototype-pair-locked",
      {
        detail: {
          cards: selectedCards.map(
            (card) => ({ ...card })
          )
        }
      }
    )
  );

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
