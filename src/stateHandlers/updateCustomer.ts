import { Message } from "@grammyjs/types";
import { getCustomerDataD1, getCustomerListD1 } from "../data/d1";
import { sendMessage } from "../data/telegramApi";
import {
	goToSelectCustomer,
	goToSelectProperty,
} from "../stateTransitions/stateTransitions";
import { UserCache } from "../types";

export default async function handleUpdateCustomer(
	env: Env,
	message: Message,
	userCache: UserCache
): Promise<void> {
	const chatId = message.chat.id;
	const choice = message.text
		? (message.text.toUpperCase() as "OK" | "CANCEL")
		: null;
	const category = userCache.customer_category;
	const customerName = userCache.customer_name;

	if (category === undefined) {
		console.warn(
			`customer_category field of ${chatId}'s user_cache is undefined`
		);
		await sendMessage(env, chatId, "Terjadi kesalahan.", "HTML", {
			keyboard: [["OK"], ["CANCEL"]],
			one_time_keyboard: true,
			resize_keyboard: true,
		});
		return;
	}

	if (customerName === undefined || customerName === null) {
		console.warn(`customer_name field of ${chatId}'s user_cache is undefined`);
		await sendMessage(env, chatId, "Terjadi kesalahan.", "HTML", {
			keyboard: [["OK"], ["CANCEL"]],
			one_time_keyboard: true,
			resize_keyboard: true,
		});
		return;
	}

	switch (choice) {
		case "OK":
			try {
				const customerData = await getCustomerDataD1(
					env,
					chatId,
					category,
					customerName
				);

				if(!customerData) {
					throw new Error("Failed to get customer data")
				}

				// Lanjut ke pilihan property yang akan diubah
				await goToSelectProperty(env, chatId, category, customerData);
			} catch (error) {
				console.error("An error occurred:", error);
			}
			break;

		case "CANCEL":
			try {
				// Kembali ke daftar pelanggan
				const customerList = await getCustomerListD1(env, chatId, category);
				await goToSelectCustomer(env, chatId, customerList, category);
			} catch (error) {
				console.error("An error occurred:", error);
			}
			break;
	}
	return;
}
