/* ==========================================================
   1. INCIDENT PRESENTATION EVENTS
========================================================== */

function createNachtRaidersIncidentPresentationEvent(record) {
  if (
    !record ||
    record.presentation?.visualize === false
  ) {
    return null;
  }

  return {
    eventKey: `incident:${record.recordId}`,
    type: NACHT_RAIDERS_PRESENTATION_EVENT_INCIDENT,
    occurredAt: Math.max(0, Math.floor(Number(record.occurredAt) || 0)),
    record
  };
}

/* ==========================================================
   2. COMBAT PRESENTATION EVENTS
========================================================== */

function createNachtRaidersCombatPresentationEvent(
  combatResult,
  occurredAt
) {
  if (!combatResult) return null;

  const normalizedOccurredAt = Math.max(
    0,
    Math.floor(Number(occurredAt) || Date.now())
  );

  return {
    eventKey: [
      "combat",
      normalizedOccurredAt,
      combatResult.enemy?.id || "unknown",
      combatResult.cycle,
      combatResult.zoneDepth
    ].join(":"),
    type: NACHT_RAIDERS_PRESENTATION_EVENT_COMBAT,
    occurredAt: normalizedOccurredAt,
    combatResult
  };
}

/* ==========================================================
   3. PRESENTATION EVENT COLLECTION
========================================================== */

function appendNachtRaidersPresentationEvent(
  events,
  presentationEvent,
  maximumEvents = NACHT_RAIDERS_PRESENTATION_SETTINGS.maximumEventsPerSummary
) {
  if (!Array.isArray(events) || !presentationEvent) return false;

  events.push(presentationEvent);

  const normalizedMaximum = Math.max(
    1,
    Math.floor(Number(maximumEvents) || 1)
  );

  const excessEventCount = events.length - normalizedMaximum;

  if (excessEventCount > 0) {
    events.splice(0, excessEventCount);
  }

  return true;
}
