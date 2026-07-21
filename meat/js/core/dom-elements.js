/* ==========================================================
   1. DOM ELEMENTS
   ----------------------------------------------------------
   Cache the navigation controls and shared page views.
========================================================== */

const meatView = document.getElementById("meatView");
const sidePanel = document.getElementById("sidePanel");

const panelViews = document.querySelectorAll(".panel-view");
const desktopTabs = document.querySelectorAll(".desktop-tab");
const mobileNavigationButtons = document.querySelectorAll(
  ".mobile-nav-button[data-mobile-target]");

const meatButton = document.getElementById("meatButton");
const meatCount = document.getElementById("meatCount");
const meatPerSecondDisplay = document.getElementById(
  "meatPerSecondDisplay"
);

const floatingTextLayer = document.getElementById(
  "floatingTextLayer"
);

const meatBankStat = document.getElementById("meatBankStat");
const totalMeatStat = document.getElementById("totalMeatStat");
const meatPerSecondStat = document.getElementById(
  "meatPerSecondStat"
);
const meatPerClickStat = document.getElementById(
  "meatPerClickStat"
);
const totalClicksStat = document.getElementById(
  "totalClicksStat"
);
const producersOwnedStat = document.getElementById(
  "producersOwnedStat"
);
const runTimeStat = document.getElementById("runTimeStat");
const producerCards = document.querySelectorAll(".producer-card");
const producerList = document.getElementById("producerList");

const storePageTabs =
  document.querySelectorAll(
    ".store-page-tab[data-store-page-target]"
  );

const storePages =
  document.querySelectorAll(
    ".store-page[data-store-page]"
  );

const meatMartPage =
  document.getElementById(
    "meatMartPage"
  );

const marltonsSchematicsPage =
  document.getElementById(
    "marltonsSchematicsPage"
  );

const storeTransactionControls =
  document.getElementById(
    "storeTransactionControls"
  );

const storeModeButtons =
  document.querySelectorAll(
    ".store-control-button[data-store-mode]"
  );

const storeQuantityButtons =
  document.querySelectorAll(
    ".store-control-button[data-store-quantity]"
  );

const soundToggle =
  document.getElementById("soundToggle");

const animationToggle =
  document.getElementById("animationToggle");

const saveGameButton =
  document.getElementById("saveGameButton");

const exportSaveButton =
  document.getElementById("exportSaveButton");

const importSaveButton =
  document.getElementById("importSaveButton");

const resetGameButton =
  document.getElementById("resetGameButton");

const resetConfirmationOverlay =
  document.getElementById(
    "resetConfirmationOverlay"
  );

const cancelResetButton =
  document.getElementById(
    "cancelResetButton"
  );

const confirmResetButton =
  document.getElementById(
    "confirmResetButton"
  );

const createTransferButton =
  document.getElementById(
    "createTransferButton"
  );

const receiveTransferButton =
  document.getElementById(
    "receiveTransferButton"
  );

const saveTransferDialog =
  document.getElementById(
    "saveTransferDialog"
  );

const closeSaveTransferDialogButton =
  document.getElementById(
    "closeSaveTransferDialogButton"
  );

const transferDialogTitle =
  document.getElementById(
    "transferDialogTitle"
  );

const transferCreatePanel =
  document.getElementById(
    "transferCreatePanel"
  );

const generatedTransferCode =
  document.getElementById(
    "generatedTransferCode"
  );

const transferCountdown =
  document.getElementById(
    "transferCountdown"
  );

const transferCreateStatus =
  document.getElementById(
    "transferCreateStatus"
  );

const transferReceivePanel =
  document.getElementById(
    "transferReceivePanel"
  );

const transferCodeInput =
  document.getElementById(
    "transferCodeInput"
  );

const checkTransferCodeButton =
  document.getElementById(
    "checkTransferCodeButton"
  );

const transferPreview =
  document.getElementById(
    "transferPreview"
  );

const transferPreviewMeat =
  document.getElementById(
    "transferPreviewMeat"
  );

const transferPreviewLifetimeMeat =
  document.getElementById(
    "transferPreviewLifetimeMeat"
  );

const transferPreviewClicks =
  document.getElementById(
    "transferPreviewClicks"
  );

const transferPreviewProducers =
  document.getElementById(
    "transferPreviewProducers"
  );

const transferPreviewDate =
  document.getElementById(
    "transferPreviewDate"
  );

const confirmTransferButton =
  document.getElementById(
    "confirmTransferButton"
  );

const transferReceiveStatus =
  document.getElementById(
    "transferReceiveStatus"
  );

const offlineProductionDialog =
  document.getElementById(
    "offlineProductionDialog"
  );

const offlineProductionAmount =
  document.getElementById(
    "offlineProductionAmount"
  );

const offlineProductionDuration =
  document.getElementById(
    "offlineProductionDuration"
  );

const offlineProductionCloseButton =
  document.getElementById(
    "offlineProductionCloseButton"
  );

const producerInfoDialog =
  document.getElementById(
    "producerInfoDialog"
  );

const producerInfoIconSlot =
  document.getElementById(
    "producerInfoIconSlot"
  );

const producerInfoName =
  document.getElementById(
    "producerInfoName"
  );

const producerInfoTier =
  document.getElementById(
    "producerInfoTier"
  );

const producerInfoOwned =
  document.getElementById(
    "producerInfoOwned"
  );

const producerInfoUnitLabel =
  document.getElementById(
    "producerInfoUnitLabel"
  );

const producerInfoUnitOutput =
  document.getElementById(
    "producerInfoUnitOutput"
  );

const producerInfoCombinedLabel =
  document.getElementById(
    "producerInfoCombinedLabel"
  );

const producerInfoCombinedOutput =
  document.getElementById(
    "producerInfoCombinedOutput"
  );

const producerInfoShare =
  document.getElementById(
    "producerInfoShare"
  );

const producerInfoLifetime =
  document.getElementById(
    "producerInfoLifetime"
  );

const producerInfoDescription =
  document.getElementById(
    "producerInfoDescription"
  );

const producerInfoCloseButton =
  document.getElementById(
    "producerInfoCloseButton"
  );

const menuBackButton =
  document.getElementById(
    "menuBackButton"
  );

const randomizerReturnButton =
  document.getElementById(
    "randomizerReturnButton"
  );

const randomizerNavigationOverlay =
  document.getElementById(
    "randomizerNavigationOverlay"
  );

const confirmRandomizerNavigationButton =
  document.getElementById(
    "confirmRandomizerNavigationButton"
  );

const cancelRandomizerNavigationButton =
  document.getElementById(
    "cancelRandomizerNavigationButton"
  );


const silverSpoonIcon = document.getElementById(
    "silverSpoonIcon"
  );

const aetherRepairmenIcon = document.getElementById(
  "aetherRepairmenIcon"
);

const producerDisplayElements = {
  silverSpoon: {
    cost: document.getElementById(
      "silverSpoonCost"
    ),
    owned: document.getElementById(
      "silverSpoonOwned"
    )
  },

  aetherRepairmen: {
    cost: document.getElementById(
      "aetherRepairmenCost"
    ),
    owned: document.getElementById(
      "aetherRepairmenOwned"
    )
  },

  vandornCrops: {
    cost: document.getElementById(
      "vandornCropsCost"
    ),
    owned: document.getElementById(
      "vandornCropsOwned"
    )
  },

  sunkenMiningTown: {
    cost: document.getElementById(
      "sunkenMiningTownCost"
    ),
    owned: document.getElementById(
      "sunkenMiningTownOwned"
    )
  },

  giantFactory: {
    cost: document.getElementById(
      "giantFactoryCost"
    ),
    owned: document.getElementById(
      "giantFactoryOwned"
    )
  },

  libertySavingsBonds: {
    cost: document.getElementById(
      "libertySavingsBondsCost"
    ),
    owned: document.getElementById(
      "libertySavingsBondsOwned"
    )
  },

  marsShrine: {
    cost: document.getElementById(
      "marsShrineCost"
    ),
    owned: document.getElementById(
      "marsShrineOwned"
    )
  },

  ominousLighthouse: {
    cost: document.getElementById(
      "ominousLighthouseCost"
    ),
    owned: document.getElementById(
      "ominousLighthouseOwned"
    )
  },

  cccpMissile: {
    cost: document.getElementById(
      "cccpMissileCost"
    ),
    owned: document.getElementById(
      "cccpMissileOwned"
    )
  },

  newIndustriesLaboratory: {
    cost: document.getElementById(
      "newIndustriesLaboratoryCost"
    ),
    owned: document.getElementById(
      "newIndustriesLaboratoryOwned"
    )
  },

  darkAetherRift: {
    cost: document.getElementById(
      "darkAetherRiftCost"
    ),
    owned: document.getElementById(
      "darkAetherRiftOwned"
    )
  },

  mpd: {
    cost: document.getElementById(
      "mpdCost"
    ),
    owned: document.getElementById(
      "mpdOwned"
    )
  },

  shemsSpacetimeMacGuffin: {
    cost: document.getElementById(
      "shemsSpacetimeMacGuffinCost"
    ),
    owned: document.getElementById(
      "shemsSpacetimeMacGuffinOwned"
    )
  }
};
