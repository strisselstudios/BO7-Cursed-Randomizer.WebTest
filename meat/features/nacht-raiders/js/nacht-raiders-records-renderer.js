/* ==========================================================
   1. RECORD SELECTION STATE
========================================================== */

let selectedNachtRaidersReportId = null;

/* ==========================================================
   2. MENU RECORD STATUS
========================================================== */

function updateNachtRaidersRecordsMenuState() {
  if (!nachtRaidersRecordsButton || !nachtRaidersRecordsUnreadBadge) return;

  const nachtRaidersState = ensureNachtRaidersFeatureState();
  const reportCount = nachtRaidersState.fieldRecords.reports.length;
  const unreadCount = getUnreadNachtRaidersReportCount();

  nachtRaidersRecordsUnreadBadge.textContent = String(unreadCount);
  nachtRaidersRecordsUnreadBadge.hidden = unreadCount <= 0;

  nachtRaidersRecordsButton.setAttribute(
    "aria-label",
    unreadCount > 0
      ? `Open Field Records. ${unreadCount} unread.`
      : `Open Field Records. ${reportCount} archived.`
  );

  if (!nachtRaidersMenuStatus) return;

  if (!nachtRaidersState.hasStarted) {
    nachtRaidersMenuStatus.textContent = "NO FIELD RECORD DETECTED";
  } else if (unreadCount > 0) {
    nachtRaidersMenuStatus.textContent =
      `${unreadCount} UNREAD FIELD RECORD${unreadCount === 1 ? "" : "S"}`;
  } else if (reportCount > 0) {
    nachtRaidersMenuStatus.textContent =
      `${reportCount} FIELD RECORD${reportCount === 1 ? "" : "S"} ARCHIVED`;
  } else {
    nachtRaidersMenuStatus.textContent = "EXPEDITION ACTIVE // NO ARCHIVED RECORDS";
  }
}

/* ==========================================================
   3. REPORT LIST
========================================================== */

function getSortedNachtRaidersReports() {
  return getNachtRaidersExpeditionReports().sort(
    (firstReport, secondReport) =>
      secondReport.reportSequence - firstReport.reportSequence
  );
}

function renderNachtRaidersReportList(reports) {
  if (!nachtRaidersReportList || !nachtRaidersReportCount) return;

  nachtRaidersReportList.replaceChildren();
  nachtRaidersReportCount.textContent = String(reports.length);

  if (reports.length === 0) {
    nachtRaidersReportList.append(
      createNachtRaidersRecordElement(
        "p",
        "nacht-raiders-record-list-empty",
        "NO EXPEDITION LOGS FOUND"
      )
    );

    return;
  }

  for (const report of reports) {
    const button = document.createElement("button");
    const filenameRow = createNachtRaidersRecordElement(
      "span",
      "nacht-raiders-record-list-filename-row"
    );

    button.type = "button";
    button.className = "nacht-raiders-record-list-button";
    button.dataset.reportId = report.reportId;
    button.setAttribute(
      "aria-pressed",
      report.reportId === selectedNachtRaidersReportId ? "true" : "false"
    );

    if (report.reportId === selectedNachtRaidersReportId) {
      button.classList.add("is-selected");
    }

    if (report.isRead !== true) {
      button.classList.add("is-unread");
    }

    filenameRow.append(
      createNachtRaidersRecordElement(
        "strong",
        "nacht-raiders-record-list-filename",
        report.filename
      )
    );

    if (report.isRead !== true) {
      filenameRow.append(
        createNachtRaidersRecordElement(
          "span",
          "nacht-raiders-record-list-unread",
          "NEW"
        )
      );
    }

    button.append(
      filenameRow,
      createNachtRaidersRecordElement(
        "span",
        "nacht-raiders-record-list-date",
        formatNachtRaidersReportDate(report.createdAt)
      ),
      createNachtRaidersRecordElement(
        "span",
        "nacht-raiders-record-list-meta",
        `${report.entryCount} ENTR${report.entryCount === 1 ? "Y" : "IES"} // DEPTH ${formatNachtRaidersReportRange(
          report.depth?.starting,
          report.depth?.ending
        )}`
      )
    );

    nachtRaidersReportList.append(button);
  }
}

/* ==========================================================
   4. REPORT REWARDS
========================================================== */

function renderNachtRaidersReportRewards(report) {
  if (!nachtRaidersReportRewards) return;

  nachtRaidersReportRewards.replaceChildren();

  const rewards = getNachtRaidersPositiveRewards(report.rewards);

  if (rewards.length === 0) {
    nachtRaidersReportRewards.append(
      createNachtRaidersRecordElement(
        "span",
        "nacht-raiders-report-reward-empty",
        "NO RECOVERABLE ASSETS"
      )
    );

    return;
  }

  for (const reward of rewards) {
    const rewardElement = createNachtRaidersRecordElement(
      "span",
      "nacht-raiders-report-reward"
    );

    rewardElement.append(
      createNachtRaidersRecordElement(
        "strong",
        "nacht-raiders-report-reward-label",
        reward.label
      ),
      createNachtRaidersRecordElement(
        "span",
        "nacht-raiders-report-reward-value",
        `+${formatNachtRaidersReportAmount(reward.amount)}`
      )
    );

    nachtRaidersReportRewards.append(rewardElement);
  }
}

/* ==========================================================
   5. REPORT ENTRIES
========================================================== */

function renderNachtRaidersReportEntries(report) {
  if (!nachtRaidersReportEntries) return;

  nachtRaidersReportEntries.replaceChildren();

  for (const record of report.entries || []) {
    const incidentDefinition = getNachtRaidersIncidentDefinition(record.eventId);
    const presentation =
      record.presentation &&
      typeof record.presentation === "object" &&
      !Array.isArray(record.presentation)
        ? record.presentation
        : {};

    const title =
      typeof presentation.title === "string" && presentation.title
        ? presentation.title
        : incidentDefinition?.title ||
          String(record.eventId || "UNKNOWN EVENT").toUpperCase();

    const lines =
      Array.isArray(presentation.lines) && presentation.lines.length > 0
        ? presentation.lines
        : incidentDefinition?.lines || ["ARCHIVE ENTRY CORRUPTED."];

    const entry = createNachtRaidersRecordElement(
      "article",
      "nacht-raiders-report-entry"
    );

    const entryHeader = createNachtRaidersRecordElement(
      "header",
      "nacht-raiders-report-entry-header"
    );

    entryHeader.append(
      createNachtRaidersRecordElement(
        "span",
        "nacht-raiders-report-entry-time",
        formatNachtRaidersReportDate(record.occurredAt)
      ),
      createNachtRaidersRecordElement(
        "span",
        "nacht-raiders-report-entry-location",
        `${String(record.zoneId || "UNKNOWN").toUpperCase()} // DEPTH ${Math.max(
          0,
          Math.floor(Number(record.zoneDepth) || 0)
        )}`
      )
    );

    entry.append(
      entryHeader,
      createNachtRaidersRecordElement(
        "h4",
        "nacht-raiders-report-entry-title",
        title
      )
    );

   for (const line of lines) {
      const lineClassName =
        typeof line === "string" &&
        line.trim().startsWith(">>")
          ? "nacht-raiders-report-entry-output"
          : "nacht-raiders-report-entry-line";

      entry.append(
        createNachtRaidersRecordElement(
          "p",
          lineClassName,
          line
        )
      );
    }
    for (const reward of getNachtRaidersPositiveRewards(record.rewards)) {
      entry.append(
        createNachtRaidersRecordElement(
          "p",
          "nacht-raiders-report-entry-output",
          `>> ${reward.label}: +${formatNachtRaidersReportAmount(reward.amount)}`
        )
      );
    }

    nachtRaidersReportEntries.append(entry);
  }
}

/* ==========================================================
   6. COMPLETE REPORT RENDERING
========================================================== */

function renderNachtRaidersReportDetail(report) {
  if (!nachtRaidersReportEmpty || !nachtRaidersReportContent) return;

  const hasReport = Boolean(report);

  nachtRaidersReportEmpty.hidden = hasReport;
  nachtRaidersReportContent.hidden = !hasReport;

  if (!report) return;

  nachtRaidersReportFilename.textContent = report.filename;
  nachtRaidersReportCreatedAt.textContent = formatNachtRaidersReportDate(report.createdAt);

  nachtRaidersReportCycle.textContent = formatNachtRaidersReportRange(
    report.cycle?.starting,
    report.cycle?.ending
  );

  nachtRaidersReportDepth.textContent = formatNachtRaidersReportRange(
    report.depth?.starting,
    report.depth?.ending
  );

  nachtRaidersReportEntryCount.textContent =
    formatNachtRaidersReportAmount(report.entryCount);

  nachtRaidersReportZones.textContent =
    Array.isArray(report.zoneIds) && report.zoneIds.length > 0
      ? report.zoneIds.join(", ").toUpperCase()
      : "UNKNOWN";

  renderNachtRaidersReportRewards(report);
  renderNachtRaidersReportEntries(report);
}

function renderNachtRaidersFieldRecords() {
  const reports = getSortedNachtRaidersReports();

  if (
    !reports.some(
      (report) => report.reportId === selectedNachtRaidersReportId
    )
  ) {
    selectedNachtRaidersReportId = reports[0]?.reportId || null;
  }

  const selectedReport =
    reports.find(
      (report) => report.reportId === selectedNachtRaidersReportId
    ) || null;

  if (nachtRaidersRecordsSummary) {
    nachtRaidersRecordsSummary.textContent =
      reports.length > 0
        ? `${reports.length} ARCHIVED FILE${reports.length === 1 ? "" : "S"}`
        : "ARCHIVE EMPTY";
  }

  renderNachtRaidersReportList(reports);
  renderNachtRaidersReportDetail(selectedReport);
  updateNachtRaidersRecordsMenuState();
}
