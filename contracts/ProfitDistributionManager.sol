// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract ProfitDistributionManager is Ownable {
    address[] public contributors;

    event ProfitDistributed(uint256 totalProfit, uint256 individualShare);

    constructor(address[] memory initialContributors) Ownable(msg.sender) {
        contributors = initialContributors;
    }

    function updateContributors(address[] memory newContributors) external onlyOwner {
        contributors = newContributors;
    }

    function distributeProfit() public payable {
        uint256 totalContributors = contributors.length;
        require(totalContributors > 0, "No contributors to distribute profit.");
        require(msg.value > 0, "No profit to distribute.");

        uint256 individualShare = msg.value / totalContributors;
        require(individualShare > 0, "Share amount too small");

        // Ensure total distribution doesn't exceed sent amount
        require(individualShare * totalContributors <= msg.value, "Distribution calculation error");

        for (uint256 i = 0; i < totalContributors; i++) {
            require(contributors[i] != address(0), "Invalid contributor address");
            Address.sendValue(payable(contributors[i]), individualShare);
        }

        emit ProfitDistributed(msg.value, individualShare);
    }

    function getContributors() external view returns (address[] memory) {
        return contributors;
    }
}
