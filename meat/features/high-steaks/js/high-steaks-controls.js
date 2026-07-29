/* ==========================================================
   1. PLAYER CARD SELECTION
========================================================== */

HighSteaks.togglePrototypeCardSelection =
  function togglePrototypeCardSelection(
    cardId
  ) {
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

    const selectedCardIndex =
      state.player.selectedCardIds
        .indexOf(cardId);

    if (selectedCardIndex >= 0) {
      state.player.selectedCardIds.splice(
        selectedCardIndex,
        1
      );

      state.phaseText =
        "CHOOSE EXACTLY TWO CARDS";

      HighSteaks.renderPrototype();

      return true;
    }

    if (
      state.player.selectedCardIds
        .length >=
      HighSteaks.MATCH_SETTINGS
        .cardsPerPlay
    ) {
      state.phaseText =
        "ONLY TWO CARDS MAY BE PLAYED";

      HighSteaks.renderPrototype();

      return false;
    }

    state.player.selectedCardIds.push(
      cardId
    );

    state.phaseText =
      state.player.selectedCardIds.length ===
        HighSteaks.MATCH_SETTINGS.cardsPerPlay
        ? "PAIR READY. PLACE CARDS"
        : "CHOOSE ONE MORE CARD";

    HighSteaks.renderPrototype();

    return true;
  };

/* ==========================================================
   2. CLEAR SELECTION
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

/* ==========================================================
   3. PLACE PLAYER CARDS
========================================================== */

HighSteaks.confirmPrototypeSelection =
  function confirmPrototypeSelection() {
    const state =
      HighSteaks.prototypeState;

    if (
      !state ||
      state.locked ||
      state.phase !==
        HighSteaks.PHASE_PLAYER_TURN ||
      state.player.selectedCardIds.length !==
        HighSteaks.MATCH_SETTINGS.cardsPerPlay
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

    if (
      selectedCards.length !==
      HighSteaks.MATCH_SETTINGS
        .cardsPerPlay
    ) {
      return false;
    }

    const placementMotion =
      HighSteaks.capturePlayerCardPlacementMotion(
        state.player.selectedCardIds
      );

    const handReflowMotion =
      HighSteaks.capturePlayerHandReflowMotion(
        state.player.selectedCardIds
      );

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

    state.phase =
      HighSteaks.PHASE_DEALER_TURN;

    state.sceneState =
      "reveal";

    state.locked = true;

    state.phaseText =
      "T.E.D.D. IS CHOOSING";

    HighSteaks.renderPrototype();

    HighSteaks.animatePlacedCards(
      placementMotion
    );

    HighSteaks.animatePlayerHandReflow(
      handReflowMotion
    );

    HighSteaks.startTeddTurn(
      state
    );

    document.dispatchEvent(
      new CustomEvent(
        "high-steaks:player-cards-placed",
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
   4. PLAYER INPUT
========================================================== */

highSteaksPlayerHand
  ?.addEventListener(
    "click",
    (event) => {
      if (
        !(event.target instanceof Element)
      ) {
        return;
      }

      const cardButton =
        event.target.closest(
          "[data-high-steaks-card-id]"
        );

      if (
        !(
          cardButton instanceof
          HTMLButtonElement
        ) ||
        !highSteaksPlayerHand.contains(
          cardButton
        )
      ) {
        return;
      }

      event.preventDefault();

      HighSteaks.togglePrototypeCardSelection(
        cardButton.dataset
          .highSteaksCardId
      );
    }
  );

highSteaksClearButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      HighSteaks.clearPrototypeSelection();
    }
  );

highSteaksConfirmButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      HighSteaks.confirmPrototypeSelection();
    }
  );
