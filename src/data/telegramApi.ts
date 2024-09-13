import { ReplyMarkup } from "../types";

type MessageBody = {
	chat_id: number;
	text: string;
	parse_mode?: "MarkdownV2" | "HTML" | "Markdown";
	reply_markup?: ReplyMarkup;
}

// Fungsi untuk mengirim teks ke chat dengan markup keyboard
export async function sendMessage(
	env: Env,
	chatId: number,
	text: string,
	parse_mode?: "MarkdownV2" | "HTML" | "Markdown",
	replyMarkup?: ReplyMarkup
): Promise<Response> {
	const apiMethod = "/sendMessage";
	const Url = env.TELEGRAM_API_URL + env.BOT_TOKEN + apiMethod;

	
	const messageBody: MessageBody = {
		chat_id: chatId,
		text,
	};

	if (parse_mode) {
		messageBody.parse_mode = parse_mode
	}

	if (replyMarkup) {
		messageBody.reply_markup = replyMarkup
	}


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