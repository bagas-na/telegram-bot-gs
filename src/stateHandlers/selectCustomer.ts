import { Message } from "@grammyjs/types";
import { getCustomerListD1, updateUserCacheD1 } from "../data/d1";
import { sendMessage } from "../data/telegramApi";
import {
	goToCreateCustomer,
	goToSelectCategory,
	goToUpdateCustomer,
} from "../stateTransitions/stateTransitions";
import { CustomerCategory, CustomerData, UserCache } from "../types";
import { formatCustomerData } from "../utils/formats";

export default async function handleSelectCustomer(
	env: Env,
	message: Message,
	userCache: UserCache
): Promise<void> {
	const chatId = message.chat.id;
	
	const category = userCache.customer_category;
		if (category === undefined) {
			console.warn(
				`customer_category field of ${chatId}'s user_cache is undefined`
			);
			return;
		}

	// Mengambil teks yg berisi [NEW atau UPDATE] dan [ANGKA atau NAMA GC]
	const commandText = message.text;
	if (commandText === undefined) {
		console.warn("Message content is empty, exit from handleSelectCustomer()");
		return;
	}

	if (commandText === "CANCEL") {
		await goToSelectCategory(env, chatId);
		return;
	}

	// Memecah commandText menjadi command (NEW, UPDATE, CANCEL), dan customerName
	const [command, ...args] = commandText.trim().split(" ");
	const customerName = args.join(" ").trim();
	if (command === undefined || customerName === "") {
		console.log("Empty command argument");
		return;
	}

	try {
		const existingCustomerList = await getCustomerListD1(env, chatId, category);

		switch (command.toUpperCase()) {
			case "NEW":
				await caseSelectNewCustomer(
					env,
					chatId,
					category,
					existingCustomerList,
					customerName
				);
				break;
			case "UPDATE":
				await caseSelectUpdateCustomer(
					env,
					chatId,
					category,
					existingCustomerList,
					customerName
				);
				break;
			case "CANCEL":
				await goToSelectCategory(env, chatId);
				break;
			default:
				console.warn(
					`Invalid command. Entered '${command}'. Valid commands include 'NEW', 'UPDATE', and 'CANCEL"`
				);
		}
		return;
	} catch (error) {
		console.error("An error occurred:", error);
	}
}

async function caseSelectNewCustomer(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	existingCustomerList: CustomerData[],
	customerName: string
): Promise<void> {
	const existingCustomerNames = existingCustomerList.map((c) =>
		c.customer_name.toLowerCase()
	);
	let clientText = "";

	// Cek apabila nama pelanggan sudah ada dalam list
	if (!existingCustomerNames.includes(customerName.toLowerCase())) {
		await goToCreateCustomer(env, chatId, category, customerName);
	}

	// Jika pelanggan sudah ada, ambil data pelanggan tersebut.
	const customerData = existingCustomerList.filter(
		(c) => c.customer_name.toLowerCase() === customerName.toLowerCase()
	)[0] as CustomerData;

	clientText =
		"Pelanggan dengan nama " + customerName + " sudah ada di dalam list.\n\n";
	clientText += formatCustomerData(customerData);
	clientText +=
		"\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol **OK**. Jika tidak, silahkan klik tombol **Cancel**";

	await sendMessage(env, chatId, clientText, {
		keyboard: [["OK"], ["CANCEL"]],
		one_time_keyboard: true,
		resize_keyboard: true,
	});

	await updateUserCacheD1(env, chatId, {
		user_state: "awaiting_customer_update",
		customer_name: customerData.customer_name,
	});
}

async function caseSelectUpdateCustomer(
	env: Env,
	chatId: number,
	category: CustomerCategory,
	existingCustomerList: CustomerData[],
	customerName: string
): Promise<void> {
	const existingCustomerNames = existingCustomerList.map((c) =>
		c.customer_name.toLowerCase()
	);
	const numberRegex = /^-?\d+(\.\d+)?$/; // Regex untuk menentukan apakah suatu string adalah angka
	const customerIndex = numberRegex.test(customerName)
		? Number(customerName)
		: null;
	let clientText = "";

	// Jika no. urut yang digunakan adalah angka valid
	if (
		customerIndex &&
		customerIndex > 0 &&
		customerIndex <= existingCustomerList.length
	) {
		const customerData = existingCustomerList[
			customerIndex - 1
		] as CustomerData;
		await goToUpdateCustomer(env, chatId, category, customerData);
	}

	// Jika no. urut di luar batas, berikan informasi mengenai batasan
	else if (numberRegex.test(customerName)) {
		clientText = `Angka yang anda masukkan, **${customerIndex}** berada di luar list ( 1 - ${String(
			existingCustomerList.length + 1
		)}).`;

		await sendMessage(env, chatId, clientText, {
			keyboard: [["CANCEL"]],
			one_time_keyboard: true,
			resize_keyboard: true,
		});
		await updateUserCacheD1(env, chatId, {
			user_state: "awaiting_customer_selection",
		});
	}

	// Jika menggunakan nama customer,
	if (existingCustomerNames.includes(customerName.toLowerCase())) {
		const customerData = existingCustomerList.filter(
			(c) => c.customer_name.toLowerCase() === customerName.toLowerCase()
		)[0] as CustomerData;
		await goToUpdateCustomer(env, chatId, category, customerData);
	}
}
