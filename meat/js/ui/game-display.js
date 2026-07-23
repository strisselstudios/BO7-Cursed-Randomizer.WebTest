/* ==========================================================
   1. GAME DISPLAY
   ----------------------------------------------------------
   Updates the resource header, statistics screen and store.
========================================================== */

function getTotalProducersOwned() {
  return Object.values(
    gameState.producers
  ).reduce(
    (total, amount) =>
      total + amount,
    0
  );
}

function updateResourceDisplay() {
function updateResourceDisplay() {
  const displayedMeatBank =
    gameState.infiniteMeat
      ? "INFINITE"
      : formatMeat(
          gameState.meat
        );

  meatCount.textContent =
    `${displayedMeatBank} MEAT`;

  meatPerSecondDisplay
    .textContent =
    `${formatMeatPerSecond(
      gameState.meatPerSecond
    )} per second`;

  meatBankStat.textContent =
    displayedMeatBank;

  totalMeatStat.textContent =
    formatMeat(
      gameState.totalMeat
    );

  meatPerSecondStat.textContent =
    formatMeatPerSecond(
      gameState.meatPerSecond
    );
}

function updateGameDisplay() {
  updateResourceDisplay();

  meatPerClickStat.textContent =
    formatMeat(
      gameState.meatPerClick
    );

  totalClicksStat.textContent =
    gameState.totalClicks.toLocaleString(
      "en-US"
    );

  producersOwnedStat.textContent =
    getTotalProducersOwned()
      .toLocaleString(
        "en-US"
      );

  runTimeStat.textContent =
    formatRunTime(
      Date.now() -
      gameState.runStartedAt
    );

  /*
   * Producer tier history must update before feature unlocks
   * are evaluated.
   */
  if (
    typeof recordAllProducerHighestTiers ===
    "function"
  ) {
    recordAllProducerHighestTiers();
  }

  /*
   * Feature modules remain guarded so a missing feature file
   * cannot prevent the core MEAT.exe interface from loading.
   */
  if (
    typeof updateHarvesterUnlockState ===
    "function"
  ) {
    updateHarvesterUnlockState();
  }

  if (
  typeof updateHarvesterStoreControl ===
  "function"
) {
  updateHarvesterStoreControl();
}

if (
  typeof updateHarvesterDeploymentDisplay ===
  "function"
) {
  updateHarvesterDeploymentDisplay();
}


if (
  typeof updateHarvesterDutyCycleDisplay ===
  "function"
) {
  updateHarvesterDutyCycleDisplay();
}
   
  updateProducerDisplay();
}
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
  if (
    !Number.isFinite(
      gameState.totalMeat
    ) ||
    gameState.totalMeat < 0
  ) {
    return 0;
  }

  return gameState.totalMeat;
}

function calculateHighestRevealedProducerIndex() {
  const lifetimeMeat =
    getCurrentRunLifetimeMeat();

  let calculatedRevealIndex =
    -1;

  for (
    let producerIndex = 0;
    producerIndex <
      producerOrder.length;
    producerIndex++
  ) {
    const producerKey =
      producerOrder[
        producerIndex
      ];

    const producer =
      producerData[
        producerKey
      ];

    if (
      lifetimeMeat <
      producer.baseCost
    ) {
      break;
    }

    calculatedRevealIndex =
      producerIndex;
  }

  return calculatedRevealIndex;
}

function updateProducerUnlockProgress() {
  const calculatedRevealIndex =
    calculateHighestRevealedProducerIndex();

  if (
    gameState
      .highestRevealedProducerIndex ===
    calculatedRevealIndex
  ) {
    return;
  }

  gameState
    .highestRevealedProducerIndex =
    calculatedRevealIndex;

  saveGame();
}

function isProducerRevealed(
  producerKey
) {
  const producer =
    producerData[
      producerKey
    ];

  if (!producer) {
    return false;
  }

  return (
    getCurrentRunLifetimeMeat() >=
    producer.baseCost
  );
}


function updateProducerDisplay() {
  /*
   * Safety guard.
   *
   * The store should not stay completely invisible if a later
   * producer-card update fails during testing.
   */
  producerList?.classList.add(
    "store-ready"
  );

  updateProducerUnlockProgress();

  /*
   * Temporary producer icon testing is handled separately
   * in Sections 3 and 4.
   */
  updateTemporarySilverSpoonIcon();
  updateTemporaryAetherRepairmenIcon();

  const lastVisibleProducerIndex =
    Math.min(
      producerOrder.length - 1,

      gameState
        .highestRevealedProducerIndex +
        LOCKED_PRODUCER_PREVIEW_COUNT
    );

  producerCards.forEach(
    (card) => {
      const producerKey =
        card.dataset.producer;

      const producerIndex =
        producerOrder.indexOf(
          producerKey
        );

      const producer =
        producerData[
          producerKey
        ];

      const display =
        producerDisplayElements[
          producerKey
        ];

      if (
        producerIndex < 0 ||
        !producer ||
        !display
      ) {
        return;
      }

      const producerName =
        card.querySelector(
          ".producer-information strong"
        );

      const producerDescription =
        card.querySelector(
          ".producer-description"
        );

      const producerProduction =
        card.querySelector(
          ".producer-production"
        );

       const producerInfoControl =
         card.querySelector(
          ".producer-info-button"
       );
  
      if (
        !producerName ||
        !producerProduction
      ) {
        return;
      }

      const shouldBeVisible =
        producerIndex <=
        lastVisibleProducerIndex;

      card.hidden =
        !shouldBeVisible;

      if (!shouldBeVisible) {
  if (producerInfoControl) {
    producerInfoControl
      .setAttribute(
        "tabindex",
        "-1"
      );

    producerInfoControl
      .setAttribute(
        "aria-hidden",
        "true"
      );
  }

  return;
}

      const producerIsRevealed =
        isProducerRevealed(
          producerKey
        );

      card.classList.toggle(
        "locked-producer",
        !producerIsRevealed
      );

if (!producerIsRevealed) {
  card.classList.remove(
    "producer-transaction-unavailable"
  );

  if (producerInfoControl) {
    producerInfoControl
      .setAttribute(
        "tabindex",
        "-1"
      );

    producerInfoControl
      .setAttribute(
        "aria-hidden",
        "true"
      );

    producerInfoControl
      .removeAttribute(
        "aria-label"
      );
  }

  producerName.textContent =
    "?";

        if (producerDescription) {
          producerDescription.textContent =
            "?";
        }

        producerProduction.textContent =
          "?";

        display.cost.textContent =
          `${formatStoreMeat(
            producer.baseCost
          )} MEAT`;

        display.owned.textContent =
          "?";

        card.disabled = true;

        card.setAttribute(
          "aria-label",

          `Unknown producer. Reveals after earning ${formatStoreMeat(
            producer.baseCost
          )} lifetime MEAT during this run.`
        );

        return;
      }

      const displayedProducerName =
        producerKey ===
        "silverSpoon"
          ? getTemporarySilverSpoonDisplayName()
          : producer.name;

      producerName.textContent =
  displayedProducerName;

if (producerInfoControl) {
  producerInfoControl
    .setAttribute(
      "tabindex",
      "0"
    );

  producerInfoControl
    .removeAttribute(
      "aria-hidden"
    );

  producerInfoControl
    .setAttribute(
      "aria-label",
      `View ${displayedProducerName} harvest dossier`
    );
}

      if (producerDescription) {
        producerDescription.textContent =
          getProducerDescriptionForCurrentTier(
            producerKey
          );
      }

      producerProduction.textContent =
        `Produces ${formatMeatPerSecond(
          producer.meatPerSecond
        )} meat per second`;

      display.owned.textContent =
        `Owned: ${
          gameState.producers[
            producerKey
          ] ?? 0
        }`;

      const transaction =
        getProducerTransactionPreview(
          producerKey
        );

      const isSelling =
        transaction.mode ===
        STORE_MODE_SELL;

      const valuePrefix =
        isSelling
          ? "+"
          : "";

      display.cost.textContent =
        `${valuePrefix}${formatStoreMeat(
          transaction.total
        )} MEAT`;

      card.disabled =
  false;

card.classList.toggle(
  "producer-transaction-unavailable",
  !transaction.canTransact
);

      card.dataset.transactionMode =
        transaction.mode;

      const transactionAmount =
        transaction.amount
          .toLocaleString(
            "en-US"
          );

      if (
        transaction.canTransact
      ) {
        const actionWord =
          isSelling
            ? "Sell"
            : "Buy";

        const valueWord =
          isSelling
            ? "refund"
            : "cost";

        card.setAttribute(
          "aria-label",

          `${actionWord} ${transactionAmount} ${displayedProducerName}. Total ${valueWord}: ${formatStoreMeat(
            transaction.total
          )} MEAT.`
        );
      } else {
        card.setAttribute(
          "aria-label",

          isSelling
            ? `Not enough ${displayedProducerName} owned to sell the selected amount.`
            : `Not enough MEAT to buy the selected amount of ${displayedProducerName}.`
        );
      }
    }
  );
}

/* ==========================================================
   3. TEMPORARY SILVER SPOON TIER DISPLAY
   ----------------------------------------------------------
   Temporary producer upgrade test:

   Locked:
   spork-locked.png

   0 through 24 owned:
   Silver Spoon
   spork-tier1.png

   25 through 49 owned:
   Golden Spork
   spork-tier2.png

   50 or more owned:
   Golden Spork Knife
   spork-tier3.gif

   Delete or update this section when the permanent producer
   upgrade system is implemented.
========================================================== */

const SILVER_SPOON_ICON_PATHS = {
  locked:
    "meat/images/buildings/silver-spoon/spork-locked.png",

  tier1:
    "meat/images/buildings/silver-spoon/spork-tier1.png",

  tier2:
    "meat/images/buildings/silver-spoon/spork-tier2.png",

  tier3:
    "meat/images/buildings/silver-spoon/spork-tier3.gif"
};

const TEST_GOLDEN_SPORK_LEVEL =
  25;

const TEST_GOLDEN_SPORK_KNIFE_LEVEL =
  50;

function getTemporarySilverSpoonDisplayName() {
  const amountOwned =
    gameState.producers
      .silverSpoon ??
    0;

  if (
    amountOwned >=
    TEST_GOLDEN_SPORK_KNIFE_LEVEL
  ) {
    return "Golden Spork Knife";
  }

  if (
    amountOwned >=
    TEST_GOLDEN_SPORK_LEVEL
  ) {
    return "Golden Spork";
  }

  return "Silver Spoon";
}

function setTemporarySilverSpoonIcon(
  imagePath,
  altText
) {
  if (!silverSpoonIcon) {
    return;
  }

  /*
   * Only change the source when the required icon changes.
   *
   * updateProducerDisplay() runs repeatedly during passive
   * production. Reassigning the GIF source every time would
   * restart its animation.
   */

  if (
    silverSpoonIcon.getAttribute(
      "src"
    ) !== imagePath
  ) {
    silverSpoonIcon.setAttribute(
      "src",
      imagePath
    );
  }

  silverSpoonIcon.alt =
    altText;
}

function updateTemporarySilverSpoonIcon() {
  if (!silverSpoonIcon) {
    return;
  }

  const amountOwned =
    gameState.producers
      .silverSpoon ??
    0;

  if (
    !isProducerRevealed(
      "silverSpoon"
    )
  ) {
    setTemporarySilverSpoonIcon(
      SILVER_SPOON_ICON_PATHS.locked,
      "Locked Silver Spoon"
    );

    return;
  }

  if (
    amountOwned >=
    TEST_GOLDEN_SPORK_KNIFE_LEVEL
  ) {
    setTemporarySilverSpoonIcon(
      SILVER_SPOON_ICON_PATHS.tier3,
      "Golden Spork Knife"
    );

    return;
  }

  if (
    amountOwned >=
    TEST_GOLDEN_SPORK_LEVEL
  ) {
    setTemporarySilverSpoonIcon(
      SILVER_SPOON_ICON_PATHS.tier2,
      "Golden Spork"
    );

    return;
  }

  setTemporarySilverSpoonIcon(
    SILVER_SPOON_ICON_PATHS.tier1,
    "Silver Spoon"
  );
}

/* ==========================================================
   4. TEMPORARY AETHER REPAIRMEN ICON TEST
   ----------------------------------------------------------
   Temporary visual upgrade test:

   Locked:
   aether-repairman-locked.png

   Revealed with 0 through 24 owned:
   aether-repairman-tier1.png

   25 through 49 owned:
   aether-repairman-tier2.png

   50 or more owned:
   aether-repairman-tier3.gif

   Delete or update this section when the permanent upgrade
   system is implemented.
========================================================== */

const AETHER_REPAIRMEN_ICON_PATHS = {
  locked:
    "meat/images/buildings/aether-repairmen/aether-repairman-locked.png",

  tier1:
    "meat/images/buildings/aether-repairmen/aether-repairman-tier1.png",

  tier2:
    "meat/images/buildings/aether-repairmen/aether-repairman-tier2.png",

  tier3:
    "meat/images/buildings/aether-repairmen/aether-repairman-tier3.gif"
};

const TEST_AETHER_REPAIRMEN_TIER_2_LEVEL =
  25;

const TEST_AETHER_REPAIRMEN_TIER_3_LEVEL =
  50;

function setTemporaryAetherRepairmenIcon(
  imagePath,
  altText
) {
  if (!aetherRepairmenIcon) {
    return;
  }

  /*
   * Only change the source when the required icon changes.
   *
   * updateProducerDisplay() can run repeatedly during passive
   * production. Reassigning the GIF source every time could
   * restart its animation.
   */

  if (
    aetherRepairmenIcon.getAttribute(
      "src"
    ) !== imagePath
  ) {
    aetherRepairmenIcon.setAttribute(
      "src",
      imagePath
    );
  }

  aetherRepairmenIcon.alt =
    altText;
}

function updateTemporaryAetherRepairmenIcon() {
  if (!aetherRepairmenIcon) {
    return;
  }

  const amountOwned =
    gameState.producers
      .aetherRepairmen ??
    0;

  if (
    !isProducerRevealed(
      "aetherRepairmen"
    )
  ) {
    setTemporaryAetherRepairmenIcon(
      AETHER_REPAIRMEN_ICON_PATHS.locked,
      "Locked Aether Repairmen"
    );

    return;
  }

  if (
    amountOwned >=
    TEST_AETHER_REPAIRMEN_TIER_3_LEVEL
  ) {
    setTemporaryAetherRepairmenIcon(
      AETHER_REPAIRMEN_ICON_PATHS.tier3,
      "Tier 3 Aether Repairmen"
    );

    return;
  }

  if (
    amountOwned >=
    TEST_AETHER_REPAIRMEN_TIER_2_LEVEL
  ) {
    setTemporaryAetherRepairmenIcon(
      AETHER_REPAIRMEN_ICON_PATHS.tier2,
      "Tier 2 Aether Repairmen"
    );

    return;
  }

  setTemporaryAetherRepairmenIcon(
    AETHER_REPAIRMEN_ICON_PATHS.tier1,
    "Tier 1 Aether Repairmen"
  );
}

/* ==========================================================
   5. TEMPORARY PRODUCER TIER DESCRIPTIONS
   ----------------------------------------------------------
   Selects the description belonging to the producer's current
   temporary visual tier. Selling enough levels automatically
   returns the producer to its earlier name, icon, and text.
========================================================== */

function getTemporaryProducerTierForOwnedAmount(
  producerKey,
  ownedAmount
) {
  const normalizedOwnedAmount =
    Math.max(
      0,
      Math.floor(
        Number(ownedAmount) || 0
      )
    );

  if (
    producerKey ===
    "silverSpoon"
  ) {
    if (
      normalizedOwnedAmount >=
      TEST_GOLDEN_SPORK_KNIFE_LEVEL
    ) {
      return 3;
    }

    if (
      normalizedOwnedAmount >=
      TEST_GOLDEN_SPORK_LEVEL
    ) {
      return 2;
    }

    return 1;
  }

  if (
    producerKey ===
    "aetherRepairmen"
  ) {
    if (
      normalizedOwnedAmount >=
      TEST_AETHER_REPAIRMEN_TIER_3_LEVEL
    ) {
      return 3;
    }

    if (
      normalizedOwnedAmount >=
      TEST_AETHER_REPAIRMEN_TIER_2_LEVEL
    ) {
      return 2;
    }

    return 1;
  }

  return 1;
}

function getTemporaryProducerTier(
  producerKey
) {
  return getTemporaryProducerTierForOwnedAmount(
    producerKey,
    gameState.producers[
      producerKey
    ] ?? 0
  );
}

function getProducerDescriptionForCurrentTier(
  producerKey
) {
  const producer =
    producerData[
      producerKey
    ];

  if (
    !producer ||
    !producer.descriptions
  ) {
    return "";
  }

  const currentTier =
    getTemporaryProducerTier(
      producerKey
    );

  return (
    producer.descriptions[
      currentTier
    ] ?? ""
  );
}
