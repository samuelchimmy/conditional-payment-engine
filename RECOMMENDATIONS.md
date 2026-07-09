# Tether Arena — Launch Readiness Review & Recommendations

This document provides a comprehensive review of the Tether Arena codebase, identifying vulnerabilities, mock data locations, logic flaws, and architectural improvements required for a full-scale production launch.

---

## 1. Vulnerabilities & Security Patches

### 🚨 High Risk: Username Hijacking (C1/C2)
*   **Location:** `bots/security/recipientResolver.js`, `bots/handler.js`
*   **Issue:** When the bot fails to resolve a social handle to an immutable numeric ID (e.g., because the X API is down or the user isn't registered), it falls back to using the plaintext handle as the `recipientId`.
*   **Vulnerability:** If Alice sends 100 USDT to `@bob_winner` and Bob changes his handle to `@bob_retired`, an attacker can claim the `@bob_winner` handle and intercept the pending escrow once they register.
*   **Recommendation:** **Strict Numeric ID Enforcement.** Disable handle-based escrow. If the numeric ID cannot be resolved via platform API or DB, the bot should reject the command and ask the user to have the recipient "ping the bot" or "link their account" first to establish an immutable identity.

### 🟡 Medium Risk: AI Intent Injection Escape
*   **Location:** `bots/parser/intentParser.js`
*   **Issue:** While the 4-layer pipeline (Sanitizer → Regex → Isolated LLM → Zod) is robust, LLM behavior is non-deterministic.
*   **Vulnerability:** Complex "role-play" injections or Unicode-obfuscated instructions might still slip through the `<user_message>` isolation.
*   **Recommendation:**
    *   Implement **Adversarial Testing**: Run a "Red Team" suite of 100+ known jailbreak strings against the current Gemini 2.5 Flash config.
    *   **Strict Amount Hard-Cap:** Move the $10,000 cap check *before* the LLM call if possible (though difficult for natural language). Ensure the `outputValidator.js` is never bypassed by "emergency" intent types.

### 🟡 Medium Risk: Contract Ownership Centralization
*   **Location:** `contracts/IOURegistryV3.sol`
*   **Issue:** The contract uses `Ownable2Step`, but the owner (a single EOA or Multi-sig) has significant power: pausing deposits, changing fees, and upgrading the implementation (after 48h).
*   **Recommendation:** For a "full scale launch," the owner should be a **Time-locked Multi-sig (Gnosis Safe)**. The 48h timelock in the contract is excellent but only protects against implementation upgrades, not parameter changes like `setFees`.

---

## 2. Mock Data & Placeholders

The following files contain hardcoded strings or "placeholders" that must be replaced with production environment variables or real logic:

1.  **`webapp/src/lib/supabaseClient.ts`**:
    *   `https://placeholder.supabase.co` and `placeholder_key`.
    *   *Action:* Ensure these are strictly pulled from `process.env`. Throw an error if they are missing on boot.

2.  **`supabase/functions/_shared/onesignal.ts`**:
    *   `placeholder-app-id` and `placeholder-api-key`.
    *   *Action:* Replace with real OneSignal production credentials.

3.  **`webapp/src/components/ApproveCard.tsx`**:
    *   Contains mock logic for `authMethod === 'google'`.
    *   *Action:* Since Google "mock" login was removed from `WalletProvider.tsx`, this branch should be pruned or integrated with the actual WDK-restore flow.

4.  **`webapp/src/components/SocialLinkingCard.tsx`**:
    *   Placeholders like `YOUR_DISCORD_CLIENT_ID` and `YOUR_X_CLIENT_ID`.
    *   *Action:* Move to `.env.local` / Environment variables.

---

## 3. Logic & Reliability Improvements

### WDK Gas Abstraction (The "CELO" Problem)
*   **Issue:** WDK wallets on Celo sign transactions but currently pay gas in native CELO (no CIP-64 fee-currency support in the current WDK-EVM beta).
*   **Status:** You implemented `activation-funder`, which is a great stop-gap.
*   **Recommendation:** Monitor the funder wallet balance. If the funder runs dry, new users cannot "Approve" or "Claim." Implement a **Telegram/Discord alert** when the funder balance drops below 0.5 CELO.

### Oracle Stability & Disputes
*   **Location:** `oracle/sportsOracle.js`
*   **Issue:** The "Consensus Settlement Rule" is good, but if 2 of 3 sources are down, the system might stall.
*   **Recommendation:** Implement a "Manual Override" role in the DB for the Admin to settle matches that are stuck in a "Disputed" or "Waiting for Consensus" state due to API outages.

### Social Linking UX
*   **Issue:** OAuth flows use popups, which are often blocked by mobile browsers (the target audience for Celo).
*   **Recommendation:** Implement a **Deep-link / Redirect flow** as a fallback for mobile Safari/Chrome where popups are aggressively suppressed.

---

## 4. Scalability & Full-Scale Launch

1.  **Database Indexing:**
    *   Ensure `conditional_payments` has an index on `(recipient_handle, status)` and `(sender_id, status)`. The current `get-bets` query uses a complex `OR` filter that will slow down significantly at >10,000 rows.
    *   Index `agent_transactions` on `(replied, created_at)`.

2.  **Bot Rate Limiting:**
    *   The 30s reply spacing in `socialQueue.js` is safe for X/Twitter but might be too slow for a "full scale" event (e.g., World Cup Final).
    *   *Action:* Use a **multi-account executor pool** for the bot if volume exceeds 2 requests/minute to avoid hitting Twitter's platform-wide rate limits.

3.  **Error Handling (UX):**
    *   When an on-chain transaction fails, the webapp uses `friendlyTxError`.
    *   *Action:* Add a "Contact Support" link or a "Retry with higher gas" option for WDK users when the Celo network is congested.

---

## 5. Recommendation Summary Table

| Category | Priority | Item |
|---|---|---|
| **Security** | 🔴 High | Disable handle-based fallback in `recipientResolver.js` |
| **Security** | 🟡 Med | Move Contract Ownership to a Multi-sig |
| **Config** | 🔴 High | Replace all `placeholder` strings in Supabase & Webapp |
| **UX** | 🟡 Med | Mobile-friendly redirect flow for Social Linking |
| **Reliability** | 🟡 Med | Funder wallet monitoring & alerts |
| **Performance** | 🟢 Low | DB Indexing for `conditional_payments` |

**Conclusion:** The architecture is sound and the 4-layer security pipeline for AI is a standout feature. By patching the username-hijacking fallback and replacing the configuration placeholders, the app will be ready for production deployment.
