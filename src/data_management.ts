import {
  ForceReply,
  InlineKeyboardMarkup,
  Message,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  Update,
} from "@grammyjs/types";
import {
  CATEGORIES,
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  DoPostEvent,
  PROPERTIES,
  ReplyMarkup,
  UserCache,
} from "./types";

export function getCustomerList(
  chatId: number,
  customerCategory: CustomerCategory
): string[] | null {
  const sheetData = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheetData) {
    Logger.log("Cannot get customer list. Spreadsheet ID or sheet name does not exist");
    return null;
  }
  const data = sheetData.getDataRange().getValues();
  const customerList: string[] = [];

  // Loop melalui data di sheet untuk mencari kecocokan ID Telegram dan Kategori
  for (var i = 1; i < data.length; i++) {
    const dataChatId: number = data[i][1]; // Kolom B (ID Telegram)
    const dataCategory = data[i][3] as CustomerCategory; // Kolom D (Kategori)
    const dataCustomerName: string = data[i][4]; // Kolom E (Nama Customer)

    // Cek kecocokan ID Telegram dan Kategori
    if (
      String(dataChatId) === String(chatId) &&
      dataCategory === customerCategory &&
      dataCustomerName !== ""
    ) {
      customerList.push(dataCustomerName); // Tambahkan indeks dan nama customer yang cocok ke daftar
    }
  }

  return customerList;
}

// Fungsi untuk menyimpan nama customer baru ke sheet
export function saveNewCustomer(
  chatId: number,
  customerCategory: CustomerCategory,
  customerName: string
): void {
  const sheetData = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheetData) {
    Logger.log("Cannot save customer data. Spreadsheet ID or sheet name does not exist");
    return;
  }
  const lastRow = sheetData.getLastRow() + 1;

  const namaAM = getRegisteredUserName(chatId);

  // Menyimpan ID Telegram dan kategori ke sheet
  sheetData.getRange(lastRow, 2).setValue(chatId); // Kolom B
  sheetData.getRange(lastRow, 3).setValue(namaAM); // Kolom C
  sheetData.getRange(lastRow, 4).setValue(customerCategory); // Kolom D
  sheetData.getRange(lastRow, 5).setValue(customerName); // Kolom E

  // Nilai default untuk kolom-kolom lainnya
  sheetData.getRange(lastRow, 6).setValue(false); // Submit proposal
  sheetData.getRange(lastRow, 7).setValue("F0");  // Connectivity
  sheetData.getRange(lastRow, 8).setValue("F0");  // Eazy
  sheetData.getRange(lastRow, 9).setValue("F0");  // OCA
  sheetData.getRange(lastRow, 10).setValue("F0"); // Digiclinic
  sheetData.getRange(lastRow, 11).setValue("F0"); // Pijar
  sheetData.getRange(lastRow, 12).setValue("F0"); // Sprinthink
  sheetData.getRange(lastRow, 13).setValue(0);    // Nilai project
}

// Fungsi untuk mengambil data customer, return null jika tidak ditemukan
export function getCustomerData(
  chatId: number,
  customerCategory: CustomerCategory,
  customerName: string
): CustomerData | null {
  const sheetData = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheetData) {
    Logger.log("Cannot get customer list. Spreadsheet ID or sheet name does not exist");
    return null;
  }
  const data = sheetData.getDataRange().getValues();

  // Loop melalui data di sheet untuk mencari kecocokan ID Telegram, Kategori, dan Nama pelanggan
  for (var i = 1; i < data.length; i++) {
    const dataChatId: number = data[i][1]; // Kolom B (ID Telegram)
    const dataCategory = data[i][3] as CustomerCategory; // Kolom D (Kategori)
    const dataCustomerName: string = data[i][4]; // Kolom E (Nama Customer)
    if (
      String(dataChatId) === String(chatId) &&
      dataCategory === customerCategory &&
      dataCustomerName.toLocaleLowerCase() === customerName.toLocaleLowerCase()
    ) {
      return {
        customer_category: dataCategory,
        name: dataCustomerName,
        submit_proposal: data[i][5], // Kolom F
        connectivity: data[i][6], // Kolom G
        eazy: data[i][7], // Kolom H
        oca: data[i][8], // Kolom I
        digiclinic: data[i][9], // Kolom J
        pijar: data[i][10], // Kolom K
        sprinthink: data[i][11], // Kolom L
        nilai_project: data[i][12], // Kolom M
      };
    }
  }

  return null;
}

export function formatCustomerData(customerData: CustomerData): string {
  let formatText = "------\n";
  formatText += "Kategori: " + customerData.customer_category + "\n";
  formatText += "Nama GC: " + customerData.name + "\n";
  formatText += "Submit Proposal (ya/tidak): " + customerData.submit_proposal ? "ya" : "tidak" + "\n";
  formatText += "Connectivity: " + customerData.connectivity + "\n";
  formatText += "Antares Eazy: " + customerData.eazy + "\n";
  formatText += "OCA: " + customerData.oca + "\n";
  formatText += "Digiclinic: " + customerData.digiclinic + "\n";
  formatText += "Pijar: " + customerData.pijar + "\n";
  formatText += "Sprinthink: " + customerData.sprinthink + "\n";
  formatText += "Nilai Project (Rp): " + customerData.nilai_project + "\n";
  formatText += "------\n";

  return formatText
}

// Fungsi untuk mengirim teks ke chat dengan markup keyboard
export function sendText(chatId: number, text: string, replyMarkup?: ReplyMarkup): void {
  const data: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(replyMarkup || {}), // Memastikan replyMarkup dikirim dengan benar
    },
  };

  // Mengirim request ke API Telegram
  UrlFetchApp.fetch(`${TELEGRAM_API_URL}${TOKEN}/sendMessage`, data);
}

// Fungsi untuk mengecek apakah user terdaftar di Google Sheets
export function isRegisteredUser(chatId: number): boolean {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_REFERENSI);
  if (!sheet) {
    Logger.log("Cannot check if user is Registered. Spreadsheet ID or sheet name does not exist");
    return false;
  }

  const data = sheet.getRange("A2:A50").getValues(); // Ambil semua ID dari kolom A

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(chatId)) {
      // Bandingkan ID dengan ID yang ada di sheet
      return true;
    }
  }

  return false;
}

export function getRegisteredUserName(chatId: number): string | null {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_REFERENSI);
  if (!sheet) {
    Logger.log("Cannot check name of registered user. Spreadsheet ID or sheet name does not exist");
    return null;
  }

  const data = sheet.getRange("A2:A50").getValues(); // Ambil semua ID dari kolom A

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(chatId)) {
      // Bandingkan ID dengan ID yang ada di sheet
      return data[i][2]; // nama AM (kolom C)
    }
  }

  return null;
}

export function getUserCache(chatId: number): UserCache {
  const rawCache = CacheService.getUserCache().get(String(chatId));
  const cache: UserCache = rawCache ? JSON.parse(rawCache) : {};

  return cache;
}

export function updateUserCache(chatId: number, updateCache: UserCache): void {
  const oldCache = getUserCache(chatId);

  const newCache = { ...oldCache, ...updateCache };
  CacheService.getUserCache().put(String(chatId), JSON.stringify(newCache));
}

// Fungsi untuk mendapatkan kategori yang dipilih oleh user
function getSelectedCategory(chatId: number) {
  return CacheService.getUserCache().get(chatId + "_category") || "";
}

// Fungsi untuk memperbarui kategori pelanggan dan ID Telegram
function updateCategory(chatId: number, category: CustomerCategory) {
  CacheService.getUserCache().put(chatId + "_category", category); // Simpan kategori sementara di cache
}
