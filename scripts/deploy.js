async function main() {
  // Get the account to deploy the contract
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the ProductNFT contract
  const ProductNFT = await hre.ethers.getContractFactory("ProductNFT");
  const productNFT = await ProductNFT.deploy(); // Await deployment
  await productNFT.waitForDeployment();
  const productNFTAddress = await productNFT.getAddress();
  console.log("ProductNFT deployed to:", productNFTAddress);


  // Deploy the FractionalNFTManager contract, passing in the ProductNFT address
  const FractionalNFTManager = await hre.ethers.getContractFactory("FractionalNFTManager");
  const fractionalNFTManager = await FractionalNFTManager.deploy(productNFTAddress);
  await fractionalNFTManager.waitForDeployment();
  const fractionalNFTManagerAddress = await fractionalNFTManager.getAddress();
  console.log("FractionalNFTManager contract deployed to:", fractionalNFTManagerAddress);

  // Deploy the Crowdfunding contract, passing in the ProductNFT address
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy(productNFTAddress, fractionalNFTManagerAddress);
  await crowdfunding.waitForDeployment();  // Wait for the Crowdfunding contract to be deployed
  console.log("Crowdfunding contract deployed to:", await crowdfunding.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
