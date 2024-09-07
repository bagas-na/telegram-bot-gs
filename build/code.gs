const TOKEN = "7259068797:AAHrOXwLt0SSUX-3ghOZOhi9pmC3XdmEEgk";
const TELEGRAM_API_URL = "https://api.telegram.org/bot";
const WEB_APP_URL = "<apps_script_deployment_web_app_url>";
const SPREADSHEET_ID = "1msM0CAt3UgcST_N5TFTasAQTh0pHhr7jl4b4jEa5aog";
const SHEET_REFERENSI = "REFERENSI";
const SHEET_DATA = "DATA";

const CATEGORIES = ["RSUD", "PUSKESMAS", "SEKOLAH NEGERI", "DINAS", "SETDA", "BAPENDA", "POLDA"];
const PROPERTIES = [
  "submit_proposal",
  "connectivity",
  "eazy",
  "oca",
  "digiclinic",
  "pijar",
  "sprinthink",
  "nilai_project",
];

// Fungsi untuk menyetel webhook
function setWebhook() {
  const response = UrlFetchApp.fetch(`${TELEGRAM_API_URL}${TOKEN}/setWebhook?url=${WEB_APP_URL}`);
  Logger.log(response.getContentText());
}

// Fungsi untuk menangani pesan yang masuk dari webhook
function doPost(e) {
  Logger.log(e.postData.getDataAsString());

  const update = JSON.parse(e.postData.getDataAsString());
  const incomingMessage = update.message;
  if (incomingMessage === undefined) {
    return;
  }

  const chatId = incomingMessage.chat.id;
  const firstName = incomingMessage.chat.first_name;
  const lastName = incomingMessage.chat.last_name;
  const fullName = [firstName, lastName].join(" ").trim();
  const text = incomingMessage.text ? incomingMessage.text.toLowerCase() : "";
  
  const rawCache = CacheService.getUserCache().get(String(chatId));
  const cache = rawCache ? JSON.parse(rawCache) : {};
  
  // Mengecek apakah user terdaftar di Google Sheets
  if (!isUserRegistered(chatId)) {
    sendText(chatId, "Maaf " + fullName + ", Anda belum terdaftar. Hubungi admin untuk pendaftaran.");
    CacheService.getUserCache().remove(String(chatId));
  }

  switch (cache.userState) {
    case "is_selecting_category":
      handleSelectCategory(incomingMessage, cache);
      break;
    case "is_selecting_customer":
      handleSelectCustomer(incomingMessage, cache);
      break;
    case "create_customer":
      handleCreateCustomer(incomingMessage, cache);
      break;
    case "update_customer":
      handleUpdateCustomer(incomingMessage, cache);
      break;
    default:
      sendText(chatId, "Hai " + fullName + ", Anda sudah terdaftar. Silakan pilih kategori pelanggan.", {
        keyboard: [[...CATEGORIES]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });
      const newUserCache = { ...cache, userState: "is_selecting_category" };
      CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
  }
}
function handleSelectCategory(message, cache) {
  const chatId = message.chat.id;
  const category = message.text ? message.text.toUpperCase() : null;

  // Jika input user tidak sesuai dengan pilihan
  if (category === null || !CATEGORIES.includes(category)) {
    sendText(chatId, "Pilihan kategori tidak ditemukan. Silakan pilih kategori pelanggan.", {
      keyboard: [[...CATEGORIES]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    const newUserCache = { ...cache, userState: "is_selecting_category" };
    CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheet) {
    Logger.log("Spreadsheet ID or sheet name does not exist");
    CacheService.getUserCache().remove(String(chatId));
    return;
  }

  const data = sheet.getDataRange().getValues();
  const customerList = [];
  // Loop melalui data di sheet untuk mencari kecocokan ID Telegram dan Kategori
  for (var i = 1; i < data.length; i++) {
    const dataChatId = data[i][1]; // Kolom B (ID Telegram)
    const dataCategory = data[i][3]; // Kolom D (Kategori)
    const dataCustomerName = data[i][4]; // Kolom E (Nama Customer)
    // Cek kecocokan ID Telegram dan Kategori
    if (String(dataChatId) === String(chatId) && dataCategory === category && dataCustomerName !== "") {
      customerList.push([i, dataCustomerName]); // Tambahkan indeks dan nama customer yang cocok ke daftar
    }
  }
  // Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
  if (customerList.length > 0) {
    const customerText = "Daftar Customer untuk kategori " + category + ":\n" + customerList.join("\n");
    sendText(chatId, customerText);
  }
  else {
    // Jika data customer (kolom E) kosong, kirim pesan bahwa kategori masih kosong
    sendText(chatId, "Kategori " + category + " masih kosong.");
    sendText(chatId, "Apakah Anda ingin menambahkan " + category + " ?", {
      keyboard: [["YA", "TIDAK"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
  }
}
function handleSelectCustomer(message, cache) { }
function handleCreateCustomer(message, cache) { }
function handleUpdateCustomer(message, cache) { }

// Fungsi untuk menampilkan daftar customer berdasarkan kategori dan ID Telegram user
function showCustomerList(chatId, category) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheet) {
    Logger.log("Spreadsheet ID or sheet name does not exist");
    return;
  }
  const data = sheet.getDataRange().getValues();
  const customerList = [];
  // Loop melalui data di sheet untuk mencari kecocokan ID Telegram dan Kategori
  for (var i = 1; i < data.length; i++) {
    const sheetChatId = data[i][1]; // Kolom B (ID Telegram)
    const sheetCategory = data[i][3]; // Kolom D (Kategori)
    const customerName = data[i][4]; // Kolom E (Nama Customer)
    // Cek kecocokan ID Telegram dan Kategori
    if (String(sheetChatId) === String(chatId) && sheetCategory === category) {
      if (customerName) {
        customerList.push(customerName); // Tambahkan nama customer yang cocok ke daftar
      }
    }
  }
  // Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
  if (customerList.length > 0) {
    const customerText = "Daftar Customer untuk kategori " + category + ":\n" + customerList.join("\n");
    sendText(chatId, customerText);
  }
  else {
    // Jika data customer (kolom E) kosong, kirim pesan bahwa kategori masih kosong
    sendText(chatId, "Kategori " + category + " masih kosong.");
    sendText(chatId, "Apakah Anda ingin menambahkan " + category + " ?", {
      keyboard: [["YA", "TIDAK"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
  }
}
// Fungsi untuk menyimpan nama customer ke sheet
function saveCustomerName(chatId, customerName) {
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
function getSelectedCategory(chatId) {
  return CacheService.getUserCache().get(chatId + "_category") || "";
}
// Fungsi untuk memperbarui kategori pelanggan dan ID Telegram
function updateCategory(chatId, category) {
  CacheService.getUserCache().put(chatId + "_category", category); // Simpan kategori sementara di cache
}
// Fungsi untuk mengirim teks ke chat dengan markup keyboard
function sendText(chatId, text, replyMarkup) {
  const data = {
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
function isUserRegistered(chatId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_REFERENSI);
  if (!sheet) {
    Logger.log("Spreadsheet ID or sheet name does not exist");
    return;
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
