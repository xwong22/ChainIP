// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// FractionalNFTToken.sol
contract FractionalNFTToken is ERC20, Ownable {
    uint256 public nftTokenId;
    uint256 public fractionalTotalSupply;

    constructor(uint256 _nftTokenId, uint256 _fractionalTotalSupply) ERC20("FractionalNFTToken", "FNT") Ownable(msg.sender) {
        nftTokenId = _nftTokenId;
        fractionalTotalSupply = _fractionalTotalSupply;
        _mint(msg.sender, fractionalTotalSupply);  // Mint all fractional tokens to the contract owner for simplicity
    }

    // function mintShares(address to, uint256 amount) external onlyOwner {
    function mintShares(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burnShares(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
