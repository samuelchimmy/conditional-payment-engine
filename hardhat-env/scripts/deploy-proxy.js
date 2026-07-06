import hre from "hardhat";

async function main() {
  const implementationAddress = "0xfeA1E0Ef98694e44b50A9d455135a47EE6E5a994";
  
  const vault = "0x7f99841C50722EE2B92Cd5174491FbFB88a92a2a";
  const treasury = "0x5801E7FaBd22664Ca191336BBD47C397C3B26bFE";
  const feeBps = 50;
  const minFee = 0;
  const executor = "0xbCa35BE5c617EcDfcF75A4F196C2A5eb8a651E38";

  console.log("Preparing initialization data...");
  const IOURegistry = await hre.ethers.getContractFactory("IOURegistryV3");
  const initData = IOURegistry.interface.encodeFunctionData("initialize", [
    vault, treasury, feeBps, minFee, executor
  ]);

  // We need the ERC1967Proxy artifact. If it's not compiled, we can compile it, but Hardhat compiles everything imported.
  // Wait, IOURegistryV3 doesn't import ERC1967Proxy.
  // So let's create a tiny sol file that imports it so Hardhat compiles it.
  
  const ERC1967ProxyArtifact = await hre.artifacts.readArtifact("ERC1967Proxy");
  const ProxyFactory = new hre.ethers.ContractFactory(ERC1967ProxyArtifact.abi, ERC1967ProxyArtifact.bytecode, (await hre.ethers.getSigners())[0]);

  console.log("Deploying ERC1967Proxy...");
  const proxy = await ProxyFactory.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log(`Proxy successfully deployed and initialized at: ${proxyAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
