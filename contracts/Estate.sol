// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Estate is ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("GameItem", "ITM") {}

    function mint(string memory _tokenURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(_msgSender(), newItemId);
        _setTokenURI(newItemId, _tokenURI);

        return newItemId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    function tokensOfOwner(address owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 tokenId;
        uint256[] memory listToken = new uint256[](balanceOf(owner));
        for (uint256 index = 0; index < listToken.length; index++) {
            tokenId = tokenOfOwnerByIndex(owner, index);
            listToken[index] = tokenId;
        }
        return listToken;
    }

    function allTokens() public view returns (uint256[] memory) {
        uint256 tokenId;
        uint256[] memory listToken = new uint256[](totalSupply());
        for (uint256 index = 0; index < listToken.length; index++) {
            tokenId = tokenByIndex(index);
            listToken[index] = tokenId;
        }
        return listToken;
    }

    event NftBought(address _seller, address _buyer, uint256 _price);

    mapping(uint256 => uint256) public tokenIdToPrice;

    function allowBuy(uint256 _tokenId, uint256 _price) external {
        require(_msgSender() == ownerOf(_tokenId), "Not owner of this token");
        require(_price > 0, "Price zero");
        tokenIdToPrice[_tokenId] = _price;
    }

    function disallowBuy(uint256 _tokenId) external {
        require(_msgSender() == ownerOf(_tokenId), "Not owner of this token");
        tokenIdToPrice[_tokenId] = 0;
    }

    function isBuy(uint256 _tokenId) external view returns (bool) {
        return tokenIdToPrice[_tokenId] > 0;
    }

    function priceOf(uint256 _tokenId) external view returns (uint256) {
        return tokenIdToPrice[_tokenId];
    }

    function buy(uint256 _tokenId) external payable {
        uint256 price = tokenIdToPrice[_tokenId];
        require(price > 0, "This token is not for sale");
        // require(msg.value == price, "Incorrect value");

        address seller = ownerOf(_tokenId);
        _transfer(seller, _msgSender(), _tokenId);
        tokenIdToPrice[_tokenId] = 0; // not for sale anymore
        payable(seller).transfer(msg.value); // send the ETH to the seller

        emit NftBought(seller, _msgSender(), price);
    }
}
