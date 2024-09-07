import {
  ForceReply,
  InlineKeyboardMarkup,
  Message,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  Update,
} from "@grammyjs/types";
import { getCustomerList, isUserRegistered, sendText } from "./data_management";
import {
  handleCreateCustomer,
  handleEmptyCategory,
  handleSelectCategory,
  handleSelectCustomer,
  handleUpdateCustomer,
} from "./handler";
import {
  CATEGORIES,
  CustomerCategory,
  CustomerProperty,
  DoPostEvent,
  PROPERTIES,
  UserCache,
} from "./types";

// Fungsi untuk menyetel webhook
function setWebhook() {
  const response = UrlFetchApp.fetch(`${TELEGRAM_API_URL}${TOKEN}/setWebhook?url=${WEB_APP_URL}`);
  Logger.log(response.getContentText());
}

// Fungsi untuk menangani pesan yang masuk dari webhook
function doPost(e: DoPostEvent): void {
  Logger.log(e.postData.getDataAsString());
  const update: Update = JSON.parse(e.postData.getDataAsString());
  const incomingMessage = update.message;

  if (incomingMessage === undefined) {
    return;
  }

  const chatId = incomingMessage.chat.id;
  const firstName = incomingMessage.chat.first_name;
  const lastName = incomingMessage.chat.last_name;
  const fullName = [firstName, lastName].join(" ").trim();
  // const text = incomingMessage.text ? incomingMessage.text.toLowerCase() : "";

  const rawCache = CacheService.getUserCache().get(String(chatId));
  const cache: UserCache = rawCache ? JSON.parse(rawCache) : {};

  // Mengecek apakah user terdaftar di Google Sheets
  if (!isUserRegistered(chatId)) {
    sendText(
      chatId,
      "Maaf " + fullName + ", Anda belum terdaftar. Hubungi admin untuk pendaftaran."
    );
    CacheService.getUserCache().remove(String(chatId));
    return;
  }

  switch (cache.userState) {
    case "is_selecting_category":
      handleSelectCategory(incomingMessage, cache);
      break;
    case "empty_category":
      handleEmptyCategory(incomingMessage, cache);
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
      
      let categoryList: string[][] = [];
      for(let i = 0; i < CATEGORIES.length; i++) {
        categoryList.push([CATEGORIES[i]])
      }

      sendText(
        chatId,
        "Hai " + fullName + ", Anda sudah terdaftar. Silakan pilih kategori pelanggan.",
        {
          keyboard: categoryList,
          one_time_keyboard: true,
          resize_keyboard: true,
        }
      );
      const newUserCache: UserCache = { ...cache, userState: "is_selecting_category" };
      CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
  }

  return;
}

// Fungsi untuk menampilkan daftar customer berdasarkan kategori dan ID Telegram user
