// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

// prettier-ignore
import {IMarketBehavior} from "@devprotocol/protocol/contracts/interface/IMarketBehavior.sol";

contract MockMarketBehavior is IMarketBehavior {
	// solhint-disable-next-line quotes
	string private schemaInfo = '["GitHub Repository (e.g, your/awesome-repos)", "Khaos Public Signature"]';
	mapping(address => bool) private auth;
	mapping(address => string) private repositories;
	mapping(bytes32 => address) private metrics;

	function authenticate(
		address,
		string calldata,
		string calldata,
		string calldata,
		string calldata,
		string calldata,
		address,
		address
	) external override returns (bool) {
		auth[address(0)] = true;
		return true;
	}

	function schema() external view override returns (string memory) {
		return schemaInfo;
	}

	function getId(address _metrics)
		external
		view
		override
		returns (string memory)
	{
		return repositories[_metrics];
	}

	function setId(address _metrics, string memory _value)
		external
	{
		repositories[_metrics] = _value;
	}

	function getMetrics(string memory _repository)
		external
		view
		override
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
