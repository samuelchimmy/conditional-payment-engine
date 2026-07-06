import { TwitterApi } from 'twitter-api-v2';
import { handleMessage } from '../handler.js';

let twitterClient;
let bearerClient;

export async function startXAdapter() {
  console.log('[Adapter: X] Starting Twitter stream listener...');

  try {
    // Client for reads (App-only / bearer token) - best for Filtered Stream v2
    bearerClient = new TwitterApi(process.env.X_BEARER_TOKEN);

    // Client for writes (OAuth 2.0 User Token or OAuth 1.0a)
    // Assuming standard App Keys + Access Tokens for replying
    twitterClient = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_REFRESH_TOKEN, // Assuming accessSecret is stored here based on typical env vars
    });

    // We use the read-only client to set up the stream
    const roClient = bearerClient.readOnly;

    // 1. Setup Stream Rules
    const currentRules = await roClient.v2.streamRules();
    const desiredRule = '@TetherArena -is:retweet';

    const ruleExists = currentRules.data?.some(rule => rule.value === desiredRule);

    if (!ruleExists) {
      // Clear existing rules
      if (currentRules.data?.length) {
        await roClient.v2.updateStreamRules({
          delete: { ids: currentRules.data.map(rule => rule.id) },
        });
      }
      // Add our rule
      await roClient.v2.updateStreamRules({
        add: [{ value: desiredRule, tag: 'mentions' }],
      });
      console.log('[Adapter: X] Stream rules updated.');
    }

    // 2. Connect to Filtered Stream
    const stream = await roClient.v2.searchStream({
      'tweet.fields': ['author_id', 'conversation_id', 'created_at'],
      'user.fields': ['username'],
      expansions: ['author_id'],
    });

    stream.autoReconnect = true;

    stream.on('data', async (tweetEvent) => {
      // Avoid processing our own tweets
      // We can check if the author is our bot ID, but let's pass it to handler
      const tweet = tweetEvent.data;
      const author = tweetEvent.includes?.users?.find(u => u.id === tweet.author_id);
      
      console.log(`[Adapter: X] Received tweet from @${author?.username || tweet.author_id}`);

      await handleMessage({
        text: tweet.text,
        userId: tweet.author_id,
        messageId: tweet.id, // tweetId
        platform: 'x',
        replyFn: async (messageText) => {
          await replyToTweet(tweet.id, messageText);
        }
      });
    });

    stream.on('error', (error) => {
      console.error('[Adapter: X] Stream error:', error);
    });

    console.log('[Adapter: X] Successfully connected to Twitter v2 Filtered Stream');

    // NOTE: DM listening via Account Activity API (v1.1) or v2 polling requires 
    // a separate setup, typically a webhook or polling `GET /2/dm_events`. 
    // For simplicity in this demo, we'll implement standard mentions first.

  } catch (error) {
    console.error('[Adapter: X] Failed to start Twitter adapter:', error);
    // Don't throw, let other adapters run
  }
}

async function replyToTweet(tweetId, text) {
  try {
    // Truncate to 280 chars if necessary, or split into threads
    // For now, basic truncation for safety
    const safeText = text.substring(0, 280);
    
    await twitterClient.v2.reply(safeText, tweetId);
    console.log(`[Adapter: X] Replied to tweet ${tweetId}`);
  } catch (error) {
    console.error(`[Adapter: X] Failed to reply to tweet ${tweetId}:`, error);
  }
}
