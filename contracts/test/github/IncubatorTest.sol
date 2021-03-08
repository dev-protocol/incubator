// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

import {Incubator} from "contracts/github/Incubator.sol";

contract IncubatorTest is Incubator {
	constructor() public Incubator() {}

	function setLastClaimedRewardTest(
		string memory _githubRepository,
		uint256 _value
	) external {
		setLastClaimedReward(_githubRepository, _value);
	}
}
