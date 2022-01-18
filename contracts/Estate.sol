pragma solidity ^0.5.0;
import "./ERC721Full.sol";

contract Estate is ERC721Full {
    uint256 public propertycounter;

    constructor() public ERC721Full("BATDONGSAN", "BDS") {
        propertycounter = 0;
    }

    function mint(string memory tokenURI) public returns (uint256) {
        uint256 House = propertycounter;
        _mint(msg.sender, House);
        _setTokenURI(House, tokenURI);
        propertycounter += 1;
        return House;
    }

    function tokensOfOwner(address owner)
        public
        view
        returns (uint256[] memory)
    {
        return _tokensOfOwner(owner);
    }
}
