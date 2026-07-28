/* ==========================================================
   1. STANDARD PLAYING CARD HELPERS
   ----------------------------------------------------------
   Normalizes current and legacy prototype card data into
   standard ranks, suits, symbols, labels, and card colors.
========================================================== */

HighSteaks.STANDARD_SUIT_SYMBOLS = Object.freeze({
  spades: "♠",
  hearts: "♥",
  clubs: "♣",
  diamonds: "♦"
});

HighSteaks.STANDARD_SUIT_NAMES = Object.freeze({
  spades: "spades",
  hearts: "hearts",
  clubs: "clubs",
  diamonds: "diamonds"
});

HighSteaks.LEGACY_SUIT_ALIASES = Object.freeze({
  bone: "spades",
  blood: "hearts",
  steel: "clubs",
  aether: "diamonds"
});

HighSteaks.FACE_RANKS_BY_VALUE = Object.freeze({
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
  14: "A"
});

HighSteaks.getStandardSuitKey = function getStandardSuitKey(card) {
  const rawSuit = String(card?.suit || "").trim().toLowerCase();
  const singularSuit = rawSuit.endsWith("s") ? rawSuit : `${rawSuit}s`;

  if (HighSteaks.STANDARD_SUIT_SYMBOLS[rawSuit]) return rawSuit;
  if (HighSteaks.STANDARD_SUIT_SYMBOLS[singularSuit]) return singularSuit;
  return HighSteaks.LEGACY_SUIT_ALIASES[rawSuit] || rawSuit;
};

HighSteaks.getCardRank = function getCardRank(card) {
  const explicitRank = String(card?.rank || "").trim().toUpperCase();
  if (explicitRank) return explicitRank;

  const numericValue = Number(card?.value);
  return HighSteaks.FACE_RANKS_BY_VALUE[numericValue] || String(card?.value ?? "");
};

HighSteaks.getCardSuitSymbol = function getCardSuitSymbol(card) {
  const suitKey = HighSteaks.getStandardSuitKey(card);
  return HighSteaks.STANDARD_SUIT_SYMBOLS[suitKey] || String(card?.symbol || "");
};

HighSteaks.getCardSuitName = function getCardSuitName(card) {
  const suitKey = HighSteaks.getStandardSuitKey(card);
  return HighSteaks.STANDARD_SUIT_NAMES[suitKey] || String(card?.suit || "unknown suit").toLowerCase();
};

HighSteaks.isRedSuit = function isRedSuit(cardOrSuit) {
  const card = typeof cardOrSuit === "object" ? cardOrSuit : { suit: cardOrSuit };
  const suitKey = HighSteaks.getStandardSuitKey(card);
  return suitKey === "hearts" || suitKey === "diamonds";
};

HighSteaks.isNumberCard = function isNumberCard(card) {
  const rank = HighSteaks.getCardRank(card);
  const numericRank = Number(rank);
  return Number.isInteger(numericRank) && numericRank >= 2 && numericRank <= 10;
};

/* ==========================================================
   2. NUMBER CARD PIP LAYOUTS
   ----------------------------------------------------------
   Ranks 2 through 10 use standard playing-card positions.
   Lower-half pips are rotated 180 degrees.
========================================================== */

HighSteaks.NUMBER_CARD_PIP_LAYOUTS = Object.freeze({
  2: Object.freeze([
    Object.freeze({ x: 50, y: 18 }),
    Object.freeze({ x: 50, y: 82, inverted: true })
  ]),

  3: Object.freeze([
    Object.freeze({ x: 50, y: 18 }),
    Object.freeze({ x: 50, y: 50 }),
    Object.freeze({ x: 50, y: 82, inverted: true })
  ]),

  4: Object.freeze([
    Object.freeze({ x: 29, y: 19 }),
    Object.freeze({ x: 71, y: 19 }),
    Object.freeze({ x: 29, y: 81, inverted: true }),
    Object.freeze({ x: 71, y: 81, inverted: true })
  ]),

  5: Object.freeze([
    Object.freeze({ x: 29, y: 19 }),
    Object.freeze({ x: 71, y: 19 }),
    Object.freeze({ x: 50, y: 50 }),
    Object.freeze({ x: 29, y: 81, inverted: true }),
    Object.freeze({ x: 71, y: 81, inverted: true })
  ]),

  6: Object.freeze([
    Object.freeze({ x: 29, y: 18 }),
    Object.freeze({ x: 71, y: 18 }),
    Object.freeze({ x: 29, y: 50 }),
    Object.freeze({ x: 71, y: 50 }),
    Object.freeze({ x: 29, y: 82, inverted: true }),
    Object.freeze({ x: 71, y: 82, inverted: true })
  ]),

  7: Object.freeze([
    Object.freeze({ x: 29, y: 17 }),
    Object.freeze({ x: 71, y: 17 }),
    Object.freeze({ x: 50, y: 33 }),
    Object.freeze({ x: 29, y: 50 }),
    Object.freeze({ x: 71, y: 50 }),
    Object.freeze({ x: 29, y: 83, inverted: true }),
    Object.freeze({ x: 71, y: 83, inverted: true })
  ]),

  8: Object.freeze([
    Object.freeze({ x: 29, y: 17 }),
    Object.freeze({ x: 71, y: 17 }),
    Object.freeze({ x: 50, y: 33 }),
    Object.freeze({ x: 29, y: 50 }),
    Object.freeze({ x: 71, y: 50 }),
    Object.freeze({ x: 50, y: 67, inverted: true }),
    Object.freeze({ x: 29, y: 83, inverted: true }),
    Object.freeze({ x: 71, y: 83, inverted: true })
  ]),

  9: Object.freeze([
    Object.freeze({ x: 29, y: 16 }),
    Object.freeze({ x: 71, y: 16 }),
    Object.freeze({ x: 29, y: 38 }),
    Object.freeze({ x: 71, y: 38 }),
    Object.freeze({ x: 50, y: 50 }),
    Object.freeze({ x: 29, y: 62, inverted: true }),
    Object.freeze({ x: 71, y: 62, inverted: true }),
    Object.freeze({ x: 29, y: 84, inverted: true }),
    Object.freeze({ x: 71, y: 84, inverted: true })
  ]),

  10: Object.freeze([
    Object.freeze({ x: 29, y: 15 }),
    Object.freeze({ x: 71, y: 15 }),
    Object.freeze({ x: 50, y: 27 }),
    Object.freeze({ x: 29, y: 38 }),
    Object.freeze({ x: 71, y: 38 }),
    Object.freeze({ x: 29, y: 62, inverted: true }),
    Object.freeze({ x: 71, y: 62, inverted: true }),
    Object.freeze({ x: 50, y: 73, inverted: true }),
    Object.freeze({ x: 29, y: 85, inverted: true }),
    Object.freeze({ x: 71, y: 85, inverted: true })
  ])
});

HighSteaks.createCardCornerElement = function createCardCornerElement(card, positionClass) {
  const cornerElement = document.createElement("span");
  cornerElement.className = `high-steaks-card-corner ${positionClass}`;
  cornerElement.setAttribute("aria-hidden", "true");

  const rankElement = document.createElement("strong");
  rankElement.className = "high-steaks-card-rank";
  rankElement.textContent = HighSteaks.getCardRank(card);

  const suitElement = document.createElement("span");
  suitElement.className = "high-steaks-card-corner-suit";
  suitElement.textContent = HighSteaks.getCardSuitSymbol(card);

  cornerElement.append(rankElement, suitElement);
  return cornerElement;
};

HighSteaks.createNumberCardPipField = function createNumberCardPipField(card) {
  const pipField = document.createElement("span");
  pipField.className = "high-steaks-card-pip-field";
  pipField.setAttribute("aria-hidden", "true");

  const numericRank = Number(HighSteaks.getCardRank(card));
  const layout = HighSteaks.NUMBER_CARD_PIP_LAYOUTS[numericRank] || [];
  const suitSymbol = HighSteaks.getCardSuitSymbol(card);

  layout.forEach((pipData) => {
    const pipElement = document.createElement("span");
    pipElement.className = "high-steaks-card-pip";

    if (pipData.inverted) pipElement.classList.add("is-inverted");

    pipElement.textContent = suitSymbol;
    pipElement.style.left = `${pipData.x}%`;
    pipElement.style.top = `${pipData.y}%`;
    pipField.append(pipElement);
  });

  return pipField;
};

/* ==========================================================
   3. CARD ELEMENT CREATION
========================================================== */

HighSteaks.createCardFaceElement = function createCardFaceElement(card, options = {}) {
  const elementName = options.interactive ? "button" : "span";
  const cardElement = document.createElement(elementName);
  const rank = HighSteaks.getCardRank(card);
  const suitKey = HighSteaks.getStandardSuitKey(card);
  const suitName = HighSteaks.getCardSuitName(card);
  const suitSymbol = HighSteaks.getCardSuitSymbol(card);

  if (options.interactive) {
    cardElement.type = "button";
    cardElement.setAttribute("role", "listitem");
    cardElement.setAttribute("aria-pressed", options.selected ? "true" : "false");
    cardElement.disabled = Boolean(options.disabled);
  }

  cardElement.className = "high-steaks-card high-steaks-card-face";
  cardElement.classList.add(HighSteaks.isRedSuit(card) ? "is-red" : "is-black");
  cardElement.classList.toggle("is-selected", Boolean(options.selected));
  cardElement.dataset.highSteaksCardId = card.id;
  cardElement.dataset.highSteaksCardValue = String(card.value);
  cardElement.dataset.highSteaksCardSuit = suitKey;
  cardElement.setAttribute("aria-label", card.label || `${rank} of ${suitName}`);

  cardElement.append(
    HighSteaks.createCardCornerElement(
      card,
      "high-steaks-card-corner-top"
    )
  );

  if (HighSteaks.isNumberCard(card)) {
    cardElement.append(
      HighSteaks.createNumberCardPipField(card)
    );
  } else {
    const centerSuitElement = document.createElement("span");
    centerSuitElement.className = "high-steaks-card-center-suit";
    centerSuitElement.setAttribute("aria-hidden", "true");
    centerSuitElement.textContent = suitSymbol;
    cardElement.append(centerSuitElement);
  }

  cardElement.append(
    HighSteaks.createCardCornerElement(
      card,
      "high-steaks-card-corner-bottom"
    )
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

HighSteaks.createEmptyPlaySlot = function createEmptyPlaySlot(label) {
  const slotElement = document.createElement("span");
  slotElement.className = "high-steaks-play-card-slot";
  slotElement.setAttribute("role", "img");
  slotElement.setAttribute("aria-label", label);
  return slotElement;
};

/* ==========================================================
   4. SCOREBOARD AND HAND RENDERING
========================================================== */

HighSteaks.renderWinPips = function renderWinPips(container, wins, label) {
  if (!container) return;

  Array.from(container.children).forEach((pip, index) => {
    pip.classList.toggle("is-won", index < wins);
  });

  container.setAttribute("aria-label", `${label} round wins: ${wins}`);
};

HighSteaks.renderScoreboard = function renderScoreboard(state) {
  if (highSteaksRoundValue) highSteaksRoundValue.textContent = `${state.round} / ${state.maximumRounds}`;
  HighSteaks.renderWinPips(highSteaksOpponentWins, state.opponent.wins, "Opponent");
  HighSteaks.renderWinPips(highSteaksPlayerWins, state.player.wins, "Player");
};

HighSteaks.renderOpponentHand = function renderOpponentHand(state) {
  if (!highSteaksOpponentHand) return;

  highSteaksOpponentHand.replaceChildren();

  for (let index = 0; index < state.opponent.handSize; index += 1) {
    highSteaksOpponentHand.append(
      HighSteaks.createCardBackElement(index)
    );
  }

  highSteaksOpponentHand.setAttribute(
    "aria-label",
    `Opponent hand: ${state.opponent.handSize} hidden cards`
  );
};

/* ==========================================================
   4.1 PERSISTENT PLAYER HAND CARD STATE
   ----------------------------------------------------------
   Updates existing card elements instead of rebuilding them.
   Persistent elements can animate when cards close gaps.
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

  const rank =
    HighSteaks.getCardRank(card);

  const suitKey =
    HighSteaks.getStandardSuitKey(card);

  const suitName =
    HighSteaks.getCardSuitName(card);

  cardElement.className =
    "high-steaks-card high-steaks-card-face";

  cardElement.classList.add(
    HighSteaks.isRedSuit(card)
      ? "is-red"
      : "is-black"
  );

  cardElement.classList.toggle(
    "is-selected",
    selected
  );

  cardElement.type = "button";

  cardElement.dataset.highSteaksCardId =
    card.id;

  cardElement.dataset.highSteaksCardValue =
    String(card.value);

  cardElement.dataset.highSteaksCardSuit =
    suitKey;

  cardElement.setAttribute(
    "role",
    "listitem"
  );

  cardElement.setAttribute(
    "aria-label",
    card.label ||
      `${rank} of ${suitName}`
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
   4.2 PLAYER HAND RENDERING
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

      existingCardsById.delete(
        cardId
      );
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
        state.player.selectedCardIds.includes(
          card.id
        );

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
          HighSteaks.createCardFaceElement(
            card,
            {
              interactive: true,
              selected,
              disabled:
                state.locked
            }
          );
      } else {
        HighSteaks.updatePlayerHandCardElement(
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
   5. TABLE AND CONTROL RENDERING
========================================================== */

HighSteaks.renderPlayZone = function renderPlayZone(
  container,
  cards,
  ownerLabel
) {
  if (!container) return;

  container.replaceChildren();

  for (
    let slotIndex = 0;
    slotIndex < 2;
    slotIndex += 1
  ) {
    const card =
      cards[slotIndex];

    container.append(
      card
        ? HighSteaks.createCardFaceElement(
            card
          )
        : HighSteaks.createEmptyPlaySlot(
            `${ownerLabel} card slot ${slotIndex + 1}`
          )
    );
  }
};

HighSteaks.renderRoundHistory = function renderRoundHistory(state) {
  if (!highSteaksRoundHistory) return;

  highSteaksRoundHistory.replaceChildren();

  for (
    let roundIndex = 0;
    roundIndex < state.maximumRounds;
    roundIndex += 1
  ) {
    const historyMarker =
      document.createElement(
        "span"
      );

    const roundResult =
      state.history[roundIndex] ||
      "pending";

    historyMarker.className =
      `high-steaks-history-marker is-${roundResult}`;

    historyMarker.setAttribute(
      "aria-label",
      `Round ${roundIndex + 1}: ${roundResult}`
    );

    historyMarker.textContent =
      String(roundIndex + 1);

    highSteaksRoundHistory.append(
      historyMarker
    );
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

  HighSteaks.renderRoundHistory(
    state
  );

  if (highSteaksRuleCard) {
    highSteaksRuleCard.textContent =
      state.ruleName;
  }

  if (highSteaksPhaseText) {
    highSteaksPhaseText.textContent =
      state.phaseText;
  }
};

HighSteaks.renderControls = function renderControls(state) {
  const selectionCount =
    state.player.selectedCardIds.length;

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
        : "CLEAR SELECTION";
  }
};

/* ==========================================================
   6. COMPLETE PROTOTYPE RENDER
========================================================== */

HighSteaks.renderPrototype = function renderPrototype() {
  const state = HighSteaks.prototypeState;

  if (!state) return;

  if (highSteaksOpponentName) {
    highSteaksOpponentName.textContent = state.opponent.name;
  }

  HighSteaks.renderScoreboard(state);
  HighSteaks.renderOpponentHand(state);
  HighSteaks.renderPlayerHand(state);
  HighSteaks.renderTable(state);
  HighSteaks.renderControls(state);

  if (typeof HighSteaks.applySceneState === "function") {
    HighSteaks.applySceneState(state.sceneState);
  }
};
