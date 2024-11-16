// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProductNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("ProductNFT", "PNFT") Ownable(msg.sender) {}

    function mint(address to, string memory metadataURI) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);  // You can link to metadata or product info

        return tokenId;
    }

    function getLastTokenId() public view returns (uint256) {
        return nextTokenId - 1;
    }
}
