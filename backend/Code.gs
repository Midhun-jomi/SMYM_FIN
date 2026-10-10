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
      data.sort(function(a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      return jsonResponse(data);
    }

    if (action === "getAccounts") {
      const data = getSheetData(ss, SHEET_NAMES.ACCOUNTS);
      return jsonResponse(data);
    }

    if (action === "getBills") {
      const data = getSheetData(ss, SHEET_NAMES.BILLS);
      data.sort(function(a, b) {
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      });
      return jsonResponse(data);
    }

    if (action === "getEvents") {
      const data = getSheetData(ss, SHEET_NAMES.EVENTS);
      const enhanced = data.map(function(ev) {
        var inc = Number(ev.total_income) || 0;
        var exp = Number(ev.total_expense) || 0;
        ev.total_income = inc;
        ev.total_expense = exp;
        ev.net_balance = inc - exp;
        return ev;
      });
      enhanced.sort(function(a, b) {
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      });
      return jsonResponse(enhanced);
    }

    if (action === "getUsers") {
      const data = getSheetData(ss, SHEET_NAMES.USERS);
      return jsonResponse(data);
    }

    if (action === "getAuditLogs") {
      const data = getSheetData(ss, SHEET_NAMES.AUDIT_LOG);
      data.sort(function(a, b) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      return jsonResponse(data);
    }

    if (action === "getUserRole" && e.parameter.email) {
      const role = getUserRole(ss, e.parameter.email);
      return jsonResponse({ email: e.parameter.email, role: role });
    }

    if (action === "verifyPasscode") {
      const email = e.parameter.email || "";
      const role = e.parameter.role || "EDITOR";
      const passcode = e.parameter.passcode || "";
      return executeVerifyPasscode(ss, email, role, passcode);
    }

    if (action === "getDashboard") {
      const transactions = getSheetData(ss, SHEET_NAMES.TRANSACTIONS);
      transactions.sort(function(a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      const accounts = getSheetData(ss, SHEET_NAMES.ACCOUNTS);
      const bills = getSheetData(ss, SHEET_NAMES.BILLS);
      bills.sort(function(a, b) {
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      });
      const rawEvents = getSheetData(ss, SHEET_NAMES.EVENTS);
      const events = rawEvents.map(function(ev) {
        var inc = Number(ev.total_income) || 0;
        var exp = Number(ev.total_expense) || 0;
        ev.total_income = inc;
        ev.total_expense = exp;
        ev.net_balance = inc - exp;
        return ev;
      });
      events.sort(function(a, b) {
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      });

      return jsonResponse({
        transactions,
        accounts,
        bills,
        events,
      });
    }

    // Support GET-based mutation fallback
    if (action === "addTransaction" && e.parameter.payload) {
      const txn = JSON.parse(decodeURIComponent(e.parameter.payload));
      return executeAddTransaction(ss, txn);
    }

    if (action === "voidTransaction" && e.parameter.transactionId) {
      return executeVoidTransaction(ss, e.parameter.transactionId, e.parameter.actor || "admin", e.parameter.passcode || "");
    }

    if (action === "addBill" && e.parameter.payload) {
      const bill = JSON.parse(decodeURIComponent(e.parameter.payload));
      return executeAddBill(ss, bill);
    }

    if (action === "payBill" && e.parameter.payload) {
      const payData = JSON.parse(decodeURIComponent(e.parameter.payload));
      return executePayBill(ss, payData);
    }

    if (action === "addEvent" && e.parameter.payload) {
      const evt = JSON.parse(decodeURIComponent(e.parameter.payload));
      return executeAddEvent(ss, evt);
    }

    if (action === "addUser" && e.parameter.payload) {
      const user = JSON.parse(decodeURIComponent(e.parameter.payload));
      return executeAddUser(ss, user, e.parameter.actor || "admin@smym.org", e.parameter.passcode || "");
    }

    if (action === "updateUserRole" && e.parameter.payload) {
      const updateData = JSON.parse(decodeURIComponent(e.parameter.payload));
      return executeUpdateUser(ss, updateData, e.parameter.actor || "admin@smym.org", e.parameter.passcode || "");
    }

    if (action === "seedArunapuramLedger") {
      return jsonResponse(seedArunapuramLedger(ss));
    }

    if (action === "seedInitialAccounts") {
      seedAccountsIfEmpty(ss);
      seedUsersIfEmpty(ss);
      seedSettingsIfEmpty(ss);
      return jsonResponse({ success: true, message: "Initial society accounts, users, and settings created." });
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
    const passcode = body.passcode || (e && e.parameter ? e.parameter.passcode : "");
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "verifyPasscode") {
      const email = body.email || (e && e.parameter ? e.parameter.email : "");
      const role = body.role || (e && e.parameter ? e.parameter.role : "EDITOR");
      return executeVerifyPasscode(ss, email, role, passcode);
    }

    if (action === "addTransaction") {
      const txn = body.data || body;
      return executeAddTransaction(ss, txn);
    }

    if (action === "voidTransaction") {
      const idToVoid = body.transactionId || (e && e.parameter ? e.parameter.transactionId : "");
      const actor = body.actor || "admin";
      return executeVoidTransaction(ss, idToVoid, actor, passcode);
    }

    if (action === "addBill") {
      return executeAddBill(ss, body.data || body);
    }

    if (action === "payBill") {
      return executePayBill(ss, body.data || body);
    }

    if (action === "addEvent") {
      return executeAddEvent(ss, body.data || body);
    }

    if (action === "addUser") {
      return executeAddUser(ss, body.data || body, body.actor || "admin@smym.org", passcode);
    }

    if (action === "updateUserRole") {
      return executeUpdateUser(ss, body.data || body, body.actor || "admin@smym.org", passcode);
    }

    if (action === "getUsers") {
      const data = getSheetData(ss, SHEET_NAMES.USERS);
      return jsonResponse(data);
    }

    if (action === "getAuditLogs") {
      const data = getSheetData(ss, SHEET_NAMES.AUDIT_LOG);
      return jsonResponse(data);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Resolves setting value from Settings sheet
 */
function getSetting(ss, key, defaultValue) {
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet || sheet.getLastRow() <= 1) return defaultValue;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === key) {
      return data[i][1] ? data[i][1].toString().trim() : defaultValue;
    }
  }
  return defaultValue;
}

/**
 * Verifies role-based access passcode
 */
function verifyPasscode(ss, role, passcode) {
  if (!passcode) return false;
  const cleanPass = passcode.toString().trim();
  const adminPass = getSetting(ss, "ADMIN_PASSCODE", "SMYM26");
  const editorPass = getSetting(ss, "EDITOR_PASSCODE", "SMYM26");

  if (role === "ADMIN") {
    return cleanPass === adminPass;
  }
  if (role === "EDITOR") {
    return cleanPass === editorPass || cleanPass === adminPass;
  }
  return false;
}

/**
 * Authenticates user via secret passcode and returns verified identity
 */
function executeVerifyPasscode(ss, email, role, passcode) {
  if (!email || !passcode) {
    return jsonResponse({ error: "Email and access passcode are required." }, 400);
  }

  const isValid = verifyPasscode(ss, role, passcode);
  if (!isValid) {
    return jsonResponse({ error: "Invalid access passcode for requested role." }, 401);
  }

  // Look up user in Users sheet
  const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  let matchedUser = null;
  if (userSheet && userSheet.getLastRow() > 1) {
    const data = userSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase() === email.toLowerCase()) {
        if (data[i][4] === "DISABLED") {
          return jsonResponse({ error: "This user account has been deactivated by parish administration." }, 403);
        }
        matchedUser = {
          user_id: data[i][0],
          email: data[i][1],
          display_name: data[i][2],
          role: role,
          status: data[i][4] || "ACTIVE",
        };
        break;
      }
    }
  }

  if (!matchedUser) {
    matchedUser = {
      user_id: "usr_" + new Date().getTime(),
      email: email.toLowerCase(),
      display_name: email.split("@")[0],
      role: role,
      status: "ACTIVE",
    };
  }

  recordAudit(ss, email, "LOGIN", "USER", matchedUser.user_id, "Authenticated successfully as " + role);
  return jsonResponse({ success: true, user: matchedUser });
}

/**
 * Resolves user role from authoritative Users sheet
 */
function getUserRole(ss, email) {
  if (!email) return "PUBLIC_VIEWER";
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet || sheet.getLastRow() <= 1) {
    return "ADMIN";
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().trim().toLowerCase() === email.toString().trim().toLowerCase()) {
      const status = data[i][4];
      if (status !== "ACTIVE") return "PUBLIC_VIEWER";
      return data[i][3] || "PUBLIC_VIEWER";
    }
  }
  return "PUBLIC_VIEWER";
}

/**
 * Appends a new verified transaction record
 */
function executeAddTransaction(ss, txn) {
  if (!txn.amount || Number(txn.amount) <= 0 || !txn.description || !txn.type) {
    return jsonResponse({ error: "Validation failed: Invalid transaction payload." }, 400);
  }

  // Backend authorization check
  const creator = txn.created_by || "anonymous";
  const role = getUserRole(ss, creator);
  if (role === "PUBLIC_VIEWER") {
    return jsonResponse({ error: "Unauthorized: Public viewers cannot record transactions." }, 403);
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
    creator,
    createdAt,
    "",
    ""
  ]);

  // Adjust account current balance in Accounts sheet
  updateAccountBalance(ss, txn.account_id, txn.type, Number(txn.amount));

  // If linked to an event, update event totals
  if (txn.event_id) {
    updateEventTotals(ss, txn.event_id, txn.type, Number(txn.amount));
  }

  // Record audit log entry
  recordAudit(ss, creator, "CREATE", "TRANSACTION", newId, "Created " + txn.type + " of ₹" + txn.amount + ": " + txn.description);

  return jsonResponse({ success: true, transaction_id: newId });
}

/**
 * Updates status of transaction to VOID (Admin Only)
 */
function executeVoidTransaction(ss, idToVoid, actor, passcode) {
  const isAuthorized = (passcode && verifyPasscode(ss, "ADMIN", passcode)) || getUserRole(ss, actor) === "ADMIN";
  if (!isAuthorized) {
    return jsonResponse({ error: "Unauthorized: Admin authorization required to void transactions." }, 403);
  }

  const sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (!sheet) return jsonResponse({ error: "Transactions sheet not found." }, 500);

  const data = sheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idToVoid) {
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
 * Adds a new Bill record
 */
function executeAddBill(ss, bill) {
  if (!bill.bill_name || !bill.vendor || !bill.amount || Number(bill.amount) <= 0) {
    return jsonResponse({ error: "Validation failed: Invalid bill payload." }, 400);
  }

  const creator = bill.created_by || "editor@smym.org";
  const role = getUserRole(ss, creator);
  if (role === "PUBLIC_VIEWER") {
    return jsonResponse({ error: "Unauthorized: Public viewers cannot create bills." }, 403);
  }

  const sheet = ss.getSheetByName(SHEET_NAMES.BILLS);
  if (!sheet) return jsonResponse({ error: "Bills sheet not found." }, 500);

  const billId = bill.bill_id || "bill_" + new Date().getTime();
  sheet.appendRow([
    billId,
    bill.bill_name,
    bill.vendor,
    Number(bill.amount),
    Number(bill.paid_amount || 0),
    bill.due_date || new Date().toISOString().slice(0, 10),
    bill.category || "General",
    bill.status || "PENDING",
    bill.linked_transaction_id || "",
    bill.notes || ""
  ]);

  recordAudit(ss, creator, "CREATE", "BILL", billId, "Created bill: " + bill.bill_name + " (₹" + bill.amount + ")");
  return jsonResponse({ success: true, bill_id: billId });
}

/**
 * Records payment against a Bill and generates a linked transaction
 */
function executePayBill(ss, payData) {
  const billId = payData.bill_id;
  const payAmount = Number(payData.amount);
  if (!billId || !payAmount || payAmount <= 0) {
    return jsonResponse({ error: "Invalid payment amount or bill ID." }, 400);
  }

  const actor = payData.actor || "treasurer";
  const role = getUserRole(ss, actor);
  if (role === "PUBLIC_VIEWER") {
    return jsonResponse({ error: "Unauthorized: Public viewers cannot record payments." }, 403);
  }

  const billSheet = ss.getSheetByName(SHEET_NAMES.BILLS);
  if (!billSheet) return jsonResponse({ error: "Bills sheet not found." }, 500);

  const data = billSheet.getDataRange().getValues();
  let billRow = -1;
  let billName = "";
  let totalAmount = 0;
  let currentPaid = 0;
  let category = "General";

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === billId) {
      billRow = i + 1;
      billName = data[i][1];
      totalAmount = Number(data[i][3]) || 0;
      currentPaid = Number(data[i][4]) || 0;
      category = data[i][6] || "General";
      break;
    }
  }

  if (billRow === -1) {
    return jsonResponse({ error: "Bill not found: " + billId }, 404);
  }

  const newPaid = currentPaid + payAmount;
  const newStatus = newPaid >= totalAmount ? "PAID" : "PARTIALLY_PAID";

  // Generate payment expense transaction
  const txnId = "txn_" + new Date().getTime();
  const txnSheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (txnSheet) {
    txnSheet.appendRow([
      txnId,
      payData.date || new Date().toISOString().slice(0, 10),
      "EXPENSE",
      "Payment for bill: " + billName,
      category,
      payAmount,
      payData.account_id || "acc_01",
      payData.payment_method || "BANK",
      payData.event_id || "",
      billId,
      "COMPLETED",
      actor,
      new Date().toISOString(),
      "",
      ""
    ]);

    updateAccountBalance(ss, payData.account_id || "acc_01", "EXPENSE", payAmount);
  }

  // Update Bill row: col 5 is paid_amount, col 8 is status, col 9 is linked_transaction_id
  billSheet.getRange(billRow, 5).setValue(newPaid);
  billSheet.getRange(billRow, 8).setValue(newStatus);
  billSheet.getRange(billRow, 9).setValue(txnId);

  recordAudit(ss, actor, "UPDATE", "BILL", billId, "Paid ₹" + payAmount + " for " + billName + ". New status: " + newStatus);

  return jsonResponse({ success: true, bill_id: billId, transaction_id: txnId, new_status: newStatus, total_paid: newPaid });
}

/**
 * Adds a new Event record
 */
function executeAddEvent(ss, evt) {
  if (!evt.event_name || !evt.event_date) {
    return jsonResponse({ error: "Validation failed: Event name and date required." }, 400);
  }

  const creator = evt.created_by || "editor@smym.org";
  const role = getUserRole(ss, creator);
  if (role === "PUBLIC_VIEWER") {
    return jsonResponse({ error: "Unauthorized: Public viewers cannot create events." }, 403);
  }

  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  if (!sheet) return jsonResponse({ error: "Events sheet not found." }, 500);

  const eventId = evt.event_id || "evt_" + new Date().getTime();
  sheet.appendRow([
    eventId,
    evt.event_name,
    evt.event_date,
    Number(evt.budget || 0),
    0, // total_income
    0, // total_expense
    evt.status || "UPCOMING"
  ]);

  recordAudit(ss, creator, "CREATE", "EVENT", eventId, "Created event: " + evt.event_name + " with budget ₹" + (evt.budget || 0));
  return jsonResponse({ success: true, event_id: eventId });
}

/**
 * Adds a new User (Admin Only, Passcode/Role Protected)
 */
function executeAddUser(ss, user, actor, passcode) {
  const isAuthorized = (passcode && verifyPasscode(ss, "ADMIN", passcode)) || getUserRole(ss, actor) === "ADMIN";
  if (!isAuthorized) {
    return jsonResponse({ error: "Unauthorized: Only Admins can add authorized users." }, 403);
  }

  if (!user.email || !user.role || !user.display_name) {
    return jsonResponse({ error: "Validation failed: email, role, and display_name required." }, 400);
  }

  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return jsonResponse({ error: "Users sheet not found." }, 500);

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().toLowerCase() === user.email.toLowerCase()) {
      return jsonResponse({ error: "User with this email already exists." }, 400);
    }
  }

  const userId = user.user_id || "usr_" + new Date().getTime();
  const now = new Date().toISOString();
  sheet.appendRow([
    userId,
    user.email.toLowerCase(),
    user.display_name,
    user.role,
    user.status || "ACTIVE",
    now,
    now
  ]);

  recordAudit(ss, actor, "CREATE", "USER", userId, "Added user: " + user.email + " with role " + user.role);
  return jsonResponse({ success: true, user_id: userId });
}

/**
 * Updates User Role & Status (Admin Only, Passcode/Role Protected, Prevent Self-Promotion)
 */
function executeUpdateUser(ss, updateData, actor, passcode) {
  const isAuthorized = (passcode && verifyPasscode(ss, "ADMIN", passcode)) || getUserRole(ss, actor) === "ADMIN";
  if (!isAuthorized) {
    return jsonResponse({ error: "Unauthorized: Only Admins can modify user permissions." }, 403);
  }

  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return jsonResponse({ error: "Users sheet not found." }, 500);

  const data = sheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    const rowUserId = data[i][0];
    const rowUserEmail = data[i][1].toString().toLowerCase();

    if (rowUserId === updateData.user_id || (updateData.email && rowUserEmail === updateData.email.toLowerCase())) {
      // Prevent self-promotion or self-modification
      if (actor && rowUserEmail === actor.toLowerCase()) {
        return jsonResponse({ error: "Forbidden: You cannot modify your own role or permissions." }, 403);
      }

      if (updateData.role) {
        sheet.getRange(i + 1, 4).setValue(updateData.role);
      }
      if (updateData.status) {
        sheet.getRange(i + 1, 5).setValue(updateData.status);
      }
      sheet.getRange(i + 1, 7).setValue(new Date().toISOString());

      recordAudit(ss, actor, "UPDATE", "USER", rowUserId, "Updated user " + rowUserEmail + " to role: " + (updateData.role || data[i][3]) + ", status: " + (updateData.status || data[i][4]));
      found = true;
      break;
    }
  }

  if (!found) {
    return jsonResponse({ error: "User not found." }, 404);
  }

  return jsonResponse({ success: true, message: "User permissions updated successfully." });
}

/**
 * Updates event totals when transactions are linked to it
 */
function updateEventTotals(ss, eventId, type, amount) {
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === eventId) {
      if (type === "INCOME") {
        const currentIncome = Number(data[i][4]) || 0;
        sheet.getRange(i + 1, 5).setValue(currentIncome + amount);
      } else if (type === "EXPENSE") {
        const currentExpense = Number(data[i][5]) || 0;
        sheet.getRange(i + 1, 6).setValue(currentExpense + amount);
      }
      break;
    }
  }
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
      let val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone() || "Asia/Kolkata", "yyyy-MM-dd");
      }
      obj[headers[j]] = val;
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
    "bill_id", "bill_name", "vendor", "amount", "paid_amount", "due_date", "category", "status", "linked_transaction_id", "notes"
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

  // Pre-seed accounts, users & settings if empty
  seedAccountsIfEmpty(ss);
  seedUsersIfEmpty(ss);
  seedSettingsIfEmpty(ss);
}

function seedAccountsIfEmpty(ss) {
  const accSheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (accSheet && accSheet.getLastRow() <= 1) {
    accSheet.appendRow(["acc_01", "Federal Bank - Operating Account", "BANK", 150000, 150000, true]);
    accSheet.appendRow(["acc_02", "Cash in Hand (Treasurer)", "CASH", 15000, 15000, true]);
    accSheet.appendRow(["acc_03", "Youth Mission & Charity Fund", "BANK", 50000, 50000, true]);
  }
}

function seedUsersIfEmpty(ss) {
  const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (userSheet && userSheet.getLastRow() <= 1) {
    const now = new Date().toISOString();
    userSheet.appendRow(["usr_01", "admin@smym.org", "Fr. Director / Treasurer", "ADMIN", "ACTIVE", now, now]);
    userSheet.appendRow(["usr_02", "editor@smym.org", "Youth Secretary", "EDITOR", "ACTIVE", now, now]);
    userSheet.appendRow(["usr_03", "visitor@smym.org", "Parish Member", "PUBLIC_VIEWER", "ACTIVE", now, now]);
  }
}

function seedSettingsIfEmpty(ss) {
  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (settingsSheet && settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(["ADMIN_PASSCODE", "SMYM26", "Master passcode for parish director/treasurer admin privileges"]);
    settingsSheet.appendRow(["EDITOR_PASSCODE", "SMYM26", "Passcode for youth society editors to record entries"]);
    settingsSheet.appendRow(["SOCIETY_NAME", "SMYM Youth Society", "Official parish youth society title"]);
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

/**
 * One-click Arunapuram Ledger Seeder:
 * Populates all 55 verified ledger transactions from SMYM ARUNAPURAM (Dec 2024 - Oct 2026),
 * along with the starting balance ₹40,000, 3 accounts totaling ₹2,093, 7 parish events, and settings.
 * Select 'seedArunapuramLedger' in Apps Script editor and click 'Run'.
 */
function seedArunapuramLedger(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Initialize tabs if missing
  initializeDatabaseTabs();

  // 2. Settings tab
  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (settingsSheet) {
    settingsSheet.clear();
    settingsSheet.appendRow(["setting_key", "setting_value", "description"]);
    settingsSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#ecfdf5");
    settingsSheet.appendRow(["SOCIETY_NAME", "SMYM Arunapuram", "Official parish youth society title"]);
    settingsSheet.appendRow(["ADMIN_PASSCODE", "SMYM26", "Master passcode for parish director/treasurer admin privileges"]);
    settingsSheet.appendRow(["EDITOR_PASSCODE", "SMYM26", "Passcode for youth society editors to record entries"]);
  }

  // 3. Accounts tab (Opening ₹40,000, Current ₹2,093)
  const accSheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (accSheet) {
    accSheet.clear();
    accSheet.appendRow(["account_id", "account_name", "account_type", "opening_balance", "current_balance", "is_active"]);
    accSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#ecfdf5");
    accSheet.appendRow(["acc_01", "Treasurer - Operating Account", "BANK", 40000, 1643, true]);
    accSheet.appendRow(["acc_02", "Cash in Hand (Treasurer)", "CASH", 0, 300, true]);
    accSheet.appendRow(["acc_03", "Cash in Hand (ast.Vicar)", "CASH", 0, 150, true]);
  }

  // 4. Events tab
  const evtSheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  if (evtSheet) {
    evtSheet.clear();
    evtSheet.appendRow(["event_id", "event_name", "event_date", "budget", "total_income", "total_expense", "status"]);
    evtSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#ecfdf5");
    evtSheet.appendRow(["evt_cake_2024", "Cake Mela 2024", "2024-12-23", 15000, 11760, 200, "COMPLETED"]);
    evtSheet.appendRow(["evt_holyweek_2025", "Holy Week 2025", "2025-04-20", 3000, 0, 2003, "COMPLETED"]);
    evtSheet.appendRow(["evt_payasam_2025", "Payasam Mela 2025", "2025-09-04", 25000, 31200, 26040, "COMPLETED"]);
    evtSheet.appendRow(["evt_carol_2025", "Christmas Carol 2025", "2025-12-25", 15000, 10496, 14357, "COMPLETED"]);
    evtSheet.appendRow(["evt_cake_2025", "Cake Mela 2025", "2025-12-25", 35000, 35325, 32534, "COMPLETED"]);
    evtSheet.appendRow(["evt_football_2026", "Diocese Youth Football Tournament 2026", "2026-04-26", 10000, 0, 7670, "COMPLETED"]);
    evtSheet.appendRow(["evt_payasam_2026", "Payasam Mela 2026", "2026-09-04", 20000, 25841, 19948, "COMPLETED"]);
  }

  // 5. Transactions tab
  const txnSheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (txnSheet) {
    txnSheet.clear();
    txnSheet.appendRow([
      "transaction_id", "date", "type", "description", "category",
      "amount", "account_id", "payment_method", "event_id", "reference_id",
      "status", "created_by", "created_at", "updated_by", "updated_at"
    ]);
    txnSheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#ecfdf5");

    const rawRows = [
      ["txn_01", "2024-12-01", "EXPENSE", "Star Decoration", "Parish & Church Feasts", 2380, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2024-12-01T10:00:00.000Z", "", ""],
      ["txn_02", "2024-12-13", "EXPENSE", "Copy & Print (Cake Mela)", "Event Expenses", 200, "acc_01", "CASH", "evt_cake_2024", "", "COMPLETED", "treasurer@smym.org", "2024-12-13T10:00:00.000Z", "", ""],
      ["txn_03", "2024-12-13", "EXPENSE", "Unit Registration", "Diocese & Forane Dues", 980, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2024-12-13T10:00:00.000Z", "", ""],
      ["txn_04", "2024-12-20", "EXPENSE", "Bill Book", "Administration", 306, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2024-12-20T10:00:00.000Z", "", ""],
      ["txn_05", "2024-12-23", "INCOME", "Cake Mela (Sales Collection)", "Fundraising & Mela", 11760, "acc_01", "CASH", "evt_cake_2024", "", "COMPLETED", "treasurer@smym.org", "2024-12-23T10:00:00.000Z", "", ""],
      ["txn_06", "2025-04-10", "EXPENSE", "Snacks for Sunday School students", "Sunday School & Catechism", 1523, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-04-10T10:00:00.000Z", "", ""],
      ["txn_07", "2025-04-20", "EXPENSE", "Holy Week (Decoration & Food)", "Parish & Church Feasts", 2003, "acc_01", "CASH", "evt_holyweek_2025", "", "COMPLETED", "treasurer@smym.org", "2025-04-20T10:00:00.000Z", "", ""],
      ["txn_08", "2025-04-21", "EXPENSE", "Supplement", "Society Activities", 208, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-04-21T10:00:00.000Z", "", ""],
      ["txn_09", "2025-04-23", "EXPENSE", "Cleaning / Painting (Grotto)", "Parish Maintenance", 5852, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-04-23T10:00:00.000Z", "", ""],
      ["txn_10", "2025-04-24", "EXPENSE", "Fish (Grotto)", "Parish Maintenance", 2890, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-04-24T10:00:00.000Z", "", ""],
      ["txn_11", "2025-05-03", "EXPENSE", "Snacks for Holy communion students", "Sunday School & Catechism", 119, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-05-03T10:00:00.000Z", "", ""],
      ["txn_12", "2025-05-21", "EXPENSE", "Cleaning Side", "Parish Maintenance", 720, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-05-21T10:00:00.000Z", "", ""],
      ["txn_13", "2025-05-27", "EXPENSE", "Motor Rent (Cleaning)", "Equipment Rental", 230, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-05-27T10:00:00.000Z", "", ""],
      ["txn_14", "2025-05-29", "EXPENSE", "Gift (asst.vicar)", "Honorarium & Gifts", 199, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-05-29T10:00:00.000Z", "", ""],
      ["txn_15", "2025-05-31", "EXPENSE", "Bouquet", "Parish & Church Feasts", 400, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-05-31T10:00:00.000Z", "", ""],
      ["txn_16", "2025-06-05", "EXPENSE", "Farewell Gift (Sister)", "Honorarium & Gifts", 900, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-06-05T10:00:00.000Z", "", ""],
      ["txn_17", "2025-07-02", "EXPENSE", "Feast celebration (asst.vicar)", "Parish & Church Feasts", 1259, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-07-02T10:00:00.000Z", "", ""],
      ["txn_18", "2025-07-28", "EXPENSE", "Poster Making Competition", "Competitions & Youth Fest", 1500, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-07-28T10:00:00.000Z", "", ""],
      ["txn_19", "2025-07-31", "EXPENSE", "Registration (രചന മത്സരം)", "Competitions & Youth Fest", 570, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-07-31T10:00:00.000Z", "", ""],
      ["txn_20", "2025-08-03", "EXPENSE", "Min. Balance (Service charge)", "Bank Charges", 2000, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-08-03T10:00:00.000Z", "", ""],
      ["txn_21", "2025-08-04", "EXPENSE", "Vianney day", "Honorarium & Gifts", 900, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-08-04T10:00:00.000Z", "", ""],
      ["txn_22", "2025-08-27", "EXPENSE", "Football competition registration", "Sports & Youth Welfare", 1000, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-08-27T10:00:00.000Z", "", ""],
      ["txn_23", "2025-08-30", "EXPENSE", "Sunday School Onam", "Sunday School & Catechism", 1933, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-08-30T10:00:00.000Z", "", ""],
      ["txn_24", "2025-08-31", "EXPENSE", "Football practice (Turf booking)", "Sports & Youth Welfare", 600, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-08-31T10:00:00.000Z", "", ""],
      ["txn_25", "2025-09-04", "INCOME", "Payasam Mela (Collection & Sales)", "Fundraising & Mela", 31200, "acc_01", "CASH", "evt_payasam_2025", "", "COMPLETED", "treasurer@smym.org", "2025-09-04T10:00:00.000Z", "", ""],
      ["txn_26", "2025-09-04", "EXPENSE", "Payasam Mela (Ingredients & Supplies)", "Event Expenses", 26040, "acc_01", "CASH", "evt_payasam_2025", "", "COMPLETED", "treasurer@smym.org", "2025-09-04T10:00:00.000Z", "", ""],
      ["txn_27", "2025-09-06", "EXPENSE", "Football competition (Food)", "Sports & Youth Welfare", 2210, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-09-06T10:00:00.000Z", "", ""],
      ["txn_28", "2025-09-29", "EXPENSE", "Birthday Celebration & Gift (Vicar)", "Honorarium & Gifts", 3389, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-09-29T10:00:00.000Z", "", ""],
      ["txn_29", "2025-09-30", "EXPENSE", "Badminton shuttlecock", "Sports & Youth Welfare", 1100, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-09-30T10:00:00.000Z", "", ""],
      ["txn_30", "2025-10-04", "EXPENSE", "Birthday Celebration & Gift (ast.Vicar)", "Honorarium & Gifts", 2168, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-10-04T10:00:00.000Z", "", ""],
      ["txn_31", "2025-10-17", "EXPENSE", "SMYM Flag", "Society Assets & Flags", 250, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-10-17T10:00:00.000Z", "", ""],
      ["txn_32", "2025-11-30", "EXPENSE", "Supplement", "Society Activities", 3000, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-11-30T10:00:00.000Z", "", ""],
      ["txn_33", "2025-12-01", "EXPENSE", "Unit Registration", "Diocese & Forane Dues", 1160, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2025-12-01T10:00:00.000Z", "", ""],
      ["txn_34", "2025-12-25", "INCOME", "Christmas Carol (Donations & Collection)", "Carol & Celebrations", 10496, "acc_01", "CASH", "evt_carol_2025", "", "COMPLETED", "treasurer@smym.org", "2025-12-25T10:00:00.000Z", "", ""],
      ["txn_35", "2025-12-25", "EXPENSE", "Christmas Carol (Band & Transport Expenses)", "Event Expenses", 14357, "acc_01", "CASH", "evt_carol_2025", "", "COMPLETED", "treasurer@smym.org", "2025-12-25T10:00:00.000Z", "", ""],
      ["txn_36", "2025-12-25", "INCOME", "Cake Mela (Sales Revenue)", "Fundraising & Mela", 35325, "acc_01", "CASH", "evt_cake_2025", "", "COMPLETED", "treasurer@smym.org", "2025-12-25T10:00:00.000Z", "", ""],
      ["txn_37", "2025-12-25", "EXPENSE", "Cake Mela (Bakery & Packaging Cost)", "Event Expenses", 32534, "acc_01", "CASH", "evt_cake_2025", "", "COMPLETED", "treasurer@smym.org", "2025-12-25T10:00:00.000Z", "", ""],
      ["txn_38", "2026-01-06", "EXPENSE", "Crib Cleaning", "Parish Maintenance", 400, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-01-06T10:00:00.000Z", "", ""],
      ["txn_39", "2026-02-12", "EXPENSE", "Cleaning and refreshment", "Parish Maintenance", 740, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-02-12T10:00:00.000Z", "", ""],
      ["txn_40", "2026-03-07", "EXPENSE", "Womens Day", "Society Activities", 800, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-03-07T10:00:00.000Z", "", ""],
      ["txn_41", "2026-03-20", "EXPENSE", "Kurishinte Vazhi", "Liturgy & Spiritual", 200, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-03-20T10:00:00.000Z", "", ""],
      ["txn_42", "2026-04-09", "EXPENSE", "വിശ്വാസോത്സവം - refreshment", "Sunday School & Catechism", 400, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-04-09T10:00:00.000Z", "", ""],
      ["txn_43", "2026-04-26", "EXPENSE", "Football competition registration", "Sports & Youth Welfare", 850, "acc_01", "CASH", "evt_football_2026", "", "COMPLETED", "treasurer@smym.org", "2026-04-26T10:00:00.000Z", "", ""],
      ["txn_44", "2026-05-02", "EXPENSE", "Football Jersey", "Sports & Youth Welfare", 6820, "acc_01", "CASH", "evt_football_2026", "", "COMPLETED", "treasurer@smym.org", "2026-05-02T10:00:00.000Z", "", ""],
      ["txn_45", "2026-06-28", "EXPENSE", "Badminton & Football competition registration", "Sports & Youth Welfare", 1800, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-06-28T10:00:00.000Z", "", ""],
      ["txn_46", "2026-07-02", "EXPENSE", "St.Thomas Quiz and Prize Pool", "Competitions & Youth Fest", 150, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-07-02T10:00:00.000Z", "", ""],
      ["txn_47", "2026-07-05", "EXPENSE", "Social experiment", "Society Activities", 100, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-07-05T10:00:00.000Z", "", ""],
      ["txn_48", "2026-07-12", "EXPENSE", "Football competition registration", "Sports & Youth Welfare", 750, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-07-12T10:00:00.000Z", "", ""],
      ["txn_49", "2026-07-17", "EXPENSE", "Condolence Flowers", "Charity & Welfare", 400, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-07-17T10:00:00.000Z", "", ""],
      ["txn_50", "2026-08-15", "EXPENSE", "Quiz Competition Prize", "Competitions & Youth Fest", 1750, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-08-15T10:00:00.000Z", "", ""],
      ["txn_51", "2026-09-04", "INCOME", "Payasam Mela (Sales Collection)", "Fundraising & Mela", 25841, "acc_01", "CASH", "evt_payasam_2026", "", "COMPLETED", "treasurer@smym.org", "2026-09-04T10:00:00.000Z", "", ""],
      ["txn_52", "2026-09-04", "EXPENSE", "Payasam Mela (Ingredients & Supplies)", "Event Expenses", 19948, "acc_01", "CASH", "evt_payasam_2026", "", "COMPLETED", "treasurer@smym.org", "2026-09-04T10:00:00.000Z", "", ""],
      ["txn_53", "2026-09-27", "EXPENSE", "Gift For Students (Sunday School)", "Sunday School & Catechism", 850, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-09-27T10:00:00.000Z", "", ""],
      ["txn_54", "2026-10-01", "EXPENSE", "Peter (House)", "Charity & Welfare", 2000, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-10-01T10:00:00.000Z", "", ""],
      ["txn_55", "2026-10-04", "EXPENSE", "Birthday Cake (ast.Vicar)", "Honorarium & Gifts", 950, "acc_01", "CASH", "", "", "COMPLETED", "treasurer@smym.org", "2026-10-04T10:00:00.000Z", "", ""],
    ];

    if (rawRows.length > 0) {
      txnSheet.getRange(2, 1, rawRows.length, 15).setValues(rawRows);
    }
  }

  recordAudit(ss, "admin@smym.org", "CREATE", "TRANSACTION", "bulk_ledger", "Seeded 55 transactions for SMYM Arunapuram ledger.");
  return { success: true, count: 55, message: "SMYM Arunapuram complete ledger seeded successfully!" };
}
