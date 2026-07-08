import { TwitterApi } from 'twitter-api-v2';
import { handleMessage } from '../handler.js';

let twitterClient;      // OAuth 2.0 user-context client (for posting replies)
let bearerClient;       // App-only client (for the filtered stream)
let oauth2RefreshToken; // rotates on each refresh

// OAuth 2.0 user tokens expire (~2h). Build/refresh the write client from the
// refresh token so replies never lapse. Returns a client or null.
async function refreshWriteClient() {
  const clientId = process.env.X_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.X_OAUTH2_CLIENT_SECRET;
  const refreshToken = oauth2RefreshToken || process.env.X_OAUTH2_REFRESH_TOKEN;
  if (!clientId || !refreshToken) return null;
  try {
    const oauthClient = new TwitterApi({ clientId, clientSecret });
    const { client, accessToken, refreshToken: newRefresh } =
      await oauthClient.refreshOAuth2Token(refreshToken);
    if (newRefresh) oauth2RefreshToken = newRefresh; // refresh tokens rotate
    twitterClient = client;
    console.log('[Adapter: X] OAuth 2.0 write token refreshed.');
    return client;
  } catch (e) {
    console.error('[Adapter: X] Failed to refresh OAuth 2.0 token:', e.message);
    return null;
  }
}

export async function startXAdapter() {
  console.log('[Adapter: X] Starting Twitter stream listener...');

  try {
    // Client for reads (App-only / bearer token) - best for Filtered Stream v2
    bearerClient = new TwitterApi(process.env.X_BEARER_TOKEN);

    // Client for writes: OAuth 2.0 user context (refresh-token based). Fall back
    // to OAuth 1.0a app+user tokens if those are provided instead.
    if (process.env.X_OAUTH2_REFRESH_TOKEN) {
      await refreshWriteClient();
    } else if (process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET) {
      twitterClient = new TwitterApi({
        appKey: process.env.X_API_KEY,
        appSecret: process.env.X_API_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_SECRET,
      });
    }

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

    const BOT_USER_ID = process.env.X_BOT_USER_ID; // Set to the numeric ID of @TetherArenaBot

    stream.on('data', async (tweetEvent) => {
      const tweet = tweetEvent.data;
      // Filter out our own bot's tweets to prevent reply loops
      if (BOT_USER_ID && tweet.author_id === BOT_USER_ID) return;
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

// Exported so socialQueue.js can use it
export async function replyToTweet(tweetId, text) {
  if (!twitterClient) {
    // Try to build it from the refresh token (e.g. first use after a restart).
    await refreshWriteClient();
  }
  if (!twitterClient) {
    console.error(`[Adapter: X] Cannot reply to ${tweetId}: no write client (set X_OAUTH2_REFRESH_TOKEN or OAuth 1.0a X_ACCESS_TOKEN/SECRET).`);
    return;
  }
  const safeText = text.substring(0, 280);
  try {
    await twitterClient.v2.reply(safeText, tweetId);
    console.log(`[Adapter: X] Replied to tweet ${tweetId}`);
  } catch (error) {
    // 401 = access token expired. Refresh once and retry.
    if (error?.code === 401 && process.env.X_OAUTH2_REFRESH_TOKEN) {
      console.log('[Adapter: X] Reply 401 — refreshing token and retrying...');
      const client = await refreshWriteClient();
      if (client) {
        try {
          await client.v2.reply(safeText, tweetId);
          console.log(`[Adapter: X] Replied to tweet ${tweetId} (after refresh)`);
          return;
        } catch (e2) {
          console.error(`[Adapter: X] Reply retry failed for ${tweetId}:`, e2.message);
          return;
        }
      }
    }
    console.error(`[Adapter: X] Failed to reply to tweet ${tweetId}:`, error.message || error);
  }
}
