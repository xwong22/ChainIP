
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductNFT Contract", function () {
  let ProductNFT, productNFT;
  let owner, addr1, addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the ProductNFT contract
    const ProductNFTFactory = await ethers.getContractFactory("ProductNFT");
    productNFT = await ProductNFTFactory.deploy();
    await productNFT.waitForDeployment();
  });

  it("Should deploy with the correct owner", async function () {
    expect(await productNFT.owner()).to.equal(owner.address);
  });

  it("Should mint an NFT and set the correct metadata URI", async function () {
    const metadataURI = "https://example.com/metadata/1";

    // Mint a new NFT
    const tx = await productNFT.connect(owner).mint(addr1.address, metadataURI);
    await tx.wait();

    // Check token ownership
    expect(await productNFT.ownerOf(0)).to.equal(addr1.address);

    // Check metadata URI
    expect(await productNFT.tokenURI(0)).to.equal(metadataURI);
  });

  it("Should increment token IDs correctly", async function () {
    const metadataURI1 = "https://example.com/metadata/1";
    const metadataURI2 = "https://example.com/metadata/2";

    // Mint two NFTs
    await productNFT.connect(owner).mint(addr1.address, metadataURI1);
    await productNFT.connect(owner).mint(addr2.address, metadataURI2);

    // Check token ownership
    expect(await productNFT.ownerOf(0)).to.equal(addr1.address);
    expect(await productNFT.ownerOf(1)).to.equal(addr2.address);
  });

  it("Should prevent non-owners from minting", async function () {
    const metadataURI = "https://example.com/metadata/1";

    // Try minting from a non-owner account
    await expect(
        productNFT.connect(addr1).mint(addr1.address, metadataURI)
    ).to.be.revertedWithCustomError(productNFT, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address); // Include expected argument
  });

  it("Should update the nextTokenId correctly after each mint", async function () {
    const metadataURI = "https://example.com/metadata/1";

    // Mint one NFT
    await productNFT.connect(owner).mint(addr1.address, metadataURI);

    // Check nextTokenId
    expect(await productNFT.nextTokenId()).to.equal(1);
  });

  it("Should prevent minting to the zero address", async function () {
    const metadataURI = "https://example.com/metadata/1";

    // Attempt to mint to the zero address
    await expect(
        productNFT.connect(owner).mint(ethers.ZeroAddress, metadataURI)
    ).to.be.revertedWithCustomError(productNFT, "ERC721InvalidReceiver");
  });
});
