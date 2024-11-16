// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalNFTToken is ERC20, Ownable {
    uint256 public nftTokenId;
    uint256 public fractionalTotalSupply;

    mapping(address => bool) private holders;
    address[] private holderList;

    constructor(uint256 _nftTokenId, uint256 _fractionalTotalSupply)
        ERC20("FractionalNFTToken", "FNT")
        Ownable(msg.sender)
    {
        nftTokenId = _nftTokenId;
        fractionalTotalSupply = _fractionalTotalSupply;
        _mint(msg.sender, fractionalTotalSupply);
        _addHolder(msg.sender);
    }

    function mintShares(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        _addHolder(to);
    }

    function burnShares(uint256 amount) external {
        _burn(msg.sender, amount);
        if (balanceOf(msg.sender) == 0) {
            _removeHolder(msg.sender);
        }
    }

    function _addHolder(address account) internal {
        if (!holders[account]) {
            holders[account] = true;
            holderList.push(account);
        }
    }

    function _removeHolder(address account) internal {
        holders[account] = false;
        for (uint256 i = 0; i < holderList.length; i++) {
            if (holderList[i] == account) {
                holderList[i] = holderList[holderList.length - 1];
                holderList.pop();
                break;
            }
        }
    }

    function getHolders() external view returns (address[] memory) {
        return holderList;
    }
}
