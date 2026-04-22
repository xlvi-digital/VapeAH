/**
 * jagoVape Backend - Secured Google Apps Script
 * Copy and paste this code into your Google Apps Script editor.
 */

const SECRET_KEY = "JAGOVAPE_SECURE_2024"; // GANTI KODE INI DAN SAMAKAN DENGAN FRONTEND
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAME = "Sheet1"; // Sesuaikan dengan nama sheet Anda

/**
 * GET Protection: Hanya merespons jika token valid
 */
function doGet(e) {
  try {
    const token = (e.parameter.key || "").trim();

    if (!token) {
      return createErrorResponse("Key is missing in URL", 401);
    }

    if (token !== SECRET_KEY) {
      return createErrorResponse("Key Mismatch (Check backend vs frontend)", 403);
    }

    if (e.parameter.action === "test") {
      return createJsonResponse({ result: "success", message: "Koneksi Berhasil (GET)" });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    const result = data.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        obj[h.toLowerCase().replace(/ /g, "_")] = row[i];
      });
      return obj;
    });

    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse("Gagal memproses permintaan", 500);
  }
}

/**
 * POST Hardening: Validasi Secret Key & Sanitasi Data
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const token = (postData.key || "").trim();

    // 1. Secret Key Implementation
    if (!token) {
      return createErrorResponse("Key is missing in POST body", 401);
    }

    if (token !== SECRET_KEY) {
      return createErrorResponse("Key Mismatch (Check backend vs frontend)", 403);
    }

    if (postData.action === "test") {
      return createJsonResponse({ result: "success", message: "Koneksi Berhasil (POST)" });
    }

    const action = postData.action;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    // 2. Action Routing & Validation
    if (action === "editProduct") {
      return handleEdit(sheet, postData);
    } else if (action === "deleteProduct") {
      return handleDelete(sheet, postData);
    } else if (action === "uploadImage") {
      return handleUploadImage(postData);
    } else if (Array.isArray(postData.data)) {
      // Bulk Upload
      return handleBulkUpload(sheet, postData.data);
    } else {
      // Single Upload
      return handleAdd(sheet, postData);
    }

  } catch (error) {
    return createErrorResponse("Gagal memproses permintaan", 500);
  }
}

/**
 * Validation & Processing Functions
 */

function handleAdd(sheet, data) {
  // Input Sanitization & Type Validation
  const sanitizedNama = sanitize(data.nama);
  const harga = parseInt(data.harga);

  if (isNaN(harga)) return createErrorResponse("Format harga tidak valid", 400);

  const lastId = getLastId(sheet);
  sheet.appendRow([
    lastId + 1,
    sanitizedNama,
    data.kategori,
    harga,
    sanitize(data.deskripsi),
    data.url_gambar,
    data.status_stock,
    new Date() // Menambahkan Timestamp
  ]);

  return createJsonResponse({ result: "success" });
}

function handleEdit(sheet, data) {
  const harga = parseInt(data.harga);
  if (isNaN(harga)) return createErrorResponse("Format harga tidak valid", 400);

  const rows = sheet.getDataRange().getValues();
  // Find row by ID (Column A / Index 0)
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      // Update starting from Column B (Index 2) to Column H (8)
      sheet.getRange(i + 1, 2, 1, 7).setValues([[
        sanitize(data.nama),
        data.kategori,
        harga,
        sanitize(data.deskripsi),
        data.url_gambar,
        data.status_stock,
        new Date() // Update Timestamp
      ]]);
      return createJsonResponse({ result: "success", message: "Produk berhasil diperbarui" });
    }
  }
  return createErrorResponse("Produk dengan ID " + data.id + " tidak ditemukan", 404);
}

function handleDelete(sheet, data) {
  const rows = sheet.getDataRange().getValues();
  // Find row by ID (Column A / Index 0)
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ result: "success", message: "Produk berhasil dihapus" });
    }
  }
  return createErrorResponse("Produk dengan ID " + data.id + " tidak ditemukan", 404);
}

/**
 * Utility Functions
 */

// Input Sanitization: Mencegah XSS & karakter ilegal
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<[^>]*>?/gm, '') // Hapus HTML Tags
    .replace(/[&"']/g, function (m) { // Escape special chars
      return { '&': '&amp;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message, code) {
  // Error Handling: Jangan tampilkan pesan sistem detail
  return ContentService.createTextOutput(JSON.stringify({
    result: "error",
    error: message,
    status: code
  }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getLastId(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  return Math.max(...data.slice(1).map(r => r[0]));
}

function handleBulkUpload(sheet, dataArray) {
  const lastId = getLastId(sheet);
  const timestamp = new Date();
  const rowsToAdd = dataArray.map((data, index) => [
    lastId + index + 1,
    sanitize(data.nama),
    data.kategori,
    parseInt(data.harga) || 0,
    sanitize(data.deskripsi),
    data.url_gambar,
    data.status_stock,
    timestamp
  ]);

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, 8).setValues(rowsToAdd);
  }

  return createJsonResponse({ result: "success", count: rowsToAdd.length });
}

function handleUploadImage(data) {
  try {
    const folder = getOrCreateFolder("jagoVape_Images");
    const blob = Utilities.newBlob(Utilities.base64Decode(data.data), data.mimeType, data.filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return createJsonResponse({
      result: "success",
      url: "https://lh3.googleusercontent.com/d/" + file.getId()
    });
  } catch (e) {
    return createErrorResponse("Gagal mengunggah gambar ke Drive", 500);
  }
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

// ... original utility functions follow ...
