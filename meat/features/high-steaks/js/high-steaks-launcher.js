/* ==========================================================
   1. HIGH STEAKS UNLOCK CONFIGURATION
   ----------------------------------------------------------
   High Steaks belongs to the Sunken Mining Town producer
   family and permanently unlocks after Tier III is reached.
========================================================== */

const HIGH_STEAKS_SOURCE_PRODUCER_KEY = "sunkenMiningTown";
const HIGH_STEAKS_REQUIRED_PRODUCER_TIER = 3;

/* ==========================================================
   2. HIGH STEAKS UNLOCK ACCESS
   ----------------------------------------------------------
   Accepts either the current producer tier or the permanently
   recorded highest historical tier.
========================================================== */

function isHighSteaksUnlocked() {
  const currentProducerTier = typeof getTemporaryProducerTier === "function"
    ? getTemporaryProducerTier(HIGH_STEAKS_SOURCE_PRODUCER_KEY)
    : 0;
  const highestRecordedTier = typeof getProducerHighestTier === "function"
    ? getProducerHighestTier(HIGH_STEAKS_SOURCE_PRODUCER_KEY)
    : 0;

  return Math.max(currentProducerTier, highestRecordedTier) >= HIGH_STEAKS_REQUIRED_PRODUCER_TIER;
}

/* ==========================================================
   3. HIGH STEAKS LAUNCHER VISIBILITY
========================================================== */

function shouldShowHighSteaksLauncher() {
  const sourceProducerIsRevealed = typeof isProducerRevealed !== "function" ||
    isProducerRevealed(HIGH_STEAKS_SOURCE_PRODUCER_KEY);

  return isHighSteaksUnlocked() && sourceProducerIsRevealed;
}

function updateHighSteaksLauncher() {
  if (!sunkenMiningTownCardGroup || !highSteaksLauncherButton) return;

  const shouldShowLauncher = shouldShowHighSteaksLauncher();

  highSteaksLauncherButton.hidden = !shouldShowLauncher;
  sunkenMiningTownCardGroup.classList.toggle("high-steaks-card-group-has-launcher", shouldShowLauncher);
}

/* ==========================================================
   4. HIGH STEAKS OPEN REQUEST
========================================================== */

function requestHighSteaksOpen() {
  if (!shouldShowHighSteaksLauncher()) return;

  document.dispatchEvent(new CustomEvent("high-steaks:open-requested"));
}

/* ==========================================================
   5. HIGH STEAKS LAUNCHER INPUT
========================================================== */

highSteaksLauncherButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  requestHighSteaksOpen();
});
