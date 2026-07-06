import hre from "hardhat";

async function main() {
  console.log("Starting deployment of IOURegistryV3...");

  const IOURegistry = await hre.ethers.getContractFactory("IOURegistryV3");
  
  console.log("Deploying contract...");
  const registry = await IOURegistry.deploy();
  
  await registry.waitForDeployment();
  
  const address = await registry.getAddress();
  console.log(`IOURegistryV3 deployed to: ${address}`);

  console.log("Initializing contract...");
  const [deployer] = await hre.ethers.getSigners();
  const tx = await registry.initialize(deployer.address);
  await tx.wait();

  console.log("Contract initialized successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
