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
  PROPERTIES_LIST,
  UserCache,
} from "./types";

export function handleSelectCategory(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const chosenCategory = message.text ? message.text.toUpperCase() : null;

  // Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
  if (chosenCategory === null || !CATEGORIES.includes(chosenCategory as CustomerCategory)) {
    sendText(chatId, "Pilihan kategori tidak ditemukan. Silakan pilih kategori pelanggan.", {
      keyboard: CATEGORY_LIST,
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    updateUserCache(chatId, { userState: "is_selecting_category" });

    return;
  }

  // Mengambil daftar customer yang sesuai dengan chatId user, dan kategori pelanggan yang sudah dipilih
  const customerList = getCustomerList(chatId, chosenCategory as CustomerCategory);

  if (customerList === null || customerList.length === 0) {
    /**
     * Jika tidak ada customer (kolom E) yang sesuai, kirim pesan bahwa kategori masih kosong
     * Kemudian, berikan pilihan:
     *  YA untuk menambahkan pelanggan
     *  TIDAK untuk memilih kategori pelanggan kembali
     */
    sendText(chatId, "Kategori " + chosenCategory + " masih kosong.");

    let clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
    clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
    clientText += "➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan.";

    sendText(chatId, clientText, {
      keyboard: [["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
  } else if (customerList.length > 0) {
    /**
     * Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
     * Kemudian, berikan instruksi untuk memilih.
     */
    let clientText = "Daftar Customer untuk kategori " + chosenCategory + ":\n";
    for (let i = 0; i < customerList.length; i++) {
      clientText = String(i + 1) + ". " + customerList[i] + "\n";
    }
    sendText(chatId, clientText);

    clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
    clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
    clientText += "➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan.\n";
    clientText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**.\n\n";
    clientText += "➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan!";

    sendText(chatId, clientText, {
      keyboard: [["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
  }

  updateUserCache(chatId, {
    userState: "is_selecting_customer",
    customer_category: chosenCategory as CustomerCategory,
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
      Logger.log("Invalid command. Entered '" + command + "'. Valid commands include 'NEW' and 'UPDATE'");
  }
}

export function handleCreateCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const choice = message.text ? message.text.toUpperCase() : null; // YES / NO choice
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;

  let clientText: string;

  switch (choice) {
    case "YA":
      // Membuat pelanggan baru
      saveNewCustomer(chatId, category, customerName);

      const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

      clientText = "Data pelanggan baru telah disimpan dalam kategori " + category + ".\n\n";
      clientText += formatCustomerData(customerData);
      sendText(chatId, clientText);

      clientText = "**Silahkan pilih informasi GC yang ingin di diubah**\n";
      clientText += "Langsung klik saja pada tombol yang muncul di bawah!\n\n";
      (clientText += "**submit_proposal**, apakah proposal masif telah dikirimkan.\n\n"),
        (clientText += "**connectivity**, status funneling layanan Datin/WMS/Indibiz/etc.\n\n"),
        (clientText += "**eazy**, status funneling Antares Eazy.\n\n"),
        (clientText += "**oca**, status funneling OCA.\n\n"),
        (clientText += "**digiclinic**, status funenling Digiclinic.\n\n"),
        (clientText += "**pijar**, status funneling ekosistem Pijar.\n\n"),
        (clientText += "**sprinthink**, status funneling Sprinthink.\n\n"),
        (clientText += "**nilai_project**, estimasi nilai project.\n\n"),
        (clientText += "**CANCEL**, kembali ke daftar pelanggan untuk kategori " + category + ".");

      sendText(chatId, clientText, {
        keyboard: [...PROPERTIES_LIST, ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "is_selecting_property" });
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

        let clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
        clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
        clientText += "➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan.";

        sendText(chatId, clientText, {
          keyboard: [["CANCEL"]],
          one_time_keyboard: true,
          resize_keyboard: true,
        });
      } else if (customerList.length > 0) {
        /**
         * Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
         * Kemudian, berikan instruksi untuk memilih.
         */
        let clientText = "Daftar Customer untuk kategori " + category + ":\n";
        for (let i = 0; i < customerList.length; i++) {
          clientText = String(i + 1) + ". " + customerList[i] + "\n";
        }
        sendText(chatId, clientText);

        clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
        clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
        clientText += "➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan.\n";
        clientText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**.\n\n";
        clientText += "➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan!";

        sendText(chatId, clientText, {
          keyboard: [["CANCEL"]],
          one_time_keyboard: true,
          resize_keyboard: true,
        });
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

export function handleUpdateCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const choice = message.text ? message.text.toUpperCase() : null; // YES / NO choice
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;

  let clientText: string;
  switch (choice) {
    case "YA":
      const customerData = getCustomerData(chatId, category, customerName) as CustomerData;

      clientText = "Berikut adalah data pelanggan saat ini.\n\n";
      clientText += formatCustomerData(customerData);
      sendText(chatId, clientText);

      clientText = "**Silahkan pilih informasi GC yang ingin di diubah**\n";
      clientText += "Langsung klik saja pada tombol yang muncul di bawah!\n\n";
      (clientText += "**submit_proposal**, apakah proposal masif telah dikirimkan.\n\n"),
        (clientText += "**connectivity**, status funneling layanan Datin/WMS/Indibiz/etc.\n\n"),
        (clientText += "**eazy**, status funneling Antares Eazy.\n\n"),
        (clientText += "**oca**, status funneling OCA.\n\n"),
        (clientText += "**digiclinic**, status funenling Digiclinic.\n\n"),
        (clientText += "**pijar**, status funneling ekosistem Pijar.\n\n"),
        (clientText += "**sprinthink**, status funneling Sprinthink.\n\n"),
        (clientText += "**nilai_project**, estimasi nilai project.\n\n"),
        (clientText += "**CANCEL**, kembali ke daftar pelanggan untuk kategori " + category + ".");

      sendText(chatId, clientText, {
        keyboard: [...PROPERTIES_LIST, ["CANCEL"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      });

      updateUserCache(chatId, { userState: "is_selecting_property" });
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

        let clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
        clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
        clientText += "➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan.";

        sendText(chatId, clientText, {
          keyboard: [["CANCEL"]],
          one_time_keyboard: true,
          resize_keyboard: true,
        });
      } else if (customerList.length > 0) {
        /**
         * Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
         * Kemudian, berikan instruksi untuk memilih.
         */
        let clientText = "Daftar Customer untuk kategori " + category + ":\n";
        for (let i = 0; i < customerList.length; i++) {
          clientText = String(i + 1) + ". " + customerList[i] + "\n";
        }
        sendText(chatId, clientText);

        clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
        clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
        clientText += "➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan.\n";
        clientText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**.\n\n";
        clientText += "➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan!";

        sendText(chatId, clientText, {
          keyboard: [["CANCEL"]],
          one_time_keyboard: true,
          resize_keyboard: true,
        });
      }

      updateUserCache(chatId, {
        userState: "is_selecting_customer",
        customer_category: category as CustomerCategory,
        customer_list: customerList,
      });
      break;
  }
}

export function handleRenameCustomer(message: Message & Update.NonChannel, cache: UserCache): void {}

export function handleSelectProperty(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const chosenProperty = message.text ? message.text.toUpperCase() : null;
  const category = cache.customer_category as CustomerCategory;
  const customerName = cache.customer_name as string;

  // Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
  if (chosenProperty === null || !PROPERTIES.includes(chosenProperty as CustomerProperty)) {
    sendText(chatId, "Pilihan tidak ditemukan. Silahkan klik pada tombol yang muncul di bawah!", {
      keyboard: [...PROPERTIES_LIST, ["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });

    updateUserCache(chatId, { userState: "is_selecting_property" });
  }

  const customerData = getCustomerData(chatId, category, customerName) as CustomerData;
  let clientText;

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
  }
}

export function handleUpdateProperty(message: Message & Update.NonChannel, cache: UserCache): void {}

function caseNewCustomer(
  chatId: number,
  category: CustomerCategory,
  customerList: string[],
  customerName: string
): void {
  let clientText;

  if (!customerList.includes(customerName.toLocaleLowerCase())) {
    clientText = "**KONFIRMASI DATA**\n\n";
    clientText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
    clientText += "------\n";
    clientText += "Kategori: " + category + "\n";
    clientText += "Nama GC: " + customerName + "\n";
    clientText += "------\n\n";
    clientText +=
      "Jika sudah benar dan lurus, silahkan klik tombol **OK**. Jika belum, silahkan klik tombol **Cancel**";

    sendText(chatId, clientText, {
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

function caseUpdateCustomer(
  chatId: number,
  category: CustomerCategory,
  customerList: string[],
  customerName: string
): void {
  let clientText;
  const numberRegex = /^-?\d+(\.\d+)?$/; // Regex untuk menentukan apakah suatu string adalah angka
  const customerIndex = numberRegex.test(customerName) ? Number(customerName) : null;

  // Jika no. urut yang digunakan adalah angka valid, konfirmasi menggunakan nama gc
  if (customerIndex && customerIndex > 0 && customerIndex <= customerList.length) {
    const customerData = getCustomerData(chatId, category, customerList[customerIndex - 1]) as CustomerData;

    clientText = "**KONFIRMASI DATA**\n\n";
    clientText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
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

  // Jika no. urut di luar batas, berikan informasi mengenai batasan
  else if (numberRegex.test(customerName)) {
    clientText = "Angka yang anda masukkan, **" + String(customerIndex) + "** berada di luar list ( 1 - ";
    clientText += String(customerList.length + 1) + ").";

    sendText(chatId, clientText, {
      keyboard: [["CANCEL"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    updateUserCache(chatId, { userState: "is_selecting_customer" });
  }

  // Jika menggunakan nama customer, berikan konfirmasi terlebih dahulu
  else if (customerList.includes(customerName.toLocaleLowerCase())) {
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
