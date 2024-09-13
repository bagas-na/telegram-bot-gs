import { Message } from "@grammyjs/types";
import { getCustomerDataD1, updateCustomerDataD1 } from "../data/d1";
import { sendMessage } from "../data/telegramApi";
import { goToSelectProperty } from "../stateTransitions/stateTransitions";
import { Funnel, FUNNEL_PROPERTIES, UserCache } from "../types";

export default async function handleUpdateProperty(
	env: Env,
	message: Message,
	userCache: UserCache
): Promise<void> {
	const numberRegex = /^-?\d+(\.\d+)?$/;
	const chatId = message.chat.id;
	const category = userCache.customer_category;
	const customerName = userCache.customer_name;
	const customerProperty = userCache.customer_property;
	const updateValue = message.text
		? (message.text.toUpperCase() as "SUDAH" | "BELUM" | Funnel | "CANCEL")
		: null; // true / false / F0 / F3 / F4 / F5 / number

	if (!category || !customerName || !customerProperty || !updateValue) {
		console.warn("Property not updated");
		return;
	}

	if (
		customerProperty === "submit_proposal" &&
		!["SUDAH", "BELUM"].includes(updateValue as "SUDAH" | "BELUM")
	) {
		console.warn(
			`Property '${customerProperty}' can only take the values "SUDAH" and "BELUM". Current value ${updateValue}`
		);
		return;
	} else if (
		FUNNEL_PROPERTIES.includes(customerProperty) &&
		!["F0", "F3", "F4", "F5"].includes(updateValue as Funnel)
	) {
		console.warn(
			`Property '${customerProperty}' can only take the values "F0", "F3", "F4", and "F5. Current value ${updateValue}`
		);
		return;
	} else if (
		customerProperty === "nilai_project" &&
		!numberRegex.test(updateValue)
	) {
		console.warn(
			`Property '${customerProperty}' can only take number values. Current value ${updateValue}`
		);
		return;
	}

	try {
		const customerData = await getCustomerDataD1(
			env,
			chatId,
			category,
			customerName
		);

		if (!customerData) {
			console.warn(
				`Customer named ${customerName} does not exist. No properties has been updated`
			);
			return;
		}

		if (updateValue === "CANCEL") {
			await goToSelectProperty(env, chatId, category, customerData);
			return;
		}

		const success = await updateCustomerDataD1(
			env,
			chatId,
			category,
			customerName,
			customerProperty,
			updateValue
		);

		if (success) {
			await sendMessage(env, chatId, `Data <strong>${customerProperty}</strong> telah diubah.`, "HTML");
			await goToSelectProperty(env, chatId, category, customerData);
			return;
		} else {
			// Handle the case when updateCustomrDataD1 fails
			throw new Error("Failed to update customer data.");
		}
	} catch (error) {
		console.error("An error occurred:", error);
	}
}
