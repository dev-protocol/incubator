// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
	constructor(uint256 initialBalance) public ERC20("Token", "TOKEN") {
		_mint(msg.sender, initialBalance);
	}
}
