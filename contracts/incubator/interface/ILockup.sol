// SPDX-License-Identifier: MPL-2.0

pragma solidity 0.6.12;

interface ILockup {
	function cancel(address _property) external;

	function withdraw(address _property) external;

	function calculateCumulativeRewardPrices()
		external
		view
		returns (
			uint256 _reward,
			uint256 _holders,
			uint256 _interest
		);
}
