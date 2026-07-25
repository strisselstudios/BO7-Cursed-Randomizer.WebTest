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
  locked: "meat/images/buildings/silver-spoon/spork-locked.png",
  tier1: "meat/images/buildings/silver-spoon/spork-tier1.png",
  tier2: "meat/images/buildings/silver-spoon/spork-tier2.png",
  tier3: "meat/images/buildings/silver-spoon/spork-tier3.gif"
};

const TEST_GOLDEN_SPORK_LEVEL = 25;
const TEST_GOLDEN_SPORK_KNIFE_LEVEL = 50;

function getTemporarySilverSpoonDisplayName() {
  const amountOwned = gameState.producers.silverSpoon ?? 0;

  if (amountOwned >= TEST_GOLDEN_SPORK_KNIFE_LEVEL) {
    return "Golden Spork Knife";
  }

  if (amountOwned >= TEST_GOLDEN_SPORK_LEVEL) {
    return "Golden Spork";
  }

  return "Silver Spoon";
}

function setTemporarySilverSpoonIcon(imagePath, altText) {
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

  if (silverSpoonIcon.getAttribute("src") !== imagePath) {
    silverSpoonIcon.setAttribute("src", imagePath);
  }

  silverSpoonIcon.alt = altText;
}

function updateTemporarySilverSpoonIcon() {
  if (!silverSpoonIcon) {
    return;
  }

  const amountOwned = gameState.producers.silverSpoon ?? 0;

  if (!isProducerRevealed("silverSpoon")) {
    setTemporarySilverSpoonIcon(SILVER_SPOON_ICON_PATHS.locked, "Locked Silver Spoon");
    return;
  }

  if (amountOwned >= TEST_GOLDEN_SPORK_KNIFE_LEVEL) {
    setTemporarySilverSpoonIcon(SILVER_SPOON_ICON_PATHS.tier3, "Golden Spork Knife");
    return;
  }

  if (amountOwned >= TEST_GOLDEN_SPORK_LEVEL) {
    setTemporarySilverSpoonIcon(SILVER_SPOON_ICON_PATHS.tier2, "Golden Spork");
    return;
  }

  setTemporarySilverSpoonIcon(SILVER_SPOON_ICON_PATHS.tier1, "Silver Spoon");
}
