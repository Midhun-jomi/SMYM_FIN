/**
 * SMYM FIN — Google Apps Script Backend API
 * Single source of truth for Google Sheets integration.
 * Deploy as Web App:
 * - Execute as: Me (Spreadsheet owner)
 * - Who has access: Anyone
 */

const SHEET_NAMES = {
  TRANSACTIONS: "Transactions",
  ACCOUNTS: "Accounts",
  BILLS: "Bills",
  EVENTS: "Events",
  USERS: "Users",
  AUDIT_LOG: "AuditLog",
  SETTINGS: "Settings",
};

/**
 * Handles HTTP GET requests for public data access and RPC calls
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getDashboard";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "getTransactions") {
      const data = getSheetData(ss, SHEET_NAMES.TRANSACTIONS);
      return jsonResponse(data);
    }

    if (action === "getAccounts") {
      const data = getSheetData(ss, SHEET_NAMES.ACCOUNTS);
      return jsonResponse(data);
    }

    if (action === "getBills") {
      const data = getSheetData(ss, SHEET_NAMES.BILLS);
      return jsonResponse(data);
    }

    if (action === "getEvents") {
      const data = getSheetData(ss, SHEET_NAMES.EVENTS);
      return jsonResponse(data);
    }

    if (action === "getDashboard") {
      const transactions = getSheetData(ss, SHEET_NAMES.TRANSACTIONS);
      const accounts = getSheetData(ss, SHEET_NAMES.ACCOUNTS);
      const bills = getSheetData(ss, SHEET_NAMES.BILLS);
      const events = getSheetData(ss, SHEET_NAMES.EVENTS);

      return jsonResponse({
        transactions,
        accounts,
        bills,
        events,
      });
    }

    // Support GET-based mutation fallback for browsers with strict redirect handling
    if (action === "addTransaction" && e.parameter.payload) {
      const txn = JSON.parse(decodeURIComponent(e.parameter.payload));
      return executeAddTransaction(ss, txn);
    }

    if (action === "voidTransaction" && e.parameter.transactionId) {
      return executeVoidTransaction(ss, e.parameter.transactionId, e.parameter.actor || "admin");
    }

    if (action === "seedInitialAccounts") {
      seedAccountsIfEmpty(ss);
      return jsonResponse({ success: true, message: "Initial society accounts created." });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * Handles HTTP POST requests for write operations with locking and verification
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    let body = {};
    try {
      body = contents ? JSON.parse(contents) : {};
    } catch (parseErr) {
      body = {};
    }

    const action = body.action || (e && e.parameter ? e.parameter.action : "");
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "addTransaction") {
      const txn = body.data || body;
      return executeAddTransaction(ss, txn);
    }

    if (action === "voidTransaction") {
      const idToVoid = body.transactionId || (e && e.parameter ? e.parameter.transactionId : "");
      const actor = body.actor || "admin";
      return executeVoidTransaction(ss, idToVoid, actor);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends a new verified transaction record
 */
function executeAddTransaction(ss, txn) {
  if (!txn.amount || Number(txn.amount) <= 0 || !txn.description || !txn.type) {
    return jsonResponse({ error: "Validation failed: Invalid transaction payload." }, 400);
  }

  const sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (!sheet) {
    return jsonResponse({ error: "Transactions sheet not found. Run initializeDatabaseTabs() first." }, 500);
  }

  const newId = txn.transaction_id || "txn_" + new Date().getTime();
  const createdAt = new Date().toISOString();

  sheet.appendRow([
    newId,
    txn.date || new Date().toISOString().slice(0, 10),
    txn.type,
    txn.description,
    txn.category || "General",
    Number(txn.amount),
    txn.account_id || "acc_01",
    txn.payment_method || "BANK",
    txn.event_id || "",
    txn.reference_id || "",
    "COMPLETED",
    txn.created_by || "anonymous",
    createdAt,
    "",
    ""
  ]);

  // Adjust account current balance in Accounts sheet
  updateAccountBalance(ss, txn.account_id, txn.type, Number(txn.amount));

  // Record audit log entry
  recordAudit(ss, txn.created_by || "system", "CREATE", "TRANSACTION", newId, "Created " + txn.type + " of ₹" + txn.amount + ": " + txn.description);

  return jsonResponse({ success: true, transaction_id: newId });
}

/**
 * Updates status of transaction to VOID
 */
function executeVoidTransaction(ss, idToVoid, actor) {
  const sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (!sheet) return jsonResponse({ error: "Transactions sheet not found." }, 500);

  const data = sheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idToVoid) {
      // Column 11 = status (K), Column 14 = updated_by (N), Column 15 = updated_at (O)
      sheet.getRange(i + 1, 11).setValue("VOID");
      sheet.getRange(i + 1, 14).setValue(actor);
      sheet.getRange(i + 1, 15).setValue(new Date().toISOString());

      // Reverse account balance adjustment
      const txnType = data[i][2];
      const amount = Number(data[i][5]);
      const accountId = data[i][6];
      const reverseType = txnType === "INCOME" ? "EXPENSE" : txnType === "EXPENSE" ? "INCOME" : "TRANSFER";
      if (reverseType !== "TRANSFER") {
        updateAccountBalance(ss, accountId, reverseType, amount);
      }

      found = true;
      break;
    }
  }

  if (!found) {
    return jsonResponse({ error: "Transaction not found: " + idToVoid }, 404);
  }

  recordAudit(ss, actor, "VOID", "TRANSACTION", idToVoid, "Voided transaction " + idToVoid);
  return jsonResponse({ success: true, voided: idToVoid });
}

/**
 * Updates current_balance in Accounts sheet based on movement
 */
function updateAccountBalance(ss, accountId, type, amount) {
  if (!accountId || !amount) return;
  const sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === accountId) {
      const current = Number(data[i][4]) || 0;
      let newBalance = current;
      if (type === "INCOME") newBalance += amount;
      if (type === "EXPENSE") newBalance -= amount;
      sheet.getRange(i + 1, 5).setValue(newBalance);
      break;
    }
  }
}

/**
 * Helper to read sheet rows as JSON objects using first row as headers
 */
function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  const headers = rows[0];
  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    results.push(obj);
  }
  return results;
}

/**
 * Appends entry to AuditLog
 */
function recordAudit(ss, actor, action, entityType, entityId, details) {
  const auditSheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOG);
  if (!auditSheet) return;
  auditSheet.appendRow([
    "aud_" + new Date().getTime(),
    new Date().toISOString(),
    actor,
    action,
    entityType,
    entityId,
    details
  ]);
}

/**
 * Returns formatted JSON response
 */
function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * One-click Sheet initializer: Run this function once from Apps Script editor!
 */
function initializeDatabaseTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Transactions
  createTabWithHeaders(ss, SHEET_NAMES.TRANSACTIONS, [
    "transaction_id", "date", "type", "description", "category",
    "amount", "account_id", "payment_method", "event_id", "reference_id",
    "status", "created_by", "created_at", "updated_by", "updated_at"
  ]);

  // 2. Accounts
  createTabWithHeaders(ss, SHEET_NAMES.ACCOUNTS, [
    "account_id", "account_name", "account_type", "opening_balance", "current_balance", "is_active"
  ]);

  // 3. Bills
  createTabWithHeaders(ss, SHEET_NAMES.BILLS, [
    "bill_id", "bill_name", "vendor", "amount", "due_date", "category", "status", "linked_transaction_id", "notes"
  ]);

  // 4. Events
  createTabWithHeaders(ss, SHEET_NAMES.EVENTS, [
    "event_id", "event_name", "event_date", "budget", "total_income", "total_expense", "status"
  ]);

  // 5. Users
  createTabWithHeaders(ss, SHEET_NAMES.USERS, [
    "user_id", "email", "display_name", "role", "status", "created_at", "updated_at"
  ]);

  // 6. AuditLog
  createTabWithHeaders(ss, SHEET_NAMES.AUDIT_LOG, [
    "log_id", "timestamp", "actor_email", "action", "entity_type", "entity_id", "details"
  ]);

  // 7. Settings
  createTabWithHeaders(ss, SHEET_NAMES.SETTINGS, [
    "setting_key", "setting_value", "description"
  ]);

  // Pre-seed accounts if empty
  seedAccountsIfEmpty(ss);
}

function seedAccountsIfEmpty(ss) {
  const accSheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (accSheet && accSheet.getLastRow() <= 1) {
    accSheet.appendRow(["acc_01", "Federal Bank - Operating Account", "BANK", 150000, 150000, true]);
    accSheet.appendRow(["acc_02", "Cash in Hand (Treasurer)", "CASH", 15000, 15000, true]);
    accSheet.appendRow(["acc_03", "Youth Mission & Charity Fund", "BANK", 50000, 50000, true]);
  }
}

function createTabWithHeaders(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ecfdf5");
  }
}
