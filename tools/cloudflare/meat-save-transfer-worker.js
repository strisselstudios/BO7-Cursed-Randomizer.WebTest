/* ==========================================================
   1. WORKER CONFIGURATION
   ----------------------------------------------------------
   Defines the transfer API version, storage table, accepted
   origins, transfer lifetime, payload limits, and code format.
========================================================== */

const TRANSFER_TABLE = "save_transfers_v2";
const TRANSFER_VERSION = 2;
const TRANSFER_PAYLOAD_MAGIC = "MEATC2.";
const CURRENT_SAVE_INTEGRITY_VERSION = 1;

const TRANSFER_CODE_LENGTH = 7;
const TRANSFER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TRANSFER_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7}$/;
const TRANSFER_TTL_MS = 10 * 60 * 1000;

const MAX_TRANSFER_REQUEST_BYTES = 1700000;
const MAX_TRANSFER_COMPRESSED_BYTES = 1200000;
const MAX_TRANSFER_DECOMPRESSED_BYTES = 5 * 1024 * 1024;
const MAX_TRANSFER_SUMMARY_BYTES = 4000;
const MAX_SAVE_OBJECT_DEPTH = 40;
const MAX_SAVE_OBJECT_ENTRIES = 50000;
const MAX_SAVE_STRING_LENGTH = 1000000;
const SAVE_FUTURE_TIMESTAMP_TOLERANCE_MS = 7 * 24 * 60 * 60 * 1000;

const ALLOWED_ORIGINS = new Set([
  "https://relicrandomizer.com",
  "https://www.relicrandomizer.com",
  "https://strisselstudios.github.io"
]);

const DANGEROUS_PROPERTY_NAMES = new Set([
  "__proto__",
  "prototype",
  "constructor"
]);

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder("utf-8", { fatal: true });

/* ==========================================================
   2. PUBLIC ERROR TYPE
   ----------------------------------------------------------
   Separates safe client-facing failures from internal Worker,
   database, and cryptographic failures.
========================================================== */

class PublicTransferError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PublicTransferError";
    this.status = status;
  }
}

/* ==========================================================
   3. WORKER ENTRY POINT
   ----------------------------------------------------------
   Handles routing, CORS, binding checks, cleanup, and failures.
========================================================== */

export default {
  async fetch(request, env) {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      console.error("MEAT.exe save-transfer Worker failure:", error);

      const status = error instanceof PublicTransferError
        ? error.status
        : 500;

      const message = error instanceof PublicTransferError
        ? error.message
        : "The save-transfer server encountered an internal error.";

      return createJsonResponse(request, { error: message }, status);
    }
  }
};

/* ==========================================================
   4. HTTP, CORS, AND ROUTING
========================================================== */

async function routeRequest(request, env) {
  if (request.method === "OPTIONS") {
    return handleCorsPreflight(request);
  }

  assertAllowedOrigin(request);

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "GET" && (pathname === "/" || pathname === "/health")) {
    return createJsonResponse(
      request,
      {
        status: "ok",
        service: "MEAT.exe Save Transfer",
        transferVersion: TRANSFER_VERSION,
        databaseBound: Boolean(env.DB),
        secretConfigured:
          typeof env.TRANSFER_MASTER_SECRET === "string" &&
          env.TRANSFER_MASTER_SECRET.length >= 32
      },
      200
    );
  }

  requireWorkerBindings(env);

  if (request.method === "POST" && pathname === "/transfer") {
    return createTransfer(request, env);
  }

  const metadataMatch = pathname.match(
    /^\/transfer\/([ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7})\/meta$/
  );

  if (request.method === "GET" && metadataMatch) {
    return previewTransfer(request, env, metadataMatch[1]);
  }

  const claimMatch = pathname.match(
    /^\/transfer\/([ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7})\/claim$/
  );

  if (request.method === "POST" && claimMatch) {
    return claimTransfer(request, env, claimMatch[1]);
  }

  throw new PublicTransferError(
    "The requested save-transfer endpoint does not exist.",
    404
  );
}

function createCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  return headers;
}

function createJsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: createCorsHeaders(request)
  });
}

function assertAllowedOrigin(request) {
  const origin = request.headers.get("Origin") || "";

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    throw new PublicTransferError(
      "This origin is not allowed to use save transfers.",
      403
    );
  }
}

function handleCorsPreflight(request) {
  const origin = request.headers.get("Origin") || "";

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, { status: 403 });
  }

  const requestedMethod = request.headers.get(
    "Access-Control-Request-Method"
  );

  if (requestedMethod && !["GET", "POST"].includes(requestedMethod)) {
    return new Response(null, {
      status: 405,
      headers: createCorsHeaders(request)
    });
  }

  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(request)
  });
}

function requireWorkerBindings(env) {
  if (!env.DB) {
    throw new PublicTransferError(
      "The save-transfer database binding is missing.",
      500
    );
  }

  if (
    typeof env.TRANSFER_MASTER_SECRET !== "string" ||
    env.TRANSFER_MASTER_SECRET.length < 32
  ) {
    throw new PublicTransferError(
      "The save-transfer encryption secret is missing.",
      500
    );
  }
}

/* ==========================================================
   5. REQUEST BODY READING
   ----------------------------------------------------------
   Rejects oversized, empty, malformed, or non-JSON requests.
========================================================== */

async function readJsonRequest(request) {
  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new PublicTransferError(
      "The transfer request must contain JSON.",
      415
    );
  }

  const declaredLength = Number(
    request.headers.get("Content-Length") || 0
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_TRANSFER_REQUEST_BYTES
  ) {
    throw new PublicTransferError(
      "The transfer request is too large.",
      413
    );
  }

  const bodyText = await request.text();
  const actualLength = TEXT_ENCODER.encode(bodyText).byteLength;

  if (actualLength <= 0) {
    throw new PublicTransferError("The transfer request is empty.");
  }

  if (actualLength > MAX_TRANSFER_REQUEST_BYTES) {
    throw new PublicTransferError(
      "The transfer request is too large.",
      413
    );
  }

  try {
    return JSON.parse(bodyText);
  } catch (error) {
    throw new PublicTransferError(
      "The transfer request contains invalid JSON."
    );
  }
}

/* ==========================================================
   6. GENERAL VALIDATION HELPERS
========================================================== */

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requirePlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new PublicTransferError(`${label} is invalid.`);
  }
}

function requireBoolean(value, label) {
  if (typeof value !== "boolean") {
    throw new PublicTransferError(`${label} is invalid.`);
  }
}

function requireString(value, label, maximumLength = 160) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maximumLength
  ) {
    throw new PublicTransferError(`${label} is invalid.`);
  }
}

function requireFiniteNumber(value, label, options = {}) {
  const {
    integer = false,
    minimum = 0,
    maximum = Number.MAX_VALUE
  } = options;

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum ||
    (integer && !Number.isInteger(value))
  ) {
    throw new PublicTransferError(`${label} is invalid.`);
  }
}

function rejectUnknownKeys(object, allowedKeys, label) {
  requirePlainObject(object, label);
  const allowedKeySet = new Set(allowedKeys);

  Object.keys(object).forEach((key) => {
    if (!allowedKeySet.has(key)) {
      throw new PublicTransferError(
        `${label} contains an unsupported property: ${key}`
      );
    }
  });
}

function validateSafeJson(
  value,
  path = "saveData",
  depth = 0,
  tracker = { entries: 0 }
) {
  if (depth > MAX_SAVE_OBJECT_DEPTH) {
    throw new PublicTransferError(
      "The transferred save is nested too deeply."
    );
  }

  if (typeof value === "string") {
    if (value.length > MAX_SAVE_STRING_LENGTH) {
      throw new PublicTransferError(
        `${path} contains an oversized text value.`
      );
    }

    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry])
    : Object.entries(value);

  tracker.entries += entries.length;

  if (tracker.entries > MAX_SAVE_OBJECT_ENTRIES) {
    throw new PublicTransferError(
      "The transferred save contains too many entries."
    );
  }

  entries.forEach(([propertyName, propertyValue]) => {
    if (DANGEROUS_PROPERTY_NAMES.has(propertyName)) {
      throw new PublicTransferError(
        `The transferred save contains a forbidden property: ${propertyName}`
      );
    }

    validateSafeJson(
      propertyValue,
      `${path}.${propertyName}`,
      depth + 1,
      tracker
    );
  });
}

function isMeaningfullyGreater(value, comparisonValue) {
  const tolerance = Math.max(
    0.000001,
    Math.abs(comparisonValue) * 1e-12
  );

  return value > comparisonValue + tolerance;
}

/* ==========================================================
   7. BASE64URL AND BOUNDED STREAM HELPERS
========================================================== */

function encodeBytesAsBase64Url(bytes) {
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += 32768) {
    binary += String.fromCharCode(
      ...bytes.subarray(
        offset,
        Math.min(offset + 32768, bytes.length)
      )
    );
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value, label) {
  if (
    typeof value !== "string" ||
    !value ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new PublicTransferError(`${label} is invalid.`);
  }

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );

  let binary;

  try {
    binary = atob(paddedBase64);
  } catch (error) {
    throw new PublicTransferError(`${label} is invalid.`);
  }

  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function readBoundedByteStream(readableStream, maximumBytes) {
  const reader = readableStream.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maximumBytes) {
        throw new PublicTransferError(
          "The transferred save expands beyond the supported size.",
          413
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combinedBytes = new Uint8Array(totalBytes);
  let writeOffset = 0;

  chunks.forEach((chunk) => {
    combinedBytes.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  });

  return combinedBytes;
}

/* ==========================================================
   8. COMPRESSED TRANSFER PAYLOAD DECODING
   ----------------------------------------------------------
   Decodes the browser's MEATC2 payload, enforces compressed and
   expanded size limits, and parses the recovered export package.
========================================================== */

async function decodeTransferPayload(payload) {
  if (
    typeof payload !== "string" ||
    !payload.startsWith(TRANSFER_PAYLOAD_MAGIC)
  ) {
    throw new PublicTransferError(
      "The compressed transfer payload is invalid."
    );
  }

  const compressedBytes = decodeBase64Url(
    payload.slice(TRANSFER_PAYLOAD_MAGIC.length),
    "The compressed transfer payload"
  );

  if (
    compressedBytes.byteLength <= 0 ||
    compressedBytes.byteLength > MAX_TRANSFER_COMPRESSED_BYTES
  ) {
    throw new PublicTransferError(
      "The compressed save is too large to transfer.",
      413
    );
  }

  let decompressedBytes;

  try {
    const decompressedStream = new Blob([compressedBytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));

    decompressedBytes = await readBoundedByteStream(
      decompressedStream,
      MAX_TRANSFER_DECOMPRESSED_BYTES
    );
  } catch (error) {
    if (error instanceof PublicTransferError) {
      throw error;
    }

    throw new PublicTransferError(
      "The compressed transfer payload could not be decompressed."
    );
  }

  let exportPackage;

  try {
    exportPackage = JSON.parse(TEXT_DECODER.decode(decompressedBytes));
  } catch (error) {
    throw new PublicTransferError(
      "The compressed transfer payload is malformed."
    );
  }

  return {
    compressedBytes,
    exportPackage
  };
}

/* ==========================================================
   9. SERVER TRUST VALIDATION
   ----------------------------------------------------------
   Rejects modified saves and a bounded set of contradictory
   progression states before a trusted transfer is created.
========================================================== */

function validateTrustedSavePackage(exportPackage, currentTime = Date.now()) {
  requirePlainObject(
    exportPackage,
    "The transferred export package"
  );

  validateSafeJson(exportPackage, "exportPackage");

  rejectUnknownKeys(
    exportPackage,
    [
      "game",
      "exportVersion",
      "saveIntegrityVersion",
      "exportedAt",
      "saveData"
    ],
    "The transferred export package"
  );

  if (
    exportPackage.game !== "MEAT.exe" ||
    exportPackage.exportVersion !== 2 ||
    exportPackage.saveIntegrityVersion !== CURRENT_SAVE_INTEGRITY_VERSION
  ) {
    throw new PublicTransferError(
      "The transferred export format is unsupported."
    );
  }

  requireFiniteNumber(
    exportPackage.exportedAt,
    "The export timestamp",
    {
      integer: true,
      maximum: Number.MAX_SAFE_INTEGER
    }
  );

  const saveState = exportPackage.saveData;

  requirePlainObject(
    saveState,
    "The transferred save data"
  );

  requireFiniteNumber(
    saveState.saveVersion,
    "The transferred save version",
    {
      integer: true,
      minimum: 1,
      maximum: Number.MAX_SAFE_INTEGER
    }
  );

  if (
    saveState.saveIntegrityVersion !== CURRENT_SAVE_INTEGRITY_VERSION
  ) {
    throw new PublicTransferError(
      "The transferred save integrity version is unsupported."
    );
  }

  requireBoolean(
    saveState.modifiedSave,
    "The transferred modified-save state"
  );

  if (saveState.modifiedSave !== false) {
    throw new PublicTransferError(
      "Modified saves cannot create trusted save transfers.",
      403
    );
  }

  if (
    !Array.isArray(saveState.modifiedSaveReasons) ||
    saveState.modifiedSaveReasons.length !== 0
  ) {
    throw new PublicTransferError(
      "The transferred save contains modified-save records.",
      403
    );
  }

  requireFiniteNumber(saveState.meat, "Current MEAT");
  requireFiniteNumber(saveState.totalMeat, "Lifetime MEAT");

  requireFiniteNumber(
    saveState.totalClicks,
    "Total clicks",
    {
      integer: true,
      maximum: Number.MAX_SAFE_INTEGER
    }
  );

  requireFiniteNumber(
    saveState.runStartedAt,
    "The run-start timestamp",
    {
      integer: true,
      maximum: Number.MAX_SAFE_INTEGER
    }
  );

  requireFiniteNumber(
    saveState.lastSavedAt,
    "The last-save timestamp",
    {
      integer: true,
      maximum: Number.MAX_SAFE_INTEGER
    }
  );

  if (isMeaningfullyGreater(saveState.meat, saveState.totalMeat)) {
    throw new PublicTransferError(
      "Current MEAT exceeds lifetime MEAT.",
      403
    );
  }

  const futureTimestampLimit =
    currentTime + SAVE_FUTURE_TIMESTAMP_TOLERANCE_MS;

  if (
    saveState.runStartedAt > futureTimestampLimit ||
    saveState.lastSavedAt > futureTimestampLimit ||
    saveState.runStartedAt > saveState.lastSavedAt
  ) {
    throw new PublicTransferError(
      "The transferred save contains impossible timestamps.",
      403
    );
  }

  requirePlainObject(
    saveState.producers,
    "The producer ownership data"
  );

  let producersOwned = 0;

  Object.entries(saveState.producers).forEach(
    ([producerKey, ownedAmount]) => {
      requireFiniteNumber(
        ownedAmount,
        `The ${producerKey} ownership amount`,
        {
          integer: true,
          maximum: Number.MAX_SAFE_INTEGER
        }
      );

      producersOwned += ownedAmount;

      if (!Number.isSafeInteger(producersOwned)) {
        throw new PublicTransferError(
          "The transferred producer total is invalid.",
          403
        );
      }
    }
  );

  if (isPlainObject(saveState.producerLifetimeMeat)) {
    let trackedProducerLifetimeMeat = 0;

    Object.entries(saveState.producerLifetimeMeat).forEach(
      ([producerKey, lifetimeAmount]) => {
        requireFiniteNumber(
          lifetimeAmount,
          `The ${producerKey} lifetime amount`
        );

        if (
          isMeaningfullyGreater(
            lifetimeAmount,
            saveState.totalMeat
          )
        ) {
          throw new PublicTransferError(
            "Producer lifetime output exceeds lifetime MEAT.",
            403
          );
        }

        const remainingLifetime = Math.max(
          0,
          saveState.totalMeat - trackedProducerLifetimeMeat
        );

        if (
          isMeaningfullyGreater(
            lifetimeAmount,
            remainingLifetime
          )
        ) {
          throw new PublicTransferError(
            "Tracked producer output exceeds lifetime MEAT.",
            403
          );
        }

        trackedProducerLifetimeMeat += lifetimeAmount;
      }
    );
  }

  const harvesterState = saveState.features?.harvester;

  if (isPlainObject(harvesterState)) {
    requireFiniteNumber(
      harvesterState.lifetimeMeat,
      "Harvester lifetime output"
    );

    if (
      isMeaningfullyGreater(
        harvesterState.lifetimeMeat,
        saveState.totalMeat
      )
    ) {
      throw new PublicTransferError(
        "Harvester lifetime output exceeds lifetime MEAT.",
        403
      );
    }

    if (
      harvesterState.deployed === true &&
      harvesterState.unlocked !== true
    ) {
      throw new PublicTransferError(
        "The Harvester is deployed without being unlocked.",
        403
      );
    }
  }

  const nachtRaidersState = saveState.features?.nachtRaiders;

  if (isPlainObject(nachtRaidersState)) {
    const operative = nachtRaidersState.operative;

    if (isPlainObject(operative)) {
      requireFiniteNumber(
        operative.health,
        "Nacht Raiders operative health"
      );

      requireFiniteNumber(
        operative.maxHealth,
        "Nacht Raiders operative maximum health"
      );

      if (operative.health > operative.maxHealth) {
        throw new PublicTransferError(
          "Nacht Raiders operative health exceeds maximum health.",
          403
        );
      }
    }

    const statistics = nachtRaidersState.statistics;

    if (isPlainObject(statistics)) {
      const encounters = Number(statistics.encounters || 0);
      const victories = Number(statistics.victories || 0);
      const stalemates = Number(statistics.stalemates || 0);

      if (
        !Number.isFinite(encounters) ||
        !Number.isFinite(victories) ||
        !Number.isFinite(stalemates) ||
        encounters < 0 ||
        victories < 0 ||
        stalemates < 0 ||
        victories + stalemates > encounters
      ) {
        throw new PublicTransferError(
          "Nacht Raiders encounter statistics are contradictory.",
          403
        );
      }
    }
  }

  return {
    meat: saveState.meat,
    totalMeat: saveState.totalMeat,
    totalClicks: saveState.totalClicks,
    producersOwned,
    lastSavedAt: saveState.lastSavedAt
  };
}

/* ==========================================================
   10. SERVER KEY DERIVATION
   ----------------------------------------------------------
   Derives separate AES-GCM and HMAC-SHA-256 keys from the one
   private Cloudflare Worker secret.
========================================================== */

async function deriveContextKeyBytes(masterSecret, context) {
  return crypto.subtle.digest(
    "SHA-256",
    TEXT_ENCODER.encode(`${context}|${masterSecret}`)
  );
}

async function deriveAesKey(masterSecret) {
  const keyBytes = await deriveContextKeyBytes(
    masterSecret,
    "MEAT.exe|transfer-encryption-v2"
  );

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function deriveHmacKey(masterSecret) {
  const keyBytes = await deriveContextKeyBytes(
    masterSecret,
    "MEAT.exe|transfer-signing-v2"
  );

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign", "verify"]
  );
}

/* ==========================================================
   11. RECORD AUTHENTICATION FORMAT
   ----------------------------------------------------------
   Creates deterministic text and AES additional data from the
   immutable record fields protected by encryption and HMAC.
========================================================== */

function createRecordAuthenticationText(record) {
  return [
    TRANSFER_VERSION,
    record.code,
    record.created_at,
    record.expires_at,
    record.summary,
    record.iv,
    record.encrypted_payload
  ].join("\n");
}

function createEncryptionAdditionalData(record) {
  return TEXT_ENCODER.encode(
    [
      "MEAT.exe",
      `transferVersion=${TRANSFER_VERSION}`,
      record.code,
      record.created_at,
      record.expires_at,
      record.summary
    ].join("\n")
  );
}

/* ==========================================================
   12. SERVER ENCRYPTION AND DECRYPTION
========================================================== */

async function encryptTransferPayload(
  compressedBytes,
  record,
  masterSecret
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptionKey = await deriveAesKey(masterSecret);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: createEncryptionAdditionalData(record),
      tagLength: 128
    },
    encryptionKey,
    compressedBytes
  );

  return {
    iv: encodeBytesAsBase64Url(iv),
    encryptedPayload: encodeBytesAsBase64Url(
      new Uint8Array(encryptedBuffer)
    )
  };
}

async function decryptTransferPayload(record, masterSecret) {
  const iv = decodeBase64Url(
    record.iv,
    "The stored transfer initialization vector"
  );

  const encryptedPayload = decodeBase64Url(
    record.encrypted_payload,
    "The stored encrypted transfer payload"
  );

  if (iv.byteLength !== 12 || encryptedPayload.byteLength <= 16) {
    throw new PublicTransferError(
      "The stored transfer payload is invalid.",
      410
    );
  }

  const encryptionKey = await deriveAesKey(masterSecret);
  let decryptedBuffer;

  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: createEncryptionAdditionalData(record),
        tagLength: 128
      },
      encryptionKey,
      encryptedPayload
    );
  } catch (error) {
    throw new PublicTransferError(
      "The stored transfer failed encryption verification.",
      410
    );
  }

  const compressedBytes = new Uint8Array(decryptedBuffer);

  if (
    compressedBytes.byteLength <= 0 ||
    compressedBytes.byteLength > MAX_TRANSFER_COMPRESSED_BYTES
  ) {
    throw new PublicTransferError(
      "The stored transfer payload has an invalid size.",
      410
    );
  }

  return compressedBytes;
}

/* ==========================================================
   13. RECORD SIGNING AND VERIFICATION
========================================================== */

async function signTransferRecord(record, masterSecret) {
  const signingKey = await deriveHmacKey(masterSecret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    TEXT_ENCODER.encode(createRecordAuthenticationText(record))
  );

  return encodeBytesAsBase64Url(new Uint8Array(signature));
}

async function verifyTransferRecord(record, masterSecret) {
  let signatureBytes;

  try {
    signatureBytes = decodeBase64Url(
      record.signature,
      "The stored transfer signature"
    );
  } catch (error) {
    return false;
  }

  const signingKey = await deriveHmacKey(masterSecret);

  return crypto.subtle.verify(
    "HMAC",
    signingKey,
    signatureBytes,
    TEXT_ENCODER.encode(createRecordAuthenticationText(record))
  );
}

/* ==========================================================
   14. TRANSFER CODE GENERATION
========================================================== */

function generateTransferCode() {
  const randomBytes = crypto.getRandomValues(
    new Uint8Array(TRANSFER_CODE_LENGTH)
  );

  return Array.from(
    randomBytes,
    (byte) => TRANSFER_CODE_ALPHABET[byte & 31]
  ).join("");
}

function normalizeAndValidateTransferCode(value) {
  const code = String(value || "")
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
    .slice(0, TRANSFER_CODE_LENGTH);

  if (!TRANSFER_CODE_PATTERN.test(code)) {
    throw new PublicTransferError(
      "Enter a valid seven-character transfer code."
    );
  }

  return code;
}

/* ==========================================================
   15. DATABASE HELPERS
========================================================== */

async function deleteExpiredTransfers(database, currentTime = Date.now()) {
  try {
    await database
      .prepare(
        `DELETE FROM ${TRANSFER_TABLE}
         WHERE expires_at <= ?
            OR claimed = 1`
      )
      .bind(currentTime)
      .run();
  } catch (error) {
    console.warn("MEAT.exe transfer cleanup failed:", error);
  }
}

async function getActiveTransferRow(database, code, currentTime = Date.now()) {
  const row = await database
    .prepare(
      `SELECT
         code,
         transfer_version,
         summary,
         encrypted_payload,
         iv,
         signature,
         created_at,
         expires_at,
         claimed
       FROM ${TRANSFER_TABLE}
       WHERE code = ?
       LIMIT 1`
    )
    .bind(code)
    .first();

  if (!row) {
    throw new PublicTransferError(
      "No active transfer was found for that code.",
      404
    );
  }

  if (Number(row.claimed) !== 0) {
    throw new PublicTransferError(
      "That transfer has already been claimed.",
      410
    );
  }

  if (
    !Number.isFinite(Number(row.expires_at)) ||
    Number(row.expires_at) <= currentTime
  ) {
    await database
      .prepare(`DELETE FROM ${TRANSFER_TABLE} WHERE code = ?`)
      .bind(code)
      .run();

    throw new PublicTransferError(
      "That transfer code has expired.",
      410
    );
  }

  return row;
}

async function verifyActiveTransfer(env, code) {
  const row = await getActiveTransferRow(env.DB, code);
  const signatureValid = await verifyTransferRecord(
    row,
    env.TRANSFER_MASTER_SECRET
  );

  if (signatureValid) {
    return row;
  }

  await env.DB
    .prepare(`DELETE FROM ${TRANSFER_TABLE} WHERE code = ?`)
    .bind(code)
    .run();

  throw new PublicTransferError(
    "That transfer failed server integrity verification.",
    410
  );
}

function parseStoredSummary(summaryText) {
  if (
    typeof summaryText !== "string" ||
    TEXT_ENCODER.encode(summaryText).byteLength >
      MAX_TRANSFER_SUMMARY_BYTES
  ) {
    throw new PublicTransferError(
      "The stored transfer summary is invalid.",
      410
    );
  }

  let summary;

  try {
    summary = JSON.parse(summaryText);
  } catch (error) {
    throw new PublicTransferError(
      "The stored transfer summary is malformed.",
      410
    );
  }

  requirePlainObject(summary, "The stored transfer summary");
  return summary;
}

function isUniqueConstraintError(error) {
  const message = String(error?.message || error).toLowerCase();

  return (
    message.includes("unique") ||
    message.includes("primary key") ||
    message.includes("constraint failed")
  );
}

/* ==========================================================
   16. TRANSFER CREATION
   ----------------------------------------------------------
   Decompresses and validates the save, encrypts and signs the
   compressed bytes, and stores a one-use record in D1.
========================================================== */

async function createTransfer(request, env) {
  const requestData = await readJsonRequest(request);

  requirePlainObject(
    requestData,
    "The transfer request"
  );

  rejectUnknownKeys(
    requestData,
    ["game", "transferVersion", "compressedPayload"],
    "The transfer request"
  );

  if (
    requestData.game !== "MEAT.exe" ||
    requestData.transferVersion !== TRANSFER_VERSION
  ) {
    throw new PublicTransferError(
      "The transfer request version is unsupported."
    );
  }

  requireString(
    requestData.compressedPayload,
    "The compressed transfer payload",
    Math.ceil(MAX_TRANSFER_COMPRESSED_BYTES * 4 / 3) + 64
  );

  const { compressedBytes, exportPackage } =
    await decodeTransferPayload(requestData.compressedPayload);

  const summary = validateTrustedSavePackage(exportPackage);
  const summaryText = JSON.stringify(summary);

  if (
    TEXT_ENCODER.encode(summaryText).byteLength >
    MAX_TRANSFER_SUMMARY_BYTES
  ) {
    throw new PublicTransferError(
      "The transfer summary is too large."
    );
  }

  const currentTime = Date.now();
  const expiresAt = currentTime + TRANSFER_TTL_MS;

  await deleteExpiredTransfers(env.DB, currentTime);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateTransferCode();

    const baseRecord = {
      code,
      transfer_version: TRANSFER_VERSION,
      summary: summaryText,
      created_at: currentTime,
      expires_at: expiresAt
    };

    const { iv, encryptedPayload } = await encryptTransferPayload(
      compressedBytes,
      baseRecord,
      env.TRANSFER_MASTER_SECRET
    );

    const record = {
      ...baseRecord,
      iv,
      encrypted_payload: encryptedPayload
    };

    const signature = await signTransferRecord(
      record,
      env.TRANSFER_MASTER_SECRET
    );

    try {
      await env.DB
        .prepare(
          `INSERT INTO ${TRANSFER_TABLE} (
             code,
             transfer_version,
             summary,
             encrypted_payload,
             iv,
             signature,
             created_at,
             expires_at,
             claimed
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`
        )
        .bind(
          code,
          TRANSFER_VERSION,
          summaryText,
          encryptedPayload,
          iv,
          signature,
          currentTime,
          expiresAt
        )
        .run();

      return createJsonResponse(
        request,
        {
          code,
          transferVersion: TRANSFER_VERSION,
          serverVerified: true,
          expiresAt: new Date(expiresAt).toISOString()
        },
        201
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new PublicTransferError(
    "A unique transfer code could not be generated.",
    503
  );
}

/* ==========================================================
   17. TRANSFER PREVIEW
   ----------------------------------------------------------
   Verifies the signed record and returns only non-sensitive
   summary metadata without consuming the transfer.
========================================================== */

async function previewTransfer(request, env, untrustedCode) {
  const code = normalizeAndValidateTransferCode(untrustedCode);
  const row = await verifyActiveTransfer(env, code);

  return createJsonResponse(
    request,
    {
      code,
      transferVersion: TRANSFER_VERSION,
      serverVerified: true,
      createdAt: new Date(Number(row.created_at)).toISOString(),
      expiresAt: new Date(Number(row.expires_at)).toISOString(),
      summary: parseStoredSummary(row.summary)
    },
    200
  );
}

/* ==========================================================
   18. TRANSFER CLAIM
   ----------------------------------------------------------
   Verifies the record, atomically claims it, decrypts the
   compressed payload, returns it once, and deletes the row.
========================================================== */

async function claimTransfer(request, env, untrustedCode) {
  const code = normalizeAndValidateTransferCode(untrustedCode);
  const currentTime = Date.now();
  const row = await verifyActiveTransfer(env, code);

  const claimResult = await env.DB
    .prepare(
      `UPDATE ${TRANSFER_TABLE}
       SET claimed = 1
       WHERE code = ?
         AND claimed = 0
         AND expires_at > ?`
    )
    .bind(code, currentTime)
    .run();

  const changedRows = Number(claimResult?.meta?.changes || 0);

  if (changedRows !== 1) {
    throw new PublicTransferError(
      "That transfer has already been claimed or has expired.",
      410
    );
  }

  try {
    const compressedBytes = await decryptTransferPayload(
      row,
      env.TRANSFER_MASTER_SECRET
    );

    const response = createJsonResponse(
      request,
      {
        transfer: {
          game: "MEAT.exe",
          transferVersion: TRANSFER_VERSION,
          serverVerified: true,
          createdAt: new Date(Number(row.created_at)).toISOString(),
          expiresAt: new Date(Number(row.expires_at)).toISOString(),
          summary: parseStoredSummary(row.summary),
          compressedPayload:
            TRANSFER_PAYLOAD_MAGIC +
            encodeBytesAsBase64Url(compressedBytes)
        }
      },
      200
    );

    await env.DB
      .prepare(`DELETE FROM ${TRANSFER_TABLE} WHERE code = ?`)
      .bind(code)
      .run();

    return response;
  } catch (error) {
    await env.DB
      .prepare(`DELETE FROM ${TRANSFER_TABLE} WHERE code = ?`)
      .bind(code)
      .run();

    throw error;
  }
}
