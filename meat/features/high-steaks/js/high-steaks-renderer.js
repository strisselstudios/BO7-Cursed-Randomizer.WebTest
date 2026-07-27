/* ==========================================================
   1. HIGH STEAKS CARD ELEMENTS
========================================================== */

HighSteaks.createCardFaceElement = function createCardFaceElement(card, options = {}) {
  const elementName = options.interactive ? "button" : "span";
  const cardElement = document.createElement(elementName);

  if (options.interactive) {
    cardElement.type = "button";
    cardElement.setAttribute("role", "listitem");
    cardElement.setAttribute("aria-pressed", options.selected ? "true" : "false");
  }

  cardElement.className = "high-steaks-card high-steaks-card-face";
  cardElement.dataset.highSteaksCardId = card.id;
  cardElement.dataset.highSteaksCardValue = String(card.value);
  cardElement.dataset.highSteaksCardSuit = card.suit;
  cardElement.setAttribute("aria-label", `${card.value} of ${card.suit.toLowerCase()}`);
  cardElement.classList.toggle("is-selected", Boolean(options.selected));
  if (options.interactive) cardElement.disabled = Boolean(options.disabled);

  const valueElement = document.createElement("strong");
  valueElement.className = "high-steaks-card-value";
  valueElement.textContent = String(card.value);

  const symbolElement = document.createElement("span");
  symbolElement.className = "high-steaks-card-symbol";
  symbolElement.textContent = card.symbol;

  const suitElement = document.createElement("small");
  suitElement.className = "high-steaks-card-suit";
  suitElement.textContent = card.suit;

  cardElement.append(valueElement, symbolElement, suitElement);
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
  slotElement.setAttribute("aria-label", label);
  slotElement.textContent = "?";
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

HighSteaks.renderPlayerHand = function renderPlayerHand(state) {
  if (!highSteaksPlayerHand) return;

  highSteaksPlayerHand.replaceChildren();
  const handCenter = (state.player.hand.length - 1) / 2;

  state.player.hand.forEach((card, index) => {
    const selected = state.player.selectedCardIds.includes(card.id);
    const cardElement = HighSteaks.createCardFaceElement(card, { interactive: true, selected, disabled: state.locked });
    cardElement.style.setProperty("--high-steaks-card-offset", String(index - handCenter));
    cardElement.style.setProperty("--high-steaks-card-depth", String(Math.abs(index - handCenter)));
    highSteaksPlayerHand.append(cardElement);
  });
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
      : HighSteaks.createEmptyPlaySlot(`${ownerLabel} card slot ${slotIndex + 1}`));
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
  const selectedCards = state.player.selectedCardIds
    .map((cardId) => state.player.hand.find((card) => card.id === cardId))
    .filter(Boolean);

  HighSteaks.renderPlayZone(highSteaksOpponentPlayZone, [], "Opponent");
  HighSteaks.renderPlayZone(highSteaksPlayerPlayZone, selectedCards, "Player");
  HighSteaks.renderRoundHistory(state);

  if (highSteaksRuleCard) highSteaksRuleCard.textContent = state.ruleName;
  if (highSteaksPhaseText) highSteaksPhaseText.textContent = state.phaseText;
};

/* ==========================================================
   5. CONTROL RENDERING
========================================================== */

HighSteaks.renderControls = function renderControls(state) {
  const selectionCount = state.player.selectedCardIds.length;

  if (highSteaksConfirmButton) {
    highSteaksConfirmButton.disabled = selectionCount !== 2 || state.locked;
    highSteaksConfirmButton.textContent = state.locked ? "PAIR LOCKED" : "PLAY SELECTED CARDS";
  }

  if (highSteaksClearButton) {
    highSteaksClearButton.disabled = selectionCount === 0 && !state.locked;
    highSteaksClearButton.textContent = state.locked ? "RESET PAIR" : "CLEAR SELECTION";
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
