// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

// prettier-ignore
import {IncubatorStorageTest} from "contracts/test/github/IncubatorStorageTest.sol";
import {Incubator} from "contracts/github/Incubator.sol";

contract IncubatorTest is Incubator, IncubatorStorageTest {
	constructor() public Incubator() {}
}
