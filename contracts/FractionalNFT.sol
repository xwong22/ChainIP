// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalNFT is ERC1155, Ownable {
    uint256 public constant PRODUCT_SHARE = 1;  // ID for the fractionalized NFT token
    uint256 public totalSupply;
    address public productNFTAddress;
    mapping(address => uint256) public contributorShares;

    event Fractionalized(address indexed contributor, uint256 amount);
    event FractionalOwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    constructor() ERC1155("https://api.example.com/api/token/{id}.json") {
        productNFTAddress = _productNFTAddress;
    }

    // Fractionalize ownership based on the contribution
    function fractionalize(address contributor, uint256 amount) external onlyOwner {
        _mint(contributor, PRODUCT_SHARE, amount, "");
        contributorShares[contributor] += amount;
        totalSupply += amount;
        emit Fractionalized(contributor, amount);
    }

    // Transfer fractional ownership to the product NFT owner
    function transferOwnership(uint256 amount) external {
        require(contributorShares[msg.sender] >= amount, "Not enough shares to transfer");
        contributorShares[msg.sender] -= amount;
        totalSupply -= amount;
        _mint(msg.sender, PRODUCT_SHARE, amount, "");
        emit OwnershipTransferred(msg.sender, address(this));
    }

    // Retrieve the total number of fractional shares an address owns
    function getFractionalOwnership(address contributor) external view returns (uint256) {
        return contributorShares[contributor];
    }

    // Mint an ERC-1155 token for fractional ownership (callable by contract owner)
    function mintShares(address contributor, uint256 amount) external onlyOwner {
        _mint(contributor, PRODUCT_SHARE, amount, "");
        contributorShares[contributor] += amount;
        totalSupply += amount;
    }

    // Get the total fractionalized supply (total shares)
    function getTotalSupply() external view returns (uint256) {
        return totalSupply;
    }
}
