import { Message } from "@grammyjs/types";
import { getCustomerListD1 } from "../data/d1";
import { goToSelectCategory, goToSelectCustomer } from "../stateTransitions/stateTransitions";
import { CATEGORIES, CustomerCategory } from "../types";

// Fungsi untuk menangani userState "select_category"
export default async function handleSelectCategory(
	env: Env,
	message: Message
): Promise<void> {
	const chatId = message.chat.id;

	// Mengambil pilihan user berdasarkan teks yang dikirim
	const chosenCategory = message.text
		? (message.text.toUpperCase() as CustomerCategory)
		: undefined;

	// Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
	if (chosenCategory === undefined || !CATEGORIES.includes(chosenCategory)) {
		await goToSelectCategory(
			env,
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
	try {
		const customerList = await getCustomerListD1(env, chatId, chosenCategory);

		await goToSelectCustomer(env, chatId, customerList, chosenCategory);
		return;
	} catch (error) {
		console.error('An error occurred:', error);
	}
}