/* ==========================================================
   1. CORE INCIDENT OBJECT ASSETS
   ----------------------------------------------------------
   These placeholder assets occupy the incident object stage.
   Finished images or sprite sheets can replace them later by
   changing only their animation source definitions.
========================================================== */

registerNachtRaidersAssets([
  {
    id: "abandoned-field-pack",
    type: NACHT_RAIDERS_ASSET_TYPE_ITEM,
    label: "FIELD PACK",
    placeholder: "FP",
    facing: "left",
    animations: createNachtRaidersPlaceholderAnimationSet(72, 72)
  },
  {
    id: "damaged-perk-machine",
    type: NACHT_RAIDERS_ASSET_TYPE_ITEM,
    label: "PERK MACHINE",
    placeholder: "PM",
    facing: "left",
    animations: createNachtRaidersPlaceholderAnimationSet(72, 72)
  },
  {
    id: "encrypted-field-radio",
    type: NACHT_RAIDERS_ASSET_TYPE_ITEM,
    label: "FIELD RADIO",
    placeholder: "FR",
    facing: "left",
    animations: createNachtRaidersPlaceholderAnimationSet(72, 72)
  },
  {
    id: "aether-contamination-sample",
    type: NACHT_RAIDERS_ASSET_TYPE_ITEM,
    label: "AETHER SAMPLE",
    placeholder: "AS",
    facing: "left",
    animations: createNachtRaidersPlaceholderAnimationSet(72, 72)
  },
  {
    id: "temporal-echo",
    type: NACHT_RAIDERS_ASSET_TYPE_ENVIRONMENT,
    label: "TEMPORAL ECHO",
    placeholder: "TE",
    facing: "left",
    animations: createNachtRaidersPlaceholderAnimationSet(72, 72)
  },
  {
    id: "sealed-relic-fragment",
    type: NACHT_RAIDERS_ASSET_TYPE_ITEM,
    label: "RELIC FRAGMENT",
    placeholder: "RF",
    facing: "left",
    animations: createNachtRaidersPlaceholderAnimationSet(72, 72)
  }
]);
