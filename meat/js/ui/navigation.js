/* ==========================================================
   1. SHARED PANEL CONTROLLER
   ----------------------------------------------------------
   Displays the selected Store, Stats, or Settings panel.
   Only portrait mobile layouts hide the meat view.
========================================================== */

function isPortraitMobileLayout() {
  return window.matchMedia(
    "(max-width: 760px) and (orientation: portrait)"
  ).matches;
}

/* ==========================================================
   1.1 HEADER CORNER CONTROLS
   ----------------------------------------------------------
   Displays the Randomizer link on the MEAT view.

   Displays the menu back arrow only when a Store, Stats, or
   Settings view is open in portrait mode.
========================================================== */

function updateHeaderCornerControls(
  viewName = "meat"
) {
  const portraitMenuIsOpen =
    isPortraitMobileLayout() &&
    viewName !== "meat";

  if (menuBackButton) {
    menuBackButton.hidden =
      !portraitMenuIsOpen;
  }

  if (randomizerReturnButton) {
    randomizerReturnButton.hidden =
      portraitMenuIsOpen;
  }
}

/* ==========================================================
   1.2 MOBILE NAVIGATION SELECTION
   ----------------------------------------------------------
   Keeps the bottom navigation highlight synchronized with
   the currently displayed portrait view.
========================================================== */

function setActiveMobileNavigationButton(
  viewName
) {
  mobileNavigationButtons.forEach(
    (button) => {
      button.classList.toggle(
        "active-nav-button",
        button.dataset.mobileTarget ===
          viewName
      );
    }
  );
}

function showSidePanelView(viewName) {
  sidePanel.classList.add(
    "mobile-side-panel-active"
  );

  if (isPortraitMobileLayout()) {
    meatView.style.display = "none";
  } else {
    meatView.style.display = "";
  }

  panelViews.forEach((panel) => {
    const isSelected =
      panel.dataset.view === viewName;

    panel.hidden = !isSelected;

    panel.classList.toggle(
      "active-panel",
      isSelected
    );

    if (isSelected) {
      panel.scrollTop = 0;
    }
  });

  desktopTabs.forEach((tab) => {
    tab.classList.toggle(
      "active-tab",
      tab.dataset.panelTarget ===
        viewName
    );
  });

  updateHeaderCornerControls(viewName);
}

/* ==========================================================
   2. MOBILE MEAT VIEW CONTROLLER
   ----------------------------------------------------------
   Restores the main meat-clicking view in portrait mobile
   layouts without affecting the landscape two-column layout.
========================================================== */

function showMobileMeatView() {
  if (!isPortraitMobileLayout()) {
    meatView.style.display = "";

    sidePanel.classList.add(
      "mobile-side-panel-active"
    );

    updateHeaderCornerControls("meat");

    return;
  }

  sidePanel.classList.remove(
    "mobile-side-panel-active"
  );

  meatView.style.display = "";

  panelViews.forEach((panel) => {
    const isStorePanel =
      panel.dataset.view === "store";

    panel.hidden = !isStorePanel;

    panel.classList.toggle(
      "active-panel",
      isStorePanel
    );
  });

  desktopTabs.forEach((tab) => {
    tab.classList.toggle(
      "active-tab",
      tab.dataset.panelTarget ===
        "store"
    );
  });

  updateHeaderCornerControls("meat");
}

/* ==========================================================
   3. MOBILE NAVIGATION
   ----------------------------------------------------------
   Switches between the Meat, Store, Stats, and Settings
   views.
========================================================== */

mobileNavigationButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        const targetView =
          button.dataset.mobileTarget;

        setActiveMobileNavigationButton(
          targetView
        );

        if (targetView === "meat") {
          showMobileMeatView();
          return;
        }

        showSidePanelView(targetView);
      }
    );
  }
);

/* ==========================================================
   3.1 PORTRAIT MENU BACK BUTTON
   ----------------------------------------------------------
   Returns Store, Stats, or Settings to the MEAT screen
   without leaving MEAT.exe or opening another page.
========================================================== */

if (menuBackButton) {
  menuBackButton.addEventListener(
    "click",
    () => {
      setActiveMobileNavigationButton(
        "meat"
      );

      showMobileMeatView();
    }
  );
}

/* ==========================================================
   4. DESKTOP PANEL NAVIGATION
   ----------------------------------------------------------
   Switches the right-side desktop panel between its tabs.
========================================================== */

desktopTabs.forEach((tab) => {
  tab.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
    }
  );

  tab.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      showSidePanelView(
        tab.dataset.panelTarget
      );
    }
  );
});

/* ==========================================================
   5. RESPONSIVE VIEW RESTORATION
   ----------------------------------------------------------
   Uses a single-view interface only in portrait mobile mode.
   Landscape always keeps the meat and side panel visible.
========================================================== */

function restoreResponsiveLayout() {
  if (!isPortraitMobileLayout()) {
    meatView.style.display = "";

    sidePanel.classList.add(
      "mobile-side-panel-active"
    );

    let activePanel =
      document.querySelector(
        ".panel-view.active-panel"
      );

    if (!activePanel) {
      activePanel =
        document.querySelector(
          '.panel-view[data-view="store"]'
        );

      if (activePanel) {
        activePanel.hidden = false;

        activePanel.classList.add(
          "active-panel"
        );
      }
    }

    if (activePanel) {
      desktopTabs.forEach((tab) => {
        tab.classList.toggle(
          "active-tab",
          tab.dataset.panelTarget ===
            activePanel.dataset.view
        );
      });
    }

    /*
     * Landscape and desktop never display the menu arrow.
     * The Randomizer text control remains available because
     * the MEAT view is still visible in the split layout.
     */
    updateHeaderCornerControls("meat");

    return;
  }

  const activeMobileButton =
    document.querySelector(
      ".mobile-nav-button.active-nav-button[data-mobile-target]"
    );

  const activeView =
    activeMobileButton
      ?.dataset
      .mobileTarget ||
    "meat";

  if (activeView === "meat") {
    showMobileMeatView();
  } else {
    showSidePanelView(activeView);
  }
}

window.addEventListener(
  "resize",
  restoreResponsiveLayout
);

window.addEventListener(
  "orientationchange",
  () => {
    requestAnimationFrame(
      restoreResponsiveLayout
    );
  }
);

restoreResponsiveLayout();
