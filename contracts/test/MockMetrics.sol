// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

// prettier-ignore
import {IMetrics} from "@devprotocol/protocol/contracts/interface/IMetrics.sol";

contract MockMetrics is IMetrics {
	address public override property;
	address public override market;

	function setProperty(address _value) external {
		property = _value;
	}

	function setMarket(address _value) external {
		market = _value;
	}
}
