import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { handleMessage } from '../handler.js';

let client;

export async function startDiscordAdapter() {
  console.log('[Adapter: Discord] Starting Discord bot listener...');

  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token || !clientId) {
      console.warn('[Adapter: Discord] Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID, skipping...');
      return;
    }

    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    // 1. Register Slash Commands
    const commands = [
      {
        name: 'bet',
        description: 'Place a conditional bet using plain language',
        options: [
          {
            name: 'text',
            description: 'E.g., send 15 USDT to @user if Nigeria beats Brazil',
            type: 3, // STRING
            required: true,
          },
        ],
      },
      {
        name: 'claim',
        description: 'Check for pending MagicPay claims for your connected wallet',
      },
      {
        name: 'mybets',
        description: 'List your active bets',
      },
      {
        name: 'balance',
        description: 'Show your USDT balance on Celo',
      },
    ];

    const rest = new REST({ version: '10' }).setToken(token);

    console.log('[Adapter: Discord] Refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    // 2. Event Listeners
    client.on('ready', () => {
      console.log(`[Adapter: Discord] Logged in as ${client.user.tag}!`);
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'bet') {
        const text = interaction.options.getString('text');
        
        await interaction.deferReply();
        
        await handleMessage({
          text,
          userId: interaction.user.id,
          messageId: interaction.id,
          platform: 'discord',
          replyFn: async (messageText) => {
            await interaction.editReply(messageText);
          }
        });
      } else {
        // Handle other commands (/claim, /mybets, /balance)
        await interaction.reply({ content: 'Command processing not yet implemented.', ephemeral: true });
      }
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      const content = message.content.trim();
      const isMentioned = message.mentions.has(client.user);
      const isBetCommand = content.toLowerCase().startsWith('!bet');

      if (isMentioned || isBetCommand) {
        // Strip out the mention or !bet prefix
        let text = content.replace(/<@!?\d+>/g, '').trim();
        if (isBetCommand) text = text.replace(/^!bet\s+/i, '');

        await handleMessage({
          text,
          userId: message.author.id,
          messageId: message.id,
          platform: 'discord',
          replyFn: async (messageText) => {
            await message.reply(messageText);
          }
        });
      }
    });

    await client.login(token);

  } catch (error) {
    console.error('[Adapter: Discord] Failed to start:', error);
  }
}
