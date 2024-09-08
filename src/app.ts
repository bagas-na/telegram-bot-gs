import { Update } from "@grammyjs/types";
import { goToSelectCategory } from "./action";
import { getUserCache, isRegisteredUser, sendText } from "./data_management";
import {
  handleCreateCustomer,
  handleSelectCategory,
  handleSelectCustomer,
  handleSelectProperty,
  handleUpdateCustomer,
  handleUpdateProperty,
} from "./handler";
import { DoPostEvent } from "./types";

// Fungsi untuk menyetel webhook
function setWebhook() {
  const response = UrlFetchApp.fetch(`${TELEGRAM_API_URL}${TOKEN}/setWebhook?url=${WEB_APP_URL}`);
  Logger.log(response.getContentText());
}

// Fungsi untuk menangani pesan yang masuk dari webhook
// Entry point dari program ini
function doPost(e: DoPostEvent): void {
  Logger.log(e.postData.getDataAsString());
  const update: Update = JSON.parse(e.postData.getDataAsString());
  const incomingMessage = update.message;

  if (incomingMessage === undefined) {
    Logger.log("Message is empty, exit from doPost()");
    return;
  }

  const chatId = incomingMessage.chat.id;
  const firstName = incomingMessage.chat.first_name;
  const lastName = incomingMessage.chat.last_name;
  const fullName = [firstName, lastName].join(" ").trim();

  const cache = getUserCache(chatId);

  // Mengecek apakah user terdaftar di Google Sheets
  if (!isRegisteredUser(chatId)) {
    sendText(chatId, "Maaf " + fullName + ", Anda belum terdaftar. Hubungi admin untuk pendaftaran.");
    CacheService.getUserCache().remove(String(chatId));
    return;
  }

  switch (cache.userState) {
    case "select_category":
      handleSelectCategory(incomingMessage);
      break;
    case "select_customer":
      handleSelectCustomer(incomingMessage, cache);
      break;
    case "create_customer":
      handleCreateCustomer(incomingMessage, cache);
      break;
    case "update_customer":
      handleUpdateCustomer(incomingMessage, cache);
      break;
    case "select_property":
      handleSelectProperty(incomingMessage, cache);
      break;
    case "update_property":
      handleUpdateProperty(incomingMessage, cache);
      break;
    default:
      sendText(chatId, `Hai ${fullName}, Anda sudah terdaftar`);
      goToSelectCategory(chatId);
  }

  return;
}
