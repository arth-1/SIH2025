import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

async function main() {
  console.log("Deploying CertificateRegistry contract...");

  // Get the contract factory
  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");

  // Deploy the contract
  const certificateRegistry = await CertificateRegistry.deploy();

  // Wait for deployment to complete
  await certificateRegistry.deployed();

  const deployedAddress = certificateRegistry.address;
  
  console.log("CertificateRegistry deployed to:", deployedAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: deployedAddress,
    network: process.env.HARDHAT_NETWORK || "localhost",
    deployedAt: new Date().toISOString(),
    deployer: (await ethers.getSigners())[0].address
  };

  fs.writeFileSync(
    "./blockchain/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment.json");

  // Verify on etherscan if not on localhost
  if (process.env.HARDHAT_NETWORK !== "localhost" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await certificateRegistry.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: deployedAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
