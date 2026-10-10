/**
 * SMYM FIN — Google Apps Script Backend API
 * Single source of truth for Google Sheets integration.
 * Deploy as Web App:
 * - Execute as: Me (Spreadsheet owner)
 * - Who has access: Anyone
 */

// Replace with your Google Spreadsheet ID (from docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet() ? SpreadsheetApp.getActiveSpreadsheet().getId() : "";

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
 * Handles HTTP GET requests for public data access
 */
function doGet(e) {
  try {
    const action = e.parameter.action || "getDashboard";
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
    // Acquire lock for concurrency safety (timeout 10s)
    lock.waitLock(10000);

    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "addTransaction") {
      const txn = body.data;
      if (!txn.amount || txn.amount <= 0 || !txn.description || !txn.type) {
        return jsonResponse({ error: "Validation failed: Invalid transaction payload." }, 400);
      }

      const sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
      const newId = txn.transaction_id || "txn_" + new Date().getTime();
      const createdAt = new Date().toISOString();

      sheet.appendRow([
        newId,
        txn.date,
        txn.type,
        txn.description,
        txn.category,
        txn.amount,
        txn.account_id,
        txn.payment_method,
        txn.event_id || "",
        txn.reference_id || "",
        "COMPLETED",
        txn.created_by || "anonymous",
        createdAt,
        "",
        ""
      ]);

      // Record in Audit Log
      recordAudit(ss, txn.created_by || "system", "CREATE", "TRANSACTION", newId, "Created " + txn.type + " of ₹" + txn.amount);

      return jsonResponse({ success: true, transaction_id: newId });
    }

    if (action === "voidTransaction") {
      const idToVoid = body.transactionId;
      const actor = body.actor || "admin";
      const sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
      const data = sheet.getDataRange().getValues();

      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === idToVoid) {
          // Status column index is 10 (0-indexed: column K)
          sheet.getRange(i + 1, 11).setValue("VOID");
          sheet.getRange(i + 1, 14).setValue(actor);
          sheet.getRange(i + 1, 15).setValue(new Date().toISOString());
          found = true;
          break;
        }
      }

      if (!found) {
        return jsonResponse({ error: "Transaction not found." }, 404);
      }

      recordAudit(ss, actor, "VOID", "TRANSACTION", idToVoid, "Voided transaction " + idToVoid);
      return jsonResponse({ success: true, voided: idToVoid });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  } finally {
    lock.releaseLock();
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
 * Returns formatted JSON response with CORS headers
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
