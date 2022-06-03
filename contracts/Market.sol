// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IMarket {
    event Bought(
        address _seller,
        address _buyer,
        uint256 _tokenId,
        uint256 _price
    );

    event Bid(
        address _seller,
        address _buyer,
        uint256 _tokenId,
        uint256 _price
    );

    event OpenForSell(address _seller, uint256 _price, uint256 _tokenId);

    event CancelSell(address _seller, uint256 _tokenId);
}

struct Bider {
    address seller;
    uint256 price;
    uint256 tokenId;
}

contract MarkerModifier {
    IERC20 internal _wrapETH;
    IERC721 internal _nft;

    mapping(uint256 => uint256) internal _tokenIdToPrice;
    mapping(uint256 => Bider) internal _tokenIdToBider;

    modifier onlyOwner(uint256 _tokenId) {
        require(
            msg.sender == _nft.ownerOf(_tokenId),
            "Owner must be the same as the token owner"
        );
        _;
    }

    modifier notOwner(uint256 _tokenId) {
        require(
            msg.sender != _nft.ownerOf(_tokenId),
            "Owner must be not the same as the token owner"
        );
        _;
    }

    modifier onlyBuy(uint256 _tokenId) {
        require(
            msg.sender != _nft.ownerOf(_tokenId),
            "Owner must be the same as the token owner"
        );
        require(
            _tokenIdToPrice[_tokenId] > 0,
            "Token price must be greater than 0"
        );
        require(
            _wrapETH.balanceOf(msg.sender) >= _tokenIdToPrice[_tokenId],
            "Not enough WETH"
        );
        _;
    }
}

contract Market is MarkerModifier, IMarket {
    constructor(address wrapETH, address nft) {
        _wrapETH = IERC20(wrapETH);
        _nft = IERC721(nft);
    }

    function priceOfToken(uint256 _tokenId) public view returns (uint256) {
        return _tokenIdToPrice[_tokenId];
    }

    function openSellToken(uint256 _tokenId, uint256 _price)
        external
        onlyOwner(_tokenId)
    {
        _nft.approve(address(this), _tokenId);
        _tokenIdToPrice[_tokenId] = _price;
        emit OpenForSell(msg.sender, _price, _tokenId);
    }

    function cancelSellToken(uint256 _tokenId) external onlyOwner(_tokenId) {
        _nft.approve(address(0), _tokenId);
        _tokenIdToPrice[_tokenId] = 0;
        emit CancelSell(msg.sender, _tokenId);
    }

    /*
        call Approve on the NFT contract to allow the market to transfer the token
     */
    function acceptBid(uint256 _tokenId, address _buyer)
        external
        onlyOwner(_tokenId)
    {
        uint256 _price = _tokenIdToBider[_tokenId].price;
        require(_price > 0, "Price must be greater than 0");
        _tokenIdToBider[_tokenId] = Bider(address(0), 0, 0);
        _nft.transferFrom(msg.sender, _buyer, _tokenId);
        _wrapETH.transfer(_buyer, _price);
        emit Bought(msg.sender, _buyer, _tokenId, _price);
    }

    function buy(uint256 _tokenId) external onlyBuy(_tokenId) {
        address _seller = _nft.ownerOf(_tokenId);
        _nft.transferFrom(_seller, msg.sender, _tokenId);
        _wrapETH.transfer(msg.sender, _tokenIdToPrice[_tokenId]);
        _tokenIdToPrice[_tokenId] = 0;
        emit Bought(_seller, msg.sender, _tokenId, _tokenIdToPrice[_tokenId]);
    }

    function bid(uint256 _tokenId, uint256 _price) external notOwner(_tokenId) {
        require(_tokenIdToPrice[_tokenId] == 0, "Token price must not sell");
        require(_price > 0, "Price must be greater than 0");
        require(
            _price > _tokenIdToBider[_tokenId].price,
            "Price must be greater than the current bid price"
        );
        _wrapETH.approve(address(this), _price);
        _tokenIdToBider[_tokenId] = Bider(msg.sender, _price, _tokenId);
        emit Bid(
            msg.sender,
            _nft.ownerOf(_tokenId),
            _tokenId,
            _tokenIdToPrice[_tokenId]
        );
    }
}
