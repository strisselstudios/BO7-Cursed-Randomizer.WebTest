/* ==========================================================
   1. REPORT SELECTION
========================================================== */

function selectNachtRaidersReport(reportId) {
  const report = getNachtRaidersExpeditionReport(reportId);

  if (!report) return false;

  const wasUnread = report.isRead !== true;

  selectedNachtRaidersReportId = report.reportId;

  if (wasUnread) {
    markNachtRaidersReportRead(report.reportId);
    saveGame();
  }

  renderNachtRaidersFieldRecords();

  return true;
}

/* ==========================================================
   2. ARCHIVE ACCESS
========================================================== */

function openNachtRaidersFieldRecords() {
  if (
    typeof isNachtRaidersWindowOpen !== "function" ||
    !isNachtRaidersWindowOpen()
  ) {
    return false;
  }

  const nachtRaidersState = ensureNachtRaidersFeatureState();

  const finalizationResult = finalizeNachtRaidersPendingReports(
    nachtRaidersState,
    {
      force: true,
      reason: NACHT_RAIDERS_REPORT_REASON_OPERATIVE_ACCESS,
      createdAt: Date.now()
    }
  );

  const reports = getSortedNachtRaidersReports();

  const selectedReport =
    reports.find(
      (report) => report.reportId === selectedNachtRaidersReportId
    ) ||
    reports[0] ||
    null;

  selectedNachtRaidersReportId = selectedReport?.reportId || null;

  let shouldSave = finalizationResult.reportsCreated > 0;

  if (selectedReport?.isRead !== true) {
    markNachtRaidersReportRead(selectedReport.reportId);
    shouldSave = true;
  }

  if (shouldSave) {
    saveGame();
  }

  if (!showNachtRaidersRecordsScreen()) {
    return false;
  }

  renderNachtRaidersFieldRecords();

  return true;
}

function returnFromNachtRaidersFieldRecords() {
  return showNachtRaidersMenuScreen();
}

/* ==========================================================
   3. BUTTON INPUT
========================================================== */

nachtRaidersRecordsButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  openNachtRaidersFieldRecords();
});

nachtRaidersRecordsBackButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  returnFromNachtRaidersFieldRecords();
});

nachtRaidersReportList?.addEventListener("click", (event) => {
  const reportButton = event.target.closest("[data-report-id]");

  if (
    !reportButton ||
    !nachtRaidersReportList.contains(reportButton)
  ) {
    return;
  }

  selectNachtRaidersReport(reportButton.dataset.reportId);
});

/* ==========================================================
   4. FEATURE EVENTS
========================================================== */

document.addEventListener(
  "nacht-raiders:opened",
  updateNachtRaidersRecordsMenuState
);

document.addEventListener(
  "nacht-raiders:menu-returned",
  updateNachtRaidersRecordsMenuState
);

document.addEventListener(
  "nacht-raiders:simulation-completed",
  (event) => {
    if (event.detail?.reportsCreated > 0) {
      updateNachtRaidersRecordsMenuState();
    }

    if (
      nachtRaidersWindow?.dataset.nachtRaidersScreen ===
      NACHT_RAIDERS_SCREEN_RECORDS
    ) {
      renderNachtRaidersFieldRecords();
    }
  }
);

document.addEventListener(
  "nacht-raiders:screen-changed",
  (event) => {
    if (event.detail?.screen === NACHT_RAIDERS_SCREEN_MENU) {
      updateNachtRaidersRecordsMenuState();
      return;
    }

    if (event.detail?.screen !== NACHT_RAIDERS_SCREEN_RECORDS) {
      return;
    }

    renderNachtRaidersFieldRecords();

    window.requestAnimationFrame(() => {
      nachtRaidersRecordsBackButton?.focus({
        preventScroll: true
      });
    });
  }
);

/* ==========================================================
   5. INITIAL DISPLAY
========================================================== */

updateNachtRaidersRecordsMenuState();
