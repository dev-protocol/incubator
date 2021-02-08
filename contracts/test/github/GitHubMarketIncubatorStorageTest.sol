// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

// prettier-ignore
import {GitHubMarketIncubatorStorage} from "contracts/github/GitHubMarketIncubatorStorage.sol";

contract GitHubMarketIncubatorStorageTest is GitHubMarketIncubatorStorage {
	function setStartPriceTest(string memory _githubRepository, uint256 _price)
		external
	{
		setStartPrice(_githubRepository, _price);
	}

	function setStakingTest(string memory _githubRepository, uint256 _staking)
		external
	{
		setStaking(_githubRepository, _staking);
	}

	function setRewardLimitTest(
		string memory _githubRepository,
		uint256 _rewardLimit
	) external {
		setRewardLimit(_githubRepository, _rewardLimit);
	}

	function setRewardLowerLimitTest(
		string memory _githubRepository,
		uint256 _rewardLimit
	) external {
		setRewardLowerLimit(_githubRepository, _rewardLimit);
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

	function setAddressConfigAddressTest(address _link) external {
		setAddressConfigAddress(_link);
	}
}
