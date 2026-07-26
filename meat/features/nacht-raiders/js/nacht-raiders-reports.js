/* ==========================================================
   1. FIELD RECORD CLONING
   ----------------------------------------------------------
   Creates independent report snapshots so later incident-data
   changes cannot mutate previously generated reports.
========================================================== */

function cloneNachtRaidersFieldRecord(record) {
  const clonedRecord = {
    ...record
  };

  clonedRecord.rewards =
    record.rewards &&
    typeof record.rewards === "object" &&
    !Array.isArray(record.rewards)
      ? {
          ...record.rewards
        }
      : createEmptyNachtRaidersRewards();

  clonedRecord.presentation =
    record.presentation &&
    typeof record.presentation === "object" &&
    !Array.isArray(record.presentation)
      ? {
          title:
            typeof record.presentation.title === "string"
              ? record.presentation.title
              : "",

          lines:
            Array.isArray(record.presentation.lines)
              ? [...record.presentation.lines]
              : []
        }
      : {
          title: "",
          lines: []
        };

    clonedRecord.tags =
    Array.isArray(record.tags)
      ? [...record.tags]
      : [];

  clonedRecord.combat =
    record.combat &&
    typeof record.combat === "object" &&
    !Array.isArray(record.combat)
      ? {
          ...record.combat
        }
      : null;

  return clonedRecord;
}

/* ==========================================================
   2. REPORT SUMMARY CREATION
========================================================== */

function createNachtRaidersRecordCountMap() {
  return {};
}

function incrementNachtRaidersRecordCount(
  countMap,
  recordKey
) {
  if (
    typeof recordKey !== "string" ||
    !recordKey
  ) {
    return;
  }

  countMap[recordKey] =
    Math.max(
      0,
      Math.floor(
        Number(countMap[recordKey]) || 0
      )
    ) + 1;
}

function summarizeNachtRaidersFieldRecords(
  records
) {
  const rewards =
    createEmptyNachtRaidersRewards();

  const eventTypeCounts =
    createNachtRaidersRecordCountMap();

  const eventIdCounts =
    createNachtRaidersRecordCountMap();

  const zoneIds =
    new Set();

  let startedAt =
    Number.POSITIVE_INFINITY;

  let endedAt = 0;

  let startingCycle =
    Number.POSITIVE_INFINITY;

  let endingCycle = 0;

  let startingDepth =
    Number.POSITIVE_INFINITY;

  let endingDepth = 0;

  for (const record of records) {
    const occurredAt =
      Math.max(
        0,
        Math.floor(
          Number(record.occurredAt) || 0
        )
      );

    const cycle =
      Math.max(
        0,
        Math.floor(
          Number(record.cycle) || 0
        )
      );

    const zoneDepth =
      Math.max(
        0,
        Math.floor(
          Number(record.zoneDepth) || 0
        )
      );

    startedAt =
      Math.min(
        startedAt,
        occurredAt
      );

    endedAt =
      Math.max(
        endedAt,
        occurredAt
      );

    startingCycle =
      Math.min(
        startingCycle,
        cycle
      );

    endingCycle =
      Math.max(
        endingCycle,
        cycle
      );

    startingDepth =
      Math.min(
        startingDepth,
        zoneDepth
      );

    endingDepth =
      Math.max(
        endingDepth,
        zoneDepth
      );

    if (
      typeof record.zoneId === "string" &&
      record.zoneId
    ) {
      zoneIds.add(record.zoneId);
    }

    incrementNachtRaidersRecordCount(
      eventTypeCounts,
      record.eventType
    );

    incrementNachtRaidersRecordCount(
      eventIdCounts,
      record.eventId
    );

    for (
      const rewardKey of
      NACHT_RAIDERS_REWARD_KEYS
    ) {
      rewards[rewardKey] +=
        Math.max(
          0,
          Math.floor(
            Number(
              record.rewards?.[rewardKey]
            ) || 0
          )
        );
    }
  }

  return {
    entryCount:
      records.length,

    startedAt:
      Number.isFinite(startedAt)
        ? startedAt
        : 0,

    endedAt,

    startingCycle:
      Number.isFinite(startingCycle)
        ? startingCycle
        : 0,

    endingCycle,

    startingDepth:
      Number.isFinite(startingDepth)
        ? startingDepth
        : 0,

    endingDepth,

    zoneIds:
      [...zoneIds],

    rewards,
    eventTypeCounts,
    eventIdCounts
  };
}

/* ==========================================================
   3. REPORT IDENTITY
========================================================== */

function createNachtRaidersReportFilename(
  reportSequence
) {
  const formattedSequence =
    String(
      Math.max(
        0,
        Math.floor(
          Number(reportSequence) || 0
        )
      )
    ).padStart(
      NACHT_RAIDERS_REPORT_SETTINGS
        .sequencePadding,
      "0"
    );

  return (
    NACHT_RAIDERS_REPORT_SETTINGS
      .filenamePrefix +
    formattedSequence +
    NACHT_RAIDERS_REPORT_SETTINGS
      .filenameExtension
  );
}

function createNachtRaidersReportId(
  reportSequence
) {
  return (
    "NR-REPORT-" +
    String(
      Math.max(
        0,
        Math.floor(
          Number(reportSequence) || 0
        )
      )
    ).padStart(
      NACHT_RAIDERS_REPORT_SETTINGS
        .sequencePadding,
      "0"
    )
  );
}

/* ==========================================================
   4. REPORT CREATION
========================================================== */

function createNachtRaidersExpeditionReport(
  nachtRaidersState,
  records,
  options = {}
) {
  const clonedRecords =
    records.map(
      cloneNachtRaidersFieldRecord
    );

  const summary =
    summarizeNachtRaidersFieldRecords(
      clonedRecords
    );

  nachtRaidersState.fieldRecords
    .reportSequence += 1;

  const reportSequence =
    nachtRaidersState.fieldRecords
      .reportSequence;

  const requestedCreatedAt =
    Math.max(
      0,
      Math.floor(
        Number(options.createdAt) ||
        Date.now()
      )
    );

  const createdAt =
    Math.max(
      requestedCreatedAt,
      summary.endedAt
    );

  const reason =
    typeof options.reason === "string" &&
    options.reason
      ? options.reason
      : NACHT_RAIDERS_REPORT_REASON_AUTOMATIC_SEGMENT;

  return {
    reportId:
      createNachtRaidersReportId(
        reportSequence
      ),

    reportSequence,

    filename:
      createNachtRaidersReportFilename(
        reportSequence
      ),

    createdAt,
    reason,
    isRead: false,

    cycle: {
      starting:
        summary.startingCycle,

      ending:
        summary.endingCycle
    },

    depth: {
      starting:
        summary.startingDepth,

      ending:
        summary.endingDepth
    },

    zoneIds:
      summary.zoneIds,

    entryCount:
      summary.entryCount,

    rewards: {
      ...summary.rewards
    },

    eventTypeCounts: {
      ...summary.eventTypeCounts
    },

    eventIdCounts: {
      ...summary.eventIdCounts
    },

    startedAt:
      summary.startedAt,

    endedAt:
      summary.endedAt,

    entries:
      clonedRecords
  };
}

/* ==========================================================
   5. REPORT ARCHIVE
========================================================== */

function archiveNachtRaidersExpeditionReport(
  nachtRaidersState,
  report
) {
  const reports =
    nachtRaidersState.fieldRecords.reports;

  reports.push(report);

  const excessReportCount =
    reports.length -
    NACHT_RAIDERS_REPORT_ARCHIVE_LIMIT;

  if (excessReportCount > 0) {
    reports.splice(
      0,
      excessReportCount
    );
  }

  return report;
}

/* ==========================================================
   6. PENDING RECORD FINALIZATION
   ----------------------------------------------------------
   Non-forced finalization only creates complete report chunks.
   Forced finalization also archives the remaining partial chunk.
========================================================== */

function finalizeNachtRaidersPendingReports(
  nachtRaidersState,
  options = {}
) {
  const pendingEntries =
    nachtRaidersState.fieldRecords
      .pendingEntries;

  const force =
    options.force === true;

  const maximumEntries =
    Math.max(
      1,
      Math.floor(
        Number(
          NACHT_RAIDERS_REPORT_SETTINGS
            .maximumEntriesPerReport
        ) || 1
      )
    );

  const result = {
    reportsCreated: 0,
    entriesArchived: 0,
    reportIds: []
  };

  while (
    pendingEntries.length >= maximumEntries ||
    (
      force &&
      pendingEntries.length > 0
    )
  ) {
    const entryCount =
      Math.min(
        maximumEntries,
        pendingEntries.length
      );

    const reportEntries =
      pendingEntries.splice(
        0,
        entryCount
      );

    const report =
      createNachtRaidersExpeditionReport(
        nachtRaidersState,
        reportEntries,
        options
      );

    archiveNachtRaidersExpeditionReport(
      nachtRaidersState,
      report
    );

    result.reportsCreated += 1;
    result.entriesArchived +=
      reportEntries.length;

    result.reportIds.push(
      report.reportId
    );
  }

  return result;
}

/* ==========================================================
   7. REPORT LOOKUP
========================================================== */

function getNachtRaidersExpeditionReport(
  reportId
) {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  return (
    nachtRaidersState.fieldRecords.reports.find(
      (report) =>
        report.reportId === reportId
    ) || null
  );
}

function getNachtRaidersExpeditionReports() {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  return [
    ...nachtRaidersState.fieldRecords.reports
  ];
}

function getUnreadNachtRaidersReportCount() {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  return nachtRaidersState.fieldRecords.reports.reduce(
    (
      unreadCount,
      report
    ) =>
      unreadCount +
      (
        report.isRead === true
          ? 0
          : 1
      ),
    0
  );
}

function markNachtRaidersReportRead(
  reportId
) {
  const report =
    getNachtRaidersExpeditionReport(
      reportId
    );

  if (!report) {
    return false;
  }

  report.isRead = true;

  return true;
}
