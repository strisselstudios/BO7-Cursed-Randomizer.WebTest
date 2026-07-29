/* ==========================================================
   1. PLAYER CARD SELECTION
========================================================== */

HighSteaks.togglePrototypeCardSelection = function togglePrototypeCardSelection(cardId) {
    const state =
    HighSteaks.prototypeState;

  if (
    !state ||
    state.locked ||
    state.phase !==
      HighSteaks.PHASE_PLAYER_TURN
  ) {
    return false;
  }

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

HighSteaks.clearPrototypeSelection =
  function clearPrototypeSelection() {
    const state =
      HighSteaks.prototypeState;

    if (
      !state ||
      state.locked ||
      state.phase !==
        HighSteaks.PHASE_PLAYER_TURN
    ) {
      return false;
    }

    state.player.selectedCardIds = [];

    state.phaseText =
      "CHOOSE EXACTLY TWO CARDS";

    HighSteaks.renderPrototype();

    return true;
  };

HighSteaks.confirmPrototypeSelection = function confirmPrototypeSelection() {
  const state =
    HighSteaks.prototypeState;

  if (
    !state ||
    state.locked ||
    state.player.selectedCardIds.length !== 2
  ) {
    return false;
  }

  const selectedCardIds =
    new Set(
      state.player.selectedCardIds
    );

  const selectedCards =
    state.player.hand.filter(
      (card) =>
        selectedCardIds.has(
          card.id
        )
    );

  if (selectedCards.length !== 2) {
    return false;
  }

  const placementMotion =
    typeof HighSteaks.capturePlayerCardPlacementMotion ===
      "function"
      ? HighSteaks.capturePlayerCardPlacementMotion(
          state.player.selectedCardIds
        )
      : [];

  const handReflowMotion =
    typeof HighSteaks.capturePlayerHandReflowMotion ===
      "function"
      ? HighSteaks.capturePlayerHandReflowMotion(
          state.player.selectedCardIds
        )
      : [];

  state.player.playedCards =
    selectedCards;

  state.player.hand =
    state.player.hand.filter(
      (card) =>
        !selectedCardIds.has(
          card.id
        )
    );

  state.player.selectedCardIds = [];
  state.locked = true;
  state.sceneState = "reveal";

  state.phaseText =
    "CARDS PLACED. AWAITING OPPONENT";

    HighSteaks.renderPrototype();

  /*
   * Install the real-card placement animations immediately
   * after layout changes and before this event task ends.
   * The browser never paints the cards sitting in their final
   * positions before their starting transforms are active.
   */

  if (
    typeof HighSteaks.animatePlacedCards ===
      "function"
  ) {
    HighSteaks.animatePlacedCards(
      placementMotion
    );
  }

  if (
    typeof HighSteaks.animatePlayerHandReflow ===
      "function"
  ) {
    HighSteaks.animatePlayerHandReflow(
      handReflowMotion
    );
  }
  document.dispatchEvent(
    new CustomEvent(
      "high-steaks:prototype-pair-locked",
      {
        detail: {
          cards:
            selectedCards.map(
              (card) => ({
                ...card
              })
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
