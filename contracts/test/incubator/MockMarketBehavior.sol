// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {
	IMarketBehavior
} from "contracts/incubator/interface/IMarketBehavior.sol";

contract MockMarketBehavior is IMarketBehavior {
	mapping(address => bool) private auth;
	mapping(address => string) private repositories;
	mapping(bytes32 => address) private metrics;

	function authenticate(
		address ,
		string calldata,
		string calldata,
		string calldata,
		string calldata,
		string calldata,
		address ,
		address
	)
		external
		override
		returns (
			// solium-disable-next-line indentation
			bool
		)
	{
		auth[address(0)] = true;
	}

	function schema() external override view returns (string memory) {
		return "[\"GitHub Repository (e.g, your/awesome-repos)\", \"Khaos Public Signature\"]";
	}

	function getId(address _metrics)
        external
        override
        view
        returns (string memory)
    {
		return repositories[_metrics];
	}

	function getMetrics(string memory _repository)
        external
        override
        view
        returns (address)
    {
		return metrics[createKey(_repository)];
	}


	function createKey(string memory _repository)
        private
        pure
        returns (bytes32)
    {
		return keccak256(abi.encodePacked(_repository));
	}
}
