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
      tab.dataset.panelTarget === viewName
    );
  });
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
      tab.dataset.panelTarget === "store"
    );
  });
}


/* ==========================================================
   3. MOBILE NAVIGATION
   ----------------------------------------------------------
   Switches between the Meat, Store, Stats, and Settings views.
========================================================== */

mobileNavigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetView = button.dataset.mobileTarget;

    mobileNavigationButtons.forEach((navButton) => {
      navButton.classList.remove("active-nav-button");
    });

    button.classList.add("active-nav-button");

    if (targetView === "meat") {
      showMobileMeatView();
      return;
    }

    showSidePanelView(targetView);
  });
});


/* ==========================================================
   4. DESKTOP PANEL NAVIGATION
   ----------------------------------------------------------
   Switches the right-side desktop panel between its tabs.
========================================================== */

desktopTabs.forEach((tab) => {
  tab.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  tab.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    showSidePanelView(tab.dataset.panelTarget);
  });
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
      activePanel = document.querySelector(
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

    return;
  }

  const activeMobileButton =
    document.querySelector(
      ".mobile-nav-button.active-nav-button[data-mobile-target]"
    );

  const activeView =
    activeMobileButton?.dataset.mobileTarget ||
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
