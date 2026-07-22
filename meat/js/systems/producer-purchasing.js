/* ==========================================================
   1. STORE TRANSACTION STATE
   ----------------------------------------------------------
   Tracks the currently selected Buy/Sell mode and transaction
   quantity. These are interface settings and are not saved.
========================================================== */

const STORE_MODE_BUY =
  "buy";

const STORE_MODE_SELL =
  "sell";

const STORE_QUANTITY_ONE =
  "1";

const STORE_QUANTITY_TEN =
  "10";

const STORE_QUANTITY_ONE_HUNDRED =
  "100";

const STORE_QUANTITY_MAX =
  "max";

let selectedStoreTransactionMode =
  STORE_MODE_BUY;

let selectedStoreTransactionQuantity =
  STORE_QUANTITY_ONE;

/* ==========================================================
   2. TRANSACTION PREVIEW
   ----------------------------------------------------------
   Determines the amount and total value that should be shown
   on each producer card for the selected controls.
========================================================== */

function getFixedStoreQuantity() {
  switch (
    selectedStoreTransactionQuantity
  ) {
    case STORE_QUANTITY_TEN:
      return 10;

    case STORE_QUANTITY_ONE_HUNDRED:
      return 100;

    case STORE_QUANTITY_ONE:
    default:
      return 1;
  }
}

function getProducerTransactionPreviewForMode(
  producerKey,
  requestedMode =
    selectedStoreTransactionMode
) {
  const normalizedMode =
    requestedMode === STORE_MODE_SELL
      ? STORE_MODE_SELL
      : STORE_MODE_BUY;

  const producer =
    producerData[producerKey];

  const currentlyOwned =
    gameState.producers[
      producerKey
    ] ?? 0;

  if (!producer) {
    return {
      mode: normalizedMode,
      amount: 0,
      total: 0,
      canTransact: false
    };
  }

  if (
    normalizedMode ===
    STORE_MODE_SELL
  ) {
    const amount =
      selectedStoreTransactionQuantity ===
      STORE_QUANTITY_MAX
        ? currentlyOwned
        : getFixedStoreQuantity();

    const hasSelectedAmount =
      amount > 0 &&
      currentlyOwned >= amount;

    return {
      mode: STORE_MODE_SELL,
      amount,

      total:
        hasSelectedAmount
          ? getProducerBulkSellRefund(
              producerKey,
              amount
            )
          : 0,

      canTransact:
        hasSelectedAmount
    };
  }

  const amount =
    selectedStoreTransactionQuantity ===
    STORE_QUANTITY_MAX
      ? getMaximumAffordableProducerAmount(
          producerKey
        )
      : getFixedStoreQuantity();

  const total =
    getProducerBulkBuyCost(
      producerKey,
      amount
    );

  return {
    mode: STORE_MODE_BUY,
    amount,
    total,

    canTransact:
      amount > 0 &&
      Number.isFinite(total) &&
      gameState.meat >= total
  };
}

function getProducerTransactionPreview(
  producerKey
) {
  return getProducerTransactionPreviewForMode(
    producerKey,
    selectedStoreTransactionMode
  );
}

function getProducerBuyTransactionPreview(
  producerKey
) {
  return getProducerTransactionPreviewForMode(
    producerKey,
    STORE_MODE_BUY
  );
}

/* ==========================================================
   3. PRODUCER BUYING
   ----------------------------------------------------------
   Purchases the requested number of producer levels.
========================================================== */

function purchaseProducerAmount(
  producerKey,
  amount
) {
  const producer =
    producerData[producerKey];

  if (
    !producer ||
    !isProducerRevealed(
      producerKey
    )
  ) {
    return false;
  }

  const normalizedAmount =
    Math.max(
      0,
      Math.floor(
        Number(amount) || 0
      )
    );

  if (normalizedAmount === 0) {
    return false;
  }

  const totalCost =
    getProducerBulkBuyCost(
      producerKey,
      normalizedAmount
    );

  if (
    !Number.isFinite(totalCost) ||
    gameState.meat < totalCost
  ) {
    return false;
  }

  gameState.meat -= totalCost;

  gameState.producers[
    producerKey
  ] =
    (
      gameState.producers[
        producerKey
      ] ?? 0
    ) +
    normalizedAmount;

  return true;
}

/*
 * Compatibility wrapper for any existing debug commands or
 * future code that still calls purchaseProducer().
 */
function purchaseProducer(
  producerKey
) {
  return purchaseProducerAmount(
    producerKey,
    1
  );
}

/* ==========================================================
   4. PRODUCER SELLING
   ----------------------------------------------------------
   Removes the requested number of producer levels and returns
   a percentage of their prior purchase prices.
========================================================== */

function sellProducerAmount(
  producerKey,
  amount
) {
  const producer =
    producerData[producerKey];

  if (!producer) {
    return false;
  }

  const currentlyOwned =
    gameState.producers[
      producerKey
    ] ?? 0;

  const normalizedAmount =
    Math.max(
      0,
      Math.floor(
        Number(amount) || 0
      )
    );

  if (
    normalizedAmount === 0 ||
    currentlyOwned <
      normalizedAmount
  ) {
    return false;
  }

  const totalRefund =
    getProducerBulkSellRefund(
      producerKey,
      normalizedAmount
    );

  gameState.producers[
    producerKey
  ] =
    currentlyOwned -
    normalizedAmount;

  gameState.meat +=
    totalRefund;

  return true;
}

/* ==========================================================
   4.1 PRODUCER TRANSACTION FEEDBACK
   ----------------------------------------------------------
   Restarts successful and failed transaction feedback on the
   exact producer control that was pressed.
========================================================== */

const PRODUCER_TRANSACTION_SUCCESS_CLASS =
  "producer-transaction-feedback-success";

const PRODUCER_TRANSACTION_FAILURE_CLASS =
  "producer-transaction-feedback-failure";

const producerTransactionFeedbackTimers =
  new WeakMap();

function getDefaultProducerFeedbackTarget(
  producerKey
) {
  return document.querySelector(
    `.producer-card[data-producer="${producerKey}"]`
  );
}

function restartProducerTransactionFeedback(
  target,
  className,
  duration
) {
  if (!target?.classList) {
    return;
  }

  const existingTimer =
    producerTransactionFeedbackTimers.get(
      target
    );

  if (existingTimer) {
    window.clearTimeout(
      existingTimer
    );
  }

  target.classList.remove(
    PRODUCER_TRANSACTION_SUCCESS_CLASS,
    PRODUCER_TRANSACTION_FAILURE_CLASS
  );

  /*
   * Force the browser to commit the removed class so rapidly
   * repeated purchases restart the animation from frame one.
   */
  void target.offsetWidth;

  target.classList.add(
    className
  );

  const removalTimer =
    window.setTimeout(
      () => {
        target.classList.remove(
          className
        );

        producerTransactionFeedbackTimers
          .delete(target);
      },
      duration
    );

  producerTransactionFeedbackTimers.set(
    target,
    removalTimer
  );
}

function showProducerTransactionSuccess(
  target
) {
  restartProducerTransactionFeedback(
    target,
    PRODUCER_TRANSACTION_SUCCESS_CLASS,
    460
  );
}

function showProducerTransactionFailure(
  target
) {
  restartProducerTransactionFeedback(
    target,
    PRODUCER_TRANSACTION_FAILURE_CLASS,
    380
  );
}
/* ==========================================================
   5. SELECTED STORE TRANSACTION
   ----------------------------------------------------------
   Performs the currently selected Buy or Sell transaction and
   refreshes production, interface values, and saved progress.
========================================================== */

function transactProducer(
  producerKey,
  options = {}
) {
  const requestedMode =
    options.mode === STORE_MODE_BUY ||
    options.mode === STORE_MODE_SELL
      ? options.mode
      : selectedStoreTransactionMode;

  const feedbackTarget =
    options.feedbackTarget ??
    getDefaultProducerFeedbackTarget(
      producerKey
    );

  if (
    !isProducerRevealed(
      producerKey
    )
  ) {
    return false;
  }

  const transaction =
    getProducerTransactionPreviewForMode(
      producerKey,
      requestedMode
    );

  if (
    !transaction.canTransact ||
    transaction.amount <= 0
  ) {
    showProducerTransactionFailure(
      feedbackTarget
    );

    return false;
  }

  const transactionSucceeded =
    transaction.mode ===
    STORE_MODE_SELL
      ? sellProducerAmount(
          producerKey,
          transaction.amount
        )
      : purchaseProducerAmount(
          producerKey,
          transaction.amount
        );

  if (!transactionSucceeded) {
    showProducerTransactionFailure(
      feedbackTarget
    );

    return false;
  }

  calculateMeatPerSecond();
  updateGameDisplay();
  saveGame();

  showProducerTransactionSuccess(
    feedbackTarget
  );

  return true;
}

/* ==========================================================
   6. PRODUCER CARD CONTROLS
   ----------------------------------------------------------
   Uses the producer card as the transaction button. INFO input
   is handled separately and never triggers a transaction.
========================================================== */

producerCards.forEach(
  (card) => {
    card.addEventListener(
      "click",
      (event) => {
        if (
          event.target.closest(
            ".producer-info-button"
          )
        ) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        transactProducer(
  card.dataset.producer,
  {
    feedbackTarget: card
  }
);
      }
    );
  }
);
