import {
  ForceReply,
  InlineKeyboardMarkup,
  Message,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  Update,
} from "@grammyjs/types";
import {
  formatCustomerData,
  getCustomerData,
  getCustomerList,
  saveNewCustomer,
  sendText,
  updateUserCache,
} from "./data_management";
import {
  CATEGORIES,
  CATEGORY_LIST,
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  DoPostEvent,
  PROPERTIES,
  UserCache,
} from "./types";

export function handleSelectCategory(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const category = message.text ? message.text.toUpperCase() : null;

  // Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
  if (category === null || !CATEGORIES.includes(category as CustomerCategory)) {
    sendText(chatId, "Pilihan kategori tidak ditemukan. Silakan pilih kategori pelanggan.", {
      keyboard: CATEGORY_LIST,
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    updateUserCache(chatId, { userState: "is_selecting_category" });

    return;
  }

  // Mengambil daftar customer yang sesuai dengan chatId user, dan kategori pelanggan
  const customerList = getCustomerList(chatId, category as CustomerCategory);

  if (customerList === null || customerList.length === 0) {
    /**
     * Jika tidak ada customer (kolom E) yang sesuai, kirim pesan bahwa kategori masih kosong
     * Kemudian, berikan pilihan:
     *  YA untuk menambahkan pelanggan
     *  TIDAK untuk memilih kategori pelanggan kembali
     */
    sendText(chatId, "Kategori " + category + " masih kosong.");
    let customerText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru \n";
    customerText += "contoh: **NEW SMA 8 Bandung**";
    sendText(chatId, customerText);
  } else if (customerList.length > 0) {
    /**
     * Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
     * Kemudian, berikan instruksi untuk memilih.
     */
    let customerText = "Daftar Customer untuk kategori " + category + ":\n";
    for (let i = 0; i < customerList.length; i++) {
      customerText = String(i + 1) + ". " + customerList[i] + "\n";
    }
    sendText(chatId, customerText);

    customerText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru \n";
    customerText += "contoh: **NEW SMA 8 Bandung**\n\n";
    customerText +=
      "➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan\n";
    customerText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**";
    sendText(chatId, customerText);
  }

  updateUserCache(chatId, {
    userState: "is_selecting_customer",
    customer_category: category as CustomerCategory,
    customer_list: customerList,
  });

  return;
}

export function handleSelectCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const category = cache.customer_category as CustomerCategory;
  const chatId = message.chat.id;
  const text = message.text;

  const list = getCustomerList(chatId, category);
  const customerList = list ? list.map((name) => name.toLocaleLowerCase()) : [];

  if (text === undefined) {
    Logger.log("Message content is empty, exit from handleSelectCustomer()");
    return;
  }

  const [command, ...args] = text.trim().split(" ");
  const customerName = args.join(" ").trim();

  if (customerName === "") {
    Logger.log("Empty command argument");
  }

  switch (command.toUpperCase()) {
    case "NEW":
      caseNewCustomer(chatId, category, customerList, customerName);
      break;

    case "UPDATE":
      caseUpdateCustomer(chatId, category, customerList, customerName);
      break;

    default:
      Logger.log(
        "Invalid command. Entered '" + command + "'. Valid commands include 'NEW' and 'UPDATE'"
      );
  }
}

export function handleCreateCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const choice = message.text ? message.text.toUpperCase() : null;
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;

  let customerText: string;

  switch (choice) {
    case "YA":
      // Membuat pelanggan baru
      saveNewCustomer(chatId, category, customerName)
      customerText = "Data pelanggan baru telah disimpan " + category;
      sendText(chatId, customerText);

      // updateUserCache(chatId, { userState: "create_customer" });
      break;

    case "TIDAK":
      // Kembali ke daftar pelanggan
      const customerList = getCustomerList(chatId, category as CustomerCategory);

      if (customerList === null || customerList.length === 0) {
        /**
         * Jika tidak ada customer (kolom E) yang sesuai, kirim pesan bahwa kategori masih kosong
         * Kemudian, berikan pilihan:
         *  YA untuk menambahkan pelanggan
         *  TIDAK untuk memilih kategori pelanggan kembali
         */
        sendText(chatId, "Kategori " + category + " masih kosong.");
        let customerText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru \n";
        customerText += "contoh: **NEW SMA 8 Bandung**";
        sendText(chatId, customerText);
      } else if (customerList.length > 0) {
        /**
         * Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
         * Kemudian, berikan instruksi cara untuk memilih.
         */
        let customerText = "Daftar Customer untuk kategori " + category + ":\n";
        for (let i = 0; i < customerList.length; i++) {
          customerText = String(i + 1) + ". " + customerList[i] + "\n";
        }
        sendText(chatId, customerText);

        customerText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru \n";
        customerText += "contoh: **NEW SMA 8 Bandung**\n\n";
        customerText +=
          "➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan\n";
        customerText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**";
        sendText(chatId, customerText);
      }

      updateUserCache(chatId, {
        userState: "is_selecting_customer",
        customer_category: category as CustomerCategory,
        customer_list: customerList,
      });
      break;
  }

  return;
}

export function handleUpdateCustomer(
  message: Message & Update.NonChannel,
  cache: UserCache
): void {}

export function handleDeleteCustomer(
  message: Message & Update.NonChannel,
  cache: UserCache
): void {}

export function handleSelectProperty(
  message: Message & Update.NonChannel,
  cache: UserCache
): void {}

export function handleUpdateProperty(
  message: Message & Update.NonChannel,
  cache: UserCache
): void {}

function caseNewCustomer(
  chatId: number,
  category: CustomerCategory,
  customerList: string[],
  customerName: string
): void {
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

    sendText(chatId, customerText, {
      keyboard: [["OK"], ["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });

    updateUserCache(chatId, {
      userState: "create_customer",
      customer_name: customerName,
    });
  } else {
    const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

    customerText = "Pelanggan dengan nama " + customerName + " sudah ada di dalam list.\n\n";
    customerText += formatCustomerData(customerData);
    customerText +=
      "\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";

    sendText(chatId, customerText, {
      keyboard: [["OK"], ["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });

    updateUserCache(chatId, {
      userState: "update_customer",
      customer_name: customerData.name,
    });
  }
}

function caseUpdateCustomer(
  chatId: number,
  category: CustomerCategory,
  customerList: string[],
  customerName: string
): void {
  let customerText;
  const numberRegex = /^-?\d+(\.\d+)?$/; // Regex untuk menentukan apakah suatu string adalah angka
  const customerIndex = numberRegex.test(customerName) ? Number(customerName) : null;

  // Jika no. urut yang digunakan adalah angka valid, konfirmasi menggunakan nama gc
  if (customerIndex && customerIndex > 0 && customerIndex <= customerList.length) {
    const customerData = getCustomerData(
      chatId,
      category,
      customerList[customerIndex - 1]
    ) as CustomerData;

    customerText = "**KONFIRMASI DATA**\n\n";
    customerText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
    customerText += formatCustomerData(customerData);
    customerText +=
      "\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";

    sendText(chatId, customerText, {
      keyboard: [["OK"], ["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    updateUserCache(chatId, {
      userState: "update_customer",
      customer_name: customerData.name,
    });
  }

  // Jika no. urut di luar batas, berikan informasi mengenai batasan
  else if (numberRegex.test(customerName)) {
    customerText =
      "Angka yang anda masukkan, **" + String(customerIndex) + "** berada di luar list ( 1 - ";
    customerText += String(customerList.length + 1) + ").";

    sendText(chatId, customerText);
    updateUserCache(chatId, { userState: "is_selecting_customer" });
  }

  // Jika menggunakan nama customer, berikan konfirmasi terlebih dahulu
  else if (customerList.includes(customerName.toLocaleLowerCase())) {
    const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

    customerText = "Pelanggan dengan nama " + customerName + " sudah ada di dalam list.\n\n";
    customerText += formatCustomerData(customerData);
    customerText +=
      "\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";
    sendText(chatId, customerText, {
      keyboard: [["OK"], ["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    updateUserCache(chatId, {
      userState: "update_customer",
      customer_name: customerData.name,
    });
  }
}
