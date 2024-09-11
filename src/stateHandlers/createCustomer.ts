import { Message } from "@grammyjs/types";
import { getCustomerDataD1, getCustomerListD1, insertNewCustomerD1 } from "../data/d1";
import { sendMessage } from "../data/telegramApi";
import {
	goToSelectCustomer,
	goToSelectProperty,
} from "../stateTransitions/stateTransitions";
import { UserCache } from "../types";

export default async function handleCreateCustomer(
	env: Env,
	message: Message,
	userCache: UserCache
): Promise<void> {
	const chatId = message.chat.id;
	const choice = message.text
		? (message.text.toUpperCase() as "YA" | "TIDAK")
		: null;
	const category = userCache.customer_category;
	const customerName = userCache.customer_name;

	if (category === undefined) {
		console.warn(
			`customer_category field of ${chatId}'s user_cache is undefined`
		);
		return;
	}

	if (customerName === undefined || customerName === null) {
		console.warn(`customer_name field of ${chatId}'s user_cache is undefined`);
		return;
	}

	let clientText: string = "";

	switch (choice) {
		case "YA":
			try {
				// Membuat pelanggan baru
				const success = await insertNewCustomerD1(
					env,
					chatId,
					category,
					customerName
				);

				// Kirim pesan konfirmasi
				clientText =
					"Data pelanggan baru telah disimpan dalam kategori " +
					category +
					".\n\n";

				if (success) {
					await sendMessage(env, chatId, clientText);

					// Mengambil data pelanggan setelah berhasil disimpan
					const customerData = await getCustomerDataD1(
						env,
						chatId,
						category,
						customerName
					);
					
					if(!customerData) {
						throw new Error("Failed to get customer data")
					}

					// Kembali ke daftar pilihan property yang akan diubah
					goToSelectProperty(env, chatId, category, customerData);
				} else {
					// Handle the case when insertNewCustomerD1 fails to insert
					throw new Error("Failed to insert new customer");
				}
			} catch (error) {
				console.error("An error occurred:", error);
			}
			break;

		case "TIDAK":
			// Kembali ke daftar pelanggan
			try {
				const customerList = await getCustomerListD1(env, chatId, category);
				goToSelectCustomer(env, chatId, customerList, category);
			} catch (error) {
        console.error("An error occurred:", error);
      }
			break;
	}

	return;
}
