import { Message } from "@grammyjs/types";
import { getCustomerListD1, updateUserCacheD1 } from "../data/d1";
import { sendMessage } from "../data/telegramApi";
import {
	goToCreateCustomer,
	goToSelectCategory,
	goToUpdateCustomer,
} from "../stateTransitions/stateTransitions";
import { CustomerCategory, CustomerData, UserCache } from "../types";
import { formatCustomerDataHTML } from "../utils/formats";

export default async function handleSelectCustomer(
	env: Env,
	message: Message,
	userCache: UserCache
): Promise<void> {
	const chatId = message.chat.id;

	const category = userCache.customer_category;
	console.log(JSON.stringify({ chatId, category }));
	if (category === undefined) {
		console.warn(
			`customer_category field of ${chatId}'s user_cache is undefined`
		);
		await sendMessage(env, chatId, "Terjadi kesalahan", "HTML", {
			keyboard: [["CANCEL"]],
			one_time_keyboard: true,
			resize_keyboard: true,
		});
		return;
	}

	// Mengambil teks yg berisi [NEW atau UPDATE] dan [ANGKA atau NAMA GC]
	const commandText = message.text;
	if (commandText === undefined) {
		console.warn("Message content is empty, exit from handleSelectCustomer()");
		await sendMessage(env, chatId, "Pesan terkirim kosong", "HTML", {
			keyboard: [["CANCEL"]],
			one_time_keyboard: true,
			resize_keyboard: true,
		});
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
		await sendMessage(env, chatId, "Perintah yang dimasukkan tidak valid", "HTML", {
			keyboard: [["CANCEL"]],
			one_time_keyboard: true,
			resize_keyboard: true,
		});
		return;
	}

	console.log(
		`The text "${message.text}" has been parsed into command: "${command}", customerName: "${customerName}"`
	);

	try {
		const existingCustomerList = await getCustomerListD1(env, chatId, category);

		switch (command.toUpperCase()) {
			case "NEW":
				console.log(
					`Creating new customer with category: "${category}", customerName: ${customerName}`
				);
				await caseSelectNewCustomer(
					env,
					chatId,
					category,
					existingCustomerList,
					customerName
				);
				break;
			case "UPDATE":
				console.log(
					`Updating customer with category: "${category}", customerName: ${customerName}`
				);
				await caseSelectUpdateCustomer(
					env,
					chatId,
					category,
					existingCustomerList,
					customerName
				);
				break;
			case "CANCEL":
				console.log("Canceling selecting/creating a customer...");
				await goToSelectCategory(env, chatId);
				break;
			default:
				console.warn(
					`Invalid command. Entered '${command}'. Valid commands include 'NEW', 'UPDATE', and 'CANCEL"`
				);
				await sendMessage(env, chatId, "Perintah yang dimasukkan tidak valid", "HTML", {
					keyboard: [["CANCEL"]],
					one_time_keyboard: true,
					resize_keyboard: true,
				});
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
		console.log("Yep, this customer is new");
		await goToCreateCustomer(env, chatId, category, customerName);
		return;
	}

	console.log("Actually, we already have your customer.");
	// Jika pelanggan sudah ada, ambil data pelanggan tersebut.
	const customerData = existingCustomerList.filter(
		(c) => c.customer_name.toLowerCase() === customerName.toLowerCase()
	)[0] as CustomerData;

	clientText =
		`Pelanggan dengan nama <strong>${customerName}</strong> sudah ada di dalam list.\n\n`;
	clientText += formatCustomerDataHTML(customerData);
	clientText +=
		"\nJika anda ingin meng-UPDATE GC ini, silahkan klik tombol <strong>OK</strong>. Jika tidak, silahkan klik tombol <strong>Cancel</strong>";

	await sendMessage(env, chatId, clientText, "HTML", {
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
		console.log(`We are using your number, ${customerIndex}, as the index...`);
		const customerData = existingCustomerList[
			customerIndex - 1
		] as CustomerData;
		console.log(`...to update the customer ${JSON.stringify(customerData)}.`);
		await goToUpdateCustomer(env, chatId, category, customerData);
		return;
	}

	// Jika no. urut di luar batas, berikan informasi mengenai batasan
	if (customerIndex) {
		clientText = `Angka yang anda masukkan, <strong>${customerIndex}</strong> berada di luar list ( 1 - ${String(existingCustomerList.length)} ).`;
		console.log(`Your number, ${customerIndex}, is out of bounds`);
		await sendMessage(env, chatId, clientText, "HTML", {
			keyboard: [["CANCEL"]],
			one_time_keyboard: true,
			resize_keyboard: true,
		});
		await updateUserCacheD1(env, chatId, {
			user_state: "awaiting_customer_selection",
		});
		return;
	}

	// Jika menggunakan nama customer,
	if (existingCustomerNames.includes(customerName.toLowerCase())) {
		const customerData = existingCustomerList.filter(
			(c) => c.customer_name.toLowerCase() === customerName.toLowerCase()
		)[0] as CustomerData;
		console.log(
			`We are using the name of the customer, ${customerName}, to update the customer data.`
		);
		await goToUpdateCustomer(env, chatId, category, customerData);
		return;
	}
}
