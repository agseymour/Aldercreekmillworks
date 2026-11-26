/**
 * Google Apps Script backend for Alder Creek Millworks
 * Auto-creates a "Saves" tab in your Google Sheet and serves student saves + leaderboards.
 */
function doGet(e) {
  const action = (e.parameter.action || "").toLowerCase();
  const classCode = (e.parameter.classCode || "").toUpperCase().trim();
  const sheet = getOrCreateSheet();

  if (action === "load") {
    const shopName = (e.parameter.shopName || "").trim();
    const pin = (e.parameter.pin || "").trim();
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (
        String(rows[i][0]).toUpperCase() === classCode &&
        String(rows[i][1]).toLowerCase() === shopName.toLowerCase()
      ) {
        const savedPin = String(rows[i][2]);
        if (savedPin && savedPin !== pin) {
          return jsonOut({ ok: false, error: "Incorrect PIN" });
        }
        return jsonOut({ ok: true, saveJson: rows[i][8] });
      }
    }
    return jsonOut({ ok: false, error: "Not found" });
  }

  if (action === "leaderboard") {
    const rows = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < rows.length; i++) {
      if (!classCode || String(rows[i][0]).toUpperCase() === classCode) {
        list.push({
          shopName: rows[i][1],
          stars: Number(rows[i][3]) || 1.0,
          cash: Number(rows[i][4]) || 0,
          act: Number(rows[i][5]) || 1,
          legacyTitle: rows[i][6] || "Woodworker"
        });
      }
    }
    list.sort((a, b) => b.stars - a.stars || b.cash - a.cash);
    return jsonOut({ ok: true, rows: list });
  }

  return jsonOut({ ok: true, status: "Alder Creek Millworks API Online" });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action !== "save") return jsonOut({ ok: false });

    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();
    const classCode = String(data.classCode || "").toUpperCase().trim();
    const shopName = String(data.shopName || "").trim();
    const now = new Date().toISOString();

    const rowValues = [
      classCode,
      shopName,
      String(data.pin || ""),
      Number(data.stars) || 1.0,
      Number(data.cash) || 0,
      Number(data.act) || 1,
      String(data.legacyTitle || "Apprentice"),
      now,
      String(data.saveJson || "")
    ];

    for (let i = 1; i < rows.length; i++) {
      if (
        String(rows[i][0]).toUpperCase() === classCode &&
        String(rows[i][1]).toLowerCase() === shopName.toLowerCase()
      ) {
        sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
        return jsonOut({ ok: true, updated: true });
      }
    }

    sheet.appendRow(rowValues);
    return jsonOut({ ok: true, created: true });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Saves");
  if (!sheet) {
    sheet = ss.insertSheet("Saves");
    sheet.appendRow([
      "ClassCode",
      "ShopName",
      "PIN",
      "Stars",
      "Cash",
      "Act",
      "LegacyTitle",
      "LastUpdated",
      "SaveJSON"
    ]);
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
