import TelegramBot from 'node-telegram-bot-api';
import { handleMessage } from '../handler.js';

let bot;
let botUsername = 'TarenaAi_bot'; // resolved from getMe() at startup

function welcomeText() {
  return (
    `Gm fans 👋\n\n` +
    `I'm *tether.arena* — the first AI-powered conditional sports P2P. Think of me as the friend who keeps your promise: I back all your banter with real USDT onchain. No fugazi. 😎\n\n` +
    `*How it works:* just @ me in plain English with a bet and a condition. If it happens, the money moves to your mate automatically. If it doesn't, you get refunded. No wallets to fumble, no gas to buy.\n\n` +
    `*Try it:*\n` +
    `\`@${botUsername} send $50 to @jade if France beats Senegal\`\n\n` +
    `*Get started:* create your wallet in 30s at ${process.env.WEBAPP_URL || 'https://tarena.xyz'} — then talk to me right here. Your friends will love it. 🏟️`
  );
}

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

    // Resolve the real bot username so mention-detection + examples are correct.
    try {
      const me = await bot.getMe();
      if (me?.username) botUsername = me.username;
    } catch { /* keep default */ }

    // Warm welcome on /start (DMs) and when added to a group.
    bot.onText(/\/start/, (msg) => {
      bot.sendMessage(msg.chat.id, welcomeText(), { parse_mode: 'Markdown' }).catch(() => {});
    });

    bot.on('new_chat_members', (msg) => {
      const added = msg.new_chat_members || [];
      const meAdded = added.some((m) => m.username === botUsername || m.is_bot && m.username === botUsername);
      if (meAdded) {
        bot.sendMessage(msg.chat.id, welcomeText(), { parse_mode: 'Markdown' }).catch(() => {});
      }
    });

    // Handle natural-language messages that mention the bot or reply to it
    // (the ONLY flow — no slash commands, by design).
    bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      const mention = `@${botUsername}`;
      const isReplyToBot = msg.reply_to_message && msg.reply_to_message.from?.id === bot.botInfo?.id;
      const mentionsBot = msg.text.toLowerCase().includes(mention.toLowerCase());
      const isDM = msg.chat.type === 'private';

      if (isDM || isReplyToBot || mentionsBot) {
        const cleanText = msg.text.replace(new RegExp(mention, 'ig'), '').trim();
        if (!cleanText) return;
        await handleMessage({
          text: cleanText,
          userId: msg.from.id.toString(),
          messageId: msg.message_id.toString(),
          platform: 'telegram',
          replyFn: async (messageText) => {
            await bot.sendMessage(msg.chat.id, messageText, { reply_to_message_id: msg.message_id });
          }
        });
      }
    });

    // Inline queries → post a natural-language mention (no slash command).
    bot.on('inline_query', (query) => {
      const results = [
        {
          type: 'article',
          id: 'bet',
          title: 'Send a conditional payment',
          input_message_content: {
            message_text: `@${botUsername} ${query.query}`
          },
          description: query.query ? `Send: ${query.query}` : 'e.g. send $50 to @jade if France beats Senegal'
        }
      ];
      bot.answerInlineQuery(query.id, results).catch(() => {});
    });

    console.log('[Adapter: Telegram] Successfully connected to Telegram API');

  } catch (error) {
    console.error('[Adapter: Telegram] Failed to start:', error);
  }
}
