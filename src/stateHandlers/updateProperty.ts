export default function handleUpdateProperty(env: Env, message: Message): void {
	const chatId = message.chat.id;
	const category = cache.customer_category;
	const customerName = cache.customer_name;
	const customerProperty = cache.customer_property;
	const propertyValue = message.text ? message.text.toUpperCase() : null; // true / false / F0 / F3 / F4 / F5 / number
	let customerData: CustomerData;

	if (propertyValue === null) {
		// do nothing
		return;
	}

	if (propertyValue.toUpperCase() === "CANCEL") {
		const customerData = getCustomerData(chatId, category, customerName);
		goToSelectProperty(chatId, category, customerData);
	}

	switch (customerProperty) {
		case "submit_proposal":
			if (!["SUDAH", "BELUM"].includes(propertyValue)) {
				// do nothing, kalau input tidak sesuai
				break;
			}

			if (propertyValue === "SUDAH") {
				updateCustomerProperty(
					chatId,
					category,
					customerName,
					customerProperty,
					true
				);
			} else if (propertyValue === "BELUM") {
				updateCustomerProperty(
					chatId,
					category,
					customerName,
					customerProperty,
					false
				);
			}
			sendText(chatId, "Data " + customerProperty + " telah diubah.");
			customerData = getCustomerData(chatId, category, customerName);

			goToSelectProperty(chatId, category, customerData);
			break;

		case "connectivity":
		case "eazy":
		case "oca":
		case "digiclinic":
		case "pijar":
		case "sprinthink":
			if (
				!["F0 (lead)", "F3 (submit)", "F4 (negotiation)", "F5 (win)"].includes(
					propertyValue
				)
			) {
				// do nothing
				break;
			}

			if (propertyValue === "F0 (lead)") {
				updateCustomerProperty(
					chatId,
					category,
					customerName,
					customerProperty,
					"F0"
				);
			} else if (propertyValue === "F3 (submit)") {
				updateCustomerProperty(
					chatId,
					category,
					customerName,
					customerProperty,
					"F3"
				);
			} else if (propertyValue === "F4 (negotiation)") {
				updateCustomerProperty(
					chatId,
					category,
					customerName,
					customerProperty,
					"F4"
				);
			} else if (propertyValue === "F5 (win)") {
				updateCustomerProperty(
					chatId,
					category,
					customerName,
					customerProperty,
					"F5"
				);
			}
			sendText(chatId, "Data " + customerProperty + " telah diubah.");
			customerData = getCustomerData(chatId, category, customerName);

			goToSelectProperty(chatId, category, customerData);
			break;

		case "nilai_project":
			const numberRegex = /^-?\d+(\.\d+)?$/;
			if (!numberRegex.test(propertyValue)) {
				// do nothing, kalau input bukan angka
				break;
			}
			updateCustomerProperty(
				chatId,
				category,
				customerName,
				customerProperty,
				Number(propertyValue)
			);

			sendText(chatId, "Data " + customerProperty + " telah diubah.");
			customerData = getCustomerData(chatId, category, customerName);

			goToSelectProperty(chatId, category, customerData);
			break;
	}
}
