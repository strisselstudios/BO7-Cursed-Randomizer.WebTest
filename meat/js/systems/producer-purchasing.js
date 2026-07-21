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

function getProducerTransactionPreview(
  producerKey
) {
  const producer =
    producerData[producerKey];

  const currentlyOwned =
    gameState.producers[
      producerKey
    ] ?? 0;

  if (!producer) {
    return {
      mode:
        selectedStoreTransactionMode,

      amount: 0,
      total: 0,
      canTransact: false
    };
  }

  if (
    selectedStoreTransactionMode ===
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
   5. SELECTED STORE TRANSACTION
   ----------------------------------------------------------
   Performs the currently selected Buy or Sell transaction and
   refreshes production, interface values, and saved progress.
========================================================== */

function transactProducer(
  producerKey
) {
  if (
    !isProducerRevealed(
      producerKey
    )
  ) {
    return;
  }

  const transaction =
    getProducerTransactionPreview(
      producerKey
    );

  if (
    !transaction.canTransact ||
    transaction.amount <= 0
  ) {
    return;
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
    return;
  }

  calculateMeatPerSecond();
  updateGameDisplay();
  saveGame();
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
          card.dataset.producer
        );
      }
    );
  }
);
