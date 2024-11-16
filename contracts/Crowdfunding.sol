// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "./ProductNFT.sol";  // Import the ProductNFT contract
import "./FractionalNFTManager.sol";

contract Crowdfunding {
    struct Campaign {
        address creator;
        string creatorName;
        string twitterHandle;
        string projectName;
        string projectDescription;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        bool finalized;
        uint256 productNFTId;       // The ID of the minted NFT for this campaign
        mapping(address => uint256) contributions;
        address[] contributorList;  // New field to track unique contributors

        // for selling the productNFT
        uint256 totalProductSupply;
        uint256 productPrice;


        // Voting related
        // bool votingStarted;
        // uint256 votingDeadline;
        // mapping(address => bool) hasVoted;  // Track who voted
        // uint256 totalVotesSupply;  // Votes for supply changes
        // uint256 totalVotesPrice;   // Votes for price changes
        // uint256 proposedSupply;    // Proposed new supply
        // uint256 proposedPrice;     // Proposed new price
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;

    ProductNFT public productNFT;
    FractionalNFTManager public fractionalNFTManager;

    // Constructor to accept the ProductNFT and FractionalNFTManager addresses
    constructor(address _productNFTAddress, address _fractionalNFTManagerAddress) {
        productNFT = ProductNFT(_productNFTAddress);
        fractionalNFTManager = FractionalNFTManager(_fractionalNFTManagerAddress);
    }

    event CampaignInitialized(
        uint256 campaignId, 
        address indexed creator, 
        string creatorName,
        string twitterHandle,
        string projectName,
        uint256 targetAmount, 
        uint256 deadline
    );
    event ContributionMade(uint256 campaignId, address indexed contributor, uint256 amount);
    event CampaignSuccessful(uint256 campaignId, uint256 productNFTId);
    event CampaignFailed(uint256 campaignId);
    event RefundProcessed(uint256 campaignId, address indexed contributor, uint256 amount);
    event ProductPurchased(uint256 indexed campaignId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event EarningsDistributed(uint256 indexed campaignId, uint256 totalEarnings);


    modifier onlyCreator(uint256 campaignId) {
        require(campaigns[campaignId].creator == msg.sender, "Not the campaign creator");
        _;
    }

    modifier isActiveCampaign(uint256 campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        // require(block.timestamp <= campaign.deadline, "Campaign has ended");
        require(!campaign.finalized, "Campaign already finalized");
        _;
    }

    function initializeCampaign(
        uint256 targetAmount, 
        uint256 deadline,
        string memory creatorName,
        string memory twitterHandle,
        string memory projectName,
        string memory projectDescription
    ) external {
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(bytes(creatorName).length > 0, "Creator name cannot be empty");
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(deadline > block.timestamp, "Deadline must be in the future");

        campaignCount++;
        Campaign storage campaign = campaigns[campaignCount];
        
        // Initialize basic campaign details
        campaign.creator = msg.sender;
        campaign.creatorName = creatorName;
        campaign.twitterHandle = twitterHandle;
        campaign.projectName = projectName;
        campaign.projectDescription = projectDescription;
        campaign.targetAmount = targetAmount;
        campaign.deadline = deadline;
        campaign.currentAmount = 0;
        campaign.finalized = false;
        
        // Initialize product-related fields
        campaign.totalProductSupply = 0;
        campaign.productPrice = 0;
        
        // Initialize empty contributor list
        delete campaign.contributorList;

        emit CampaignInitialized(
            campaignCount, 
            msg.sender, 
            creatorName,
            twitterHandle,
            projectName,
            targetAmount, 
            deadline
        );
    }

    function contribute(uint256 campaignId) external payable isActiveCampaign(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.value > 0, "Contribution must be greater than 0");

        // If this is their first contribution, add them to the contributor list
        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributorList.push(msg.sender);
        }

        campaign.currentAmount += msg.value;
        campaign.contributions[msg.sender] += msg.value;

        emit ContributionMade(campaignId, msg.sender, msg.value);

        if (campaign.currentAmount >= campaign.targetAmount) {
            emit CampaignSuccessful(campaignId, campaign.productNFTId);
        }
    }

    function finalizeCampaign(uint256 campaignId) external onlyCreator(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp > campaign.deadline || campaign.currentAmount >= campaign.targetAmount, 
            "Campaign not eligible for finalization");
        require(!campaign.finalized, "Campaign already finalized");

        if (campaign.currentAmount >= campaign.targetAmount) {
            campaign.finalized = true;

            // Mint the NFT
            uint256 productNFTId = productNFT.mint(campaign.creator, "https://example.com/product-nft.json");
            campaign.productNFTId = productNFTId;

            // Set initial product details
            campaign.totalProductSupply = 1000; // Initial supply
            campaign.productPrice = 1 ether;   // Initial price (1 ETH)

            // Fractionalize the ProductNFT
            fractionalNFTManager.fractionalizeNFT(productNFTId, 1000);  // Create 1000 fractional tokens
            address fractionalNFTAddress = fractionalNFTManager.getFractionalNFT(productNFTId);
            FractionalNFTToken fractionalNFTToken = FractionalNFTToken(fractionalNFTAddress);

            // Get all contributors and their contributions
            address[] memory contributors = getContributors(campaignId);
            for (uint256 i = 0; i < contributors.length; i++) {
                address contributor = contributors[i];
                if (contributor != address(0)) {
                    uint256 contribution = campaign.contributions[contributor];
                    if (contribution > 0) {
                        // Calculate share amount based on contribution percentage
                        uint256 shareAmount = (contribution * 1000) / campaign.currentAmount;
                        if (shareAmount > 0) {
                            fractionalNFTToken.mintShares(contributor, shareAmount);
                        }
                    }
                }
            }

            emit CampaignSuccessful(campaignId, productNFTId);
        } else {
            emit CampaignFailed(campaignId);
        }
    }

    // Helper function to get all contributors
    function getContributors(uint256 campaignId) internal view returns (address[] memory) {
        return campaigns[campaignId].contributorList;
    }


    function purchaseProduct(uint256 campaignId, uint256 amount) external payable {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.finalized, "Campaign is not finalized");
        require(amount > 0, "Amount must be greater than zero");
        require(campaign.totalProductSupply >= amount, "Not enough products available");

        uint256 totalPrice = amount * campaign.productPrice;
        require(msg.value >= totalPrice, "Insufficient payment");

        campaign.totalProductSupply -= amount;

        // Get the Fractional NFT details
        uint256 tokenId = campaign.productNFTId;
        address fractionalNFTAddress = fractionalNFTManager.getFractionalNFT(tokenId);
        FractionalNFTToken fractionalNFTToken = FractionalNFTToken(fractionalNFTAddress);

        uint256 fractionalSupply = fractionalNFTToken.fractionalTotalSupply();
        require(fractionalSupply > 0, "No fractional tokens exist");

        // Calculate earnings per token
        uint256 earningsPerToken = msg.value / fractionalSupply;
        require(earningsPerToken > 0, "Earnings per token must be greater than zero");

        // Get all token holders and distribute earnings
        address[] memory holders = fractionalNFTToken.getHolders();
        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];
            if (holder != address(0)) {
                uint256 holderBalance = fractionalNFTToken.balanceOf(holder);
                if (holderBalance > 0) {  // Only process holders with tokens
                    uint256 payout = holderBalance * earningsPerToken;
                    
                    if (payout > 0 && totalDistributed + payout <= msg.value) {
                        totalDistributed += payout;
                        (bool success, ) = payable(holder).call{value: payout}("");
                        require(success, "Transfer failed");
                    }
                }
            }
        }

        // Refund any remaining dust amount to the buyer
        uint256 remaining = msg.value - totalDistributed;
        if (remaining > 0) {
            (bool success, ) = payable(msg.sender).call{value: remaining}("");
            require(success, "Refund transfer failed");
        }

        emit ProductPurchased(campaignId, msg.sender, amount, totalPrice);
        emit EarningsDistributed(campaignId, totalDistributed);
    }


    // function mintProductNFT(uint256 campaignId) private returns (uint256) {
    //     Campaign storage campaign = campaigns[campaignId];

    //     // You can customize metadata based on the campaign details, such as campaign ID, creator, etc.
    //     string memory campaignMetadata = string(abi.encodePacked("Campaign #", uint2str(campaignId)));

    //     // Call the ProductNFT contract to mint the NFT
    //     uint256 productNFTId = productNFT.mint(campaign.creator, campaignMetadata);  // Mint NFT for the campaign creator
    //     return productNFTId;
    // }


    function refund(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp > campaign.deadline, "Campaign still active");
        require(campaign.currentAmount < campaign.targetAmount, "Campaign was successful");
        require(campaign.contributions[msg.sender] > 0, "No contributions to refund");

        uint256 contributedAmount = campaign.contributions[msg.sender];
        campaign.contributions[msg.sender] = 0;

        payable(msg.sender).transfer(contributedAmount);

        emit RefundProcessed(campaignId, msg.sender, contributedAmount);
    }

    function getContribution(uint256 campaignId, address contributor) external view returns (uint256) {
        return campaigns[campaignId].contributions[contributor];
    }

    function getCampaignDetails(uint256 campaignId) external view returns (
        address creator,
        string memory creatorName,
        string memory twitterHandle,
        string memory projectName,
        string memory projectDescription,
        uint256 targetAmount,
        uint256 currentAmount,
        uint256 deadline,
        bool finalized
    ) {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.creator,
            campaign.creatorName,
            campaign.twitterHandle,
            campaign.projectName,
            campaign.projectDescription,
            campaign.targetAmount,
            campaign.currentAmount,
            campaign.deadline,
            campaign.finalized
        );
    }

    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }


    // // Voting related functions
    // function startVoting(uint256 campaignId, uint256 votingDuration) external onlyCreator(campaignId) {
    //     Campaign storage campaign = campaigns[campaignId];
    //     require(campaign.finalized, "Campaign must be finalized");
    //     require(!campaign.votingStarted, "Voting already started");

    //     campaign.votingStarted = true;
    //     campaign.votingDeadline = block.timestamp + votingDuration;

    //     emit VotingStarted(campaignId, campaign.votingDeadline);
    // }

    // event VotingStarted(uint256 indexed campaignId, uint256 votingDeadline);

    // function vote(uint256 campaignId, bool voteForSupplyIncrease, uint256 proposedSupply, uint256 proposedPrice) external {
    //     Campaign storage campaign = campaigns[campaignId];
    //     require(campaign.votingStarted, "Voting not started");
    //     require(block.timestamp <= campaign.votingDeadline, "Voting has ended");
    //     require(!campaign.hasVoted[msg.sender], "You have already voted");

    //     campaign.hasVoted[msg.sender] = true;

    //     // Vote on supply and price
    //     if (voteForSupplyIncrease) {
    //         campaign.totalVotesSupply += 1;
    //         campaign.proposedSupply = proposedSupply;
    //     }
        
    //     if (!voteForSupplyIncrease) {
    //         campaign.totalVotesPrice += 1;
    //         campaign.proposedPrice = proposedPrice;
    //     }

    //     emit Voted(campaignId, msg.sender, voteForSupplyIncrease, proposedSupply, proposedPrice);
    // }

    // event Voted(uint256 indexed campaignId, address indexed voter, bool voteForSupplyIncrease, uint256 proposedSupply, uint256 proposedPrice);

    // function finalizeVoting(uint256 campaignId) external {
    //     Campaign storage campaign = campaigns[campaignId];
    //     require(campaign.votingStarted, "Voting has not started");
    //     require(block.timestamp > campaign.votingDeadline, "Voting still ongoing");

    //     bool majorityVotesSupply = campaign.totalVotesSupply > (campaignCount / 2);
    //     bool majorityVotesPrice = campaign.totalVotesPrice > (campaignCount / 2);

    //     // Apply the results of the voting
    //     if (majorityVotesSupply) {
    //         campaign.totalProductSupply = campaign.proposedSupply;
    //     }
    //     if (majorityVotesPrice) {
    //         campaign.productPrice = campaign.proposedPrice;
    //     }

    //     campaign.votingStarted = false;  // End the voting process

    //     emit VotingFinalized(campaignId, campaign.totalProductSupply, campaign.productPrice);
    // }

    // event VotingFinalized(uint256 indexed campaignId, uint256 newProductSupply, uint256 newProductPrice);


}
