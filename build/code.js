"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_management_1 = require("./data_management");
const handler_1 = require("./handler");
const types_1 = require("./types");
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
        Logger.log("Message is empty, exit from doPost()");
        return;
    }
    const chatId = incomingMessage.chat.id;
    const firstName = incomingMessage.chat.first_name;
    const lastName = incomingMessage.chat.last_name;
    const fullName = [firstName, lastName].join(" ").trim();
    // const text = incomingMessage.text ? incomingMessage.text.toLowerCase() : "";
    const cache = (0, data_management_1.getUserCache)(chatId);
    // Mengecek apakah user terdaftar di Google Sheets
    if (!(0, data_management_1.isRegisteredUser)(chatId)) {
        (0, data_management_1.sendText)(chatId, "Maaf " + fullName + ", Anda belum terdaftar. Hubungi admin untuk pendaftaran.");
        CacheService.getUserCache().remove(String(chatId));
        return;
    }
    switch (cache.userState) {
        case "is_selecting_category":
            (0, handler_1.handleSelectCategory)(incomingMessage, cache);
            break;
        case "empty_category":
            (0, handler_1.handleEmptyCategory)(incomingMessage, cache);
            break;
        case "is_selecting_customer":
            (0, handler_1.handleSelectCustomer)(incomingMessage, cache);
            break;
        case "create_customer":
            (0, handler_1.handleCreateCustomer)(incomingMessage, cache);
            break;
        case "update_customer":
            (0, handler_1.handleUpdateCustomer)(incomingMessage, cache);
            break;
        case "delete_customer":
            (0, handler_1.handleDeleteCustomer)(incomingMessage, cache);
            break;
        case "is_selecting_property":
            (0, handler_1.handleSelectProperty)(incomingMessage, cache);
            break;
        case "update_property":
            (0, handler_1.handleUpdateProperty)(incomingMessage, cache);
            break;
        default:
            let categoryList = [];
            for (let i = 0; i < types_1.CATEGORIES.length; i++) {
                categoryList.push([types_1.CATEGORIES[i]]);
            }
            (0, data_management_1.sendText)(chatId, "Hai " + fullName + ", Anda sudah terdaftar. Silakan pilih kategori pelanggan.", {
                keyboard: categoryList,
                one_time_keyboard: true,
                resize_keyboard: true,
            });
            (0, data_management_1.updateUserCache)(chatId, { userState: "is_selecting_category" });
    }
    return;
}
// Fungsi untuk menampilkan daftar customer berdasarkan kategori dan ID Telegram user
