// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
	constructor(uint256 initialBalance) ERC20("Token", "TOKEN") public {
		_mint(msg.sender, initialBalance);
	}
}
