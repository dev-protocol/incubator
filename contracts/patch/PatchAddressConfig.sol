// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

contract PatchAddressConfig {
	address public owner;
	address public token;

	constructor() {
		owner = msg.sender;
	}

	function setToken(address _token) external {
		require(msg.sender == owner, "invalid sender");
		token = _token;
	}
}
