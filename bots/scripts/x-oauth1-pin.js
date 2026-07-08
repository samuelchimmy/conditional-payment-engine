// OAuth 1.0a PIN (out-of-band) flow → generates accessToken + accessSecret for
// the bot account, which is what adapters/x.adapter.js needs to POST replies.
// Usage:
//   Step 1:  node scripts/x-oauth1-pin.js request
//   Step 2:  node scripts/x-oauth1-pin.js access <oauth_token> <oauth_token_secret> <PIN>
import { TwitterApi } from 'twitter-api-v2';

const APP_KEY = process.env.X_API_KEY;
const APP_SECRET = process.env.X_API_SECRET;

if (!APP_KEY || !APP_SECRET) {
  console.error('Missing X_API_KEY / X_API_SECRET in env'); process.exit(1);
}

const mode = process.argv[2];

if (mode === 'request') {
  const client = new TwitterApi({ appKey: APP_KEY, appSecret: APP_SECRET });
  const authLink = await client.generateAuthLink('oob'); // PIN-based
  console.log('\n=== STEP 1 complete ===');
  console.log('oauth_token       :', authLink.oauth_token);
  console.log('oauth_token_secret:', authLink.oauth_token_secret);
  console.log('\n👉 Open this URL, authorize @tetherarena, copy the PIN:');
  console.log('   ', authLink.url);
  console.log('\nThen run:');
  console.log(`   node scripts/x-oauth1-pin.js access ${authLink.oauth_token} ${authLink.oauth_token_secret} <PIN>\n`);
} else if (mode === 'access') {
  const [, , , oauthToken, oauthTokenSecret, pin] = process.argv;
  if (!oauthToken || !oauthTokenSecret || !pin) {
    console.error('Usage: node scripts/x-oauth1-pin.js access <oauth_token> <oauth_token_secret> <PIN>');
    process.exit(1);
  }
  const client = new TwitterApi({
    appKey: APP_KEY, appSecret: APP_SECRET,
    accessToken: oauthToken, accessSecret: oauthTokenSecret,
  });
  const { accessToken, accessSecret, screenName, userId } = await client.login(pin);
  console.log('\n=== ✅ OAuth 1.0a tokens for @' + screenName + ' (id ' + userId + ') ===');
  console.log('X_ACCESS_TOKEN=' + accessToken);
  console.log('X_ACCESS_SECRET=' + accessSecret);
  console.log('\nPaste these two into the VM .env and restart.\n');
} else {
  console.log('Usage:\n  node scripts/x-oauth1-pin.js request\n  node scripts/x-oauth1-pin.js access <oauth_token> <oauth_token_secret> <PIN>');
}
