// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("Crowdfunding - Product Purchase and Earnings Distribution", function () {
//   let Crowdfunding, ProductNFT, FractionalNFTManager, FractionalNFTToken;
//   let crowdfunding, productNFT, fractionalNFTManager, fractionalNFTToken;
//   let owner, creator, contributor, buyer, holder1, holder2, holder3;
//   let campaignId = 1;

//   beforeEach(async function () {
//     [owner, creator, contributor, buyer, holder1, holder2, holder3] = await ethers.getSigners();

//     console.log("owner:", owner.address);
//     console.log("creator:", creator.address);
//     console.log("contributor:", contributor.address);
//     console.log("buyer:", buyer.address);
//     console.log("holder1:", holder1.address);
//     console.log("holder2:", holder2.address);
//     console.log("holder3:", holder3.address);

//     // Deploy ProductNFT
//     const ProductNFTFactory = await ethers.getContractFactory("ProductNFT");
//     productNFT = await ProductNFTFactory.deploy();
//     await productNFT.waitForDeployment();

//     // Deploy FractionalNFTManager
//     const FractionalNFTManagerFactory = await ethers.getContractFactory("FractionalNFTManager");
//     fractionalNFTManager = await FractionalNFTManagerFactory.deploy(productNFT.target);
//     await fractionalNFTManager.waitForDeployment();

//     // Deploy Crowdfunding contract
//     const CrowdfundingFactory = await ethers.getContractFactory("Crowdfunding");
//     crowdfunding = await CrowdfundingFactory.deploy(productNFT.target, fractionalNFTManager.target);
//     await crowdfunding.waitForDeployment();

//     // Transfer ownership of ProductNFT and FractionalNFTManager
//     await productNFT.transferOwnership(crowdfunding.target);
//     await fractionalNFTManager.transferOwnership(crowdfunding.target);

//     // Initialize a campaign
//     const targetAmount = ethers.parseEther("10");
//     const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
//     await crowdfunding.connect(creator).initializeCampaign(
//         targetAmount,
//         deadline,
//         "John Doe",              // creatorName
//         "@johndoe",             // twitterHandle
//         "My Awesome Project",    // projectName
//         "This is a description of my awesome project" // projectDescription
//     );

//     // Contribute to meet the target
//     await crowdfunding.connect(holder1).contribute(campaignId, { value: targetAmount });
//     await crowdfunding.connect(holder2).contribute(campaignId, { value: targetAmount });
//     await crowdfunding.connect(holder3).contribute(campaignId, { value: targetAmount });

//     // Finalize the campaign
//     await crowdfunding.connect(creator).finalizeCampaign(campaignId);

//     // Get the NFT ID from the campaign
//     const campaign = await crowdfunding.campaigns(campaignId);
//     const tokenId = campaign.productNFTId;

//     // Get fractional NFT address
//     const fractionalNFTAddress = await fractionalNFTManager.getFractionalNFT(tokenId);
//     fractionalNFTToken = await ethers.getContractAt("FractionalNFTToken", fractionalNFTAddress);


    
//   });

//   it("should allow product purchase and distribute earnings to fractional token holders", async function () {
//     // Store initial balances BEFORE the purchase
//     const initialBalance1 = await ethers.provider.getBalance(holder1.address);
//     const initialBalance2 = await ethers.provider.getBalance(holder2.address);
//     const initialBalance3 = await ethers.provider.getBalance(holder3.address);

//     // Debug: Check token distribution
//     console.log("\nToken Distribution:");
//     console.log("Holder1 tokens:", (await fractionalNFTToken.balanceOf(holder1.address)).toString());
//     console.log("Holder2 tokens:", (await fractionalNFTToken.balanceOf(holder2.address)).toString());
//     console.log("Holder3 tokens:", (await fractionalNFTToken.balanceOf(holder3.address)).toString());
//     console.log("Total Supply:", (await fractionalNFTToken.fractionalTotalSupply()).toString());

//     const amountToPurchase = 2;
//     const pricePerProduct = ethers.parseEther("1"); // 1 ETH per product
//     const totalPrice = pricePerProduct * BigInt(amountToPurchase);

//     // Debug: Check contract balance
//     console.log("\nBalances before purchase:");
//     console.log("Buyer balance:", ethers.formatEther(await ethers.provider.getBalance(buyer.address)));
//     console.log("Contract balance:", ethers.formatEther(await ethers.provider.getBalance(crowdfunding.target)));

//     // Purchase product
//     const purchaseTx = await crowdfunding.connect(buyer).purchaseProduct(
//         campaignId, 
//         amountToPurchase, 
//         { value: totalPrice }
//     );

//     // Wait for transaction to be mined
//     await purchaseTx.wait();

//     // Get final balances
//     const finalBalance1 = await ethers.provider.getBalance(holder1.address);
//     const finalBalance2 = await ethers.provider.getBalance(holder2.address);
//     const finalBalance3 = await ethers.provider.getBalance(holder3.address);

//     // Verify balance changes
//     expect(finalBalance1).to.be.gt(initialBalance1);
//     expect(finalBalance2).to.be.gt(initialBalance2);
//     expect(finalBalance3).to.be.gt(initialBalance3);

//     // Verify the remaining product supply
//     const campaign = await crowdfunding.campaigns(campaignId);
//     expect(campaign.totalProductSupply).to.equal(998); // 1000 - 2
//   });

//   it("should fail if buyer does not pay sufficient amount", async function () {
//     const amountToPurchase = 1; // 1 product
//     const insufficientAmount = ethers.parseEther("0.5"); // Less than product price

//     await expect(
//       crowdfunding.connect(buyer).purchaseProduct(campaignId, amountToPurchase, { value: insufficientAmount })
//     ).to.be.revertedWith("Insufficient payment");
//   });

//   it("should fail if trying to purchase more products than available", async function () {
//     const excessiveAmount = 11; // More than total supply

//     await expect(
//       crowdfunding.connect(buyer).purchaseProduct(campaignId, excessiveAmount, { value: ethers.parseEther("11") })
//     ).to.be.revertedWith("Not enough products available");
//   });
// });
