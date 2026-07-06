import hre from "hardhat";

async function main() {
  const contractAddress = "0xfeA1E0Ef98694e44b50A9d455135a47EE6E5a994";
  const IOURegistry = await hre.ethers.getContractFactory("IOURegistryV3");
  const registry = IOURegistry.attach(contractAddress);

  try {
      const vault = await registry.vault();
      console.log('Vault:', vault);
      const owner = await registry.owner();
      console.log('Owner:', owner);
  } catch (e) {
      console.log("Error fetching state:", e.message);
  }
}
main();
