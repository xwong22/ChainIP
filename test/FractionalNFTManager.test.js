const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FractionalNFTManager", function () {
  let ProductNFT, productNFT;
  let FractionalNFTToken, fractionalNFTToken;
  let FractionalNFTManager, fractionalNFTManager;
  let owner, user1, user2;
  const nftURI = "https://example.com/nft-metadata";
  const fractionAmount = 1000; // 1000 fractional tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy ProductNFT contract (ERC721)
    ProductNFT = await ethers.getContractFactory("ProductNFT");
    productNFT = await ProductNFT.deploy();
    await productNFT.waitForDeployment();

    // Deploy FractionalNFTManager contract
    FractionalNFTManager = await ethers.getContractFactory("FractionalNFTManager");
    fractionalNFTManager = await FractionalNFTManager.deploy(productNFT.target);
    await fractionalNFTManager.waitForDeployment();

    

    // Mint an NFT
    await productNFT.connect(owner).mint(owner.address, nftURI);
    nftTokenId = 0; // Assume the first token minted has ID 0
  });

  it("should mint an NFT", async function () {
    const ownerOfNFT = await productNFT.ownerOf(nftTokenId);
    expect(ownerOfNFT).to.equal(owner.address);
  });

  it("should fractionalize an NFT", async function () {
    // Fractionalize the NFT by creating 1000 fractional tokens
    await fractionalNFTManager.fractionalizeNFT(nftTokenId, fractionAmount);
    
    // Check that the fractional token contract exists and is mapped to the NFT ID
    fractionalNFTTokenAddress = await fractionalNFTManager.getFractionalNFT(nftTokenId);
    expect(fractionalNFTManager).to.not.equal(ethers.ZeroAddress);
    
    // Verify the fractional NFT token details
    const fractionalNFTToken = await ethers.getContractAt("FractionalNFTToken", fractionalNFTTokenAddress);
    expect(await fractionalNFTToken.fractionalTotalSupply()).to.equal(fractionAmount);
  });

  it("should allow minting of fractional tokens", async function () {
    // Fractionalize the NFT first
    await fractionalNFTManager.fractionalizeNFT(nftTokenId, fractionAmount);
    fractionalNFTTokenAddress = await fractionalNFTManager.getFractionalNFT(nftTokenId);

    

    const fractionalNFTToken = await ethers.getContractAt("FractionalNFTToken", fractionalNFTTokenAddress);

    // const owner = await fractionalNFTToken.owner();
    // console.log(owner);
    // const owner2 = await fractionalNFTManager.owner();
    // console.log(owner2);

    // // Check that the owner of the fractionalNFTToken is the fractionalNFTManager
    // const owner = await fractionalNFTToken.owner();
    // console.log("FractionalNFTToken owner:", owner);
    // expect(owner).to.equal(fractionalNFTManager.address); // Make sure fractionalNFTManager owns the token

    // Check that the fractionalNFTManager owns the fractionalNFTToken contract
    // expect(owner).to.equal(fractionalNFTManager.target);

    // Mint 500 fractional tokens to user1
    await fractionalNFTToken.mintShares(user1.address, 500);
    expect(await fractionalNFTToken.balanceOf(user1.address)).to.equal(500);

    // Mint 300 fractional tokens to user2
    await fractionalNFTToken.mintShares(user2.address, 300);
    expect(await fractionalNFTToken.balanceOf(user2.address)).to.equal(300);
  });

//   it("should allow burning fractional tokens to redeem the NFT", async function () {
//     // Fractionalize the NFT first
//     await fractionalNFTManager.fractionalizeNFT(nftTokenId, fractionAmount);
//     fractionalNFTTokenAddress = await fractionalNFTManager.getFractionalNFT(nftTokenId);
//     const fractionalNFTToken = await ethers.getContractAt("FractionalNFTToken", fractionalNFTTokenAddress);

//     // Mint fractional tokens to user1
//     await fractionalNFTToken.mintShares(user1.address, 500);

//     // User1 burns all their fractional tokens
//     await fractionalNFTToken.connect(user1).burnShares(500);

//     // Check that User1 has redeemed the NFT
//     const nftOwner = await productNFT.ownerOf(nftTokenId);
//     expect(nftOwner).to.equal(user1.address);
//   });

//   it("should not allow redeeming NFT without burning all fractional tokens", async function () {
//     // Fractionalize the NFT first
//     await fractionalNFTManager.fractionalizeNFT(nftTokenId, fractionAmount);
//     fractionalNFTTokenAddress = await fractionalNFTManager.getFractionalNFT(nftTokenId);
//     const fractionalNFTToken = await ethers.getContractAt("FractionalNFTToken", fractionalNFTTokenAddress);

//     // Mint fractional tokens to user1
//     await fractionalNFTToken.mintShares(user1.address, 500);

//     // User1 burns only part of their fractional tokens (not all)
//     await fractionalNFTToken.connect(user1).burnShares(300);

//     // User1 should not be able to redeem the NFT yet
//     await expect(
//       fractionalNFTManager.connect(user1).redeemNFT(nftTokenId, 300)
//     ).to.be.revertedWith("Not enough fractional tokens burned");
//   });

  it("should allow multiple users to own fractions of the same NFT", async function () {
    // Fractionalize the NFT first
    await fractionalNFTManager.fractionalizeNFT(nftTokenId, fractionAmount);
    fractionalNFTTokenAddress = await fractionalNFTManager.getFractionalNFT(nftTokenId);
    const fractionalNFTToken = await ethers.getContractAt("FractionalNFTToken", fractionalNFTTokenAddress);

    // Mint fractional tokens to user1 and user2
    await fractionalNFTToken.mintShares(user1.address, 500);
    await fractionalNFTToken.mintShares(user2.address, 300);

    // Check fractional token balances
    expect(await fractionalNFTToken.balanceOf(user1.address)).to.equal(500);
    expect(await fractionalNFTToken.balanceOf(user2.address)).to.equal(300);
  });
});
