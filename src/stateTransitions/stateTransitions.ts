import { ResponseParameters } from "@grammyjs/types";
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
	formatCustomerDataHTML,
	formatPropertySelectionMenuHTML,
} from "../utils/formats";

// Fungsi yang dijalankan sebelum mengubah userState menjadi "select_category"
export async function goToSelectCategory(
	env: Env,
	chatId: number,
	customText?: string
): Promise<void> {
	console.log("Going to select category...")
	let defaultText = "<strong>Silahkan pilih kategori pelanggan</strong>\n";
	defaultText += "Langsung klik saja pada tombol yang muncul di bawah!";

	await sendMessage(env, chatId, customText || defaultText, "HTML", {
		keyboard: CATEGORY_LIST,
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, { user_state: "awaiting_category_selection" });

	return;
}

// Fungsi yang dijalankan sebelum mengubah userState menjadi "select_customer"
export async function goToSelectCustomer(
	env: Env,
	chatId: number,
	customerList: CustomerData[],
	chosenCategory: CustomerCategory
): Promise<void> {
	console.log("Going to select customer...")
	const customerNames = customerList.map((c) => c.customer_name);
	let clientText: string;
	console.log("Existing customer list. ", customerNames)

	if (customerNames.length === 0) {
		/**
		 * Jika customerNames masih kosong, beri pesan bahwa kategori masih kosong
		 * Kemudian, berikan pilihan:
		 *   YA untuk menambahkan pelanggan
		 *   TIDAK untuk memilih kategori pelanggan kembali
		 */
		await sendMessage(env, chatId, `Kategori <strong>${chosenCategory}</strong> masih kosong.`, "HTML");

		clientText = "➡️ Ketik <strong>NEW [nama_gc]</strong> untuk menambahkan pelanggan baru.\n";
		clientText += "contoh: <strong>NEW SMA 8 Bandung</strong>.\n\n";
		clientText +=
			"➡️ Pilih atau ketik <strong>CANCEL</strong> untuk kembali ke <strong>pilihan kategori pelanggan</strong>.";
	} else {
		/**
		 * Jika customerNames.length > 0, tampilkan daftarnya
		 * Kemudian, berikan instruksi untuk memilih.
		 */
		clientText = `Daftar Customer untuk kategori <strong>${chosenCategory}</strong>:\n`;
		for (let i = 0; i < customerNames.length; i++) {
			clientText += `${String(i + 1)}.) ${customerNames[i]}\n`;
		}
		await sendMessage(env, chatId, clientText, "HTML");

		clientText = "➡️ Ketik <strong>NEW [nama_gc]</strong> untuk menambahkan pelanggan baru.\n";
		clientText += "contoh: <strong>NEW SMA 8 Bandung</strong>.\n\n";
		clientText += "➡️ Ketik <strong>UPDATE [nama_gc]</strong> atau <strong>UPDATE [no. urut]</strong> untuk update informasi pelanggan.\n";
		clientText += "contoh: <strong>UPDATE SMA 3 Bandung</strong>, atau <strong>UPDATE 12</strong>.\n\n";
		clientText +=
			"➡️ Pilih atau ketik <strong>CANCEL</strong> untuk kembali ke pilihan <strong>kategori</strong> pelanggan!";
	}

	// Berikan pilihan CANCEL jika user ingin kembali ke pilihan daftar kategori pelanggan
	await sendMessage(env, chatId, clientText, "HTML", {
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
	console.log("Going to create customer...")
	let clientText: string;

	clientText = "<strong>KONFIRMASI DATA</strong>\n\n";
	clientText += "Apakah data pelanggan yang diinput ini sudah benar?\n";
	clientText += "------\n";
	clientText += `Kategori: <strong>${category}</strong>\n`;
	clientText += `Nama GC: <strong>${customerName}</strong>\n`;
	clientText += "------\n\n";
	clientText +=
		"Jika sudah benar dan lurus, silahkan klik tombol <strong>OK</strong>. Jika belum, silahkan klik tombol <strong>Cancel</strong>";

	await sendMessage(env, chatId, clientText, "HTML", {
		keyboard: [["OK"], ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_customer_creation",
		customer_name: customerName,
	});

	return;
}

export async function goToUpdateCustomer(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	customerData: CustomerData,
	customText?: string
): Promise<void> {
	console.log("Going to update customer...")
	let defaultText: string;
	defaultText = "<strong>KONFIRMASI DATA</strong>\n\n";
	defaultText += "Apakah pelanggan yang terpilih ini sudah benar?\n";
	defaultText += formatCustomerDataHTML(customerData);
	defaultText +=
		"\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol <strong>OK</strong>. Jika tidak, silahkan klik tombol <strong>Cancel</strong>";

	await sendMessage(env, chatId, customText || defaultText, "HTML", {
		keyboard: [["OK"], ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_customer_update",
		customer_name: customerData.customer_name,
	});

	return;
}

export async function goToSelectProperty(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	customerData?: CustomerData,
	customText?: string
): Promise<void> {
	console.log("Going to select property...")
	// Menampilkan data detail pelanggan saat ini
	if (customerData) {
		let detailedText = "Berikut adalah data pelanggan saat ini.\n\n";
		detailedText += formatCustomerDataHTML(customerData);
		await sendMessage(env, chatId, detailedText, "HTML");
	}

	// Menampilkan pilihan property dari customer yang bisa diubah
	let clientText = formatPropertySelectionMenuHTML(category);

	await sendMessage(env, chatId, clientText, "HTML", {
		keyboard: [...PROPERTIES_LIST, ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, { user_state: "awaiting_property_selection" });

	return;
}

export async function goToUpdateProperty(
	env: Env,
	chatId: number,
	chosenProperty: CustomerProperty,
	customerData: CustomerData
): Promise<void> {
	console.log("Going to update category...")
	let clientText;
	let keyboardOptions: Array<Array<Funnel | "CANCEL" | "SUDAH" | "BELUM">>;
	clientText = `Status <strong>${MAP_PROPS_TO_TEXT[chosenProperty]}</strong> untuk pelanggan ini adalah sebagai berikut:\n\n`;
	clientText += `Kategori: <strong>${customerData.customer_category}</strong>\n`;
	clientText += `Nama GC: <strong>${customerData.customer_name}</strong>\n`;
	clientText += `${MAP_PROPS_TO_TEXT[chosenProperty]}: <strong>${customerData[chosenProperty]}</strong>`
	await sendMessage(env, chatId, clientText, "HTML");

	if (chosenProperty === "nilai_project") {
		clientText =  "➡️ Masukkan estimasi nilai total proyek pada pelanggan ini.\n\n";
		clientText += "➡️ Pilih atau Ketik <strong>CANCEL</strong> untuk kembali ke menu sebelumnya.";
	} else {
		clientText =  `➡️ Klik pada tombol di bawah untuk mengubah status <strong>${MAP_PROPS_TO_TEXT[chosenProperty]}</strong>.\n\n`;
		clientText += "➡️ Pilih atau Ketik <strong>CANCEL</strong> untuk kembali ke menu sebelumnya.";
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

	await sendMessage(env, chatId, clientText, "HTML", {
		keyboard: keyboardOptions,
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_property_update",
		customer_property: chosenProperty,
	});

	return;
}
