import hre from "hardhat";

/**
 * One-time owner configuration for the deployed IOURegistryV3 proxy.
 *
 * The live contract at PROXY is deployed but NOT yet usable:
 *   - USDT is not a supported token  -> createConditionalIOU reverts (UnsupportedToken)
 *   - the bot executor is not authorized -> createConditionalIOU reverts (onlyExecutor)
 *
 * Both fixes are onlyOwner. Run this ONCE with the OWNER key.
 *
 * Usage:
 *   1. In hardhat-env/.env set:  PRIVATE_KEY=<owner private key for 0x83d5add1...>
 *   2. (optional) set EXECUTOR_ADDRESS=<address whose key the bot uses as EXECUTOR_PRIVATE_KEY>
 *   3. npx hardhat run scripts/configure.js --network celo
 *   4. DELETE the key from .env immediately afterwards.
 */
async function main() {
  const PROXY = "0x4708f9697c72bBBCa2ad82bbf03F2A8E0d62038C";
  const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

  // The address the bot signs createConditionalIOU with (EXECUTOR_PRIVATE_KEY's address).
  // Override via EXECUTOR_ADDRESS env; defaults to the address used in deploy-proxy.js.
  const EXECUTOR = process.env.EXECUTOR_ADDRESS || "0xbCa35BE5c617EcDfcF75A4F196C2A5eb8a651E38";

  const [signer] = await hre.ethers.getSigners();
  console.log("Running as:", signer.address);

  const registry = (await hre.ethers.getContractFactory("IOURegistryV3")).attach(PROXY);

  const owner = await registry.owner();
  console.log("Contract owner:", owner);
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Signer ${signer.address} is NOT the owner (${owner}). Set PRIVATE_KEY to the owner key.`
    );
  }

  // 1. Enable USDT as a supported token
  const alreadySupported = await registry.supportedTokens(USDT);
  if (alreadySupported) {
    console.log("✓ USDT already supported");
  } else {
    console.log("→ setSupportedToken(USDT, true) ...");
    const tx1 = await registry.setSupportedToken(USDT, true);
    await tx1.wait();
    console.log("✓ USDT enabled:", tx1.hash);
  }

  // 2. Authorize the bot executor
  const alreadyExecutor = await registry.executors(EXECUTOR);
  if (alreadyExecutor) {
    console.log("✓ Executor already authorized:", EXECUTOR);
  } else {
    console.log(`→ setExecutor(${EXECUTOR}, true) ...`);
    const tx2 = await registry.setExecutor(EXECUTOR, true);
    await tx2.wait();
    console.log("✓ Executor authorized:", tx2.hash);
  }

  // Summary
  console.log("\n=== Post-config state ===");
  console.log("supportedTokens[USDT]:", await registry.supportedTokens(USDT));
  console.log("executors[bot]       :", await registry.executors(EXECUTOR));
  console.log("vault                :", await registry.vault());
  console.log("treasury             :", await registry.treasury());
  console.log("feeBps               :", (await registry.feeBps()).toString());
  console.log("\nDone. The bot can now lock USDT escrow. Remember to delete PRIVATE_KEY from .env.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
