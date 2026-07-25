/* ==========================================================
   6. PRODUCER INFO DIALOG INPUT
   ----------------------------------------------------------
   Closes the dossier through its button, backdrop, or Escape.
   Side controls move through known producers.
========================================================== */

   producerInfoPurchaseButton
  ?.addEventListener(
    "click",
    () => {
      if (
        !openProducerInfoKey ||
        producerInfoTransitionInProgress ||
        producerInfoViewportRecoveryInProgress
      ) {
        return;
      }

      const producerKey =
        openProducerInfoKey;

      transactProducer(
        producerKey,
        {
          mode: STORE_MODE_BUY,

          feedbackTarget:
            producerInfoPurchaseButton
        }
      );

      /*
       * Refresh immediately so ownership, cost, output,
       * producer tier, name, and icon update without waiting
       * for the 250ms live-refresh interval.
       */
      updateProducerInfoDialog();
    }
  );
   
producerInfoPreviousButton
  ?.addEventListener(
    "click",
    () => {
      showAdjacentProducerInfo(-1);
    }
  );

producerInfoNextButton
  ?.addEventListener(
    "click",
    () => {
      showAdjacentProducerInfo(1);
    }
  );

producerInfoCloseButton
  ?.addEventListener(
    "click",
    closeProducerInfo
  );

producerInfoDialog
  ?.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();

      closeProducerInfo();
    }
  );

producerInfoDialog
  ?.addEventListener(
    "close",
    () => {
      /*
       * The viewport recovery system deliberately closes and
       * reopens the dialog. Ignore exactly that one close
       * event without using an unreliable timed flag.
       */
      if (
        producerInfoIgnoreNextCloseEvent
      ) {
        producerInfoIgnoreNextCloseEvent =
          false;

        return;
      }

      cancelProducerInfoTransition();
      cancelProducerInfoViewportRefresh();

      producerInfoViewportRecoveryInProgress =
        false;

      openProducerInfoKey =
        null;

      updateProducerInfoNavigationButtons();
    }
  );

producerInfoDialog
  ?.addEventListener(
    "click",
    (event) => {
      if (
        event.target !==
        producerInfoDialog
      ) {
        return;
      }

      const dialogBounds =
        producerInfoDialog
          .getBoundingClientRect();

      const clickedInsideDialog =
        event.clientX >=
          dialogBounds.left &&
        event.clientX <=
          dialogBounds.right &&
        event.clientY >=
          dialogBounds.top &&
        event.clientY <=
          dialogBounds.bottom;

      if (!clickedInsideDialog) {
        closeProducerInfo();
      }
    }
  );

/* ==========================================================
   7. PRODUCER INFO LIVE REFRESH
   ----------------------------------------------------------
   Keeps ownership, production, tier, output share, lifetime
   yield, and navigation availability current while open.
========================================================== */

window.setInterval(
  () => {
    if (
      producerInfoDialog?.open &&
      openProducerInfoKey &&
      !producerInfoTransitionInProgress
    ) {
      updateProducerInfoDialog();
    }
  },
  PRODUCER_INFO_REFRESH_RATE
);
