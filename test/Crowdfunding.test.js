const { expect } = require("chai");
const { ethers } = require("hardhat");

const dateToUNIX = (date) => {
  return Math.round(new Date(date).getTime() / 1000)
}

describe("Crowdfunding Contract", function () {
  let Crowdfunding, crowdfunding;
  let owner, creator, contributor1, contributor2;
  const targetAmount = ethers.parseEther("10"); // 10 ETH
  const oneEther = ethers.parseEther("1");
  // const deadline = Math.floor(Date.now() / 1000) +  24 * 3600; // 1 hour from now
  const deadline=dateToUNIX('2024-12-12');


  console.log("deadline", deadline);
  console.log("Deadline Type:", typeof deadline);


  beforeEach(async function () {
    [owner, creator, contributor1, contributor2] = await ethers.getSigners();
    Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy();
    // await crowdfunding.deployed();
  });

  it("should allow a campaign to be initialized", async function () {
    const block = await ethers.provider.getBlock("latest");
    console.log("Current block timestamp:", block.timestamp);


    const tx = await crowdfunding.connect(creator).initializeCampaign(targetAmount, deadline);
    await expect(tx).to.emit(crowdfunding, "CampaignInitialized");

    const campaignDetails = await crowdfunding.getCampaignDetails(1);
    expect(campaignDetails.creator).to.equal(creator.address);
    expect(campaignDetails.targetAmount).to.equal(targetAmount);
    expect(campaignDetails.currentAmount).to.equal(0);
    expect(campaignDetails.deadline).to.equal(deadline);
    expect(campaignDetails.finalized).to.equal(false);
  });

  it("should allow contributions to an active campaign", async function () {
    await crowdfunding.connect(creator).initializeCampaign(targetAmount, deadline);

    const tx = await crowdfunding.connect(contributor1).contribute(1, { value: oneEther });
    await expect(tx).to.emit(crowdfunding, "ContributionMade").withArgs(1, contributor1.address, oneEther);

    const contribution = await crowdfunding.getContribution(1, contributor1.address);
    expect(contribution).to.equal(oneEther);

    const campaignDetails = await crowdfunding.getCampaignDetails(1);
    expect(campaignDetails.currentAmount).to.equal(oneEther);
  });

  it("should emit CampaignSuccessful if the target is met", async function () {
    await crowdfunding.connect(creator).initializeCampaign(targetAmount, deadline);

    const tx1 = await crowdfunding.connect(contributor1).contribute(1, { value: ethers.parseEther("5") });
    const tx2 = await crowdfunding.connect(contributor2).contribute(1, { value: ethers.parseEther("5") });

    await expect(tx2).to.emit(crowdfunding, "CampaignSuccessful").withArgs(1);

    const campaignDetails = await crowdfunding.getCampaignDetails(1);
    expect(campaignDetails.currentAmount).to.equal(targetAmount);
  });

  it("should allow refunds if the campaign fails", async function () {
    const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    await crowdfunding.connect(creator).initializeCampaign(targetAmount, pastDeadline);

    await crowdfunding.connect(contributor1).contribute(1, { value: oneEther });

    const refundTx = await crowdfunding.connect(contributor1).refund(1);
    await expect(refundTx).to.emit(crowdfunding, "RefundProcessed").withArgs(1, contributor1.address, oneEther);

    const contribution = await crowdfunding.getContribution(1, contributor1.address);
    expect(contribution).to.equal(0);
  });

  // it("should not allow contributions after the deadline", async function () {
  //   const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  //   await crowdfunding.connect(creator).initializeCampaign(targetAmount, pastDeadline);

  //   await expect(
  //     crowdfunding.connect(contributor1).contribute(1, { value: oneEther })
  //   ).to.be.revertedWith("Campaign has ended");
  // });

  it("should not allow non-creator to finalize the campaign", async function () {
    await crowdfunding.connect(creator).initializeCampaign(targetAmount, deadline);

    await crowdfunding.connect(contributor1).contribute(1, { value: targetAmount });

    await expect(
      crowdfunding.connect(contributor1).finalizeCampaign(1)
    ).to.be.revertedWith("Not the campaign creator");
  });

  it("should allow the creator to finalize a successful campaign", async function () {
    await crowdfunding.connect(creator).initializeCampaign(targetAmount, deadline);

    await crowdfunding.connect(contributor1).contribute(1, { value: targetAmount });

    const finalizeTx = await crowdfunding.connect(creator).finalizeCampaign(1);
    await expect(finalizeTx).to.emit(crowdfunding, "CampaignSuccessful");

    const campaignDetails = await crowdfunding.getCampaignDetails(1);
    expect(campaignDetails.finalized).to.equal(true);
  });

  it("should allow the creator to finalize a failed campaign", async function () {
    const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    await crowdfunding.connect(creator).initializeCampaign(targetAmount, pastDeadline);

    const finalizeTx = await crowdfunding.connect(creator).finalizeCampaign(1);
    await expect(finalizeTx).to.emit(crowdfunding, "CampaignFailed");
  });
});
