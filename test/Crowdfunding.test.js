const { expect } = require("chai");
const { ethers } = require("hardhat");

const dateToUNIX = (date) => {
  return Math.round(new Date(date).getTime() / 1000);
};

describe("Crowdfunding Contract with ProductNFT", function () {
  let Crowdfunding, crowdfunding;
  let ProductNFT, productNFT;
  let owner, creator, contributor1, contributor2;
  const targetAmount = ethers.parseEther("10"); // 10 ETH
  const oneEther = ethers.parseEther("1");
  const deadline = dateToUNIX("2024-12-12");

  beforeEach(async function () {
    [owner, creator, contributor1, contributor2] = await ethers.getSigners();

    // console.log("Owner: ", owner.address);
    // console.log("Creator: ", creator.address);
    // console.log("Contributor1: ", contributor1.address);
    // console.log("Contributor2: ", contributor2.address);

    // Deploy ProductNFT contract
    const ProductNFTFactory = await ethers.getContractFactory("ProductNFT");
    productNFT = await ProductNFTFactory.deploy();
    await productNFT.waitForDeployment();

    // Deploy FractionalNFTManager contract
    const FractionalNFTManagerFactory = await ethers.getContractFactory("FractionalNFTManager");
    fractionalNFTManager = await FractionalNFTManagerFactory.deploy(productNFT.target);
    await fractionalNFTManager.waitForDeployment();

    // Deploy Crowdfunding contract with ProductNFT address
    const CrowdfundingFactory = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await CrowdfundingFactory.deploy(productNFT.target, fractionalNFTManager.target);
    await crowdfunding.waitForDeployment();

    // Transfer ownership of ProductNFT to the Crowdfunding contract
    await productNFT.transferOwnership(crowdfunding.target);

    // Transfer ownership of FractionalNFTManager to the Crowdfunding contract
    await fractionalNFTManager.transferOwnership(crowdfunding.target);
  });

  it("should initialize a campaign and link to ProductNFT", async function () {
    const tx = await crowdfunding.connect(creator).initializeCampaign(
        ethers.parseEther("10"), // targetAmount (10 ETH)
        1733961600,              // deadline
        "John Doe",              // creatorName
        "@johndoe",             // twitterHandle
        "My Awesome Project",    // projectName
        "This is a description of my awesome project" // projectDescription
    );
    await expect(tx).to.emit(crowdfunding, "CampaignInitialized");

    const campaignDetails = await crowdfunding.getCampaignDetails(1);
    expect(campaignDetails.creator).to.equal(creator.address);
    expect(campaignDetails.targetAmount).to.equal(targetAmount);
    expect(campaignDetails.currentAmount).to.equal(0);
    expect(campaignDetails.deadline).to.equal(deadline);
    expect(campaignDetails.finalized).to.equal(false);
  });

  it("should mint a ProductNFT after a successful campaign", async function () {
    await crowdfunding.connect(creator).initializeCampaign(
        targetAmount,
        deadline,
        "John Doe",              // creatorName
        "@johndoe",             // twitterHandle
        "My Awesome Project",    // projectName
        "This is a description of my awesome project" // projectDescription
    );

    // Contributors contribute to meet the target
    await crowdfunding.connect(contributor1).contribute(1, { value: ethers.parseEther("5") });
    await crowdfunding.connect(contributor2).contribute(1, { value: ethers.parseEther("5") });

    // Finalize the campaign
    const finalizeTx = await crowdfunding.connect(creator).finalizeCampaign(1);
    await expect(finalizeTx).to.emit(crowdfunding, "CampaignSuccessful");

    // Check that the ProductNFT was minted
    const tokenId = 0; // Assuming the first NFT minted has ID 0
    const ownerOfNFT = await productNFT.ownerOf(tokenId);
    expect(ownerOfNFT).to.equal(creator.address);
  });

  // it("should not mint a ProductNFT for failed campaigns", async function () {
  //   const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  //   await crowdfunding.connect(creator).initializeCampaign(
  //       targetAmount,
  //       pastDeadline,
  //       "John Doe",
  //       "@johndoe",
  //       "My Awesome Project",
  //       "This is a description of my awesome project"
  //   );

  //   // Finalize the campaign
  //   const finalizeTx = await crowdfunding.connect(creator).finalizeCampaign(1);
  //   await expect(finalizeTx).to.emit(crowdfunding, "CampaignFailed");

  //   // Ensure no ProductNFT is minted
  //   const tokenId = 0; // The first token ID would be 0 if minted
  //   // Ensure no NFT was minted
  //   await expect(
  //       productNFT.tokenURI(0)  // Trying to get the token URI for tokenId 0 should fail
  //   ).to.be.revertedWithCustomError(productNFT, "ERC721NonexistentToken").withArgs(tokenId);
  // });

  it("should allow contributions to an active campaign", async function () {
    await crowdfunding.connect(creator).initializeCampaign(
        targetAmount,
        deadline,
        "John Doe",
        "@johndoe",
        "My Awesome Project",
        "This is a description of my awesome project"
    );

    const tx = await crowdfunding.connect(contributor1).contribute(1, { value: oneEther });
    await expect(tx).to.emit(crowdfunding, "ContributionMade").withArgs(1, contributor1.address, oneEther);

    const contribution = await crowdfunding.getContribution(1, contributor1.address);
    expect(contribution).to.equal(oneEther);

    const campaignDetails = await crowdfunding.getCampaignDetails(1);
    expect(campaignDetails.currentAmount).to.equal(oneEther);
  });
});
