// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./ProfitDistributionManager.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

import { Attestation } from "@ethsign/sign-protocol-evm/src/models/Attestation.sol";
import { ISP } from "@ethsign/sign-protocol-evm/src/interfaces/ISP.sol";
import { ISPHook } from "@ethsign/sign-protocol-evm/src/interfaces/ISPHook.sol";

// interface ISPHook {
//     function didReceiveAttestation(
//         address attester,
//         uint64 schemaId,
//         uint64 attestationId,
//         bytes calldata extraData
//     ) external payable;

//     function didReceiveAttestation(
//         address attester,
//         uint64 schemaId,
//         uint64 attestationId,
//         IERC20 resolverFeeERC20Token,
//         uint256 resolverFeeERC20Amount,
//         bytes calldata extraData
//     ) external;

//     function didReceiveRevocation(
//         address attester,
//         uint64 schemaId,
//         uint64 attestationId,
//         bytes calldata extraData
//     ) external payable;

//     function didReceiveRevocation(
//         address attester,
//         uint64 schemaId,
//         uint64 attestationId,
//         IERC20 resolverFeeERC20Token,
//         uint256 resolverFeeERC20Amount,
//         bytes calldata extraData
//     ) external;
// }

// Add this struct definition at contract level
struct AttestationData {
    address requestorAddress;
    uint256 price;
    uint256 projectID;
}

contract ProfitDistributionHook is ISPHook, ProfitDistributionManager {
    constructor(address[] memory initialContributors)
        ProfitDistributionManager(initialContributors)
    {}

    // Implementation for didReceiveAttestation (Ether-based)
    function didReceiveAttestation(
        address, // attester
        uint64,  // schemaId
        uint64 attestationId,  // attestationId
        bytes calldata // extraData
    ) external payable override {
        // distributeProfit(); // Trigger profit distribution

        Attestation memory attestation = ISP(_msgSender()).getAttestation(attestationId);
        AttestationData memory data = abi.decode(attestation.data, (AttestationData));

        // // Convert price from milliUnits back to Ether units (divide by 1000)
        // number priceInEth = data.price / 1000;
        
        // Distribute the profit using the price from the attestation
        distributeProfit(data.price);  // Remove the {value: priceInEth}
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
        // distributeProfit(); // Trigger profit distribution
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
