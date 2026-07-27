/* ==========================================================
   1. WORKER CONFIGURATION
   ----------------------------------------------------------
   Defines transfer lifetime, payload limits, accepted origins,
   transfer-code characters, and API response headers.
========================================================== */

const TRANSFER_LIFETIME_SECONDS = 10 * 60;
const MAX_REQUEST_BODY_BYTES = 512 * 1024;
const MAX_TRANSFER_PACKAGE_BYTES = 400 * 1024;

const TRANSFER_CODE_LENGTH = 7;
const TRANSFER_CODE_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ALLOWED_ORIGINS = new Set([
  "https://strisselstudios.github.io",
  "https://relicrandomizer.com",
  "https://www.relicrandomizer.com"
]);

const JSON_CONTENT_TYPE =
  "application/json; charset=utf-8";


/* ==========================================================
   2. WORKER ENTRY POINT
   ----------------------------------------------------------
   Handles CORS, API routing, cleanup, validation, and failures.
========================================================== */

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return handleCorsPreflight(request, origin);
    }

    if (!isOriginAllowed(origin)) {
      return createJsonResponse(
        {
          error:
            "This save-transfer request came from an unauthorized origin."
        },
        403,
        origin
      );
    }

    if (!env.DB) {
      return createJsonResponse(
        {
          error:
            "The save-transfer database is not configured."
        },
        500,
        origin
      );
    }

    if (
      typeof env.TRANSFER_MASTER_SECRET !== "string" ||
      env.TRANSFER_MASTER_SECRET.length < 32
    ) {
      return createJsonResponse(
        {
          error:
            "The save-transfer encryption secret is not configured."
        },
        500,
        origin
      );
    }

    const url = new URL(request.url);

    try {
      await deleteExpiredTransfers(env.DB);

      if (
        request.method === "GET" &&
        url.pathname === "/"
      ) {
        return createJsonResponse(
          {
            ok: true,
            service: "MEAT.exe Save Transfer",
            version: 2
          },
          200,
          origin
        );
      }

      if (
        request.method === "POST" &&
        url.pathname === "/transfer"
      ) {
        return createTransfer(
          request,
          env,
          origin
        );
      }

      const metadataMatch =
        url.pathname.match(
          /^\/transfer\/([A-Z2-9]{7})\/meta$/
        );

      if (
        request.method === "GET" &&
        metadataMatch
      ) {
        return previewTransfer(
          metadataMatch[1],
          env,
          origin
        );
      }

      const claimMatch =
        url.pathname.match(
          /^\/transfer\/([A-Z2-9]{7})\/claim$/
        );

      if (
        request.method === "POST" &&
        claimMatch
      ) {
        return claimTransfer(
          claimMatch[1],
          env,
          origin
        );
      }

      return createJsonResponse(
        {
          error:
            "The requested save-transfer endpoint does not exist."
        },
        404,
        origin
      );
    } catch (error) {
      console.error(
        "MEAT.exe save-transfer Worker failure:",
        error
      );

      return createJsonResponse(
        {
          error:
            error instanceof PublicTransferError
              ? error.message
              : "The save-transfer server encountered an internal error."
        },
        error instanceof PublicTransferError
          ? error.status
          : 500,
        origin
      );
    }
  }
};


/* ==========================================================
   3. PUBLIC ERROR TYPE
   ----------------------------------------------------------
   Distinguishes safe client-facing failures from internal
   Worker, database, and cryptographic errors.
========================================================== */

class PublicTransferError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = "PublicTransferError";
    this.status = status;
  }
}


/* ==========================================================
   4. CORS AND RESPONSE HELPERS
========================================================== */

function isOriginAllowed(origin) {
  return (
    origin === "" ||
    ALLOWED_ORIGINS.has(origin)
  );
}


function createCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type",
    "Access-Control-Max-Age":
      "86400",
    "Cache-Control":
      "no-store",
    "Content-Type":
      JSON_CONTENT_TYPE,
    "X-Content-Type-Options":
      "nosniff"
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] =
      origin;

    headers["Vary"] = "Origin";
  }

  return headers;
}


function handleCorsPreflight(
  request,
  origin
) {
  if (!isOriginAllowed(origin)) {
    return new Response(null, {
      status: 403
    });
  }

  const requestedMethod =
    request.headers.get(
      "Access-Control-Request-Method"
    );

  if (
    requestedMethod &&
    ![
      "GET",
      "POST"
    ].includes(requestedMethod)
  ) {
    return new Response(null, {
      status: 405,
      headers: createCorsHeaders(origin)
    });
  }

  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(origin)
  });
}


function createJsonResponse(
  body,
  status,
  origin
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: createCorsHeaders(origin)
    }
  );
}


/* ==========================================================
   5. REQUEST BODY READING
   ----------------------------------------------------------
   Rejects oversized, missing, malformed, or non-JSON requests.
========================================================== */

async function readJsonRequest(request) {
  const contentType =
    request.headers.get(
      "Content-Type"
    ) || "";

  if (
    !contentType
      .toLowerCase()
      .startsWith("application/json")
  ) {
    throw new PublicTransferError(
      "The transfer request must contain JSON.",
      415
    );
  }

  const contentLengthHeader =
    request.headers.get(
      "Content-Length"
    );

  if (contentLengthHeader) {
    const contentLength =
      Number(contentLengthHeader);

    if (
      Number.isFinite(contentLength) &&
      contentLength >
        MAX_REQUEST_BODY_BYTES
    ) {
      throw new PublicTransferError(
        "The save-transfer request is too large.",
        413
      );
    }
  }

  const bodyText = await request.text();

  if (!bodyText) {
    throw new PublicTransferError(
      "The save-transfer request is empty."
    );
  }

  if (
    new TextEncoder()
      .encode(bodyText)
      .byteLength >
      MAX_REQUEST_BODY_BYTES
  ) {
    throw new PublicTransferError(
      "The save-transfer request is too large.",
      413
    );
  }

  try {
    return JSON.parse(bodyText);
  } catch (error) {
    throw new PublicTransferError(
      "The save-transfer request contains invalid JSON."
    );
  }
}


/* ==========================================================
   6. TRANSFER PACKAGE VALIDATION
   ----------------------------------------------------------
   Performs strict outer-package checks before encryption and
   database storage. Full game-state validation remains the
   responsibility of the browser save system.
========================================================== */

function validateTransferPackage(
  transferPackage
) {
  if (
    !isPlainObject(
      transferPackage
    )
  ) {
    throw new PublicTransferError(
      "The transfer package is invalid."
    );
  }

  const allowedKeys = new Set([
    "game",
    "exportVersion",
    "exportedAt",
    "saveData"
  ]);

  for (
    const key of
    Object.keys(transferPackage)
  ) {
    if (!allowedKeys.has(key)) {
      throw new PublicTransferError(
        "The transfer package contains unsupported data."
      );
    }
  }

  if (
    transferPackage.game !==
    "MEAT.exe"
  ) {
    throw new PublicTransferError(
      "The transfer package is not a MEAT.exe save."
    );
  }

  if (
    transferPackage.exportVersion !== 1
  ) {
    throw new PublicTransferError(
      "The transfer package version is not supported."
    );
  }

  if (
    typeof transferPackage.exportedAt !==
      "string" ||
    transferPackage.exportedAt.length >
      64 ||
    Number.isNaN(
      Date.parse(
        transferPackage.exportedAt
      )
    )
  ) {
    throw new PublicTransferError(
      "The transfer creation date is invalid."
    );
  }

  if (
    !isPlainObject(
      transferPackage.saveData
    )
  ) {
    throw new PublicTransferError(
      "The transfer package does not contain valid save data."
    );
  }

  assertJsonSafeValue(
    transferPackage,
    "transferPackage"
  );

  const serializedPackage =
    JSON.stringify(
      transferPackage
    );

  const packageByteLength =
    new TextEncoder()
      .encode(serializedPackage)
      .byteLength;

  if (
    packageByteLength >
    MAX_TRANSFER_PACKAGE_BYTES
  ) {
    throw new PublicTransferError(
      "The save is too large to transfer.",
      413
    );
  }

  return serializedPackage;
}


function isPlainObject(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(value);

  return (
    prototype ===
      Object.prototype ||
    prototype === null
  );
}


function assertJsonSafeValue(
  value,
  path,
  visited = new WeakSet()
) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new PublicTransferError(
        `${path} contains a non-finite number.`
      );
    }

    return;
  }

  if (typeof value !== "object") {
    throw new PublicTransferError(
      `${path} contains unsupported data.`
    );
  }

  if (visited.has(value)) {
    throw new PublicTransferError(
      `${path} contains circular data.`
    );
  }

  visited.add(value);

  if (Array.isArray(value)) {
    if (value.length > 10000) {
      throw new PublicTransferError(
        `${path} contains an oversized array.`
      );
    }

    value.forEach(
      (entry, index) => {
        assertJsonSafeValue(
          entry,
          `${path}[${index}]`,
          visited
        );
      }
    );

    visited.delete(value);

    return;
  }

  if (!isPlainObject(value)) {
    throw new PublicTransferError(
      `${path} contains an unsupported object.`
    );
  }

  const keys = Object.keys(value);

  if (keys.length > 10000) {
    throw new PublicTransferError(
      `${path} contains too many properties.`
    );
  }

  keys.forEach((key) => {
    if (
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor"
    ) {
      throw new PublicTransferError(
        `${path} contains an unsafe property.`
      );
    }

    assertJsonSafeValue(
      value[key],
      `${path}.${key}`,
      visited
    );
  });

  visited.delete(value);
}


/* ==========================================================
   7. TRANSFER CREATION
   ----------------------------------------------------------
   Validates the package, creates a collision-resistant code,
   encrypts the package, signs the stored record, and inserts
   the one-use transfer into D1.
========================================================== */

async function createTransfer(
  request,
  env,
  origin
) {
  const transferPackage =
    await readJsonRequest(request);

  const serializedPackage =
    validateTransferPackage(
      transferPackage
    );

  const now = Date.now();

  const createdAt =
    new Date(now).toISOString();

  const expiresAt =
    new Date(
      now +
      TRANSFER_LIFETIME_SECONDS *
        1000
    ).toISOString();

  const summary =
    createTransferSummary(
      transferPackage
    );

  const summaryJson =
    JSON.stringify(summary);

  const encryptedPackage =
    await encryptTransferPackage(
      serializedPackage,
      env.TRANSFER_MASTER_SECRET
    );

  let code = "";

  for (
    let attempt = 0;
    attempt < 12;
    attempt += 1
  ) {
    code = generateTransferCode();

    const signature =
      await signTransferRecord(
        {
          code,
          initializationVector:
            encryptedPackage
              .initializationVector,
          encryptedPayload:
            encryptedPackage
              .encryptedPayload,
          summaryJson,
          createdAt,
          expiresAt
        },
        env.TRANSFER_MASTER_SECRET
      );

    try {
      await env.DB
        .prepare(
          `
            INSERT INTO meat_save_transfers (
              code,
              encrypted_payload,
              initialization_vector,
              signature,
              summary_json,
              created_at,
              expires_at,
              claimed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
          `
        )
        .bind(
          code,
          encryptedPackage
            .encryptedPayload,
          encryptedPackage
            .initializationVector,
          signature,
          summaryJson,
          createdAt,
          expiresAt
        )
        .run();

      return createJsonResponse(
        {
          code,
          expiresAt
        },
        201,
        origin
      );
    } catch (error) {
      if (
        isUniqueConstraintError(
          error
        )
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "A unique transfer code could not be generated."
  );
}


/* ==========================================================
   8. TRANSFER PREVIEW
   ----------------------------------------------------------
   Returns only signed summary metadata. It does not reveal or
   consume the encrypted save package.
========================================================== */

async function previewTransfer(
  untrustedCode,
  env,
  origin
) {
  const code =
    normalizeAndValidateTransferCode(
      untrustedCode
    );

  const row =
    await getTransferRecord(
      code,
      env.DB
    );

  requireAvailableTransfer(row);

  const recordIsValid =
    await verifyTransferRecord(
      row,
      env.TRANSFER_MASTER_SECRET
    );

  if (!recordIsValid) {
    throw new PublicTransferError(
      "The transfer could not be verified.",
      409
    );
  }

  let summary;

  try {
    summary =
      JSON.parse(row.summary_json);
  } catch (error) {
    throw new PublicTransferError(
      "The transfer metadata is invalid.",
      409
    );
  }

  return createJsonResponse(
    {
      code,
      expiresAt: row.expires_at,
      summary
    },
    200,
    origin
  );
}


/* ==========================================================
   9. TRANSFER CLAIM
   ----------------------------------------------------------
   Verifies the record, atomically marks it claimed, decrypts
   the save package, and returns it exactly once.
========================================================== */

async function claimTransfer(
  untrustedCode,
  env,
  origin
) {
  const code =
    normalizeAndValidateTransferCode(
      untrustedCode
    );

  const row =
    await getTransferRecord(
      code,
      env.DB
    );

  requireAvailableTransfer(row);

  const recordIsValid =
    await verifyTransferRecord(
      row,
      env.TRANSFER_MASTER_SECRET
    );

  if (!recordIsValid) {
    throw new PublicTransferError(
      "The transfer could not be verified.",
      409
    );
  }

  const claimedAt =
    new Date().toISOString();

  const claimResult =
    await env.DB
      .prepare(
        `
          UPDATE meat_save_transfers
          SET claimed_at = ?
          WHERE code = ?
            AND claimed_at IS NULL
            AND expires_at > ?
        `
      )
      .bind(
        claimedAt,
        code,
        claimedAt
      )
      .run();

  const changedRows =
    Number(
      claimResult
        ?.meta
        ?.changes || 0
    );

  if (changedRows !== 1) {
    throw new PublicTransferError(
      "This transfer has already been claimed or has expired.",
      410
    );
  }

  let serializedPackage;

  try {
    serializedPackage =
      await decryptTransferPackage(
        row.encrypted_payload,
        row.initialization_vector,
        env.TRANSFER_MASTER_SECRET
      );
  } catch (error) {
    console.error(
      "MEAT.exe transfer decryption failed:",
      error
    );

    throw new PublicTransferError(
      "The transfer could not be decrypted.",
      409
    );
  }

  let transferPackage;

  try {
    transferPackage =
      JSON.parse(
        serializedPackage
      );
  } catch (error) {
    throw new PublicTransferError(
      "The decrypted transfer contains invalid data.",
      409
    );
  }

  validateTransferPackage(
    transferPackage
  );

  return createJsonResponse(
    {
      transfer:
        transferPackage
    },
    200,
    origin
  );
}


/* ==========================================================
   10. DATABASE RECORD HELPERS
========================================================== */

async function getTransferRecord(
  code,
  database
) {
  return database
    .prepare(
      `
        SELECT
          code,
          encrypted_payload,
          initialization_vector,
          signature,
          summary_json,
          created_at,
          expires_at,
          claimed_at
        FROM meat_save_transfers
        WHERE code = ?
        LIMIT 1
      `
    )
    .bind(code)
    .first();
}


function requireAvailableTransfer(row) {
  if (!row) {
    throw new PublicTransferError(
      "No transfer was found for that code.",
      404
    );
  }

  if (row.claimed_at) {
    throw new PublicTransferError(
      "This transfer has already been claimed.",
      410
    );
  }

  const expirationTime =
    Date.parse(row.expires_at);

  if (
    Number.isNaN(
      expirationTime
    ) ||
    expirationTime <= Date.now()
  ) {
    throw new PublicTransferError(
      "This transfer has expired.",
      410
    );
  }
}


async function deleteExpiredTransfers(
  database
) {
  const retentionBoundary =
    new Date(
      Date.now() -
      24 * 60 * 60 * 1000
    ).toISOString();

  try {
    await database
      .prepare(
        `
          DELETE FROM meat_save_transfers
          WHERE expires_at < ?
             OR (
               claimed_at IS NOT NULL
               AND claimed_at < ?
             )
        `
      )
      .bind(
        retentionBoundary,
        retentionBoundary
      )
      .run();
  } catch (error) {
    console.warn(
      "MEAT.exe transfer cleanup failed:",
      error
    );
  }
}


function isUniqueConstraintError(error) {
  const message =
    String(
      error?.message || error
    ).toLowerCase();

  return (
    message.includes("unique") ||
    message.includes(
      "constraint failed"
    )
  );
}


/* ==========================================================
   11. TRANSFER SUMMARY
   ----------------------------------------------------------
   Produces the non-sensitive preview shown before the receiving
   player confirms replacement of the local save.
========================================================== */

function createTransferSummary(
  transferPackage
) {
  const saveData =
    transferPackage.saveData;

  return {
    meat:
      readFiniteNonNegativeNumber(
        saveData.meat
      ),

    totalMeat:
      readFiniteNonNegativeNumber(
        saveData.totalMeat
      ),

    totalClicks:
      readFiniteNonNegativeNumber(
        saveData.totalClicks
      ),

    producersOwned:
      countOwnedProducers(
        saveData.producers
      ),

    lastSavedAt:
      readSummaryDate(
        saveData.lastSavedAt,
        transferPackage.exportedAt
      )
  };
}


function readFiniteNonNegativeNumber(
  value
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue < 0
  ) {
    return 0;
  }

  return numericValue;
}


function countOwnedProducers(
  producers
) {
  if (!isPlainObject(producers)) {
    return 0;
  }

  return Object.values(
    producers
  ).reduce(
    (total, amount) => {
      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        return total;
      }

      return (
        total +
        Math.floor(
          numericAmount
        )
      );
    },
    0
  );
}


function readSummaryDate(
  preferredValue,
  fallbackValue
) {
  if (
    typeof preferredValue ===
      "string" &&
    !Number.isNaN(
      Date.parse(
        preferredValue
      )
    )
  ) {
    return preferredValue;
  }

  return fallbackValue;
}


/* ==========================================================
   12. TRANSFER CODE GENERATION
========================================================== */

function generateTransferCode() {
  const randomValues =
    new Uint32Array(
      TRANSFER_CODE_LENGTH
    );

  crypto.getRandomValues(
    randomValues
  );

  let code = "";

  for (
    let index = 0;
    index <
      TRANSFER_CODE_LENGTH;
    index += 1
  ) {
    code +=
      TRANSFER_CODE_CHARACTERS[
        randomValues[index] %
        TRANSFER_CODE_CHARACTERS.length
      ];
  }

  return code;
}


function normalizeAndValidateTransferCode(
  value
) {
  const normalizedCode =
    String(value || "")
      .toUpperCase()
      .replace(
        /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g,
        ""
      )
      .slice(
        0,
        TRANSFER_CODE_LENGTH
      );

  const pattern =
    /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7}$/;

  if (!pattern.test(normalizedCode)) {
    throw new PublicTransferError(
      "Enter a valid seven-character transfer code."
    );
  }

  return normalizedCode;
}


/* ==========================================================
   13. KEY DERIVATION
   ----------------------------------------------------------
   Derives independent AES-GCM and HMAC keys from the configured
   TRANSFER_MASTER_SECRET without storing either derived key.
========================================================== */

async function deriveEncryptionKey(
  masterSecret
) {
  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        masterSecret
      ),
      "HKDF",
      false,
      [
        "deriveKey"
      ]
    );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt:
        new TextEncoder().encode(
          "MEAT.exe save-transfer v2"
        ),
      info:
        new TextEncoder().encode(
          "AES-GCM encryption"
        )
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    [
      "encrypt",
      "decrypt"
    ]
  );
}


async function deriveSigningKey(
  masterSecret
) {
  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        masterSecret
      ),
      "HKDF",
      false,
      [
        "deriveKey"
      ]
    );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt:
        new TextEncoder().encode(
          "MEAT.exe save-transfer v2"
        ),
      info:
        new TextEncoder().encode(
          "HMAC record signing"
        )
    },
    keyMaterial,
    {
      name: "HMAC",
      hash: "SHA-256",
      length: 256
    },
    false,
    [
      "sign",
      "verify"
    ]
  );
}


/* ==========================================================
   14. AES-GCM ENCRYPTION
========================================================== */

async function encryptTransferPackage(
  serializedPackage,
  masterSecret
) {
  const encryptionKey =
    await deriveEncryptionKey(
      masterSecret
    );

  const initializationVector =
    crypto.getRandomValues(
      new Uint8Array(12)
    );

  const encryptedBuffer =
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv:
          initializationVector
      },
      encryptionKey,
      new TextEncoder().encode(
        serializedPackage
      )
    );

  return {
    encryptedPayload:
      arrayBufferToBase64(
        encryptedBuffer
      ),

    initializationVector:
      arrayBufferToBase64(
        initializationVector
      )
  };
}


async function decryptTransferPackage(
  encryptedPayload,
  initializationVector,
  masterSecret
) {
  const encryptionKey =
    await deriveEncryptionKey(
      masterSecret
    );

  const decryptedBuffer =
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv:
          base64ToUint8Array(
            initializationVector
          )
      },
      encryptionKey,
      base64ToUint8Array(
        encryptedPayload
      )
    );

  return new TextDecoder().decode(
    decryptedBuffer
  );
}


/* ==========================================================
   15. HMAC RECORD SIGNING
   ----------------------------------------------------------
   Signs all security-relevant record fields so database
   modification is detected before previewing or claiming.
========================================================== */

function createRecordSigningPayload(
  record
) {
  return [
    record.code,
    record.initializationVector,
    record.encryptedPayload,
    record.summaryJson,
    record.createdAt,
    record.expiresAt
  ].join("\n");
}


async function signTransferRecord(
  record,
  masterSecret
) {
  const signingKey =
    await deriveSigningKey(
      masterSecret
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      signingKey,
      new TextEncoder().encode(
        createRecordSigningPayload(
          record
        )
      )
    );

  return arrayBufferToBase64(
    signature
  );
}


async function verifyTransferRecord(
  row,
  masterSecret
) {
  if (
    typeof row.signature !==
      "string" ||
    typeof row.encrypted_payload !==
      "string" ||
    typeof row.initialization_vector !==
      "string" ||
    typeof row.summary_json !==
      "string" ||
    typeof row.created_at !==
      "string" ||
    typeof row.expires_at !==
      "string"
  ) {
    return false;
  }

  const signingKey =
    await deriveSigningKey(
      masterSecret
    );

  let storedSignature;

  try {
    storedSignature =
      base64ToUint8Array(
        row.signature
      );
  } catch (error) {
    return false;
  }

  return crypto.subtle.verify(
    "HMAC",
    signingKey,
    storedSignature,
    new TextEncoder().encode(
      createRecordSigningPayload(
        {
          code: row.code,

          initializationVector:
            row.initialization_vector,

          encryptedPayload:
            row.encrypted_payload,

          summaryJson:
            row.summary_json,

          createdAt:
            row.created_at,

          expiresAt:
            row.expires_at
        }
      )
    )
  );
}


/* ==========================================================
   16. BASE64 CONVERSION
========================================================== */

function arrayBufferToBase64(
  value
) {
  const bytes =
    value instanceof Uint8Array
      ? value
      : new Uint8Array(value);

  let binary = "";

  const chunkSize = 0x8000;

  for (
    let offset = 0;
    offset < bytes.length;
    offset += chunkSize
  ) {
    const chunk =
      bytes.subarray(
        offset,
        offset + chunkSize
      );

    binary +=
      String.fromCharCode(
        ...chunk
      );
  }

  return btoa(binary);
}


function base64ToUint8Array(
  value
) {
  if (
    typeof value !== "string" ||
    value.length === 0
  ) {
    throw new Error(
      "Invalid Base64 value."
    );
  }

  const binary =
    atob(value);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index);
  }

  return bytes;
}
