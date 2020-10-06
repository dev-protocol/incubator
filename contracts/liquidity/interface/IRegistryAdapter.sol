// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IRegistryAdapter {
	function lockupDry()
		external
		view
		returns (uint256 _nextRewards, uint256 _amount);

	function lockupGetCumulativeLockedUp(address _property)
		external
		view
		returns (
			uint256 _value,
			uint256 _unit,
			uint256 _block
		);
}
