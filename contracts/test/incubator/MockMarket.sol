// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {IMarket} from "@devprtcl/protocol/contracts/interface/IMarket.sol";
import {
	IMarketBehavior
} from "@devprtcl/protocol/contracts/interface/IMarketBehavior.sol";

contract MockMarket is IMarket {
	address public override behavior;
	bool public override enabled;
	uint256 public override votingEndBlockNumber;
	mapping(address => bool) private auth;
	mapping(address => bool) private deauth;

	constructor(address _behavior) public {
		behavior = _behavior;
	}

	function authenticate(
		address _prop,
		string calldata,
		string calldata,
		string calldata,
		string calldata,
		string calldata
	) external override returns (bool) {
		auth[_prop] = true;
		return true;
	}

	function authenticateFromPropertyFactory(
		address _prop,
		address,
		string calldata,
		string calldata,
		string calldata,
		string calldata,
		string calldata
	) external override returns (bool) {
		auth[_prop] = true;
		return false;
	}

	function authenticatedCallback(address, bytes32)
		external
		override
		returns (address)
	{
		return address(0);
	}

	function toEnable() external override {
		enabled = true;
	}

	function schema() external view override returns (string memory) {
		return IMarketBehavior(behavior).schema();
	}

	function deauthenticate(address _metrics) external override {
		deauth[_metrics] = false;
	}

	function issuedMetrics() external view override returns (uint256) {
		return 10;
	}
}