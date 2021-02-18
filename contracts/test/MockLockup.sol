// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// The real Lockup contract does not inherit the interface, so the test mock will do so as well.
contract MockLockup {
	uint256 public baseValue = 100;
	address private devtoken;
	// solhint-disable-next-line
	uint256 private withdrawAmount = 100000000000000000000;

	constructor(address _devToken) {
		devtoken = _devToken;
	}

	function withdraw(address, uint256 _amount) external {
		IERC20(devtoken).transfer(msg.sender, withdrawAmount + _amount);
	}

	function calculateWithdrawableInterestAmount(address, address)
		external
		view
		returns (uint256)
	{
		return withdrawAmount;
	}

	function calculateCumulativeRewardPrices()
		public
		view
		returns (
			uint256 _reward,
			uint256 _holders,
			uint256 _interest
		)
	{
		return (0, 0, baseValue * block.number);
	}
}
