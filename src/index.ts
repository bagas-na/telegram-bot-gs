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
import { getUserCache, isRegisteredUserD1 } from "./data/d1";
import { sendMessage } from "./data/telegramApi";
import {
	handleCreateCustomer,
	handleSelectCategory,
	handleSelectCustomer,
	handleSelectProperty,
	handleUpdateCustomer,
	handleUpdateProperty,
} from "./stateHandlers";
import { goToSelectCategory } from "./stateTransitions";

export default {
	async fetch(request, env, ctx): Promise<Response> {
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
				handleNewMessage(env, update.message);
				return new Response("JSON received successfully", { status: 200 });
			}

			if (update.callback_query) {
				handleCallbackQuery(env, update.callback_query);
				return new Response("JSON received successfully", { status: 200 });
			}

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

	const cache = await getUserCache(env, chatId);

	// Mengecek apakah user terdaftar
	if (!isRegisteredUserD1(env, chatId)) {
		sendMessage(
			env,
			chatId,
			`Maaf ${fullName}, Anda belum terdaftar. Hubungi admin untuk pendaftaran.`
		);
		return;
	}

	switch (cache?.user_state) {
		case "awaiting_category_selection":
			handleSelectCategory(env, message);
			break;
		case "awaiting_customer_selection":
			handleSelectCustomer(env, message);
			break;
		case "awaiting_customer_creation":
			handleCreateCustomer(env, message);
			break;
		case "awaiting_customer_update":
			handleUpdateCustomer(env, message);
			break;
		case "awaiting_property_selection":
			handleSelectProperty(env, message);
			break;
		case "awaiting_property_update":
			handleUpdateProperty(env, message);
			break;
		default:
			sendMessage(env, chatId, `Hai ${fullName}, Anda sudah terdaftar`);
			goToSelectCategory(env, chatId);
	}

	return;
}
function handleCallbackQuery(env: Env, callback: CallbackQuery) {}
