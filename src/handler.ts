import { Message, Update } from "@grammyjs/types";
import {
  getCustomerData,
  getCustomerList,
  saveNewCustomer,
  sendText,
  updateCustomerProperty,
  updateUserCache,
} from "./data_management";
import {
  CATEGORIES,
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  PROPERTIES,
  UserCache,
} from "./types";

import {
  goToCreateCustomer,
  goToSelectCategory,
  goToSelectCustomer,
  goToSelectProperty,
  goToUpdateCustomer,
  goToUpdateProperty,
} from "./action";
import { formatCustomerData } from "./texts";



export function handleSelectCategory(message: Message & Update.NonChannel): void {
  const chatId = message.chat.id;
  const chosenCategory = message.text ? message.text.toUpperCase() : null;

  // Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
  if (chosenCategory === null || !CATEGORIES.includes(chosenCategory as CustomerCategory)) {
    goToSelectCategory(
      chatId,
      "Pilihan kategori tidak ditemukan. Silakan pilih kategori pelanggan dari pilihan di bawah ini."
    );
    return;
  }

  /**
   * Jika input user (kategori) sesuai dengan pilihan yang ada (di dalam CATEGORIES):
   *  1. Ambil daftar customer yang sesuai dengan chatId user dan kategori pelanggan
   *     dan masukkan ke dalam customerList
   *  2. Kemudian lakukan perintah tambahan (dalam fungsi goToSelectCustomer()), dan
   *  3. Mengubah value dalam cache (dilakukan di dalam fungsi goToSelectCustomer()):
   *      a. 'userState' -> "select_customer",
   *      b. 'customer_category' -> sesuai pilihan (chose)
   */ 
  const customerList = getCustomerList(chatId, chosenCategory as CustomerCategory);

  goToSelectCustomer(chatId, customerList, chosenCategory as CustomerCategory);
  return;
}

export function handleSelectCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const category = cache.customer_category as CustomerCategory;
  const chatId = message.chat.id;
  const text = message.text;

  const list = getCustomerList(chatId, category);
  const customerList = list ? list.map((name) => name.toLowerCase()) : [];

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
      caseSelectNewCustomer(chatId, category, customerList, customerName);
      break;

    case "UPDATE":
      caseSelectUpdateCustomer(chatId, category, customerList, customerName);
      break;

    case "CANCEL":
      goToSelectCategory(chatId);
      break;

    default:
      Logger.log(
        `Invalid command. Entered '${command}'. Valid commands include 'NEW', 'UPDATE', and 'CANCEL"`
      );
  }
}

export function handleCreateCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const choice = message.text ? message.text.toUpperCase() : null; // YES / NO choice
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;

  let clientText: string = "";

  switch (choice) {
    case "YA":
      // Membuat pelanggan baru
      saveNewCustomer(chatId, category, customerName);

      const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

      // Kirim pesan konfirmasi
      clientText = "Data pelanggan baru telah disimpan dalam kategori " + category + ".\n\n";

      // Kembali ke daftar pilihan property yang akan diubah
      goToSelectProperty(chatId, category, customerData);
      break;

    case "TIDAK":
      // Kembali ke daftar pelanggan
      const customerList = getCustomerList(chatId, category);
      goToSelectCustomer(chatId, customerList, category);
      break;
  }

  return;
}

export function handleUpdateCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const choice = message.text ? message.text.toUpperCase() : null; // YES / NO choice
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;

  let clientText = "";
  switch (choice) {
    case "YA":
      const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

      // Lanjut ke pilihan property yang akan diubah
      goToSelectProperty(chatId, category, customerData);
      break;

    case "TIDAK":
      // Kembali ke daftar pelanggan
      const customerList = getCustomerList(chatId, category);
      goToSelectCustomer(chatId, customerList, category);
      break;
  }
}

export function handleSelectProperty(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const chosenProperty = message.text ? message.text.toUpperCase() : null;
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;

  // Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
  if (chosenProperty === null || ![...PROPERTIES, "CANCEL"].includes(chosenProperty as CustomerProperty)) {
    sendText(chatId, "Pilihan tidak ditemukan");
    goToSelectProperty(chatId, category, null);
    return;
  }

  const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

  if (chosenProperty === "CANCEL") {
    goToSelectProperty(chatId, category, customerData);
    return
  }

  goToUpdateProperty(chatId, chosenProperty as CustomerProperty, customerData)
}

export function handleUpdateProperty(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;
  const customerProperty = cache.customer_property as CustomerProperty;
  const propertyValue = message.text ? message.text.toUpperCase() : null; // true / false / F0 / F3 / F4 / F5 / number
  let clientText: string;
  let customerData: CustomerData;

  if (propertyValue === null) {
    // do nothing
    return;
  }

  if (propertyValue.toUpperCase() === "CANCEL") {
    const customerData = getCustomerData(chatId, category, customerName) as CustomerData;
    goToSelectProperty(chatId, category, customerData);
  }

  switch (customerProperty) {
    case "submit_proposal":
      if (!["SUDAH", "BELUM"].includes(propertyValue)) {
        // do nothing, kalau input tidak sesuai
        break;
      }

      if (propertyValue === "SUDAH") {
        updateCustomerProperty(chatId, category, customerName, customerProperty, true);
      } else if (propertyValue === "BELUM") {
        updateCustomerProperty(chatId, category, customerName, customerProperty, false);
      }
      sendText(chatId, "Data " + customerProperty + " telah diubah.");
      customerData = getCustomerData(chatId, category, customerName) as CustomerData;

      goToSelectProperty(chatId, category, customerData);
      break;

    case "connectivity":
    case "eazy":
    case "oca":
    case "digiclinic":
    case "pijar":
    case "sprinthink":
      if (!["F0 (lead)", "F3 (submit)", "F4 (negotiation)", "F5 (win)"].includes(propertyValue)) {
        // do nothing
        break;
      }

      if (propertyValue === "F0 (lead)") {
        updateCustomerProperty(chatId, category, customerName, customerProperty, "F0");
      } else if (propertyValue === "F3 (submit)") {
        updateCustomerProperty(chatId, category, customerName, customerProperty, "F3");
      } else if (propertyValue === "F4 (negotiation)") {
        updateCustomerProperty(chatId, category, customerName, customerProperty, "F4");
      } else if (propertyValue === "F5 (win)") {
        updateCustomerProperty(chatId, category, customerName, customerProperty, "F5");
      }
      sendText(chatId, "Data " + customerProperty + " telah diubah.");
      customerData = getCustomerData(chatId, category, customerName) as CustomerData;

      goToSelectProperty(chatId, category, customerData);
      break;

    case "nilai_project":
      const numberRegex = /^-?\d+(\.\d+)?$/;
      if (!numberRegex.test(propertyValue)) {
        // do nothing, kalau input bukan angka
        break;
      }
      updateCustomerProperty(
        chatId,
        category,
        customerName,
        customerProperty,
        Number(propertyValue)
      );

      sendText(chatId, "Data " + customerProperty + " telah diubah.");
      customerData = getCustomerData(chatId, category, customerName) as CustomerData;

      goToSelectProperty(chatId, category, customerData);
      break;
  }
}

function caseSelectNewCustomer(
  chatId: number,
  category: CustomerCategory,
  customerList: string[],
  customerName: string
): void {
  let clientText = "";

  if (!customerList.includes(customerName.toLowerCase())) {
    // Nama pelanggan baru tidak duplikat dengan nama yang ada di daftar,
    // konfirmasi pembuatan pelanggan baru
    goToCreateCustomer(chatId, category, customerName);
  } else {
    const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

    clientText = "Pelanggan dengan nama " + customerName + " sudah ada di dalam list.\n\n";
    clientText += formatCustomerData(customerData);
    clientText +=
      "\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";

    sendText(chatId, clientText, {
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

function caseSelectUpdateCustomer(
  chatId: number,
  category: CustomerCategory,
  customerList: string[],
  customerName: string
): void {
  let clientText = "";
  const numberRegex = /^-?\d+(\.\d+)?$/; // Regex untuk menentukan apakah suatu string adalah angka
  const customerIndex = numberRegex.test(customerName) ? Number(customerName) : null;

  // Jika no. urut yang digunakan adalah angka valid, konfirmasi menggunakan nama gc
  if (customerIndex && customerIndex > 0 && customerIndex <= customerList.length) {
    const customerData = getCustomerData(chatId, category, customerName) as CustomerData;
    goToUpdateCustomer(chatId, category, customerData);
  }

  // Jika no. urut di luar batas, berikan informasi mengenai batasan
  else if (numberRegex.test(customerName)) {
    clientText = `Angka yang anda masukkan, **${customerIndex}** berada di luar list ( 1 - ${String(
      customerList.length + 1
    )}).`;

    sendText(chatId, clientText, {
      keyboard: [["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    updateUserCache(chatId, { userState: "select_customer" });
  }

  // Jika menggunakan nama customer, berikan konfirmasi terlebih dahulu
  else if (customerList.includes(customerName.toLowerCase())) {
    const customerData = getCustomerData(chatId, category, customerName) as CustomerData;
    goToUpdateCustomer(chatId, category, customerData);
  }
}
