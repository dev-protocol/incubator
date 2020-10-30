// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// The real DEV contract does not inherit the interface, so the test mock will do so as well.
contract MockDev is ERC20 {
	constructor()
		public
		ERC20("Dev", "DEV")
	{}

	function deposit(address _to, uint256 _amount) external returns (bool) {
		require(transfer(_to, _amount), "dev transfer failed");
		return true;
	}
}