import { updateUserCacheD1 } from "../data/d1";
import { sendMessage } from "../data/telegramApi";
import {
	CATEGORY_LIST,
	CustomerCategory,
	CustomerData,
	CustomerProperty,
	Funnel,
	FUNNEL_PROPERTIES,
	MAP_PROPS_TO_TEXT,
	PROPERTIES_LIST,
} from "../types";
import {
	formatCustomerData,
	formatPropertySelectionMenu,
} from "../utils/formats";

// Fungsi yang dijalankan sebelum mengubah userState menjadi "select_category"
export async function goToSelectCategory(
	env: Env,
	chatId: number,
	customText?: string
): Promise<void> {
	let defaultText = "**Silahkan pilih kategori pelanggan**\n";
	defaultText += "Langsung klik saja pada tombol yang muncul di bawah!";

	await sendMessage(env, chatId, customText || defaultText, {
		keyboard: CATEGORY_LIST,
		one_time_keyboard: true,
		resize_keyboard: true,
	});
	await updateUserCacheD1(env, chatId, { user_state: "awaiting_category_selection" });
}

// Fungsi yang dijalankan sebelum mengubah userState menjadi "select_customer"
export async function goToSelectCustomer(
	env: Env,
	chatId: number,
	customerList: CustomerData[],
	chosenCategory: CustomerCategory
): Promise<void> {
	const customerNames = customerList.map((c) => c.customer_name);
	let clientText: string;

	if (customerNames.length === 0) {
		/**
		 * Jika customerNames masih kosong, beri pesan bahwa kategori masih kosong
		 * Kemudian, berikan pilihan:
		 *   YA untuk menambahkan pelanggan
		 *   TIDAK untuk memilih kategori pelanggan kembali
		 */
		await sendMessage(env, chatId, "Kategori " + chosenCategory + " masih kosong.");

		clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
		clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
		clientText +=
			"➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan.";
	} else {
		/**
		 * Jika customerNames.length > 0, tampilkan daftarnya
		 * Kemudian, berikan instruksi untuk memilih.
		 */
		clientText = "Daftar Customer untuk kategori " + chosenCategory + ":\n";
		for (let i = 0; i < customerNames.length; i++) {
			clientText = String(i + 1) + ". " + customerNames[i] + "\n";
		}
		await sendMessage(env, chatId, clientText);

		clientText = "➡️ Ketik `NEW [nama_gc]` untuk menambahkan pelanggan baru.\n";
		clientText += "contoh: **NEW SMA 8 Bandung**.\n\n";
		clientText +=
			"➡️ Ketik `UPDATE [nama_gc]` atau `UPDATE [no. urut]` untuk update informasi pelanggan.\n";
		clientText += "contoh: **UPDATE SMA 3 Bandung**, atau **UPDATE 12**.\n\n";
		clientText +=
			"➡️ Pilih atau ketik **CANCEL** untuk kembali ke pilihan **kategori** pelanggan!";
	}

	// Berikan pilihan CANCEL jika user ingin kembali ke pilihan daftar kategori pelanggan
	await sendMessage(env, chatId, clientText, {
		keyboard: [["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_customer_selection",
		customer_category: chosenCategory,
	});

	return;
}

export async function goToCreateCustomer(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	customerName: string
): Promise<void> {
	let clientText: string;

	clientText = "**KONFIRMASI DATA**\n\n";
	clientText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
	clientText += "------\n";
	clientText += "Kategori: " + category + "\n";
	clientText += "Nama GC: " + customerName + "\n";
	clientText += "------\n\n";
	clientText +=
		"Jika sudah benar dan lurus, silahkan klik tombol **OK**. Jika belum, silahkan klik tombol **Cancel**";

	await sendMessage(env, chatId, clientText, {
		keyboard: [["OK"], ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_customer_creation",
		customer_name: customerName,
	});
}

export async function goToUpdateCustomer(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	customerData: CustomerData,
	customText?: string
): Promise<void> {
	let defaultText: string;
	defaultText = "**KONFIRMASI DATA**\n\n";
	defaultText += "Apakah pelanggan yang terpilih ini sudah benar?\n";
	defaultText += formatCustomerData(customerData);
	defaultText +=
		"\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";

	await sendMessage(env, chatId, customText || defaultText, {
		keyboard: [["OK"], ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_customer_update",
		customer_name: customerData.customer_name,
	});
}

export async function goToSelectProperty(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	customerData?: CustomerData,
	customText?: string
): Promise<void> {
	// Menampilkan data detail pelanggan saat ini
	if (customerData) {
		let detailedText = "Berikut adalah data pelanggan saat ini.\n\n";
		detailedText += formatCustomerData(customerData);
		await sendMessage(env, chatId, detailedText);
	}

	// Menampilkan pilihan property dari customer yang bisa diubah
	let clientText = formatPropertySelectionMenu(category);

	await sendMessage(env, chatId, clientText, {
		keyboard: [...PROPERTIES_LIST, ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, { user_state: "awaiting_property_selection" });
}

export async function goToUpdateProperty(
	env: Env,
	chatId: number,
	chosenProperty: CustomerProperty,
	customerData: CustomerData
): Promise<void> {
	let clientText;
	let keyboardOptions: Array<Array<Funnel | "CANCEL" | "SUDAH" | "BELUM">>;
	clientText = `Status ${MAP_PROPS_TO_TEXT[chosenProperty]} untuk pelanggan ini adalah sebagai berikut:\n\n`;
	clientText += `Kategori: ${customerData.customer_category}\n`;
	clientText += `Nama GC: ${customerData.customer_name}\n`;
	clientText += `${MAP_PROPS_TO_TEXT[chosenProperty]}: `;
	await sendMessage(env, chatId, clientText);

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
			["F0"],
			["F3"],
			["F4"],
			["F5"],
			["CANCEL"],
		];
	} else {
		keyboardOptions = [["CANCEL"]];
	}

	await sendMessage(env, chatId, clientText, {
		keyboard: keyboardOptions,
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_property_update",
		customer_property: chosenProperty,
	});
}
