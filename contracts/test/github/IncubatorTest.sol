// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

import {Incubator} from "contracts/github/Incubator.sol";

contract IncubatorTest is Incubator {
	constructor() public Incubator() {}

	function setAccountAddressTest(address _a, address _b) external {
		setAccountAddress(_a, _b);
	}
}
