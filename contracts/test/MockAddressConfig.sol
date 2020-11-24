// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

// The real AddressConfig contract does not inherit the interface, so the test mock will do so as well.
contract MockAddressConfig {
	address public token;
	address public lockup;

	constructor(address _token, address _lockup) public {
		token = _token;
		lockup = _lockup;
	}
}
