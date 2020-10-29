// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {
	ILink
} from "contracts/incubator/interface/ILink.sol";

contract MockLink is ILink {
	address private token;
	address private lockup;

	constructor(address _token, address _lockup)
		public
	{
		token = _token;
		lockup = _lockup;
	}

	function getTokenAddress() external view override returns (address){
		return token;
	}

	function getLockupAddress() external view override returns (address){
		return lockup;
	}
}
