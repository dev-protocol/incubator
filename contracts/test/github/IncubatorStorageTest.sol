// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

// prettier-ignore
import {IncubatorStorage} from "contracts/github/IncubatorStorage.sol";

contract IncubatorStorageTest is IncubatorStorage {
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

	function setPublicSignatureTest(
		string memory _githubRepository,
		string memory _publicSignature
	) external {
		setPublicSignature(_githubRepository, _publicSignature);
	}

	function setCallbackKickerAddressTest(address _callback) external {
		setCallbackKickerAddress(_callback);
	}
}
