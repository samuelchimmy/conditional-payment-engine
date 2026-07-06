import hre from "hardhat";

async function main() {
  const contractAddress = "0xfeA1E0Ef98694e44b50A9d455135a47EE6E5a994";
  
  const vault = "0x7f99841C50722EE2B92Cd5174491FbFB88a92a2a";
  const treasury = "0x5801E7FaBd22664Ca191336BBD47C397C3B26bFE";
  const feeBps = 50;
  const minFee = 0;
  const executor = "0xbCa35BE5c617EcDfcF75A4F196C2A5eb8a651E38";

  console.log(`Attaching to IOURegistryV3 at ${contractAddress}...`);
  const IOURegistry = await hre.ethers.getContractFactory("IOURegistryV3");
  const registry = IOURegistry.attach(contractAddress);

  console.log("Initializing contract...");
  const tx = await registry.initialize(vault, treasury, feeBps, minFee, executor);
  
  console.log(`Transaction sent: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  
  await tx.wait();
  console.log("Contract successfully initialized!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
