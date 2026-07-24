/* ==========================================================
   1. GLOBAL BROWSER ZOOM PREVENTION
   ----------------------------------------------------------
   Prevents page scaling through mobile pinch gestures,
   Safari gesture events, Ctrl/Command-wheel input, and
   keyboard zoom shortcuts.

   This applies across the entire MEAT.exe interface,
   including the Harvest Dossier and every menu.
========================================================== */

/* ==========================================================
   1.1 SAFARI GESTURE EVENTS
   ----------------------------------------------------------
   Safari exposes pinch and rotation through proprietary
   gesture events. Prevent their browser defaults.
========================================================== */

function preventZoomGesture(event) {
  event.preventDefault();
}

[
  "gesturestart",
  "gesturechange",
  "gestureend"
].forEach((eventName) => {
  document.addEventListener(
    eventName,
    preventZoomGesture,
    {
      passive: false
    }
  );
});

/* ==========================================================
   1.2 MULTI-TOUCH PINCH INPUT
   ----------------------------------------------------------
   Blocks touch interactions containing more than one active
   contact while retaining ordinary one-finger scrolling.
========================================================== */

function preventMultiTouchZoom(event) {
  if (event.touches.length <= 1) {
    return;
  }

  event.preventDefault();
}

document.addEventListener(
  "touchstart",
  preventMultiTouchZoom,
  {
    passive: false
  }
);

document.addEventListener(
  "touchmove",
  preventMultiTouchZoom,
  {
    passive: false
  }
);

/* ==========================================================
   1.3 TRACKPAD AND CTRL-WHEEL ZOOM
   ----------------------------------------------------------
   Browsers commonly represent trackpad pinch gestures as a
   wheel event with Ctrl or Command active.
========================================================== */

document.addEventListener(
  "wheel",
  (event) => {
    if (
      !event.ctrlKey &&
      !event.metaKey
    ) {
      return;
    }

    event.preventDefault();
  },
  {
    passive: false
  }
);

/* ==========================================================
   1.4 KEYBOARD ZOOM SHORTCUTS
   ----------------------------------------------------------
   Blocks Ctrl/Command plus, minus, and equals shortcuts.

   Ctrl/Command+0 remains available as an emergency reset if
   the browser itself was previously zoomed through its menu.
========================================================== */

document.addEventListener(
  "keydown",
  (event) => {
    if (
      !event.ctrlKey &&
      !event.metaKey
    ) {
      return;
    }

    const zoomKeys = new Set([
      "+",
      "=",
      "-"
    ]);

    if (!zoomKeys.has(event.key)) {
      return;
    }

    event.preventDefault();
  }
);
