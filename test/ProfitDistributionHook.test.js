// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("ProfitDistributionHook", function () {
//   let profitHook;
//   let contributors;

//   beforeEach(async function () {
//     [owner, ...contributors] = await ethers.getSigners();
//     const initialContributors = contributors.map((c) => c.address);

//     const ProfitDistributionHook = await ethers.getContractFactory("ProfitDistributionHook");
//     profitHook = await ProfitDistributionHook.deploy(initialContributors);

//     await profitHook.waitForDeployment();
//   });

//   it("should distribute profit on Ether-based attestation", async function () {
//     const totalProfit = ethers.utils.parseEther("10"); // 10 ETH
//     const individualShare = totalProfit.div(contributors.length);

//     await expect(() =>
//       profitHook.didReceiveAttestation(
//         owner.address,
//         1, // schemaId
//         1, // attestationId
//         "0x", // extraData
//         { value: totalProfit }
//       )
//     ).to.changeEtherBalances(
//       contributors,
//       Array(contributors.length).fill(individualShare)
//     );
//   });

//   it("should distribute profit on ERC20-based attestation", async function () {
//     // Deploy a mock ERC20 token
//     const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
//     const erc20 = await ERC20Mock.deploy("MockToken", "MTK", owner.address, ethers.utils.parseEther("1000"));

//     const totalProfit = ethers.utils.parseEther("10");

//     await erc20.transfer(profitHook.address, totalProfit);

//     // No actual profit distribution logic here, but include an example of invocation
//     await expect(
//       profitHook.didReceiveAttestation(
//         owner.address,
//         1, // schemaId
//         1, // attestationId
//         erc20.address,
//         totalProfit,
//         "0x" // extraData
//       )
//     ).to.not.be.reverted;
//   });

//   it("should handle Ether-based revocation without errors", async function () {
//     await expect(
//       profitHook.didReceiveRevocation(
//         owner.address,
//         1, // schemaId
//         1, // attestationId
//         "0x", // extraData
//         { value: ethers.utils.parseEther("1") }
//       )
//     ).to.not.be.reverted;
//   });

//   it("should handle ERC20-based revocation without errors", async function () {
//     // Deploy a mock ERC20 token
//     const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
//     const erc20 = await ERC20Mock.deploy("MockToken", "MTK", owner.address, ethers.utils.parseEther("1000"));

//     await expect(
//       profitHook.didReceiveRevocation(
//         owner.address,
//         1, // schemaId
//         1, // attestationId
//         erc20.address,
//         ethers.utils.parseEther("1"),
//         "0x" // extraData
//       )
//     ).to.not.be.reverted;
//   });
// });
