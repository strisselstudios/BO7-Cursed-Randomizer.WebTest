/* ==========================================================
   1. HARVESTER DUTY-CYCLE CONFIGURATION
   ----------------------------------------------------------
   Centralizes temporary Harvester balance values.

   These are development values. Changing active duration,
   cooldown duration, click speed, or click strength later
   requires edits only in this file.
========================================================== */

const HARVESTER_ACTIVE_DURATION_MS =
  60 * 1000;

const HARVESTER_COOLDOWN_DURATION_MS =
  30 * 1000;

const HARVESTER_CLICKS_PER_SECOND =
  2;

const HARVESTER_CLICK_VALUE_MULTIPLIER =
  1;

/* ==========================================================
   2. HARVESTER CHARGE DISPLAY
   ----------------------------------------------------------
   Green:
   More than half of active time remains.

   Orange:
   One-quarter through one-half remains.

   Red:
   One-quarter or less remains.
========================================================== */

const HARVESTER_CHARGE_ORANGE_THRESHOLD =
  0.5;

const HARVESTER_CHARGE_RED_THRESHOLD =
  0.25;

const HARVESTER_DUTY_DISPLAY_REFRESH_MS =
  250;
