/* ==========================================================
   1. PRODUCER CARD DISPLAY ELEMENTS
   ----------------------------------------------------------
   Adds the tier-description area and interactive INFO control
   to every producer card without requiring every card in the
   HTML file to be rewritten.
========================================================== */

function initializeProducerCardExtras() {
  producerCards.forEach(
    (card) => {
      const producerKey =
        card.dataset.producer;

      const producer =
        producerData[
          producerKey
        ];

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

        const producerIsRevealed =
          typeof isProducerRevealed ===
            "function" &&
          isProducerRevealed(
            producerKey
          );

        infoControl.className =
          "producer-info-button";

        infoControl.textContent =
          "INFO";

        /*
         * A real button cannot be nested inside the producer
         * card because the card itself is already a button.
         */
        infoControl.setAttribute(
          "role",
          "button"
        );

        infoControl.setAttribute(
          "tabindex",
          producerIsRevealed
            ? "0"
            : "-1"
        );

        infoControl.setAttribute(
          "aria-label",
          `View ${
            producer?.name ??
            "producer"
          } harvest dossier`
        );

        if (!producerIsRevealed) {
          infoControl.setAttribute(
            "aria-hidden",
            "true"
          );
        }

        /*
         * Prevent pointer input from reaching the producer card
         * transaction listener.
         */
        infoControl.addEventListener(
          "pointerdown",
          (event) => {
            event.stopPropagation();
          }
        );

        infoControl.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            openProducerInfo(
              producerKey
            );
          }
        );

        infoControl.addEventListener(
          "keydown",
          (event) => {
            if (
              event.key !== "Enter" &&
              event.key !== " "
            ) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();

            openProducerInfo(
              producerKey
            );
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
