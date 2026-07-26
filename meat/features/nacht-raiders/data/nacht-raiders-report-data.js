/* ==========================================================
   1. EXPEDITION REPORT SETTINGS
   ----------------------------------------------------------
   Controls report segmentation, naming, and archive behavior.
========================================================== */

const NACHT_RAIDERS_REPORT_SETTINGS = Object.freeze({
  maximumEntriesPerReport: 40,
  filenamePrefix: "EXPEDITION_",
  filenameExtension: ".LOG",
  sequencePadding: 6
});

/* ==========================================================
   2. REPORT REASONS
========================================================== */

const NACHT_RAIDERS_REPORT_REASON_ACTIVE = "active";
const NACHT_RAIDERS_REPORT_REASON_INITIAL_LOAD = "initial-load";
const NACHT_RAIDERS_REPORT_REASON_VISIBILITY_RETURN = "visibility-return";
const NACHT_RAIDERS_REPORT_REASON_OPERATIVE_ACCESS = "operative-access";
const NACHT_RAIDERS_REPORT_REASON_AUTOMATIC_SEGMENT = "automatic-segment";
