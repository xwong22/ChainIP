// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FractionalNFTToken.sol";

// FractionalNFTManager.sol
contract FractionalNFTManager is Ownable {
    mapping(uint256 => address) public fractionalNFTs;  // Mapping of tokenId to fractional NFT contract address
    FractionalNFTToken public fractionalNFTToken;

    constructor(address _fractionalNFTTokenAddress) Ownable(msg.sender) {
        fractionalNFTToken = FractionalNFTToken(_fractionalNFTTokenAddress);
    }

    function fractionalizeNFT(uint256 tokenId, uint256 fractionAmount) public onlyOwner {
        require(fractionalNFTs[tokenId] == address(0), "NFT already fractionalized");

        // Create a new FractionalNFTToken contract for this NFT
        address fractionalNFTContract = address(new FractionalNFTToken(tokenId, fractionAmount));
        
        // Transfer ownership of the fractionalNFTToken to the fractionalNFTManager contract
        FractionalNFTToken(fractionalNFTContract).transferOwnership(address(this));
        fractionalNFTs[tokenId] = fractionalNFTContract;


        // check that the owner of the fractionalNFTToken is the fractionalNFTManager contract
        require(FractionalNFTToken(fractionalNFTContract).owner() == address(this), "FractionalNFTToken ownership not transferred");

        // Mint fractional tokens to the campaign contributors
        FractionalNFTToken(fractionalNFTContract).mintShares(msg.sender, fractionAmount);  // Minting all shares to the contract owner for simplicity
    }


    function getFractionalNFT(uint256 tokenId) public view returns (address) {
        return fractionalNFTs[tokenId];
    }
}
