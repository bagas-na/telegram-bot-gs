import {
  ForceReply,
  InlineKeyboardMarkup,
  Message,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  Update,
} from "@grammyjs/types";
import { getCustomerList, sendText } from "./data_management";
import {
  CATEGORIES,
  CATEGORY_LIST,
  CustomerCategory,
  CustomerProperty,
  DoPostEvent,
  PROPERTIES,
  UserCache,
} from "./types";

export function handleSelectCategory(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const category = message.text ? message.text.toUpperCase() : null;

  // Jika input user tidak sesuai dengan pilihan
  if (category === null || !CATEGORIES.includes(category as CustomerCategory)) {
    let categoryList: string[][] = [];
    for (let i = 0; i < CATEGORIES.length; i++) {
      categoryList.push([CATEGORIES[i]]);
    }

    sendText(chatId, "Pilihan kategori tidak ditemukan. Silakan pilih kategori pelanggan.", {
      keyboard: CATEGORY_LIST,
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    const newUserCache: UserCache = { ...cache, userState: "is_selecting_category" };
    CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
  }

  const customerList = getCustomerList(chatId, category as CustomerCategory);

  /**
   * Jika data customer (kolom E) kosong, kirim pesan bahwa kategori masih kosong
   * Kemudian, berikan pilihan:
   *  YA untuk menambahkan pelanggan
   *  TIDAK untuk memilih kategori pelanggan kembali
   */
  if (customerList === null || customerList.length === 0) {
    sendText(chatId, "Kategori " + category + " masih kosong.");
    sendText(chatId, "Apakah Anda ingin menambahkan " + category + " ?", {
      keyboard: [["YA"], ["TIDAK"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    });
    const newUserCache: UserCache = {
      ...cache,
      userState: "empty_category",
      customer_category: category as CustomerCategory,
      customer_list: customerList,
    };
    CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
    return;
  }

  // Jika ada customer yang cocok dan tidak kosong, tampilkan daftarnya
  let customerText = "Daftar Customer untuk kategori " + category + ":\n";
  for (let i = 0; i < customerList.length; i++) {
    customerText = String(i + 1) + ". " + customerText + customerList[1] + "\n";
  }
  sendText(chatId, customerText);

  let optionText = "➡️ Pilih atau Ketik `NEW` untuk menambahkan pelanggan baru \n\n";
  optionText +=
    "➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan\n";
  optionText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**";
  sendText(chatId, customerText);

  const newUserCache: UserCache = {
    ...cache,
    userState: "is_selecting_customer",
    customer_category: category as CustomerCategory,
    customer_list: customerList,
  };
  CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
}

export function handleEmptyCategory(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const choice = message.text ? message.text.toUpperCase() : null;
  const category = cache.customer_category as string;
  let newUserCache: UserCache;
  let customerText: string;

  switch (choice) {
    case "YA":
      // Membuat pelanggan baru
      customerText = "Masukkan nama pelanggan baru untuk kategori " + category;
      sendText(chatId, customerText);

      newUserCache = {
        ...cache,
        userState: "create_customer",
      };
      CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
      break;

    case "TIDAK":
      // Kembali memilih kategori pelanggan
      customerText = "Silahkan memilih kategori pelanggan";
      sendText(chatId, customerText,
        {
          keyboard: CATEGORY_LIST,
          one_time_keyboard: true,
          resize_keyboard: true,
        }
      );
      newUserCache = {
        ...cache,
        userState: "is_selecting_category",
      };
      CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
      break;
  }

  return;
}

export function handleSelectCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const text = message.text ? message.text.toUpperCase() : null;
  const category = cache.customer_category as string;
  let newUserCache: UserCache;
  let customerText: string;


  // let customerText = "Customer yang anda pilih adalah" + customerName + ":\n";
  // for (let i = 0; i < customerList.length; i++) {
  //   customerText = customerText + customerList[1] + "\n";
  // }
  // sendText(chatId, customerText);
  // const newUserCache: UserCache = {
  //   ...cache,
  //   userState: "is_selecting_customer",
  //   customer_category: category as CustomerCategory,
  //   customer_list: customerList,
  // };
  // CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
}
export function handleCreateCustomer(
  message: Message & Update.NonChannel,
  cache: UserCache
): void {}
export function handleUpdateCustomer(
  message: Message & Update.NonChannel,
  cache: UserCache
): void {}
