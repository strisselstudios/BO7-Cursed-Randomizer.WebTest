/* ==========================================================
   1. APPLICATION ELEMENTS
   ----------------------------------------------------------
   Caches the main responsive views, navigation controls, and
   primary MEAT resource display.
========================================================== */

/* ==========================================================
   1.1 VIEWS AND NAVIGATION
========================================================== */

const meatView = document.getElementById("meatView");
const sidePanel = document.getElementById("sidePanel");
const panelViews = document.querySelectorAll(".panel-view");
const desktopTabs = document.querySelectorAll(".desktop-tab");
const mobileNavigationButtons = document.querySelectorAll(".mobile-nav-button[data-mobile-target]");

/* ==========================================================
   1.2 RESOURCE DISPLAY AND STATISTICS
========================================================== */

const meatButton = document.getElementById("meatButton");
const meatCount = document.getElementById("meatCount");
const meatPerSecondDisplay = document.getElementById("meatPerSecondDisplay");
const floatingTextLayer = document.getElementById("floatingTextLayer");
const meatBankStat = document.getElementById("meatBankStat");
const totalMeatStat = document.getElementById("totalMeatStat");
const meatPerSecondStat = document.getElementById("meatPerSecondStat");
const meatPerClickStat = document.getElementById("meatPerClickStat");
const totalClicksStat = document.getElementById("totalClicksStat");
const producersOwnedStat = document.getElementById("producersOwnedStat");
const runTimeStat = document.getElementById("runTimeStat");

/* ==========================================================
   2. STORE ELEMENTS
   ----------------------------------------------------------
   Caches producer cards, store pages, and transaction controls.
========================================================== */

/* ==========================================================
   2.1 PRODUCER STORE
========================================================== */

const producerCards = document.querySelectorAll(".producer-card");
const producerList = document.getElementById("producerList");
const storePageTabs = document.querySelectorAll(".store-page-tab[data-store-page-target]");
const storePages = document.querySelectorAll(".store-page[data-store-page]");
const meatMartPage = document.getElementById("meatMartPage");
const marltonsSchematicsPage = document.getElementById("marltonsSchematicsPage");

/* ==========================================================
   2.2 TRANSACTION CONTROLS
========================================================== */

const storeTransactionControls = document.getElementById("storeTransactionControls");
const storeModeButtons = document.querySelectorAll(".store-control-button[data-store-mode]");
const storeQuantityButtons = document.querySelectorAll(".store-control-button[data-store-quantity]");

/* ==========================================================
   3. SETTINGS AND SAVE ELEMENTS
   ----------------------------------------------------------
   Caches preferences, local save controls, reset confirmation,
   transfer controls, and the offline-production report.
========================================================== */

/* ==========================================================
   3.1 PREFERENCES AND DIRECT SAVE CONTROLS
========================================================== */

const soundToggle = document.getElementById("soundToggle");
const animationToggle = document.getElementById("animationToggle");
const nachtRaidersBootSettingRow = document.getElementById("nachtRaidersBootSettingRow");
const nachtRaidersBootToggle = document.getElementById("nachtRaidersBootToggle");
const saveGameButton = document.getElementById("saveGameButton");
const saveGameButtonLabel = document.getElementById("saveGameButtonLabel");
const exportSaveButton = document.getElementById("exportSaveButton");
const importSaveButton = document.getElementById("importSaveButton");
const resetGameButton = document.getElementById("resetGameButton");

/* ==========================================================
   3.2 SAVE IMPORT ASSESSMENT
========================================================== */

const saveImportOverlay = document.getElementById("saveImportOverlay");
const saveImportDialog = document.getElementById("saveImportDialog");
const saveImportStatus = document.getElementById("saveImportStatus");
const saveImportTitle = document.getElementById("saveImportTitle");
const saveImportMessage = document.getElementById("saveImportMessage");
const cancelSaveImportButton = document.getElementById("cancelSaveImportButton");
const confirmSaveImportButton = document.getElementById("confirmSaveImportButton");

/* ==========================================================
   3.3 RESET CONFIRMATION
========================================================== */

const resetConfirmationOverlay = document.getElementById("resetConfirmationOverlay");
const cancelResetButton = document.getElementById("cancelResetButton");
const confirmResetButton = document.getElementById("confirmResetButton");
/* ==========================================================
   3.4 SAVE TRANSFER
========================================================== */

const createTransferButton = document.getElementById("createTransferButton");
const receiveTransferButton = document.getElementById("receiveTransferButton");
const saveTransferDialog = document.getElementById("saveTransferDialog");
const closeSaveTransferDialogButton = document.getElementById("closeSaveTransferDialogButton");
const transferDialogTitle = document.getElementById("transferDialogTitle");
const transferCreatePanel = document.getElementById("transferCreatePanel");
const generatedTransferCode = document.getElementById("generatedTransferCode");
const transferCountdown = document.getElementById("transferCountdown");
const transferCreateStatus = document.getElementById("transferCreateStatus");
const transferReceivePanel = document.getElementById("transferReceivePanel");
const transferCodeInput = document.getElementById("transferCodeInput");
const checkTransferCodeButton = document.getElementById("checkTransferCodeButton");
const transferPreview = document.getElementById("transferPreview");
const transferPreviewMeat = document.getElementById("transferPreviewMeat");
const transferPreviewLifetimeMeat = document.getElementById("transferPreviewLifetimeMeat");
const transferPreviewClicks = document.getElementById("transferPreviewClicks");
const transferPreviewProducers = document.getElementById("transferPreviewProducers");
const transferPreviewDate = document.getElementById("transferPreviewDate");
const confirmTransferButton = document.getElementById("confirmTransferButton");
const transferReceiveStatus = document.getElementById("transferReceiveStatus");

/* ==========================================================
   3.5 OFFLINE PRODUCTION
========================================================== */

const offlineProductionDialog = document.getElementById("offlineProductionDialog");
const offlineProductionAmount = document.getElementById("offlineProductionAmount");
const offlineProductionDuration = document.getElementById("offlineProductionDuration");
const offlineProductionCloseButton = document.getElementById("offlineProductionCloseButton");

/* ==========================================================
   4. PRODUCER INFORMATION ELEMENTS
   ----------------------------------------------------------
   Caches the producer dossier, producer statistics, and embedded
   Harvester information interface.
========================================================== */

/* ==========================================================
   4.1 PRODUCER DIALOG CONTROLS
========================================================== */

const producerInfoDialog = document.getElementById("producerInfoDialog");
const producerInfoPanel = document.getElementById("producerInfoPanel");
const producerInfoPreviousButton = document.getElementById("producerInfoPreviousButton");
const producerInfoNextButton = document.getElementById("producerInfoNextButton");
const producerInfoPurchaseButton = document.getElementById("producerInfoPurchaseButton");
const producerInfoPurchaseLabel = document.getElementById("producerInfoPurchaseLabel");
const producerInfoCloseButton = document.getElementById("producerInfoCloseButton");

/* ==========================================================
   4.2 PRODUCER DETAILS
========================================================== */

const producerInfoIconSlot = document.getElementById("producerInfoIconSlot");
const producerInfoName = document.getElementById("producerInfoName");
const producerInfoTier = document.getElementById("producerInfoTier");
const producerInfoOwned = document.getElementById("producerInfoOwned");
const producerInfoUnitLabel = document.getElementById("producerInfoUnitLabel");
const producerInfoUnitOutput = document.getElementById("producerInfoUnitOutput");
const producerInfoCombinedLabel = document.getElementById("producerInfoCombinedLabel");
const producerInfoCombinedOutput = document.getElementById("producerInfoCombinedOutput");
const producerInfoShare = document.getElementById("producerInfoShare");
const producerInfoLifetime = document.getElementById("producerInfoLifetime");
const producerInfoDescription = document.getElementById("producerInfoDescription");
const producerInfoHarvesterButton = document.getElementById("producerInfoHarvesterButton");

/* ==========================================================
   4.3 HARVESTER INFORMATION
========================================================== */

const harvesterInfoView = document.getElementById("harvesterInfoView");
const harvesterInfoStatus = document.getElementById("harvesterInfoStatus");
const harvesterInfoTimeRemaining = document.getElementById("harvesterInfoTimeRemaining");
const harvesterInfoPassiveMps = document.getElementById("harvesterInfoPassiveMps");
const harvesterInfoOwnedSnapshot = document.getElementById("harvesterInfoOwnedSnapshot");
const harvesterInfoClickRate = document.getElementById("harvesterInfoClickRate");
const harvesterInfoOwnershipMultiplier = document.getElementById("harvesterInfoOwnershipMultiplier");
const harvesterInfoOutputRate = document.getElementById("harvesterInfoOutputRate");
const harvesterInfoStoredMeat = document.getElementById("harvesterInfoStoredMeat");
const harvesterInfoProjectedYield = document.getElementById("harvesterInfoProjectedYield");
const harvesterInfoLifetimeMeat = document.getElementById("harvesterInfoLifetimeMeat");
const harvesterInfoFormulaHeading = document.getElementById("harvesterInfoFormulaHeading");
const harvesterInfoFormulaText = document.getElementById("harvesterInfoFormulaText");
const harvesterInfoCollectionResult = document.getElementById("harvesterInfoCollectionResult");
const harvesterInfoRetractButton = document.getElementById("harvesterInfoRetractButton");
const harvesterInfoBackButton = document.getElementById("harvesterInfoBackButton");

/* ==========================================================
   5. GLOBAL NAVIGATION ELEMENTS
========================================================== */

const menuBackButton = document.getElementById("menuBackButton");
const randomizerReturnButton = document.getElementById("randomizerReturnButton");
const randomizerNavigationOverlay = document.getElementById("randomizerNavigationOverlay");
const confirmRandomizerNavigationButton = document.getElementById("confirmRandomizerNavigationButton");
const cancelRandomizerNavigationButton = document.getElementById("cancelRandomizerNavigationButton");

/* ==========================================================
   6. HARVESTER FEATURE ELEMENTS
   ----------------------------------------------------------
   Caches the Harvester store control, placement interface,
   deployment display, charge gauge, and collection feedback.
========================================================== */

/* ==========================================================
   6.1 STORE AND PLACEMENT
========================================================== */

const silverSpoonCardGroup = document.getElementById("silverSpoonCardGroup");
const harvesterStoreActionButton = document.getElementById("harvesterStoreActionButton");
const harvesterPlacementLayer = document.getElementById("harvesterPlacementLayer");
const harvesterCursorPreview = document.getElementById("harvesterCursorPreview");
const placedHarvester = document.getElementById("placedHarvester");
const harvesterPlacementBanner = document.getElementById("harvesterPlacementBanner");
const harvesterPlacementCancelButton = document.getElementById("harvesterPlacementCancelButton");

/* ==========================================================
   6.2 CHARGE AND COLLECTION
========================================================== */

const harvesterChargeGauge = document.getElementById("harvesterChargeGauge");
const harvesterChargeGaugeFill = document.getElementById("harvesterChargeGaugeFill");
const harvesterChargeTime = document.getElementById("harvesterChargeTime");
const harvesterCollectionNotice = document.getElementById("harvesterCollectionNotice");
const harvesterCollectionAmount = document.getElementById("harvesterCollectionAmount");
const silverSpoonIcon = document.getElementById("silverSpoonIcon");

/* ==========================================================
   7. NACHT RAIDERS FEATURE ELEMENTS
   ----------------------------------------------------------
   Caches the launcher, window, boot terminal, menu, active
   expedition interface, and Field Records archive.
========================================================== */

/* ==========================================================
   7.1 LAUNCHER AND WINDOW
========================================================== */

const aetherRepairmenCardGroup = document.getElementById("aetherRepairmenCardGroup");
const aetherRepairmenIcon = document.getElementById("aetherRepairmenIcon");
const nachtRaidersLauncherButton = document.getElementById("nachtRaidersLauncherButton");
const nachtRaidersOverlay = document.getElementById("nachtRaidersOverlay");
const nachtRaidersWindow = document.getElementById("nachtRaidersWindow");
const nachtRaidersCloseButton = document.getElementById("nachtRaidersCloseButton");
const nachtRaidersScreen = document.getElementById("nachtRaidersScreen");

/* ==========================================================
   7.2 BOOT AND MENU
========================================================== */

const nachtRaidersLoadingScreen = document.getElementById("nachtRaidersLoadingScreen");
const nachtRaidersTerminalOutput = document.getElementById("nachtRaidersTerminalOutput");
const nachtRaidersMenuScreen = document.getElementById("nachtRaidersMenuScreen");
const nachtRaidersMenuArtwork = document.getElementById("nachtRaidersMenuArtwork");
const nachtRaidersPrimaryButton = document.getElementById("nachtRaidersPrimaryButton");
const nachtRaidersPrimaryButtonLabel = document.getElementById("nachtRaidersPrimaryButtonLabel");
const nachtRaidersMenuStatus = document.getElementById("nachtRaidersMenuStatus");
const nachtRaidersExitButton = document.getElementById("nachtRaidersExitButton");

/* ==========================================================
   7.3 ACTIVE EXPEDITION
========================================================== */

const nachtRaidersGameScreen = document.getElementById("nachtRaidersGameScreen");
const nachtRaidersGameBackButton = document.getElementById("nachtRaidersGameBackButton");
const nachtRaidersGameZone = document.getElementById("nachtRaidersGameZone");
const nachtRaidersGameDepth = document.getElementById("nachtRaidersGameDepth");
const nachtRaidersGameCycle = document.getElementById("nachtRaidersGameCycle");
const nachtRaidersGameLevel = document.getElementById("nachtRaidersGameLevel");
const nachtRaidersGameHealthText = document.getElementById("nachtRaidersGameHealthText");
const nachtRaidersGameHealthFill = document.getElementById("nachtRaidersGameHealthFill");
const nachtRaidersGameXpText = document.getElementById("nachtRaidersGameXpText");
const nachtRaidersGameXpFill = document.getElementById("nachtRaidersGameXpFill");
const nachtRaidersGameTravelText = document.getElementById("nachtRaidersGameTravelText");
const nachtRaidersGameTravelFill = document.getElementById("nachtRaidersGameTravelFill");
const nachtRaidersOperativeEntity = document.getElementById("nachtRaidersOperativeEntity");
const nachtRaidersOperativeVisual = document.getElementById("nachtRaidersOperativeVisual");
const nachtRaidersOperativePlaceholder = document.getElementById("nachtRaidersOperativePlaceholder");
const nachtRaidersEnemyEntity = document.getElementById("nachtRaidersEnemyEntity");
const nachtRaidersEnemyVisual = document.getElementById("nachtRaidersEnemyVisual");
const nachtRaidersEnemyPlaceholder = document.getElementById("nachtRaidersEnemyPlaceholder");
const nachtRaidersEnemyName = document.getElementById("nachtRaidersEnemyName");
const nachtRaidersEnemyHealthText = document.getElementById("nachtRaidersEnemyHealthText");
const nachtRaidersEnemyHealthFill = document.getElementById("nachtRaidersEnemyHealthFill");
const nachtRaidersGameEventType = document.getElementById("nachtRaidersGameEventType");
const nachtRaidersGameEventText = document.getElementById("nachtRaidersGameEventText");
const nachtRaidersGameSalvage = document.getElementById("nachtRaidersGameSalvage");
const nachtRaidersGameAetherResidue = document.getElementById("nachtRaidersGameAetherResidue");
const nachtRaidersGameFieldData = document.getElementById("nachtRaidersGameFieldData");
const nachtRaidersGameRelicFragments = document.getElementById("nachtRaidersGameRelicFragments");

/* ==========================================================
   7.4 FIELD RECORDS ARCHIVE
========================================================== */

const nachtRaidersRecordsButton = document.getElementById("nachtRaidersRecordsButton");
const nachtRaidersRecordsUnreadBadge = document.getElementById("nachtRaidersRecordsUnreadBadge");
const nachtRaidersRecordsScreen = document.getElementById("nachtRaidersRecordsScreen");
const nachtRaidersRecordsSummary = document.getElementById("nachtRaidersRecordsSummary");
const nachtRaidersRecordsBackButton = document.getElementById("nachtRaidersRecordsBackButton");
const nachtRaidersReportCount = document.getElementById("nachtRaidersReportCount");
const nachtRaidersReportList = document.getElementById("nachtRaidersReportList");
const nachtRaidersReportEmpty = document.getElementById("nachtRaidersReportEmpty");
const nachtRaidersReportContent = document.getElementById("nachtRaidersReportContent");
const nachtRaidersReportFilename = document.getElementById("nachtRaidersReportFilename");
const nachtRaidersReportCreatedAt = document.getElementById("nachtRaidersReportCreatedAt");
const nachtRaidersReportCycle = document.getElementById("nachtRaidersReportCycle");
const nachtRaidersReportDepth = document.getElementById("nachtRaidersReportDepth");
const nachtRaidersReportEntryCount = document.getElementById("nachtRaidersReportEntryCount");
const nachtRaidersReportZones = document.getElementById("nachtRaidersReportZones");
const nachtRaidersReportRewards = document.getElementById("nachtRaidersReportRewards");
const nachtRaidersReportEntries = document.getElementById("nachtRaidersReportEntries");

/* ==========================================================
   8. PRODUCER DISPLAY MAP
   ----------------------------------------------------------
   Maps producer IDs to their cost and ownership display nodes.
========================================================== */

const producerDisplayElements = {
  silverSpoon: {
    cost: document.getElementById("silverSpoonCost"),
    owned: document.getElementById("silverSpoonOwned")
  },
  aetherRepairmen: {
    cost: document.getElementById("aetherRepairmenCost"),
    owned: document.getElementById("aetherRepairmenOwned")
  },
  vandornCrops: {
    cost: document.getElementById("vandornCropsCost"),
    owned: document.getElementById("vandornCropsOwned")
  },
  sunkenMiningTown: {
    cost: document.getElementById("sunkenMiningTownCost"),
    owned: document.getElementById("sunkenMiningTownOwned")
  },
  giantFactory: {
    cost: document.getElementById("giantFactoryCost"),
    owned: document.getElementById("giantFactoryOwned")
  },
  libertySavingsBonds: {
    cost: document.getElementById("libertySavingsBondsCost"),
    owned: document.getElementById("libertySavingsBondsOwned")
  },
  marsShrine: {
    cost: document.getElementById("marsShrineCost"),
    owned: document.getElementById("marsShrineOwned")
  },
  ominousLighthouse: {
    cost: document.getElementById("ominousLighthouseCost"),
    owned: document.getElementById("ominousLighthouseOwned")
  },
  cccpMissile: {
    cost: document.getElementById("cccpMissileCost"),
    owned: document.getElementById("cccpMissileOwned")
  },
  newIndustriesLaboratory: {
    cost: document.getElementById("newIndustriesLaboratoryCost"),
    owned: document.getElementById("newIndustriesLaboratoryOwned")
  },
  darkAetherRift: {
    cost: document.getElementById("darkAetherRiftCost"),
    owned: document.getElementById("darkAetherRiftOwned")
  },
  mpd: {
    cost: document.getElementById("mpdCost"),
    owned: document.getElementById("mpdOwned")
  },
  shemsSpacetimeMacGuffin: {
    cost: document.getElementById("shemsSpacetimeMacGuffinCost"),
    owned: document.getElementById("shemsSpacetimeMacGuffinOwned")
  }
};
