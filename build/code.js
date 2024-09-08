import { getUserCache, isRegisteredUser, sendText, updateUserCache, } from "./data_management";
import { handleCreateCustomer, handleRenameCustomer, handleSelectCategory, handleSelectCustomer, handleSelectProperty, handleUpdateCustomer, handleUpdateProperty, } from "./handler";
import { CATEGORY_LIST, } from "./types";
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
    const cache = getUserCache(chatId);
    // Mengecek apakah user terdaftar di Google Sheets
    if (!isRegisteredUser(chatId)) {
        sendText(chatId, "Maaf " + fullName + ", Anda belum terdaftar. Hubungi admin untuk pendaftaran.");
        CacheService.getUserCache().remove(String(chatId));
        return;
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
        case "rename_customer":
            handleRenameCustomer(incomingMessage, cache);
            break;
        case "is_selecting_property":
            handleSelectProperty(incomingMessage, cache);
            break;
        case "update_property":
            handleUpdateProperty(incomingMessage, cache);
            break;
        default:
            let clientText = "Hai " + fullName + ", Anda sudah terdaftar.\n\n";
            clientText += "**Silahkan pilih kategori pelanggan**\n";
            clientText += "Langsung klik saja pada tombol yang muncul di bawah!";
            sendText(chatId, clientText, {
                keyboard: CATEGORY_LIST,
                one_time_keyboard: true,
                resize_keyboard: true,
            });
            updateUserCache(chatId, { userState: "is_selecting_category" });
    }
    return;
}
// Fungsi untuk menampilkan daftar customer berdasarkan kategori dan ID Telegram user
