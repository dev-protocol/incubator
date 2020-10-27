// SPDX-License-Identifier: MPL-2.0

pragma solidity 0.6.12;

interface IDev {
	function deposit(address _to, uint256 _amount) external returns (bool);
}
