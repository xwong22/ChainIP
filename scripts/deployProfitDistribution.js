const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const contributor1 = "0x6373336291468Cb9463d131aF8069a52cda3A537"
    const contributor2 = "0xa2C9b0F51Cf90cf3659a15963CA58E4058111cBF"
    const contributor3 = "0x91c871d879e5d885e06dE58979986137b032724b"

    const validAddress1 = ethers.getAddress(contributor1);
    const validAddress2 = ethers.getAddress(contributor2);
    const validAddress3 = ethers.getAddress(contributor3);
    console.log("Validated address 1:", validAddress1);
    console.log("Validated address 2:", validAddress2);
    console.log("Validated address 3:", validAddress3);



    // Deploy ProfitDistributionHook with the first 3 contributors
    const ProfitDistributionHook = await hre.ethers.getContractFactory("ProfitDistributionHook");
    const profitHook = await ProfitDistributionHook.deploy([validAddress1, validAddress2, validAddress3]);
    await profitHook.waitForDeployment();
    console.log("ProfitDistributionHook deployed to:", profitHook.target);

    // // Example: Send Ether to the hook to simulate profit distribution
    // try {
    //     const tx = await profitHook.didReceiveAttestation(
    //         validAddress1,        // Attester
    //         1,                    // Schema ID
    //         1,                    // Attestation ID
    //         ethers.AbiCoder.defaultAbiCoder().encode(
    //             ["tuple(address requestorAddress, uint256 price, uint256 projectID)"],
    //             [[
    //                 validAddress1,
    //                 1000n,  // Using BigInt for uint256
    //                 1n
    //             ]]
    //         ),
    //         { value: ethers.parseEther("0.001") }
    //     );
    //     console.log("Transaction sent:", tx.hash);
    //     const receipt = await tx.wait();
    //     console.log("Transaction confirmed:", receipt);
    // } catch (error) {
    //     console.error("Detailed error:", error);
    //     if (error.data) {
    //         console.error("Error data:", error.data);
    //     }
    // }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
