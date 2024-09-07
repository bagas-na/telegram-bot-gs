function getCustomerList(
  chatId: number,
  category: CustomerCategory
): Array<[number, string]> | null {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheet) {
    Logger.log("Spreadsheet ID or sheet name does not exist");
    return null;
  }
  const data = sheet.getDataRange().getValues();
  const customerList: Array<[number, string]> = [];

  // Loop melalui data di sheet untuk mencari kecocokan ID Telegram dan Kategori
  for (var i = 1; i < data.length; i++) {
    const dataChatId: number = data[i][1]; // Kolom B (ID Telegram)
    const dataCategory = data[i][3] as CustomerCategory; // Kolom D (Kategori)
    const dataCustomerName: string = data[i][4]; // Kolom E (Nama Customer)

    // Cek kecocokan ID Telegram dan Kategori
    if (
      String(dataChatId) === String(chatId) &&
      dataCategory === category &&
      dataCustomerName !== ""
    ) {
      customerList.push([i, dataCustomerName]); // Tambahkan indeks dan nama customer yang cocok ke daftar
    }
  }

  return customerList;
}

// Fungsi untuk menyimpan nama customer ke sheet
function saveCustomerName(chatId: number, customerName: string) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);

  if (!sheet) {
    Logger.log("Spreadsheet ID or sheet name does not exist");
    return;
  }

  const lastRow = sheet.getLastRow() + 1;
  const category = getSelectedCategory(chatId); // Ambil kategori yang dipilih

  // Menyimpan ID Telegram dan kategori ke sheet
  sheet.getRange(lastRow, 2).setValue(chatId); // Kolom B
  sheet.getRange(lastRow, 4).setValue(category); // Kolom D
  sheet.getRange(lastRow, 5).setValue(customerName); // Kolom E
}

// Fungsi untuk mendapatkan kategori yang dipilih oleh user
function getSelectedCategory(chatId: number) {
  return CacheService.getUserCache().get(chatId + "_category") || "";
}

// Fungsi untuk memperbarui kategori pelanggan dan ID Telegram
function updateCategory(chatId: number, category: CustomerCategory) {
  CacheService.getUserCache().put(chatId + "_category", category); // Simpan kategori sementara di cache
}

// Fungsi untuk mengirim teks ke chat dengan markup keyboard
function sendText(chatId: number, text: string, replyMarkup?: ReplyMarkup): void {
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
function isUserRegistered(chatId: number): boolean {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_REFERENSI);
  if (!sheet) {
    Logger.log("Spreadsheet ID or sheet name does not exist");
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
