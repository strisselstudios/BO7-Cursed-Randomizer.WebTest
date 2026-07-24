/* ==========================================================
   3. PRODUCER INFO STATISTICS
   ----------------------------------------------------------
   Calculates effective unit output, combined output, share
   of total producer output, and lifetime yield.
========================================================== */

/* ==========================================================
   3. PRODUCER INFO STATISTICS
   ----------------------------------------------------------
   Calculates effective unit output, combined output,
   lifetime share of all producer-generated MEAT, and
   lifetime yield.

   Harvester output is credited to the Silver Spoon family,
   so it is included in that producer's harvest share.
========================================================== */

function getTotalLifetimeProducerHarvest() {
  return producerOrder.reduce(
    (
      totalHarvest,
      producerKey
    ) => {
      const producerHarvest =
        clampMeatAmount(
          gameState
            .producerLifetimeMeat?.[
              producerKey
            ]
        );

      return addClampedMeatValues(
        totalHarvest,
        producerHarvest
      );
    },
    0
  );
}

function formatProducerInfoPercentage(
  percentage
) {
  const normalizedPercentage =
    Math.min(
      100,
      Math.max(
        0,
        Number(percentage) || 0
      )
    );

  if (
    normalizedPercentage === 0 ||
    normalizedPercentage === 100
  ) {
    return String(
      normalizedPercentage
    );
  }

  const decimalPlaces =
    normalizedPercentage >= 10
      ? 1
      : 2;

  return normalizedPercentage
    .toFixed(decimalPlaces)
    .replace(/\.?0+$/, "");
}

function updateProducerInfoStatistics(
  producerKey,
  displayName
) {
  const owned =
    gameState.producers[
      producerKey
    ] ?? 0;

  const unitOutput =
    getProducerUnitMeatPerSecond(
      producerKey
    );

  const combinedOutput =
    getProducerTotalMeatPerSecond(
      producerKey
    );

  const lifetimeOutput =
    clampMeatAmount(
      gameState
        .producerLifetimeMeat?.[
          producerKey
        ]
    );

  const totalLifetimeHarvest =
    getTotalLifetimeProducerHarvest();

  const harvestShare =
    totalLifetimeHarvest > 0
      ? (
          lifetimeOutput /
          totalLifetimeHarvest
        ) * 100
      : 0;

  producerInfoUnitLabel.textContent =
    `EACH ${displayName}`;

  producerInfoUnitOutput.textContent =
    `${formatMeatPerSecond(
      unitOutput
    )} MEAT / SECOND`;

  producerInfoCombinedLabel.textContent =
    `ALL ${owned.toLocaleString(
      "en-US"
    )} OWNED`;

  producerInfoCombinedOutput.textContent =
    `${formatMeatPerSecond(
      combinedOutput
    )} MEAT / SECOND`;

  producerInfoShare.textContent =
    `${formatProducerInfoPercentage(
      harvestShare
    )}%`;

  producerInfoLifetime.textContent =
    `${formatMeat(
      lifetimeOutput
    )} MEAT`;
}

/* ==========================================================
   3.1 PRODUCER INFO PURCHASE CONTROL
   ----------------------------------------------------------
   Displays the current purchase quantity and cost inside the
   producer banner.

   The dossier always performs a BUY transaction, regardless
   of the Meat Mart's selected Buy or Sell mode.
========================================================== */

function getProducerInfoPurchaseQuantityLabel(
  transaction
) {
  if (
    selectedStoreTransactionQuantity ===
    STORE_QUANTITY_MAX
  ) {
    if (transaction.amount <= 0) {
      return "MAX";
    }

    return (
      `MAX (${
        transaction.amount.toLocaleString(
          "en-US"
        )
      })`
    );
  }

  return (
    `×${
      transaction.amount.toLocaleString(
        "en-US"
      )
    }`
  );
}

function updateProducerInfoPurchaseControl(
  producerKey,
  displayName
) {
  if (
    !producerInfoPurchaseButton ||
    !producerInfoPurchaseLabel
  ) {
    return;
  }

  const transaction =
    getProducerBuyTransactionPreview(
      producerKey
    );

  const quantityLabel =
    getProducerInfoPurchaseQuantityLabel(
      transaction
    );

  const hasQuotedCost =
    transaction.amount > 0 &&
    Number.isFinite(
      transaction.total
    );

  const costLabel =
    hasQuotedCost
      ? `${formatStoreMeat(
          transaction.total
        )} MEAT`
      : "NOT ENOUGH MEAT";

  producerInfoPurchaseLabel.textContent =
    `BUY ${quantityLabel} · ${costLabel}`;

  producerInfoPurchaseButton
    .classList
    .toggle(
      "producer-info-purchase-unavailable",
      !transaction.canTransact
    );

  producerInfoPurchaseButton
    .setAttribute(
      "aria-disabled",
      String(
        !transaction.canTransact
      )
    );

  const accessibleLabel =
    transaction.canTransact
      ? (
          `Buy ${
            transaction.amount.toLocaleString(
              "en-US"
            )
          } ${displayName} for ${
            formatStoreMeat(
              transaction.total
            )
          } MEAT`
        )
      : (
          `Not enough MEAT to buy the selected amount of ${displayName}`
        );

  producerInfoPurchaseButton
    .setAttribute(
      "aria-label",
      accessibleLabel
    );

  producerInfoPurchaseButton.title =
    accessibleLabel;
}
