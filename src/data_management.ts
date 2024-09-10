import { Message } from "@grammyjs/types";
import {
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  Funnel,
  MAP_PROPS_TO_COL,
  ReplyMarkup,
  UserCache,
} from "./types";

export function getCustomerList(
  chatId: number,
  customerCategory: CustomerCategory
): string[] | null {
  const sheetData =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheetData) {
    Logger.log(
      "Cannot get customer list. Spreadsheet ID or sheet name does not exist"
    );
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

// Fungsi untuk mengambil data customer, return null jika tidak ditemukan
export function getCustomerData(
  chatId: number,
  customerCategory: CustomerCategory,
  customerName: string
): CustomerData | null {
  const sheetData =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheetData) {
    Logger.log(
      "Cannot get customer list. Spreadsheet ID or sheet name does not exist"
    );
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
      dataCustomerName.toLowerCase() === customerName.toLowerCase()
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

// Fungsi untuk menyimpan nama customer baru ke sheet
export function saveNewCustomer(
  chatId: number,
  customerCategory: CustomerCategory,
  customerName: string
): void {
  const sheetData =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheetData) {
    Logger.log(
      "Cannot save customer data. Spreadsheet ID or sheet name does not exist"
    );
    return;
  }
  const lastRow = sheetData.getLastRow() + 1;

  const namaAM = getRegisteredUserName(chatId);

  const defaultSubmitProposal = false;
  const defaultConnectivity = "F0";
  const defaultEazy = "F0";
  const defaultOCA = "F0";
  const defaultDigiclinic = "F0";
  const defaultPijar = "F0";
  const defaultSprinthink = "F0";
  const defaultNilaiProyek = 0;

  const value = [
    chatId,
    namaAM,
    customerCategory,
    customerName,
    defaultSubmitProposal,
    defaultConnectivity,
    defaultEazy,
    defaultOCA,
    defaultDigiclinic,
    defaultPijar,
    defaultSprinthink,
    defaultNilaiProyek,
  ];

  sheetData.getRange(lastRow, 2, 1, value.length).setValues([value]);

  // Menyimpan ID Telegram dan kategori ke sheet
  sheetData.getRange(lastRow, 2).setValue(chatId); // Kolom B
  sheetData.getRange(lastRow, 3).setValue(namaAM); // Kolom C
  sheetData.getRange(lastRow, 4).setValue(customerCategory); // Kolom D
  sheetData.getRange(lastRow, 5).setValue(customerName); // Kolom E

  // Nilai default untuk kolom-kolom lainnya
  sheetData.getRange(lastRow, 6).setValue(false); // Submit proposal
  sheetData.getRange(lastRow, 7).setValue("F0"); // Connectivity
  sheetData.getRange(lastRow, 8).setValue("F0"); // Eazy
  sheetData.getRange(lastRow, 9).setValue("F0"); // OCA
  sheetData.getRange(lastRow, 10).setValue("F0"); // Digiclinic
  sheetData.getRange(lastRow, 11).setValue("F0"); // Pijar
  sheetData.getRange(lastRow, 12).setValue("F0"); // Sprinthink
  sheetData.getRange(lastRow, 13).setValue(0); // Nilai project
}

export function updateCustomerProperty(
  chatId: number,
  customerCategory: CustomerCategory,
  customerName: string,
  customerProperty: CustomerProperty,
  propertyValue: boolean | Funnel | number
): void {
  const sheetData =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheetData) {
    Logger.log(
      "Cannot get customer list. Spreadsheet ID or sheet name does not exist"
    );
    return;
  }
  const data = sheetData.getDataRange().getValues();

  // Menyimpan letak barisan data customer tersimpan
  let rowIndex: number = 0;

  // Loop melalui data di sheet untuk mencari kecocokan ID Telegram, Kategori, dan Nama pelanggan
  for (var i = 1; i < data.length; i++) {
    const dataChatId: number = data[i][1]; // Kolom B (ID Telegram)
    const dataCategory = data[i][3] as CustomerCategory; // Kolom D (Kategori)
    const dataCustomerName: string = data[i][4]; // Kolom E (Nama Customer)
    if (
      String(dataChatId) === String(chatId) &&
      dataCategory.toUpperCase() === customerCategory.toUpperCase() &&
      dataCustomerName.toLowerCase() === customerName.toLowerCase()
    ) {
      rowIndex = i + 1;
    }
  }

  if (rowIndex === 0) {
    Logger.log(
      `Customer with id_tele: ${chatId}, kategori: ${customerCategory}, and name: ${customerName} does not exist.`
    );
    return;
  }

  if (!MAP_PROPS_TO_COL[customerProperty]) {
    Logger.log(`Property ${customerProperty} does not exist.`);
  }

  sheetData
    .getRange(rowIndex, MAP_PROPS_TO_COL[customerProperty])
    .setValue(propertyValue);

  return;
}

// Fungsi untuk mengecek apakah user terdaftar di Google Sheets
export function isRegisteredUser(chatId: number): boolean {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_REFERENSI);
  if (!sheet) {
    Logger.log(
      "Cannot check if user is Registered. Spreadsheet ID or sheet name does not exist"
    );
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
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_REFERENSI);
  if (!sheet) {
    Logger.log(
      "Cannot check name of registered user. Spreadsheet ID or sheet name does not exist"
    );
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

// Fungsi untuk mengirim teks ke chat dengan markup keyboard
export async function sendMessage(
  env: Env,
  chatId: number,
  text: string,
  replyMarkup?: ReplyMarkup
): Promise<Response> {
  const apiMethod = "/sendMessage";
  const Url = env.TELEGRAM_API_URL + env.BOT_TOKEN + apiMethod;

  const messageBody = {
    chat_id: chatId,
    text,
    replyMarkup,
  };

  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageBody),
  };

  return await fetch(Url, options);
}

export async function getUserCache(
  env: Env,
  chatId: number
): Promise<UserCache | null> {
  const stmt = env.DATABASE.prepare(
    "SELECT * FROM users WHERE telegram_id = ?1"
  );
  const cache = await stmt.bind(chatId).first<UserCache>();

  return cache;
}

export async function updateUserCache(
  env: Env,
  chatId: number,
  updateCache: UserCache
): Promise<boolean> {
  const stmt = env.DATABASE.prepare(
    "UPDATE user_cache SET user_state = ?1, customer_category = ?2 customer_name = ?3 customer_property = ?4 WHERE telegram_id = ?5"
  );
  const oldCache = await getUserCache(env, chatId);
  const {
    user_state,
    customer_category,
    customer_name,
    customer_property,
  }: UserCache = { ...oldCache, ...updateCache };

  const { success } = await stmt
    .bind(
      user_state,
      customer_category,
      customer_name,
      customer_property,
      chatId
    )
    .all();
  return success;
}
