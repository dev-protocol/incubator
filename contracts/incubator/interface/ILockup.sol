// SPDX-License-Identifier: MPL-2.0

pragma solidity 0.6.12;

interface ILockup {
	function cancel(address _property) external;

	function withdraw(address _property) external;

	function getStorageLastCumulativeInterestPriceLink()
		external
		view
		returns (uint256);
}
