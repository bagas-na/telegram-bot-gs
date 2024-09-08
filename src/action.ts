import { sendText, updateUserCache } from "./data_management";
import { formatCustomerData, formatPropertySelectionMenu } from "./texts";
import {
  CATEGORY_LIST,
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  FUNNEL_PROPERTIES,
  MAP_PROPS_TO_TEXT,
  PROPERTIES_LIST,
} from "./types";

export function goToSelectCategory(chatId: number, customText?: string): void {
  let defaultText = "**Silahkan pilih kategori pelanggan**\n";
  defaultText += "Langsung klik saja pada tombol yang muncul di bawah!";

  sendText(chatId, customText || defaultText, {
    keyboard: CATEGORY_LIST,
    one_time_keyboard: true,
    resize_keyboard: true,
  });
  updateUserCache(chatId, { userState: "select_category" });
}

export function goToSelectCustomer(
  chatId: number,
  customerList: string[] | null,
  chosenCategory: CustomerCategory
): void {
  const category = chosenCategory;

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
    userState: "select_customer",
    customer_category: category as CustomerCategory,
  });
}

export function goToCreateCustomer(chatId: number, category: CustomerCategory, customerName: string): void {
  let clientText: string;

  clientText = "**KONFIRMASI DATA**\n\n";
  clientText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
  clientText += "------\n";
  clientText += "Kategori: " + category + "\n";
  clientText += "Nama GC: " + customerName + "\n";
  clientText += "------\n\n";
  clientText += "Jika sudah benar dan lurus, silahkan klik tombol **OK**. Jika belum, silahkan klik tombol **Cancel**";

  sendText(chatId, clientText, {
    keyboard: [["OK"], ["CANCEL"]],
    one_time_keyboard: true,
    resize_keyboard: true,
  });

  updateUserCache(chatId, {
    userState: "create_customer",
    customer_name: customerName,
  });
}

export function goToUpdateCustomer(
  chatId: number,
  category: CustomerCategory,
  customerData: CustomerData,
  customText?: string
): void {
  let defaultText: string;
  defaultText = "**KONFIRMASI DATA**\n\n";
  defaultText += "Apakah pelanggan yang terpilih ini sudah benar?\n";

  let clientText = customText || defaultText;
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

export function goToSelectProperty(
  chatId: number,
  category: CustomerCategory,
  customerData: CustomerData | null = null,
  customText?: string
): void {
  // Menampilkan data detail pelanggan saat ini
  if (customerData !== null) {
    let detailedText = "Berikut adalah data pelanggan saat ini.\n\n";
    detailedText += formatCustomerData(customerData);
    sendText(chatId, detailedText);
  }

  // Menampilkan pilihan property dari customer yang bisa diubah
  let clientText = formatPropertySelectionMenu(category);

  sendText(chatId, clientText, {
    keyboard: [...PROPERTIES_LIST, ["CANCEL"]],
    one_time_keyboard: true,
    resize_keyboard: true,
  });

  updateUserCache(chatId, { userState: "select_property" });
}

export function goToUpdateProperty(chatId: number, chosenProperty: CustomerProperty, customerData: CustomerData): void {
  let clientText;
  clientText = `Status ${MAP_PROPS_TO_TEXT[chosenProperty]} untuk pelanggan ini adalah sebagai berikut:\n\n`;
  clientText += `Kategori: ${customerData.customer_category}\n`;
  clientText += `Nama GC: ${customerData.name}\n`;
  clientText += `${MAP_PROPS_TO_TEXT[chosenProperty]}: `;
  sendText(chatId, clientText);

  clientText = (function (property: CustomerProperty) {
    if (chosenProperty === "nilai_project") {
      return "➡️ Masukkan estimasi nilai total proyek pada pelanggan ini.\n\n";
    }
    return `➡️ Klik pada tombol di bawah untuk mengubah status ${MAP_PROPS_TO_TEXT[chosenProperty]}.\n\n`;
  })(chosenProperty);
  clientText += "➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";

  const keyboardOptions: string[][] = (function (property: CustomerProperty) {
    if (property === "submit_proposal") return [["SUDAH"], ["BELUM"], ["CANCEL"]];
    if (FUNNEL_PROPERTIES.includes(property))
      return [["F0 (lead)"], ["F3 (submit)"], ["F4 (negotiation)"], ["F5 (win)"], ["CANCEL"]];
    return [["CANCEL"]];
  })(chosenProperty);

  sendText(chatId, clientText, {
    keyboard: keyboardOptions,
    one_time_keyboard: true,
    resize_keyboard: true,
  });

  updateUserCache(chatId, { userState: "update_property", customer_property: chosenProperty });
}
