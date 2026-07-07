# Supabase Edge Functions Deployment

To deploy all the necessary Edge Functions for tether.arena, you need to run the Supabase deployment commands for each specific function directory (excluding the `_shared` folder, which is automatically bundled into the functions that import from it).

## Functions to Deploy:

1. **`discord-oauth`**
   Handles the Discord OAuth flow and links the user's Discord identity to their wallet profile.

2. **`secure-claim`**
   Verifies wallet identities against social claims securely, executing the payout if the claimant matches the escrow condition.

3. **`social-identity`**
   General-purpose endpoint for managing, retrieving, and validating linked social identities (Telegram, X, etc.) against the connected wallet.

## Deployment Commands

Run these commands from the root of the project using the Supabase CLI (if it was working locally) or manually copy/deploy the contents of these folders via the Supabase Dashboard:

```bash
supabase functions deploy discord-oauth --no-verify-jwt
supabase functions deploy secure-claim --no-verify-jwt
supabase functions deploy social-identity --no-verify-jwt
```

*(Note: `--no-verify-jwt` is used because we rely on our custom HMAC request signature validation and wallet-based authentication instead of default Supabase Auth JWTs).*
