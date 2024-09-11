import { updateUserCache } from "./data/d1";
import { sendMessage } from "./data/telegramApi";
import {
  CATEGORY_LIST,
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  FUNNEL_PROPERTIES,
  MAP_PROPS_TO_TEXT,
  PROPERTIES_LIST,
} from "./types";
import { formatCustomerData, formatPropertySelectionMenu } from "./utils";

// Fungsi yang dijalankan sebelum mengubah userState menjadi "select_category"
export function goToSelectCategory(
	env: Env,
	chatId: number,
	customText?: string
): void {
	let defaultText = "**Silahkan pilih kategori pelanggan**\n";
	defaultText += "Langsung klik saja pada tombol yang muncul di bawah!";

	sendMessage(env, chatId, customText || defaultText, {
		keyboard: CATEGORY_LIST,
		one_time_keyboard: true,
		resize_keyboard: true,
	});
	updateUserCache(env, chatId, { user_state: "awaiting_category_selection" });
}

// Fungsi yang dijalankan sebelum mengubah userState menjadi "select_customer"
export function goToSelectCustomer(
	env: Env,
	chatId: number,
	customerList: string[] | null,
	chosenCategory: CustomerCategory
): void {
	const category = chosenCategory;
	let clientText: string;

	if (customerList === null || customerList.length === 0) {
		/**
		 * Jika customerList masih kosong, beri pesan bahwa kategori masih kosong
		 * Kemudian, berikan pilihan:
		 *   YA untuk menambahkan pelanggan
		 *   TIDAK untuk memilih kategori pelanggan kembali
		 */
		sendMessage(env, chatId, "Kategori " + category + " masih kosong.");

		clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
		clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
		clientText +=
			"➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan.";
	} else {
		/**
		 * Jika customerList.length > 0, tampilkan daftarnya
		 * Kemudian, berikan instruksi untuk memilih.
		 */
		clientText = "Daftar Customer untuk kategori " + category + ":\n";
		for (let i = 0; i < customerList.length; i++) {
			clientText = String(i + 1) + ". " + customerList[i] + "\n";
		}
		sendMessage(env, chatId, clientText);

		clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
		clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
		clientText +=
			"➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan.\n";
		clientText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**.\n\n";
		clientText +=
			"➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan!";
	}

	// Berikan pilihan CANCEL jika user ingin kembali ke pilihan daftar kategori pelanggan
	sendMessage(env, chatId, clientText, {
		keyboard: [["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	updateUserCache(env, chatId, {
		user_state: "awaiting_customer_selection",
		customer_category: category as CustomerCategory,
	});

	return;
}

export function goToCreateCustomer(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	customerName: string
): void {
	let clientText: string;

	clientText = "**KONFIRMASI DATA**\n\n";
	clientText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
	clientText += "------\n";
	clientText += "Kategori: " + category + "\n";
	clientText += "Nama GC: " + customerName + "\n";
	clientText += "------\n\n";
	clientText +=
		"Jika sudah benar dan lurus, silahkan klik tombol **OK**. Jika belum, silahkan klik tombol **Cancel**";

	sendMessage(env, chatId, clientText, {
		keyboard: [["OK"], ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	updateUserCache(env, chatId, {
		user_state: "awaiting_customer_creation",
		customer_name: customerName,
	});
}

export function goToUpdateCustomer(
	env: Env,
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

	sendMessage(env, chatId, clientText, {
		keyboard: [["OK"], ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	updateUserCache(env, chatId, {
		user_state: "awaiting_customer_update",
		customer_name: customerData.name,
	});
}

export function goToSelectProperty(
  env: Env,
	chatId: number,
	category: CustomerCategory,
	customerData: CustomerData | null = null,
	customText?: string
): void {
	// Menampilkan data detail pelanggan saat ini
	if (customerData !== null) {
		let detailedText = "Berikut adalah data pelanggan saat ini.\n\n";
		detailedText += formatCustomerData(customerData);
		sendMessage(env, chatId, detailedText);
	}

	// Menampilkan pilihan property dari customer yang bisa diubah
	let clientText = formatPropertySelectionMenu(category);

	sendMessage(env, chatId, clientText, {
		keyboard: [...PROPERTIES_LIST, ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	updateUserCache(env, chatId, { user_state: "awaiting_property_selection" });
}

export function goToUpdateProperty(
  env: Env,
	chatId: number,
	chosenProperty: CustomerProperty,
	customerData: CustomerData
): void {
	let clientText;
	let keyboardOptions;
	clientText = `Status ${MAP_PROPS_TO_TEXT[chosenProperty]} untuk pelanggan ini adalah sebagai berikut:\n\n`;
	clientText += `Kategori: ${customerData.customer_category}\n`;
	clientText += `Nama GC: ${customerData.name}\n`;
	clientText += `${MAP_PROPS_TO_TEXT[chosenProperty]}: `;
	sendMessage(env, chatId, clientText);

	if (chosenProperty === "nilai_project") {
		clientText =
			"➡️ Masukkan estimasi nilai total proyek pada pelanggan ini.\n\n";
		clientText +=
			"➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
	} else {
		clientText = `➡️ Klik pada tombol di bawah untuk mengubah status ${MAP_PROPS_TO_TEXT[chosenProperty]}.\n\n`;
		clientText +=
			"➡️ Pilih atau Ketik **CANCEL** untuk kembali ke menu sebelumnya.";
	}

	if (chosenProperty === "submit_proposal") {
		keyboardOptions = [["SUDAH"], ["BELUM"], ["CANCEL"]];
	} else if (FUNNEL_PROPERTIES.includes(chosenProperty)) {
		keyboardOptions = [
			["F0 (lead)"],
			["F3 (submit)"],
			["F4 (negotiation)"],
			["F5 (win)"],
			["CANCEL"],
		];
	} else {
		keyboardOptions = [["CANCEL"]];
	}

	sendMessage(env, chatId, clientText, {
		keyboard: keyboardOptions,
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	updateUserCache(env, chatId, {
		user_state: "awaiting_property_update",
		customer_property: chosenProperty,
	});
}
