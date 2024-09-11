import { Message } from "@grammyjs/types";
import { getCustomerDataD1, getCustomerListD1 } from "../data/d1";
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
		? (message.text.toUpperCase() as "YA" | "TIDAK")
		: null; // YES / NO choice
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

	switch (choice) {
		case "YA":
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
				goToSelectProperty(env, chatId, category, customerData);
			} catch (error) {
				console.error("An error occurred:", error);
			}
			break;

		case "TIDAK":
			try {
				// Kembali ke daftar pelanggan
				const customerList = await getCustomerListD1(env, chatId, category);
				goToSelectCustomer(env, chatId, customerList, category);
			} catch (error) {
				console.error("An error occurred:", error);
			}
			break;
	}
}
