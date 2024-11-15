// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    struct Campaign {
        address creator;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        bool finalized;
        mapping(address => uint256) contributions;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;

    event CampaignInitialized(uint256 campaignId, address indexed creator, uint256 targetAmount, uint256 deadline);
    event ContributionMade(uint256 campaignId, address indexed contributor, uint256 amount);
    event CampaignSuccessful(uint256 campaignId);
    event CampaignFailed(uint256 campaignId);
    event RefundProcessed(uint256 campaignId, address indexed contributor, uint256 amount);

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

    function initializeCampaign(uint256 targetAmount, uint256 deadline) external {
        // require(deadline > block.timestamp, "Invalid deadline");
        require(targetAmount > 0, "Target amount must be greater than 0");

        campaignCount++;
        Campaign storage campaign = campaigns[campaignCount];
        campaign.creator = msg.sender;
        campaign.targetAmount = targetAmount;
        campaign.deadline = deadline;

        emit CampaignInitialized(campaignCount, msg.sender, targetAmount, deadline);
    }

    function contribute(uint256 campaignId) external payable isActiveCampaign(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.value > 0, "Contribution must be greater than 0");

        campaign.currentAmount += msg.value;
        campaign.contributions[msg.sender] += msg.value;

        emit ContributionMade(campaignId, msg.sender, msg.value);

        if (campaign.currentAmount >= campaign.targetAmount) {
            emit CampaignSuccessful(campaignId);
        }
    }

    function finalizeCampaign(uint256 campaignId) external onlyCreator(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp > campaign.deadline || campaign.currentAmount >= campaign.targetAmount, "Campaign not eligible for finalization");
        require(!campaign.finalized, "Campaign already finalized");

        if (campaign.currentAmount >= campaign.targetAmount) {
            campaign.finalized = true;
            emit CampaignSuccessful(campaignId);
            // TODO: Add NFT minting logic here
        } else {
            emit CampaignFailed(campaignId);
        }
    }

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
        uint256 targetAmount,
        uint256 currentAmount,
        uint256 deadline,
        bool finalized
    ) {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.creator,
            campaign.targetAmount,
            campaign.currentAmount,
            campaign.deadline,
            campaign.finalized
        );
    }
}
