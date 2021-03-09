// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

// The real AddressConfig contract does not inherit the interface, so the test mock will do so as well.
contract MockAddressConfig {
	address public token;
	address public lockup;
	address public metricsGroup;

	constructor(
		address _token,
		address _lockup,
		address _metricsGroup
	) {
		token = _token;
		lockup = _lockup;
		metricsGroup = _metricsGroup;
	}
}
