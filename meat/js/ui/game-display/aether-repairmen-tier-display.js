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
  locked: "meat/images/buildings/aether-repairmen/aether-repairman-locked.png",
  tier1: "meat/images/buildings/aether-repairmen/aether-repairman-tier1.png",
  tier2: "meat/images/buildings/aether-repairmen/aether-repairman-tier2.png",
  tier3: "meat/images/buildings/aether-repairmen/aether-repairman-tier3.gif"
};

const TEST_AETHER_REPAIRMEN_TIER_2_LEVEL = 25;
const TEST_AETHER_REPAIRMEN_TIER_3_LEVEL = 50;

function setTemporaryAetherRepairmenIcon(imagePath, altText) {
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

  if (aetherRepairmenIcon.getAttribute("src") !== imagePath) {
    aetherRepairmenIcon.setAttribute("src", imagePath);
  }

  aetherRepairmenIcon.alt = altText;
}

function updateTemporaryAetherRepairmenIcon() {
  if (!aetherRepairmenIcon) {
    return;
  }

  const amountOwned = gameState.producers.aetherRepairmen ?? 0;

  if (!isProducerRevealed("aetherRepairmen")) {
    setTemporaryAetherRepairmenIcon(AETHER_REPAIRMEN_ICON_PATHS.locked, "Locked Aether Repairmen");
    return;
  }

  if (amountOwned >= TEST_AETHER_REPAIRMEN_TIER_3_LEVEL) {
    setTemporaryAetherRepairmenIcon(AETHER_REPAIRMEN_ICON_PATHS.tier3, "Tier 3 Aether Repairmen");
    return;
  }

  if (amountOwned >= TEST_AETHER_REPAIRMEN_TIER_2_LEVEL) {
    setTemporaryAetherRepairmenIcon(AETHER_REPAIRMEN_ICON_PATHS.tier2, "Tier 2 Aether Repairmen");
    return;
  }

  setTemporaryAetherRepairmenIcon(AETHER_REPAIRMEN_ICON_PATHS.tier1, "Tier 1 Aether Repairmen");
}
