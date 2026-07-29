/* ==========================================================
   1. LEGACY PROTOTYPE COMPATIBILITY
   ----------------------------------------------------------
   Retains old helper names while the live High Steaks systems
   transition to the match-state architecture.
========================================================== */

window.HighSteaks = window.HighSteaks || {};

HighSteaks.PLACEHOLDER_PLAYER_HAND =
  Object.freeze([]);

HighSteaks.createPlaceholderState =
  function createPlaceholderState() {
    return HighSteaks.createLobbyState();
  };
