import { Message } from "@grammyjs/types";
import { ReplyMarkup } from "../types";

// Fungsi untuk mengirim teks ke chat dengan markup keyboard
export async function sendMessage(
	env: Env,
	chatId: number,
	text: string,
	replyMarkup?: ReplyMarkup
): Promise<Response> {
	const apiMethod = "/sendMessage";
	const Url = env.TELEGRAM_API_URL + env.BOT_TOKEN + apiMethod;

	
	const messageBody = {
		chat_id: chatId,
		text,
		reply_markup: replyMarkup,
	};
	console.log(`Sending message to ${Url}, ${JSON.stringify(messageBody)}`)

	const options: RequestInit = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(messageBody),
	};

	return await fetch(Url, options);
}