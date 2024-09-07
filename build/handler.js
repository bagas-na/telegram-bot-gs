"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSelectCategory = handleSelectCategory;
exports.handleEmptyCategory = handleEmptyCategory;
exports.handleSelectCustomer = handleSelectCustomer;
exports.handleCreateCustomer = handleCreateCustomer;
exports.handleUpdateCustomer = handleUpdateCustomer;
exports.handleDeleteCustomer = handleDeleteCustomer;
exports.handleSelectProperty = handleSelectProperty;
exports.handleUpdateProperty = handleUpdateProperty;
const data_management_1 = require("./data_management");
const types_1 = require("./types");
function handleSelectCategory(message, cache) {
    const chatId = message.chat.id;
    const category = message.text ? message.text.toUpperCase() : null;
    // Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
    if (category === null || !types_1.CATEGORIES.includes(category)) {
        let categoryList = [];
        for (let i = 0; i < types_1.CATEGORIES.length; i++) {
            categoryList.push([types_1.CATEGORIES[i]]);
        }
        (0, data_management_1.sendText)(chatId, "Pilihan kategori tidak ditemukan. Silakan pilih kategori pelanggan.", {
            keyboard: types_1.CATEGORY_LIST,
            one_time_keyboard: true,
            resize_keyboard: true,
        });
        (0, data_management_1.updateUserCache)(chatId, { userState: "is_selecting_category" });
        return;
    }
    // Mengambil daftar customer yang sesuai dengan chatId user, dan kategori pelanggan
    const customerList = (0, data_management_1.getCustomerList)(chatId, category);
    /**
     * Jika tidak ada customer (kolom E) yang sesuai, kirim pesan bahwa kategori masih kosong
     * Kemudian, berikan pilihan:
     *  YA untuk menambahkan pelanggan
     *  TIDAK untuk memilih kategori pelanggan kembali
     */
    if (customerList === null || customerList.length === 0) {
        (0, data_management_1.sendText)(chatId, "Kategori " + category + " masih kosong.");
        (0, data_management_1.sendText)(chatId, "Apakah Anda ingin menambahkan " + category + " ?", {
            keyboard: [["YA"], ["TIDAK"]],
            one_time_keyboard: true,
            resize_keyboard: true,
        });
        (0, data_management_1.updateUserCache)(chatId, {
            userState: "empty_category",
            customer_category: category,
            customer_list: customerList,
        });
        return;
    }
    /**
     * Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
     * Kemudian, berikan pilihan:
     *  YA untuk menambahkan pelanggan
     *  TIDAK untuk memilih kategori pelanggan kembali
     */
    let customerText = "Daftar Customer untuk kategori " + category + ":\n";
    for (let i = 0; i < customerList.length; i++) {
        customerText = String(i + 1) + ". " + customerText + customerList[1] + "\n";
    }
    (0, data_management_1.sendText)(chatId, customerText);
    let optionText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru \n";
    optionText += "contoh: **NEW SMA 8 Bandung**\n\n";
    optionText +=
        "➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan\n";
    optionText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**";
    (0, data_management_1.sendText)(chatId, customerText);
    (0, data_management_1.updateUserCache)(chatId, {
        userState: "is_selecting_customer",
        customer_category: category,
        customer_list: customerList,
    });
    return;
}
function handleEmptyCategory(message, cache) {
    const chatId = message.chat.id;
    const choice = message.text ? message.text.toUpperCase() : null;
    const category = cache.customer_category;
    let newUserCache;
    let customerText;
    switch (choice) {
        case "YA":
            // Membuat pelanggan baru
            customerText = "Masukkan nama pelanggan baru untuk kategori " + category;
            (0, data_management_1.sendText)(chatId, customerText);
            (0, data_management_1.updateUserCache)(chatId, { userState: "create_customer" });
            break;
        case "TIDAK":
            // Kembali memilih kategori pelanggan
            customerText = "Silahkan memilih kategori pelanggan";
            (0, data_management_1.sendText)(chatId, customerText, {
                keyboard: types_1.CATEGORY_LIST,
                one_time_keyboard: true,
                resize_keyboard: true,
            });
            (0, data_management_1.updateUserCache)(chatId, { userState: "is_selecting_category" });
            break;
    }
    return;
}
function handleSelectCustomer(message, cache) {
    const category = cache.customer_category;
    const customerList = cache.customer_list
        ? cache.customer_list.map((name) => name.toLocaleLowerCase())
        : [];
    const chatId = message.chat.id;
    const text = message.text;
    if (text === undefined) {
        Logger.log("Message content is empty, exit from handleSelectCustomer()");
        return;
    }
    const [command, ...args] = text.trim().split(" ");
    const customerName = args.join(" ").trim();
    if (customerName === "") {
        Logger.log("Empty command argument");
    }
    let customerText;
    switch (command.toUpperCase()) {
        case "NEW":
            caseNewCustomer(chatId, category, customerList, customerName);
            break;
        case "UPDATE":
            caseUpdateCustomer(chatId, category, customerList, customerName);
            break;
        default:
            Logger.log("Invalid command. Entered '" + command + "'. Valid commands include 'NEW' and 'UPDATE'");
    }
}
function handleCreateCustomer(message, cache) { }
function handleUpdateCustomer(message, cache) { }
function handleDeleteCustomer(message, cache) { }
function handleSelectProperty(message, cache) { }
function handleUpdateProperty(message, cache) { }
function caseNewCustomer(chatId, category, customerList, customerName) {
    let customerText;
    if (!customerList.includes(customerName.toLocaleLowerCase())) {
        customerText = "**KONFIRMASI DATA**\n\n";
        customerText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
        customerText += "------\n";
        customerText += "Kategori: " + category + "\n";
        customerText += "Nama GC: " + customerName + "\n";
        customerText += "------\n\n";
        customerText +=
            "Jika sudah benar dan lurus, silahkan klik tombol **OK**. Jika belum, silahkan klik tombol **Cancel**";
        (0, data_management_1.sendText)(chatId, customerText, {
            keyboard: [["OK"], ["CANCEL"]],
            one_time_keyboard: true,
            resize_keyboard: true,
        });
        (0, data_management_1.updateUserCache)(chatId, { userState: "create_customer" });
    }
    else {
        const customerData = (0, data_management_1.getCustomerData)(chatId, category, customerName);
        customerText = "Pelanggan dengan nama " + customerName + " sudah ada di dalam list.\n\n";
        customerText += (0, data_management_1.formatCustomerData)(customerData);
        customerText +=
            "\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";
        (0, data_management_1.sendText)(chatId, customerText, {
            keyboard: [["OK"], ["CANCEL"]],
            one_time_keyboard: true,
            resize_keyboard: true,
        });
        (0, data_management_1.updateUserCache)(chatId, { userState: "update_customer" });
    }
}
function caseUpdateCustomer(chatId, category, customerList, customerName) {
    let customerText;
    const numberRegex = /^-?\d+(\.\d+)?$/; // Regex untuk menentukan apakah suatu string adalah angka
    const customerIndex = numberRegex.test(customerName) ? Number(customerName) : null;
    // Jika no. urut yang digunakan adalah angka valid, konfirmasi menggunakan nama gc
    if (customerIndex && customerIndex > 0 && customerIndex <= customerList.length) {
        const customerData = (0, data_management_1.getCustomerData)(chatId, category, customerList[customerIndex - 1]);
        customerText = "**KONFIRMASI DATA**\n\n";
        customerText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
        customerText += (0, data_management_1.formatCustomerData)(customerData);
        customerText +=
            "\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";
        (0, data_management_1.sendText)(chatId, customerText, {
            keyboard: [["OK"], ["CANCEL"]],
            one_time_keyboard: true,
            resize_keyboard: true,
        });
        (0, data_management_1.updateUserCache)(chatId, { userState: "update_customer" });
    }
    // Jika no. urut di luar batas, berikan informasi mengenai batasan
    else if (numberRegex.test(customerName)) {
        customerText =
            "Angka yang anda masukkan, **" + String(customerIndex) + "** berada di luar list ( 1 - ";
        customerText += String(customerList.length + 1) + ").";
        (0, data_management_1.sendText)(chatId, customerText);
    }
    // Jika menggunakan nama customer, berikan konfirmasi terlebih dahulu
    else if (customerList.includes(customerName.toLocaleLowerCase())) {
        const customerData = (0, data_management_1.getCustomerData)(chatId, category, customerName);
        customerText = "Pelanggan dengan nama " + customerName + " sudah ada di dalam list.\n\n";
        customerText += (0, data_management_1.formatCustomerData)(customerData);
        customerText +=
            "\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";
        (0, data_management_1.sendText)(chatId, customerText, {
            keyboard: [["OK"], ["CANCEL"]],
            one_time_keyboard: true,
            resize_keyboard: true,
        });
        (0, data_management_1.updateUserCache)(chatId, { userState: "update_customer" });
    }
}
