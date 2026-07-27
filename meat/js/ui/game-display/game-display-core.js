/* ==========================================================
   1. GAME DISPLAY
   ----------------------------------------------------------
   Updates the resource header, statistics screen and store.
========================================================== */

function getTotalProducersOwned() {
  return Object.values(gameState.producers).reduce((total, amount) => total + amount, 0);
}

function updateResourceDisplay() {
  const displayedMeatBank = gameState.infiniteMeat ? "INFINITE" : formatMeat(gameState.meat);

  meatCount.textContent = `${displayedMeatBank} MEAT`;
  meatPerSecondDisplay.textContent = `${formatMeatPerSecond(gameState.meatPerSecond)} per second`;
  meatBankStat.textContent = displayedMeatBank;
  totalMeatStat.textContent = formatMeat(gameState.totalMeat);
  meatPerSecondStat.textContent = formatMeatPerSecond(gameState.meatPerSecond);
}

function updateGameDisplay() {
  updateResourceDisplay();

  meatPerClickStat.textContent = formatMeat(gameState.meatPerClick);
  totalClicksStat.textContent = gameState.totalClicks.toLocaleString("en-US");
  producersOwnedStat.textContent = getTotalProducersOwned().toLocaleString("en-US");
  runTimeStat.textContent = formatRunTime(Date.now() - gameState.runStartedAt);

  /*
   * Producer tier history must update before feature unlocks
   * are evaluated.
   */

  if (typeof recordAllProducerHighestTiers === "function") {
    recordAllProducerHighestTiers();
  }

  /*
   * Feature modules remain guarded so a missing feature file
   * cannot prevent the core MEAT.exe interface from loading.
   */

  if (typeof updateHarvesterUnlockState === "function") {
    updateHarvesterUnlockState();
  }

  if (typeof updateHarvesterStoreControl === "function") {
    updateHarvesterStoreControl();
  }

  if (typeof updateHarvesterDeploymentDisplay === "function") {
    updateHarvesterDeploymentDisplay();
  }

  if (typeof updateHarvesterDutyCycleDisplay === "function") {
    updateHarvesterDutyCycleDisplay();
  }

  updateProducerDisplay();

  /*
   * Feature launchers update after producer cards so their
   * attached card shape and visibility use the final producer
   * display state.
   */

    if (typeof updateNachtRaidersLauncher === "function") {
    updateNachtRaidersLauncher();
  }

  if (typeof updateHighSteaksLauncher === "function") {
    updateHighSteaksLauncher();
  }

  if (typeof updateNachtRaidersBootSettingControl === "function") {
    updateNachtRaidersBootSettingControl();
  }
}
