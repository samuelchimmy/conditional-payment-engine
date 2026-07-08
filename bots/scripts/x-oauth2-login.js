import http from 'http';
import fs from 'fs';
import { TwitterApi } from 'twitter-api-v2';

const CLIENT_ID = process.env.X_OAUTH2_CLIENT_ID;
const CLIENT_SECRET = process.env.X_OAUTH2_CLIENT_SECRET;
const CALLBACK = 'http://localhost:3000/callback';
const OUT = process.env.TOKEN_OUT || './.x_tokens.json'; // gitignored
const PORT = 3000;

if (!CLIENT_ID) { console.error('Missing X_OAUTH2_CLIENT_ID'); process.exit(1); }

const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });
const { url, codeVerifier, state } = client.generateOAuth2AuthLink(CALLBACK, {
  scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
});

fs.writeFileSync(OUT, JSON.stringify({ status: 'waiting', url }, null, 2));

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) { res.writeHead(404); return res.end(); }
  const params = new URL(req.url, CALLBACK).searchParams;
  const code = params.get('code');
  if (params.get('state') !== state) { res.writeHead(400); res.end('State mismatch'); return; }
  try {
    const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({ code, codeVerifier, redirectUri: CALLBACK });
    fs.writeFileSync(OUT, JSON.stringify({ status: 'ok', accessToken, refreshToken, expiresIn }, null, 2));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>Authorized. Return to the terminal.</h2>');
    console.log('CAPTURED_OK');
  } catch (e) {
    fs.writeFileSync(OUT, JSON.stringify({ status: 'error', error: e.message }, null, 2));
    res.writeHead(500); res.end('Exchange failed: ' + e.message);
    console.log('CAPTURE_FAILED: ' + e.message);
  }
});
server.listen(PORT, () => console.log('AUTH_URL ' + url));
