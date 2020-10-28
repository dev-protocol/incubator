// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {
	GitHubMarketIncubatorStorage
} from "contracts/incubator/GitHubMarketIncubatorStorage.sol";

contract GitHubMarketIncubatorStorageTest is GitHubMarketIncubatorStorage {
	function setStartBlockNumberTest(
		string memory _githubRepository,
		uint256 _blockNUmber
	) external {
		setStartBlockNumber(_githubRepository, _blockNUmber);
	}

	function setPropertyAddressTest(
		string memory _githubRepository,
		address _property
	) external {
		setPropertyAddress(_githubRepository, _property);
	}

	function setAccountAddressTest(address _property, address _account)
		external
	{
		setAccountAddress(_property, _account);
	}

	function setMarketAddressTest(address _market) external {
		setMarketAddress(_market);
	}

	function setMarketBehaviorAddressTest(address _marketBehavior) external {
		setMarketBehaviorAddress(_marketBehavior);
	}

	function setOperatorAddressTest(address _operator) external {
		setOperatorAddress(_operator);
	}

	function setLinkAddressTest(address _link) external {
		setLinkAddress(_link);
	}

	function setMaxProceedBlockNumberTest(uint256 _maxProceedBlockNumber)
		external
	{
		setMaxProceedBlockNumber(_maxProceedBlockNumber);
	}

	function setStakeTokenValueTest(uint256 _stakeTokenValue) external {
		setStakeTokenValue(_stakeTokenValue);
	}
}
