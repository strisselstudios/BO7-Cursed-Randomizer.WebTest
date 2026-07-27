/* ==========================================================
   1. NACHT ENVIRONMENT
   ----------------------------------------------------------
   Uses CSS fallback scenery until finished environmental art
   is assigned to the source fields.
========================================================== */

registerNachtRaidersEnvironments([
  {
    id: "nacht-exterior",
    label: "NACHT EXTERIOR",
    backgroundColor: "#010401",

    layers: [
      {
        slot: NACHT_RAIDERS_ENVIRONMENT_LAYER_SKY,
        src: "",
        fallbackClass: "nacht-raiders-environment-fallback-sky",
        opacity: 1,
        backgroundSize: "cover",
        backgroundPositionX: "center",
        backgroundPositionY: "bottom",
        backgroundRepeat: "no-repeat",
        scrollDurationMs: 0
      },

      {
        slot: NACHT_RAIDERS_ENVIRONMENT_LAYER_FAR,
        src: "",
        fallbackClass: "nacht-raiders-environment-fallback-far",
        opacity: 0.42,
        backgroundSize: "auto 100%",
        backgroundPositionX: "0px",
        backgroundPositionY: "bottom",
        backgroundRepeat: "repeat-x",
        scrollDurationMs: 22000,
        scrollDistancePx: 240
      },

      {
        slot: NACHT_RAIDERS_ENVIRONMENT_LAYER_MIDDLE,
        src: "",
        fallbackClass: "nacht-raiders-environment-fallback-middle",
        opacity: 0.32,
        backgroundSize: "auto 100%",
        backgroundPositionX: "0px",
        backgroundPositionY: "bottom",
        backgroundRepeat: "repeat-x",
        scrollDurationMs: 14500,
        scrollDistancePx: 200
      },

      {
        slot: NACHT_RAIDERS_ENVIRONMENT_LAYER_NEAR,
        src: "",
        fallbackClass: "nacht-raiders-environment-fallback-near",
        opacity: 0.58,
        backgroundSize: "auto 100%",
        backgroundPositionX: "0px",
        backgroundPositionY: "bottom",
        backgroundRepeat: "repeat-x",
        scrollDurationMs: 9000,
        scrollDistancePx: 170
      },

      {
        slot: NACHT_RAIDERS_ENVIRONMENT_LAYER_GROUND,
        src: "",
        fallbackClass: "nacht-raiders-environment-fallback-ground",
        opacity: 1,
        backgroundSize: "auto 100%",
        backgroundPositionX: "0px",
        backgroundPositionY: "bottom",
        backgroundRepeat: "repeat-x",
        scrollDurationMs: 2800,
        scrollDistancePx: 66
      }
    ]
  }
]);

/* ==========================================================
   2. CORE ZONES
========================================================== */

registerNachtRaidersZones([
  {
    id: NACHT_RAIDERS_STARTING_ZONE_ID,
    label: "NACHT",
    heading: "NACHT",
    environmentId: "nacht-exterior"
  }
]);
