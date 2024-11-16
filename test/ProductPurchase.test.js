const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding - Product Purchase and Earnings Distribution", function () {
  let Crowdfunding, ProductNFT, FractionalNFTManager, FractionalNFTToken;
  let crowdfunding, productNFT, fractionalNFTManager, fractionalNFTToken;
  let owner, creator, contributor, buyer, holder1, holder2, holder3;
  let campaignId = 1;

  beforeEach(async function () {
    [owner, creator, contributor, buyer, holder1, holder2, holder3] = await ethers.getSigners();

    // Deploy ProductNFT
    const ProductNFTFactory = await ethers.getContractFactory("ProductNFT");
    productNFT = await ProductNFTFactory.deploy();
    await productNFT.waitForDeployment();

    // Deploy FractionalNFTManager
    const FractionalNFTManagerFactory = await ethers.getContractFactory("FractionalNFTManager");
    fractionalNFTManager = await FractionalNFTManagerFactory.deploy(productNFT.target);
    await fractionalNFTManager.waitForDeployment();

    // Deploy Crowdfunding contract
    const CrowdfundingFactory = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await CrowdfundingFactory.deploy(productNFT.target, fractionalNFTManager.target);
    await crowdfunding.waitForDeployment();

    // Transfer ownership of ProductNFT and FractionalNFTManager
    await productNFT.transferOwnership(crowdfunding.target);
    await fractionalNFTManager.transferOwnership(crowdfunding.target);

    // Initialize a campaign
    const targetAmount = ethers.parseEther("10");
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await crowdfunding.connect(creator).initializeCampaign(targetAmount, deadline);

    // Contribute to meet the target
    await crowdfunding.connect(contributor).contribute(campaignId, { value: targetAmount });

    // Finalize the campaign
    await crowdfunding.connect(creator).finalizeCampaign(campaignId);

    // Get fractional NFT address and setup holders
    const tokenId = 0; // Assuming the token ID for the product NFT
    const fractionalNFTAddress = await fractionalNFTManager.getFractionalNFT(tokenId);
    fractionalNFTToken = await ethers.getContractAt("FractionalNFTToken", fractionalNFTAddress);

    // Distribute fractional tokens
    await fractionalNFTToken.connect(creator).mintShares(holder1.address, 500); // 50%
    await fractionalNFTToken.connect(creator).mintShares(holder2.address, 300); // 30%
    await fractionalNFTToken.connect(creator).mintShares(holder3.address, 200); // 20%

    // Set product details
    const productSupply = 10;
    const productPrice = ethers.parseEther("1");
    const campaign = await crowdfunding.campaigns(campaignId);
    campaign.totalProductSupply = productSupply;
    campaign.productPrice = productPrice;
  });

  it("should allow product purchase and distribute earnings to fractional token holders", async function () {
    const amountToPurchase = 2;
    const totalPrice = ethers.parseEther("2"); // 2 products * 1 ETH each

    // Purchase product
    await expect(
      crowdfunding.connect(buyer).purchaseProduct(campaignId, amountToPurchase, { value: totalPrice })
    )
      .to.emit(crowdfunding, "ProductPurchased")
      .withArgs(campaignId, buyer.address, amountToPurchase, totalPrice);

    // Verify the remaining product supply
    const campaign = await crowdfunding.campaigns(campaignId);
    expect(campaign.totalProductSupply).to.equal(8); // 10 - 2

    // Check earnings distribution
    const earningsPerToken = ethers.parseEther("1").div(1000); // 1 ETH distributed among 1000 tokens
    const expectedPayoutHolder1 = earningsPerToken.mul(500); // 50% of earnings
    const expectedPayoutHolder2 = earningsPerToken.mul(300); // 30% of earnings
    const expectedPayoutHolder3 = earningsPerToken.mul(200); // 20% of earnings

    // Validate balances
    await expect(() => crowdfunding.provider.getBalance(holder1.address)).to.changeBalance(holder1, expectedPayoutHolder1);
    await expect(() => crowdfunding.provider.getBalance(holder2.address)).to.changeBalance(holder2, expectedPayoutHolder2);
    await expect(() => crowdfunding.provider.getBalance(holder3.address)).to.changeBalance(holder3, expectedPayoutHolder3);
  });

  it("should fail if buyer does not pay sufficient amount", async function () {
    const amountToPurchase = 1; // 1 product
    const insufficientAmount = ethers.parseEther("0.5"); // Less than product price

    await expect(
      crowdfunding.connect(buyer).purchaseProduct(campaignId, amountToPurchase, { value: insufficientAmount })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("should fail if trying to purchase more products than available", async function () {
    const excessiveAmount = 11; // More than total supply

    await expect(
      crowdfunding.connect(buyer).purchaseProduct(campaignId, excessiveAmount, { value: ethers.parseEther("11") })
    ).to.be.revertedWith("Not enough products available");
  });
});
