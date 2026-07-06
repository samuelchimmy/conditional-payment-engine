import TelegramBot from 'node-telegram-bot-api';
import { handleMessage } from '../handler.js';

let bot;

export async function startTelegramAdapter() {
  console.log('[Adapter: Telegram] Starting Telegram bot listener...');

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('[Adapter: Telegram] Missing TELEGRAM_BOT_TOKEN, skipping...');
      return;
    }

    // Use polling for dev, webhook for prod
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && process.env.TELEGRAM_WEBHOOK_URL) {
      bot = new TelegramBot(token);
      await bot.setWebHook(process.env.TELEGRAM_WEBHOOK_URL);
    } else {
      bot = new TelegramBot(token, { polling: true });
    }

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, `Welcome to Tether Arena! 🏟️\n\nLink your wallet at ${process.env.WEBAPP_URL || 'https://arena.tether.io'}\nThen use /bet to place a conditional payment.`);
    });

    bot.onText(/\/bet (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const text = match[1];

      await handleMessage({
        text,
        userId: msg.from.id.toString(),
        messageId: msg.message_id.toString(),
        platform: 'telegram',
        replyFn: async (messageText) => {
          await bot.sendMessage(chatId, messageText, { reply_to_message_id: msg.message_id });
        }
      });
    });

    // Also handle non-command messages if they mention the bot (for group chats)
    bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        // Only process if it mentions the bot or replies to the bot
        // This is a simplistic check
        const isReplyToBot = msg.reply_to_message && msg.reply_to_message.from.id === bot.botInfo?.id;
        const mentionsBot = msg.entities?.some(e => e.type === 'mention') && msg.text.includes('@TetherArenaBot'); // Assume bot username
        
        if (isReplyToBot || mentionsBot) {
           await handleMessage({
             text: msg.text.replace(/@TetherArenaBot/gi, '').trim(),
             userId: msg.from.id.toString(),
             messageId: msg.message_id.toString(),
             platform: 'telegram',
             replyFn: async (messageText) => {
               await bot.sendMessage(msg.chat.id, messageText, { reply_to_message_id: msg.message_id });
             }
           });
        }
      }
    });

    // Handle inline queries
    bot.on('inline_query', (query) => {
      const results = [
        {
          type: 'article',
          id: 'bet',
          title: 'Place Bet',
          input_message_content: {
            message_text: `/bet ${query.query}`
          },
          description: `Send bet: ${query.query}`
        }
      ];
      bot.answerInlineQuery(query.id, results);
    });

    console.log('[Adapter: Telegram] Successfully connected to Telegram API');

  } catch (error) {
    console.error('[Adapter: Telegram] Failed to start:', error);
  }
}
