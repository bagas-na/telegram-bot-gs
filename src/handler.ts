import {
  ForceReply,
  InlineKeyboardMarkup,
  Message,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  Update,
} from "@grammyjs/types";
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
  CATEGORY_LIST,
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  DoPostEvent,
  PROPERTIES,
  PROPERTIES_LIST,
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
import { formatCustomerData, formatPropertySelectionMenu } from "./texts";

export function handleSelectCategory(message: Message & Update.NonChannel, cache: UserCache): void {
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
  
  // Mengambil daftar customer yang sesuai dengan chatId user, dan kategori pelanggan yang sudah dipilih
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
      Logger.log("Invalid command. Entered '" + command + "'. Valid commands include 'NEW', 'UPDATE', and 'CANCEL");
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
  if (chosenProperty === null || !PROPERTIES.includes(chosenProperty as CustomerProperty)) {
    sendText(chatId, "Pilihan tidak ditemukan");
    goToSelectProperty(chatId, category, null);
  }

  const customerData = getCustomerData(chatId, category, customerName) as CustomerData;
  let clientText = "";

  switch (chosenProperty) {
    case "submit_proposal":
      clientText = "Status submit proposal untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "Submit Proposal (sudah/belum): " + customerData.submit_proposal ? "sudah" : "belum" + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Klik pada tombol di bawah untuk mengubah status submit proposal.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
      sendText(chatId, clientText, {
        keyboard: [["SUDAH"], ["BELUM"], ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;
    case "connectivity":
      clientText = "Status opty connectivity untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "Connectivity: " + customerData.connectivity + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Klik pada tombol di bawah untuk mengubah status opty connectivity.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
      sendText(chatId, clientText, {
        keyboard: [["F0 (lead)"], ["F3 (submit)"], ["F4 (negotiation)"], ["F5 (win)"], ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;
    case "eazy":
      clientText = "Status opty Antares Eazy untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "Antares Eazy: " + customerData.eazy + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Klik pada tombol di bawah untuk mengubah status opty Antares Eazy.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
      sendText(chatId, clientText, {
        keyboard: [["F0 (lead)"], ["F3 (submit)"], ["F4 (negotiation)"], ["F5 (win)"], ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;
    case "oca":
      clientText = "Status opty OCA untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "OCA: " + customerData.oca + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Klik pada tombol di bawah ini untuk mengubah status opty OCA.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
      sendText(chatId, clientText, {
        keyboard: [["F0 (lead)"], ["F3 (submit)"], ["F4 (negotiation)"], ["F5 (win)"], ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;
    case "digiclinic":
      clientText = "Status opty Digiclinic untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "Digiclinic: " + customerData.digiclinic + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Klik pada tombol di bawah ini untuk mengubah status opty Digiclinic.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
      sendText(chatId, clientText, {
        keyboard: [["F0 (lead)"], ["F3 (submit)"], ["F4 (negotiation)"], ["F5 (win)"], ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;
    case "pijar":
      clientText = "Status opty Pijar untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "Pijar: " + customerData.pijar + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Klik pada tombol di bawah ini untuk mengubah status opty Pijar.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
      sendText(chatId, clientText, {
        keyboard: [["F0 (lead)"], ["F3 (submit)"], ["F4 (negotiation)"], ["F5 (win)"], ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;
    case "sprinthink":
      clientText = "Status opty Sprinthink untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "Sprinthink: " + customerData.sprinthink + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Klik pada tombol di bawah ini untuk mengubah status opty Sprinthink.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
      sendText(chatId, clientText, {
        keyboard: [["F0 (lead)"], ["F3 (submit)"], ["F4 (negotiation)"], ["F5 (win)"], ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;
    case "nilai_project":
      clientText = "Estimasi nilai proeject untuk pelanggan ini adalah sebagai berikut:\n\n";
      clientText += "Kategori: " + customerData.customer_category + "\n";
      clientText += "Nama GC: " + customerData.name + "\n";
      clientText += "Nilai Project (Rp): " + customerData.nilai_project + "\n";
      sendText(chatId, clientText);

      clientText = "➡️ Masukkan estimasi nilai total proyek pada pelanggan ini.\n\n";
      clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya";
      sendText(chatId, clientText, {
        keyboard: [["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
      break;

    case "CANCEL":
      goToSelectProperty(chatId, category, customerData);
      break;
  }
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
      updateCustomerProperty(chatId, category, customerName, customerProperty, Number(propertyValue));

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
