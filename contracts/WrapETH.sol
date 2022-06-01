// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrapETH is ERC20, Ownable {
    constructor() ERC20("WrapETH", "ETH") {}

    function deposit() public payable returns (bool) {
        require(
            _msgSender().balance >= msg.value,
            "Sender balance must be greater than the amount of ETH to deposit"
        );
        require(msg.value > 0, "ETH must be greater than 0");
        bool isSuccess = payable(address(this)).send(msg.value);
        _mint(_msgSender(), msg.value);
        return isSuccess;
    }

    function withdraw(uint256 amount) public returns (bool) {
        require(amount <= balanceOf(_msgSender()));
        _burn(_msgSender(), amount);
        bool isSuccess = payable(_msgSender()).send(amount);
        return isSuccess;
    }
}
