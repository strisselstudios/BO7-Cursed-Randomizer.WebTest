/* ==========================================================
   1. HIGH STEAKS UNLOCK CONFIGURATION
   ----------------------------------------------------------
   High Steaks belongs to the Sunken Mining Town producer
   family and permanently unlocks after Tier III is reached.
========================================================== */

window.HighSteaks = window.HighSteaks || {};

HighSteaks.SOURCE_PRODUCER_KEY = "sunkenMiningTown";
HighSteaks.REQUIRED_PRODUCER_TIER = 3;

/* ==========================================================
   2. HIGH STEAKS UNLOCK ACCESS
========================================================== */

HighSteaks.isUnlocked = function isUnlocked() {
  const currentProducerTier = typeof getTemporaryProducerTier === "function"
    ? getTemporaryProducerTier(HighSteaks.SOURCE_PRODUCER_KEY)
    : 0;
  const highestRecordedTier = typeof getProducerHighestTier === "function"
    ? getProducerHighestTier(HighSteaks.SOURCE_PRODUCER_KEY)
    : 0;

  return Math.max(currentProducerTier, highestRecordedTier) >= HighSteaks.REQUIRED_PRODUCER_TIER;
};

HighSteaks.shouldShowLauncher = function shouldShowLauncher() {
  const sourceProducerIsRevealed = typeof isProducerRevealed !== "function" ||
    isProducerRevealed(HighSteaks.SOURCE_PRODUCER_KEY);

  return HighSteaks.isUnlocked() && sourceProducerIsRevealed;
};

/* ==========================================================
   3. HIGH STEAKS LAUNCHER DISPLAY
========================================================== */

function updateHighSteaksLauncher() {
  if (!sunkenMiningTownCardGroup || !highSteaksLauncherButton) return;

  const shouldShowLauncher = HighSteaks.shouldShowLauncher();
  highSteaksLauncherButton.hidden = !shouldShowLauncher;
  sunkenMiningTownCardGroup.classList.toggle("high-steaks-card-group-has-launcher", shouldShowLauncher);
}

/* ==========================================================
   4. HIGH STEAKS OPEN REQUEST
========================================================== */

HighSteaks.requestOpen = function requestOpen() {
  if (!HighSteaks.shouldShowLauncher()) return;
  document.dispatchEvent(new CustomEvent("high-steaks:open-requested"));
};

highSteaksLauncherButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  HighSteaks.requestOpen();
});
