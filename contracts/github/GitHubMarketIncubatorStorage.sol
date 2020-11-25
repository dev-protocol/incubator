// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

// prettier-ignore
import {UsingStorage} from "@devprtcl/util-contracts/contracts/storage/UsingStorage.sol";

contract GitHubMarketIncubatorStorage is UsingStorage {
	// StartPrice
	function setStartPrice(string memory _githubRepository, uint256 _price)
		internal
	{
		eternalStorage().setUint(getStartPriceKey(_githubRepository), _price);
	}

	function getStartPrice(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		return eternalStorage().getUint(getStartPriceKey(_githubRepository));
	}

	function getStartPriceKey(string memory _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_startPrice", _githubRepository));
	}

	// Staking
	function setStaking(string memory _githubRepository, uint256 _staking)
		internal
	{
		eternalStorage().setUint(getStakingKey(_githubRepository), _staking);
	}

	function getStaking(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		return eternalStorage().getUint(getStakingKey(_githubRepository));
	}

	function getStakingKey(string memory _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_staking", _githubRepository));
	}

	// Reward limit
	function setRewardLimit(
		string memory _githubRepository,
		uint256 _rewardLimit
	) internal {
		eternalStorage().setUint(
			getRewardLimitKey(_githubRepository),
			_rewardLimit
		);
	}

	function getRewardLimit(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		return eternalStorage().getUint(getRewardLimitKey(_githubRepository));
	}

	function getRewardLimitKey(string memory _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked(_githubRepository, "_rewardLimit"));
	}

	// PropertyAddress
	function setPropertyAddress(
		string memory _githubRepository,
		address _property
	) internal {
		eternalStorage().setAddress(
			getPropertyAddressKey(_githubRepository),
			_property
		);
	}

	function getPropertyAddress(string memory _githubRepository)
		public
		view
		returns (address)
	{
		return
			eternalStorage().getAddress(
				getPropertyAddressKey(_githubRepository)
			);
	}

	function getPropertyAddressKey(string memory _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return
			keccak256(abi.encodePacked("_propertyAddress", _githubRepository));
	}

	// AccountAddress
	function setAccountAddress(address _property, address _account) internal {
		eternalStorage().setAddress(getAccountAddressKey(_property), _account);
	}

	function getAccountAddress(address _property)
		public
		view
		returns (address)
	{
		return eternalStorage().getAddress(getAccountAddressKey(_property));
	}

	function getAccountAddressKey(address _property)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_accountAddress", _property));
	}

	// Market
	function setMarketAddress(address _market) internal {
		eternalStorage().setAddress(getMarketAddressKey(), _market);
	}

	function getMarketAddress() public view returns (address) {
		return eternalStorage().getAddress(getMarketAddressKey());
	}

	function getMarketAddressKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_marketAddress"));
	}

	// AddressConfig
	function setAddressConfigAddress(address _addressConfig) internal {
		eternalStorage().setAddress(
			getAddressConfigAddressKey(),
			_addressConfig
		);
	}

	function getAddressConfigAddress() public view returns (address) {
		return eternalStorage().getAddress(getAddressConfigAddressKey());
	}

	function getAddressConfigAddressKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_addressConfig"));
	}
}
