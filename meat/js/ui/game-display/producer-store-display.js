/* ==========================================================
   2. STORE DISPLAY AND PRODUCER REVEALS
   ----------------------------------------------------------
   Reveals producers when lifetime MEAT earned during the
   current run reaches each producer's original base cost.

   Spending MEAT does not reduce reveal progress.

   The next two unrevealed producers remain visible as
   unknown locked previews.
========================================================== */

function getCurrentRunLifetimeMeat() {
  if (!Number.isFinite(gameState.totalMeat) || gameState.totalMeat < 0) {
    return 0;
  }

  return gameState.totalMeat;
}

function calculateHighestRevealedProducerIndex() {
  const lifetimeMeat = getCurrentRunLifetimeMeat();
  let calculatedRevealIndex = -1;

  for (let producerIndex = 0; producerIndex < producerOrder.length; producerIndex++) {
    const producerKey = producerOrder[producerIndex];
    const producer = producerData[producerKey];

    if (lifetimeMeat < producer.baseCost) {
      break;
    }

    calculatedRevealIndex = producerIndex;
  }

  return calculatedRevealIndex;
}

function updateProducerUnlockProgress() {
  const calculatedRevealIndex = calculateHighestRevealedProducerIndex();

  if (gameState.highestRevealedProducerIndex === calculatedRevealIndex) {
    return;
  }

  gameState.highestRevealedProducerIndex = calculatedRevealIndex;
  saveGame();
}

function isProducerRevealed(producerKey) {
  const producer = producerData[producerKey];

  if (!producer) {
    return false;
  }

  return getCurrentRunLifetimeMeat() >= producer.baseCost;
}

function updateProducerDisplay() {
  /*
   * Safety guard.
   *
   * The store should not stay completely invisible if a later
   * producer-card update fails during testing.
   */

  producerList?.classList.add("store-ready");

  updateProducerUnlockProgress();

  /*
   * Temporary producer icon testing is handled separately
   * in Sections 3 and 4.
   */

  updateTemporarySilverSpoonIcon();
  updateTemporaryAetherRepairmenIcon();

  const lastVisibleProducerIndex = Math.min(
    producerOrder.length - 1,
    gameState.highestRevealedProducerIndex + LOCKED_PRODUCER_PREVIEW_COUNT
  );

  producerCards.forEach((card) => {
    const producerKey = card.dataset.producer;
    const producerIndex = producerOrder.indexOf(producerKey);
    const producer = producerData[producerKey];
    const display = producerDisplayElements[producerKey];

    if (producerIndex < 0 || !producer || !display) {
      return;
    }

const producerName = card.querySelector(".producer-information strong");
const producerDescription = card.querySelector(".producer-description");

const producerProduction =
  card.querySelector(".producer-production") ||
  card.querySelector(".producer-information small");

const producerInfoControl = card.querySelector(".producer-info-button");

    if (!producerName || !producerProduction) {
      return;
    }

    const shouldBeVisible = producerIndex <= lastVisibleProducerIndex;
    card.hidden = !shouldBeVisible;

    if (!shouldBeVisible) {
      if (producerInfoControl) {
        producerInfoControl.setAttribute("tabindex", "-1");
        producerInfoControl.setAttribute("aria-hidden", "true");
      }

      return;
    }

    const producerIsRevealed = isProducerRevealed(producerKey);

    card.classList.toggle("locked-producer", !producerIsRevealed);

    if (!producerIsRevealed) {
      card.classList.remove("producer-transaction-unavailable");

      if (producerInfoControl) {
        producerInfoControl.setAttribute("tabindex", "-1");
        producerInfoControl.setAttribute("aria-hidden", "true");
        producerInfoControl.removeAttribute("aria-label");
      }

      producerName.textContent = "?";

      if (producerDescription) {
        producerDescription.textContent = "?";
      }

      producerProduction.textContent = "?";
      display.cost.textContent = `${formatStoreMeat(producer.baseCost)} MEAT`;
      display.owned.textContent = "?";
      card.disabled = true;

      card.setAttribute(
        "aria-label",
        `Unknown producer. Reveals after earning ${formatStoreMeat(producer.baseCost)} lifetime MEAT during this run.`
      );

      return;
    }

    const displayedProducerName = producerKey === "silverSpoon"
      ? getTemporarySilverSpoonDisplayName()
      : producer.name;

    producerName.textContent = displayedProducerName;

    if (producerInfoControl) {
      producerInfoControl.setAttribute("tabindex", "0");
      producerInfoControl.removeAttribute("aria-hidden");
      producerInfoControl.setAttribute("aria-label", `View ${displayedProducerName} harvest dossier`);
    }

    if (producerDescription) {
      producerDescription.textContent = getProducerDescriptionForCurrentTier(producerKey);
    }

    producerProduction.textContent = `Produces ${formatMeatPerSecond(producer.meatPerSecond)} meat per second`;
    display.owned.textContent = `Owned: ${gameState.producers[producerKey] ?? 0}`;

    const transaction = getProducerTransactionPreview(producerKey);
    const isSelling = transaction.mode === STORE_MODE_SELL;
    const valuePrefix = isSelling ? "+" : "";

    display.cost.textContent = `${valuePrefix}${formatStoreMeat(transaction.total)} MEAT`;
    card.disabled = false;
    card.classList.toggle("producer-transaction-unavailable", !transaction.canTransact);
    card.dataset.transactionMode = transaction.mode;

    const transactionAmount = transaction.amount.toLocaleString("en-US");

    if (transaction.canTransact) {
      const actionWord = isSelling ? "Sell" : "Buy";
      const valueWord = isSelling ? "refund" : "cost";

      card.setAttribute(
        "aria-label",
        `${actionWord} ${transactionAmount} ${displayedProducerName}. Total ${valueWord}: ${formatStoreMeat(transaction.total)} MEAT.`
      );
    } else {
      card.setAttribute(
        "aria-label",
        isSelling
          ? `Not enough ${displayedProducerName} owned to sell the selected amount.`
          : `Not enough MEAT to buy the selected amount of ${displayedProducerName}.`
      );
    }
  });
}
