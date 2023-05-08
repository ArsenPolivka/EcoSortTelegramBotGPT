const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const config = require('./config.json');

const telegramToken = config.token;
const openaiApiKey = config.gptApiKey;

const bot = new TelegramBot(telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => {
	bot.sendMessage(
			msg.chat.id,
			'Привіт! Я бот, який допоможе вам з утилізацією відходів. ' +
			'Введіть тип відходу, і я надам вам інформацію про сортування.'
	);
});

bot.on('text', async (msg) => {
	if (msg.text.startsWith('/')) return;

	const sender = `${msg?.chat?.first_name || ''} ${msg?.chat?.last_name || ''}`;
	const time = `${new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds()}`
	const wasteType = msg.text;

	try {
		const response = await getSortingInfoFromGPT(wasteType);
		console.log(`[${time}] ${sender}: ${wasteType}`);

		await bot.sendMessage(msg.chat.id, response);
	} catch (error) {
		console.error('Error:', error.message);

		await bot.sendMessage(msg.chat.id, 'An error occurred while retrieving the sorting information. Please try again later.');
	}
});

async function getSortingInfoFromGPT(wasteType) {
	const messages = [
		{ role: "user", content: `Надай інформацію двома реченнями про те, чи можна сортувати,
		 та куди класти такий тип сміття, як "${wasteType}"`}
	];

	try {
		const response = await axios.post(
				"https://api.openai.com/v1/chat/completions",
				{
					model: "gpt-3.5-turbo",
					messages,
					temperature: 0.8,
					max_tokens: 1000
				},
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${openaiApiKey}`
					}
				}
		);

		return response.data.choices[0].message.content.trim();
	} catch (error) {
		throw new Error(`Failed to retrieve sorting information from GPT: ${error.message}`);
	}
}
