const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfitDistributionManager", function () {
  let profitManager;
  let owner;
  let contributors;
  let nonContributor;

  beforeEach(async function () {
    // Deploy contract with contributors
    [owner, nonContributor, ...contributors] = await ethers.getSigners();
    const initialContributors = contributors.map((c) => c.address);

    const ProfitDistributionManager = await ethers.getContractFactory("ProfitDistributionManager");
    profitManager = await ProfitDistributionManager.deploy(initialContributors);

    await profitManager.waitForDeployment();
  });

  it("should distribute profit equally to all contributors", async function () {
    const totalProfit = ethers.utils.parseEther("10"); // 10 ETH
    const individualShare = totalProfit.div(contributors.length);

    await expect(() =>
      profitManager.connect(owner).distributeProfit({ value: totalProfit })
    ).to.changeEtherBalances(
      contributors,
      Array(contributors.length).fill(individualShare)
    );

    await expect(profitManager.distributeProfit({ value: 0 })).to.be.revertedWith(
      "No profit to distribute."
    );
  });

  it("should allow only the owner to update contributors", async function () {
    const newContributors = [nonContributor.address];

    await profitManager.connect(owner).updateContributors(newContributors);

    expect(await profitManager.getContributors()).to.deep.equal(newContributors);

    await expect(
      profitManager.connect(nonContributor).updateContributors(newContributors)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should revert if there are no contributors", async function () {
    await profitManager.connect(owner).updateContributors([]);

    await expect(
      profitManager.distributeProfit({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("No contributors to distribute profit.");
  });

  it("should emit an event when profit is distributed", async function () {
    const totalProfit = ethers.utils.parseEther("5"); // 5 ETH

    await expect(profitManager.connect(owner).distributeProfit({ value: totalProfit }))
      .to.emit(profitManager, "ProfitDistributed")
      .withArgs(totalProfit, totalProfit.div(contributors.length));
  });
});
