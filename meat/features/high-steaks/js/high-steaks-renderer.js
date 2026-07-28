/* ==========================================================
   1. STANDARD PLAYING-CARD ELEMENTS
========================================================== */
HighSteaks.getCardPipCount = function getCardPipCount(card) {
  const numericRank = Number.parseInt(card.rank, 10);
  return Number.isInteger(numericRank) && numericRank >= 2 && numericRank <= 10
    ? numericRank
    : 1;
};

HighSteaks.createCardCornerElement = function createCardCornerElement(card, position) {
  const cornerElement = document.createElement("span");
  cornerElement.className = `high-steaks-card-corner high-steaks-card-corner-${position}`;

  const rankElement = document.createElement("strong");
  rankElement.className = "high-steaks-card-rank";
  rankElement.textContent = card.rank;

  const suitElement = document.createElement("span");
  suitElement.className = "high-steaks-card-corner-suit";
  suitElement.textContent = card.symbol;

  cornerElement.append(rankElement, suitElement);
  return cornerElement;
};

HighSteaks.createCardCenterElement = function createCardCenterElement(card) {
  const centerElement = document.createElement("span");
  centerElement.className = "high-steaks-card-center";

  if (["J", "Q", "K"].includes(card.rank)) {
    const courtElement = document.createElement("span");
    courtElement.className = "high-steaks-card-court";
    courtElement.textContent = `${card.rank}${card.symbol}`;
    centerElement.append(courtElement);
    return centerElement;
  }

  if (card.rank === "A") {
    const aceElement = document.createElement("span");
    aceElement.className = "high-steaks-card-ace";
    aceElement.textContent = card.symbol;
    centerElement.append(aceElement);
    return centerElement;
  }

  const pipCount = HighSteaks.getCardPipCount(card);
  const pipsElement = document.createElement("span");
  pipsElement.className = "high-steaks-card-pips";
  pipsElement.dataset.pipCount = String(pipCount);

  for (let pipIndex = 0; pipIndex < pipCount; pipIndex += 1) {
    const pipElement = document.createElement("span");
    pipElement.className = "high-steaks-card-pip";
    pipElement.textContent = card.symbol;
    pipsElement.append(pipElement);
  }

  centerElement.append(pipsElement);
  return centerElement;
};

HighSteaks.createCardFaceElement = function createCardFaceElement(card, options = {}) {
  const elementName = options.interactive ? "button" : "span";
  const cardElement = document.createElement(elementName);

  if (options.interactive) {
    cardElement.type = "button";
    cardElement.setAttribute("role", "listitem");
    cardElement.setAttribute("aria-pressed", options.selected ? "true" : "false");
  }

  cardElement.className = `high-steaks-card high-steaks-card-face is-${card.color}`;
  cardElement.dataset.highSteaksCardId = card.id;
  cardElement.dataset.highSteaksCardValue = String(card.value);
  cardElement.dataset.highSteaksCardSuit = card.suit;
  cardElement.setAttribute("aria-label", `${card.rank} of ${card.suit}`);
  cardElement.classList.toggle("is-selected", Boolean(options.selected));
  if (options.interactive) cardElement.disabled = Boolean(options.disabled);

  cardElement.append(
    HighSteaks.createCardCornerElement(card, "top"),
    HighSteaks.createCardCenterElement(card),
    HighSteaks.createCardCornerElement(card, "bottom")
  );

  return cardElement;
};

HighSteaks.createCardBackElement = function createCardBackElement(index) {
  const cardElement = document.createElement("span");
  cardElement.className = "high-steaks-card high-steaks-card-back";
  cardElement.dataset.highSteaksOpponentCardIndex = String(index);
  cardElement.setAttribute("aria-hidden", "true");
  return cardElement;
};

HighSteaks.createEmptyPlaySlot = function createEmptyPlaySlot(label, ownerLabel) {
  const slotElement = document.createElement("span");
  slotElement.className = `high-steaks-play-card-slot is-${ownerLabel.toLowerCase()}-slot`;
  slotElement.setAttribute(
  "role",
  "img"
);

slotElement.setAttribute(
  "aria-label",
  label
);
  return slotElement;
};

/* ==========================================================
   2. SCOREBOARD RENDERING
========================================================== */
HighSteaks.renderWinPips = function renderWinPips(container, wins, label) {
  if (!container) return;
  Array.from(container.children).forEach((pip, index) => pip.classList.toggle("is-won", index < wins));
  container.setAttribute("aria-label", `${label} round wins: ${wins}`);
};

HighSteaks.renderScoreboard = function renderScoreboard(state) {
  if (highSteaksRoundValue) highSteaksRoundValue.textContent = `${state.round} / ${state.maximumRounds}`;
  HighSteaks.renderWinPips(highSteaksOpponentWins, state.opponent.wins, "Opponent");
  HighSteaks.renderWinPips(highSteaksPlayerWins, state.player.wins, "Player");
};

/* ==========================================================
   3. HAND RENDERING
========================================================== */
HighSteaks.renderOpponentHand = function renderOpponentHand(state) {
  if (!highSteaksOpponentHand) return;

  highSteaksOpponentHand.replaceChildren();
  for (let index = 0; index < state.opponent.handSize; index += 1) {
    highSteaksOpponentHand.append(HighSteaks.createCardBackElement(index));
  }

  highSteaksOpponentHand.setAttribute("aria-label", `Opponent hand: ${state.opponent.handSize} hidden cards`);
};

/* ==========================================================
   3.1 PLAYER HAND CARD STATE
   ----------------------------------------------------------
   Updates an existing card without destroying and recreating
   its DOM element. Persistent elements permit CSS transitions
   when cards move, raise, lower, or close gaps in the hand.
========================================================== */

HighSteaks.updatePlayerHandCardElement = function updatePlayerHandCardElement(
  cardElement,
  card,
  options = {}
) {
  if (!(cardElement instanceof HTMLButtonElement)) {
    return false;
  }

  const selected =
    options.selected === true;

  cardElement.className =
    `high-steaks-card high-steaks-card-face is-${card.color}`;

  cardElement.classList.toggle(
    "is-selected",
    selected
  );

  cardElement.dataset.highSteaksCardId =
    card.id;

  cardElement.dataset.highSteaksCardValue =
    String(card.value);

  cardElement.dataset.highSteaksCardSuit =
    card.suit;

  cardElement.setAttribute(
    "aria-label",
    `${card.rank} of ${card.suit}`
  );

  cardElement.setAttribute(
    "aria-pressed",
    selected
      ? "true"
      : "false"
  );

  cardElement.disabled =
    options.disabled === true;

  return true;
};

/* ==========================================================
   3.2 PLAYER HAND RENDERING
========================================================== */

HighSteaks.renderPlayerHand = function renderPlayerHand(state) {
  if (!highSteaksPlayerHand) return;

  const existingCardsById =
    new Map();

  for (
    const cardElement of
    highSteaksPlayerHand.children
  ) {
    const cardId =
      cardElement.dataset
        ?.highSteaksCardId;

    if (cardId) {
      existingCardsById.set(
        cardId,
        cardElement
      );
    }
  }

  const activeCardIds =
    new Set(
      state.player.hand.map(
        (card) => card.id
      )
    );

  for (
    const [
      cardId,
      cardElement
    ] of existingCardsById
  ) {
    if (!activeCardIds.has(cardId)) {
      cardElement.remove();
      existingCardsById.delete(cardId);
    }
  }

  const cardCount =
    state.player.hand.length;

  const handCenter =
    (cardCount - 1) / 2;

  const maximumDistance =
    Math.max(
      1,
      handCenter
    );

  const fanSpread =
    Math.min(
      41,
      Math.max(
        0,
        (cardCount - 1) * 4.55
      )
    );

  const fanDrop =
    Math.min(
      22,
      Math.max(
        0,
        (cardCount - 1) * 2.45
      )
    );

  const fanRotation =
    Math.min(
      10,
      Math.max(
        0,
        (cardCount - 1) * 1.1
      )
    );

  state.player.hand.forEach(
    (card, index) => {
      const selected =
        state.player.selectedCardIds
          .includes(card.id);

      let cardElement =
        existingCardsById.get(
          card.id
        );

      if (
        !(
          cardElement instanceof
          HTMLButtonElement
        )
      ) {
        cardElement =
          HighSteaks
            .createCardFaceElement(
              card,
              {
                interactive: true,
                selected,
                disabled:
                  state.locked
              }
            );
      } else {
        HighSteaks
          .updatePlayerHandCardElement(
            cardElement,
            card,
            {
              selected,
              disabled:
                state.locked
            }
          );
      }

      const normalizedOffset =
        (
          index -
          handCenter
        ) /
        maximumDistance;

      cardElement.style.setProperty(
        "--high-steaks-card-x",
        `${normalizedOffset * fanSpread}%`
      );

      cardElement.style.setProperty(
        "--high-steaks-card-drop",
        `${Math.abs(normalizedOffset) * fanDrop}px`
      );

      cardElement.style.setProperty(
        "--high-steaks-card-rotation",
        `${normalizedOffset * fanRotation}deg`
      );

      cardElement.style.setProperty(
        "--high-steaks-card-z",
        String(index + 1)
      );

      highSteaksPlayerHand.append(
        cardElement
      );
    }
  );
};

/* ==========================================================
   4. TABLE RENDERING
========================================================== */
HighSteaks.renderPlayZone = function renderPlayZone(container, cards, ownerLabel) {
  if (!container) return;

  container.replaceChildren();
  for (let slotIndex = 0; slotIndex < 2; slotIndex += 1) {
    const card = cards[slotIndex];
    container.append(card
      ? HighSteaks.createCardFaceElement(card)
      : HighSteaks.createEmptyPlaySlot(`${ownerLabel} card slot ${slotIndex + 1}`, ownerLabel));
  }
};

HighSteaks.renderRoundHistory = function renderRoundHistory(state) {
  if (!highSteaksRoundHistory) return;

  highSteaksRoundHistory.replaceChildren();
  for (let roundIndex = 0; roundIndex < state.maximumRounds; roundIndex += 1) {
    const historyMarker = document.createElement("span");
    const roundResult = state.history[roundIndex] || "pending";
    historyMarker.className = `high-steaks-history-marker is-${roundResult}`;
    historyMarker.setAttribute("aria-label", `Round ${roundIndex + 1}: ${roundResult}`);
    historyMarker.textContent = String(roundIndex + 1);
    highSteaksRoundHistory.append(historyMarker);
  }
};

HighSteaks.renderTable = function renderTable(state) {
  HighSteaks.renderPlayZone(
    highSteaksOpponentPlayZone,
    state.opponent.playedCards || [],
    "Opponent"
  );

  HighSteaks.renderPlayZone(
    highSteaksPlayerPlayZone,
    state.player.playedCards || [],
    "Player"
  );

  HighSteaks.renderRoundHistory(state);

  if (highSteaksRuleCard) {
    highSteaksRuleCard.textContent = state.ruleName;
  }

  if (highSteaksPhaseText) {
    highSteaksPhaseText.textContent = state.phaseText;
  }
};

/* ==========================================================
   5. CONTROL RENDERING
========================================================== */
HighSteaks.renderControls = function renderControls(state) {
  const selectionCount = state.player.selectedCardIds.length;

  if (highSteaksConfirmButton) {
    highSteaksConfirmButton.disabled =
      selectionCount !== 2 ||
      state.locked;

    highSteaksConfirmButton.textContent =
      state.locked
        ? "CARDS PLACED"
        : "PLACE CARDS";
  }

  if (highSteaksClearButton) {
    highSteaksClearButton.disabled =
      selectionCount === 0 &&
      !state.locked;

    highSteaksClearButton.textContent =
      state.locked
        ? "RESET PAIR"
        : "CLEAR";
  }
};

/* ==========================================================
   6. COMPLETE PROTOTYPE RENDER
========================================================== */
HighSteaks.renderPrototype = function renderPrototype() {
  const state = HighSteaks.prototypeState;
  if (!state) return;

  if (highSteaksOpponentName) highSteaksOpponentName.textContent = state.opponent.name;
  HighSteaks.renderScoreboard(state);
  HighSteaks.renderOpponentHand(state);
  HighSteaks.renderPlayerHand(state);
  HighSteaks.renderTable(state);
  HighSteaks.renderControls(state);

  if (typeof HighSteaks.applySceneState === "function") HighSteaks.applySceneState(state.sceneState);
};
