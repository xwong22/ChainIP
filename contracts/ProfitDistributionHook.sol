// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./ProfitDistributionManager.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

interface ISPHook {
    function didReceiveAttestation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        bytes calldata extraData
    ) external payable;

    function didReceiveAttestation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        IERC20 resolverFeeERC20Token,
        uint256 resolverFeeERC20Amount,
        bytes calldata extraData
    ) external;

    function didReceiveRevocation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        bytes calldata extraData
    ) external payable;

    function didReceiveRevocation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        IERC20 resolverFeeERC20Token,
        uint256 resolverFeeERC20Amount,
        bytes calldata extraData
    ) external;
}

contract ProfitDistributionHook is ISPHook, ProfitDistributionManager {
    constructor(address[] memory initialContributors)
        ProfitDistributionManager(initialContributors)
    {}

    // Implementation for didReceiveAttestation (Ether-based)
    function didReceiveAttestation(
        address, // attester
        uint64,  // schemaId
        uint64,  // attestationId
        bytes calldata // extraData
    ) external payable override {
        distributeProfit(); // Trigger profit distribution
    }

    // Implementation for didReceiveAttestation (ERC20-based)
    function didReceiveAttestation(
        address, // attester
        uint64,  // schemaId
        uint64,  // attestationId
        IERC20,  // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata // extraData
    ) external override {
        distributeProfit(); // Trigger profit distribution
    }

    // Implementation for didReceiveRevocation (Ether-based)
    function didReceiveRevocation(
        address, // attester
        uint64,  // schemaId
        uint64,  // attestationId
        bytes calldata // extraData
    ) external payable override {
        // No specific action on revocation in this example
    }

    // Implementation for didReceiveRevocation (ERC20-based)
    function didReceiveRevocation(
        address, // attester
        uint64,  // schemaId
        uint64,  // attestationId
        IERC20,  // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata // extraData
    ) external override {
        // No specific action on revocation in this example
    }
}
