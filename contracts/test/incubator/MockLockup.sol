// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

// The real Lockup contract does not inherit the interface, so the test mock will do so as well.
contract MockLockup {
	mapping(address => bool) private cancelStorage;
	mapping(address => bool) private withdrawStorage;
	uint256 private value = 100;

	function cancel(address _property) external {
		cancelStorage[_property] = true;
	}

	function withdraw(address _property) external {
		withdrawStorage[_property] = true;
	}

	function getStorageLastCumulativeInterestPrice()
		public
		view
		returns (uint256)
	{
		return value;
	}
}
