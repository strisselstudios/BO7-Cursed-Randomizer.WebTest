/* ==========================================================
   1. PRODUCER CARD DISPLAY ELEMENTS
   ----------------------------------------------------------
   Adds the tier-description area and inactive INFO control to
   every producer card without requiring every card in the HTML
   file to be rewritten.
========================================================== */

function initializeProducerCardExtras() {
  producerCards.forEach(
    (card) => {
      const information =
        card.querySelector(
          ".producer-information"
        );

      const production =
        information?.querySelector(
          "small"
        );

      const purchaseArea =
        card.querySelector(
          ".producer-purchase"
        );

      if (
        information &&
        production
      ) {
        production.classList.add(
          "producer-production"
        );

        let description =
          information.querySelector(
            ".producer-description"
          );

        if (!description) {
          description =
            document.createElement(
              "em"
            );

          description.className =
            "producer-description";

          information.insertBefore(
            description,
            production
          );
        }
      }

      if (
        purchaseArea &&
        !purchaseArea.querySelector(
          ".producer-info-button"
        )
      ) {
        const infoControl =
          document.createElement(
            "span"
          );

        infoControl.className =
          "producer-info-button";

        infoControl.textContent =
          "INFO";

        infoControl.setAttribute(
          "aria-hidden",
          "true"
        );

        /*
         * INFO is intentionally inactive for now.
         * These listeners prevent it from buying or selling
         * the producer underneath it.
         */
        infoControl.addEventListener(
          "pointerdown",
          (event) => {
            event.preventDefault();
            event.stopPropagation();
          }
        );

        infoControl.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();
          }
        );

        purchaseArea.appendChild(
          infoControl
        );
      }
    }
  );
}

/* ==========================================================
   2. STORE PAGE TABS
   ----------------------------------------------------------
   Switches the Store panel between Meat Mart and Marlton's
   Schematics. The existing outer Store code remains unchanged.
========================================================== */

function showStorePage(
  selectedPage
) {
  storePages.forEach(
    (page) => {
      const isSelected =
        page.dataset.storePage ===
        selectedPage;

      page.hidden =
        !isSelected;
    }
  );

  storePageTabs.forEach(
    (tab) => {
      const isSelected =
        tab.dataset.storePageTarget ===
        selectedPage;

      tab.classList.toggle(
        "active-store-page-tab",
        isSelected
      );

      tab.setAttribute(
        "aria-pressed",
        String(isSelected)
      );
    }
  );

  if (
    storeTransactionControls
  ) {
    storeTransactionControls.hidden =
      selectedPage !==
      "meat-mart";
  }
}

storePageTabs.forEach(
  (tab) => {
    tab.addEventListener(
      "click",
      () => {
        showStorePage(
          tab.dataset
            .storePageTarget
        );
      }
    );
  }
);

/* ==========================================================
   3. TRANSACTION CONTROL DISPLAY
   ----------------------------------------------------------
   Highlights the selected Buy/Sell mode and transaction
   quantity.
========================================================== */

function updateStoreControlDisplay() {
  storeModeButtons.forEach(
    (button) => {
      const isSelected =
        button.dataset.storeMode ===
        selectedStoreTransactionMode;

      button.classList.toggle(
        "active-store-control",
        isSelected
      );

      button.setAttribute(
        "aria-pressed",
        String(isSelected)
      );
    }
  );

  storeQuantityButtons.forEach(
    (button) => {
      const isSelected =
        button.dataset
          .storeQuantity ===
        selectedStoreTransactionQuantity;

      button.classList.toggle(
        "active-store-control",
        isSelected
      );

      button.setAttribute(
        "aria-pressed",
        String(isSelected)
      );
    }
  );
}

/* ==========================================================
   4. TRANSACTION CONTROL INPUT
   ----------------------------------------------------------
   Changes the selected mode or quantity and immediately
   recalculates every price shown in Meat Mart.
========================================================== */

storeModeButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        const requestedMode =
          button.dataset.storeMode;

        if (
          requestedMode !==
            STORE_MODE_BUY &&
          requestedMode !==
            STORE_MODE_SELL
        ) {
          return;
        }

        selectedStoreTransactionMode =
          requestedMode;

        updateStoreControlDisplay();
        updateGameDisplay();
      }
    );
  }
);

storeQuantityButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        const requestedQuantity =
          button.dataset
            .storeQuantity;

        const validQuantities =
          [
            STORE_QUANTITY_ONE,
            STORE_QUANTITY_TEN,
            STORE_QUANTITY_ONE_HUNDRED,
            STORE_QUANTITY_MAX
          ];

        if (
          !validQuantities.includes(
            requestedQuantity
          )
        ) {
          return;
        }

        selectedStoreTransactionQuantity =
          requestedQuantity;

        updateStoreControlDisplay();
        updateGameDisplay();
      }
    );
  }
);

/* ==========================================================
   5. STORE INTERFACE INITIALIZATION
   ----------------------------------------------------------
   Builds the producer-card extras and restores the default
   Meat Mart, Buy, and x1 selections.
========================================================== */

initializeProducerCardExtras();
updateStoreControlDisplay();
showStorePage("meat-mart");
