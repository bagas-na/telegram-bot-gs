/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { CallbackQuery, Message, Update } from "@grammyjs/types";
import { getUserCacheD1, isRegisteredUserD1 } from "./data/d1";
import { sendMessage } from "./data/telegramApi";
import handleCreateCustomer from "./stateHandlers/createCustomer";
import handleSelectCategory from "./stateHandlers/selectCategory";
import handleSelectCustomer from "./stateHandlers/selectCustomer";
import handleSelectProperty from "./stateHandlers/selectProperty";
import handleUpdateCustomer from "./stateHandlers/updateCustomer";
import handleUpdateProperty from "./stateHandlers/updateProperty";
import { goToSelectCategory } from "./stateTransitions/stateTransitions";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		//console.log('\n--------------------------\n')
		//console.log("Request received:");

		if (request.method !== "POST") {
			return new Response("Method not supported", { status: 405 });
		}

		const contentType = request.headers.get("Content-Type") || "";
		if (!contentType.includes("application/json")) {
			return new Response("Content-Type not supported", { status: 415 });
		}

		try {
			const update: Update = await request.json();

			if (update.message) {
				//console.log("Handle JSON as a new message");
				await handleNewMessage(env, update.message);
				return new Response("JSON received successfully", { status: 200 });
			}

			if (update.callback_query) {
				//console.log("Handle JSON as a query");
				handleCallbackQuery(env, update.callback_query);
				return new Response("JSON received successfully", { status: 200 });
			}

			//console.log("Valid JSON, but not a telegram message nor telegram callback query");
			return new Response("Internal Server Error", { status: 500 });
		} catch (error) {
			console.error("Request body is not valid JSON", error);
			return new Response("Invalid JSON", { status: 400 });
		}
	},
} satisfies ExportedHandler<Env>;

async function handleNewMessage(env: Env, message: Message) {
	const chatId = message.chat.id;
	const firstName = message.chat.first_name;
	const lastName = message.chat.last_name;
	const fullName = [firstName, lastName].join(" ").trim();
	const cache = await getUserCacheD1(env, chatId);

	//console.log(`Message content: ${JSON.stringify({chatId, firstName, lastName, messageText: message.text})}.`);

	// Mengecek apakah user terdaftar
	if (!isRegisteredUserD1(env, chatId)) {
		console.warn(`User named: ${fullName} is not registered. (chatId: ${chatId})`);
		await sendMessage(
			env, 
			chatId, 
			`Maaf <strong>${fullName}</strong>, Anda belum terdaftar. Hubungi admin untuk pendaftaran.`, 
			"HTML");
		return;
	}

	if (message.text === "/start") {
		//console.log("Handling a /start message");
		await sendMessage(env, chatId, `Hai <strong>${fullName}</strong>, Anda sudah terdaftar`, "HTML");
		await goToSelectCategory(env, chatId);
		return;
	}

	switch (cache?.user_state) {
		case "awaiting_category_selection":
			//console.log("Handle category selection");
			await handleSelectCategory(env, message);
			break;
		case "awaiting_customer_selection":
			//console.log("Handle customer selection");
			await handleSelectCustomer(env, message, cache);
			break;
		case "awaiting_customer_creation":
			//console.log("Handle customer creation");
			await handleCreateCustomer(env, message, cache);
			break;
		case "awaiting_customer_update":
			//console.log("Handle customer update");
			await handleUpdateCustomer(env, message, cache);
			break;
		case "awaiting_property_selection":
			//console.log("Handle property selection");
			await handleSelectProperty(env, message, cache);
			break;
		case "awaiting_property_update":
			//console.log("Handle property update")
			await handleUpdateProperty(env, message, cache);
			break;
		default:
			//console.log("Handling with default handler")
			await sendMessage(env, chatId, `Hai <strong>${fullName}</strong>, Anda sudah terdaftar.`, "HTML");
			await goToSelectCategory(env, chatId);
	}

	return;
}

function handleCallbackQuery(env: Env, callback: CallbackQuery) {}
