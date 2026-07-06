import hre from "hardhat";

async function main() {
  console.log("Starting deployment of IOURegistryV3...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Deploy Implementation
  const IOURegistry = await hre.ethers.getContractFactory("IOURegistryV3");
  console.log("Deploying implementation contract...");
  const registry = await IOURegistry.deploy();
  await registry.waitForDeployment();
  const implAddress = await registry.getAddress();
  console.log(`IOURegistryV3 Implementation deployed to: ${implAddress}`);

  // 2. Encode Initialize Data
  console.log("Preparing initialization data...");
  const initData = IOURegistry.interface.encodeFunctionData("initialize", [
    deployer.address, // vault
    deployer.address, // treasury
    500,              // feeBps (5%)
    0,                // minFee
    deployer.address  // initialExecutor
  ]);

  // 3. Deploy Proxy
  console.log("Deploying ERC1967Proxy...");
  const ERC1967ProxyArtifact = await hre.artifacts.readArtifact("ERC1967Proxy");
  const ProxyFactory = new hre.ethers.ContractFactory(
    ERC1967ProxyArtifact.abi, 
    ERC1967ProxyArtifact.bytecode, 
    deployer
  );
  
  const proxy = await ProxyFactory.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log(`\n======================================================`);
  console.log(`🎉 IOURegistryV3 Proxy successfully deployed!`);
  console.log(`Proxy Address: ${proxyAddress}`);
  console.log(`Implementation Address: ${implAddress}`);
  console.log(`======================================================\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
