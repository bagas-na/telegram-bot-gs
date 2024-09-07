function handleSelectCategory(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const category = message.text ? message.text.toUpperCase() : null;

  // Jika input user tidak sesuai dengan pilihan
  if (category === null || !CATEGORIES.includes(category as CustomerCategory)) {
    sendText(chatId, "Pilihan kategori tidak ditemukan. Silakan pilih kategori pelanggan.", {
      keyboard: [[...CATEGORIES]],
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
   *  TIDAK untuk mengakhiri interaksi
   *  KEMBALI untuk memilih kategori pelanggan kembali
   */
  if (customerList === null || customerList.length === 0) {
    sendText(chatId, "Kategori " + category + " masih kosong.");
    sendText(chatId, "Apakah Anda ingin menambahkan " + category + " ?", {
      keyboard: [["YA", "TIDAK", "KEMBALI"]],
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
    customerText = customerText + customerList[1] + "\n";
  }

  sendText(chatId, customerText);
  const newUserCache: UserCache = {
    ...cache,
    userState: "is_selecting_customer",
    customer_category: category as CustomerCategory,
    customer_list: customerList,
  };
  CacheService.getUserCache().put(String(chatId), JSON.stringify(newUserCache));
}

function handleEmptyCategory(message: Message & Update.NonChannel, cache: UserCache): void {
  const chatId = message.chat.id;
  const choice = message.text ? message.text.toUpperCase() : null;


}

function handleSelectCustomer(message: Message & Update.NonChannel, cache: UserCache): void {
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
function handleCreateCustomer(message: Message & Update.NonChannel, cache: UserCache): void {}
function handleUpdateCustomer(message: Message & Update.NonChannel, cache: UserCache): void {}