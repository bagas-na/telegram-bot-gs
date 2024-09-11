import { Message } from "@grammyjs/types";
import { getCustomerDataD1 } from "../data/d1";
import { sendMessage } from "../data/telegramApi";
import {
	goToSelectProperty,
	goToUpdateProperty,
} from "../stateTransitions/stateTransitions";
import { CustomerProperty, PROPERTIES, UserCache } from "../types";

export default async function handleSelectProperty(
	env: Env,
	message: Message,
	userCache: UserCache
): Promise<void> {
	const chatId = message.chat.id;
	const chosenProperty = message.text
		? (message.text.toUpperCase() as CustomerProperty | "CANCEL")
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

	// Jika input user tidak sesuai dengan pilihan, perintahkan untuk input kategori kembali
	if (chosenProperty === null || ![...PROPERTIES, "CANCEL"].includes(chosenProperty)) {
		sendMessage(env, chatId, "Pilihan tidak ditemukan");
		goToSelectProperty(env, chatId, category);
		return;
	}

	try {
		const customerData = await getCustomerDataD1(env, chatId, category, customerName);

		if(!customerData) {
			throw new Error("Failed to get customer data")
		}

		if (chosenProperty === "CANCEL") {
			goToSelectProperty(env, chatId, category, customerData);
			return;
		}

		goToUpdateProperty(env, chatId, chosenProperty, customerData);
		return;
	} catch (error) {}
}
