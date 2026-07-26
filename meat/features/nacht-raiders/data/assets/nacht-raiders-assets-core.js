/* ==========================================================
   1. CORE VISUAL ASSETS
   ----------------------------------------------------------
   Empty source paths invoke CSS placeholders. Finished sprite
   sheets can be added here without changing simulation logic,
   encounter logic, saved state, or interface structure.
========================================================== */

registerNachtRaidersAssets([
  {
    id: "operative",
    type: NACHT_RAIDERS_ASSET_TYPE_OPERATIVE,
    label: "OPERATIVE",
    placeholder: "OP",
    facing: "right",

    feetAnchor: {
      x: 0.5,
      y: 0.92
    },

    animations:
      createNachtRaidersPlaceholderAnimationSet(
        96,
        96
      )
  },

  {
    id: "reanimate",
    type: NACHT_RAIDERS_ASSET_TYPE_ENEMY,
    label: "REANIMATE",
    placeholder: "R",
    facing: "left",

    feetAnchor: {
      x: 0.5,
      y: 0.92
    },

    animations:
      createNachtRaidersPlaceholderAnimationSet(
        96,
        96
      )
  },

  {
    id: "armored-corpse",
    type: NACHT_RAIDERS_ASSET_TYPE_ENEMY,
    label: "ARMORED CORPSE",
    placeholder: "AC",
    facing: "left",

    feetAnchor: {
      x: 0.5,
      y: 0.92
    },

    animations:
      createNachtRaidersPlaceholderAnimationSet(
        96,
        96
      )
  },

  {
    id: "hellhound",
    type: NACHT_RAIDERS_ASSET_TYPE_ENEMY,
    label: "HELLHOUND",
    placeholder: "HH",
    facing: "left",

    feetAnchor: {
      x: 0.5,
      y: 0.88
    },

    animations:
      createNachtRaidersPlaceholderAnimationSet(
        96,
        96
      )
  },

  {
    id: "oscar",
    type: NACHT_RAIDERS_ASSET_TYPE_ENEMY,
    label: "O.S.C.A.R.",
    placeholder: "O",
    facing: "left",

    feetAnchor: {
      x: 0.5,
      y: 0.94
    },

    animations:
      createNachtRaidersPlaceholderAnimationSet(
        96,
        96
      )
  }
]);
