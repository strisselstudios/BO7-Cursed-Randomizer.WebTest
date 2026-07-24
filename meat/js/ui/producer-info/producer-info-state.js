/* ==========================================================
   1. PRODUCER INFO STATE
   ----------------------------------------------------------
   Tracks which producer is currently displayed. This is
   temporary interface state and is not saved.
========================================================== */

let openProducerInfoKey = null;

const PRODUCER_INFO_REFRESH_RATE = 250;

const PRODUCER_INFO_SLIDE_OUT_DURATION =
  180;

const PRODUCER_INFO_SLIDE_IN_DURATION =
  220;

const PRODUCER_INFO_SLIDE_DISTANCE =
  "110%";

const PRODUCER_INFO_TIER_LABELS = {
  1: "TIER I",
  2: "TIER II",
  3: "TIER III"
};

let producerInfoTransitionInProgress =
  false;

let producerInfoTransitionToken = 0;

let producerInfoActiveAnimation = null;

let producerInfoViewportRefreshTimer =
  null;

let producerInfoViewportRecoveryInProgress =
  false;

let producerInfoIgnoreNextCloseEvent =
  false;

let producerInfoStableViewportMode =
  window.innerWidth >= window.innerHeight
    ? "landscape"
    : "portrait";

