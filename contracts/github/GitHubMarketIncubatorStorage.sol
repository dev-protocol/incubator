// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

// prettier-ignore
import {UsingStorage} from "@devprotocol/util-contracts/contracts/storage/UsingStorage.sol";

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

	// Reward lower limit
	function setRewardLowerLimit(
		string memory _githubRepository,
		uint256 _rewardLowerLimit
	) internal {
		eternalStorage().setUint(
			getRewardLowerLimitKey(_githubRepository),
			_rewardLowerLimit
		);
	}

	function getRewardLowerLimit(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		return
			eternalStorage().getUint(getRewardLowerLimitKey(_githubRepository));
	}

	function getRewardLowerLimitKey(string memory _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return
			keccak256(abi.encodePacked(_githubRepository, "_rewardLowerLimit"));
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

	// publicSignature
	function setPublicSignature(string memory _githubRepository, string memory _publicSignature) internal {
		eternalStorage().setString(
			getPublicSignatureKey(_githubRepository),
			_publicSignature
		);
	}

	function getPublicSignature(string memory _githubRepository) public view returns (string memory) {
		return eternalStorage().getString(getPublicSignatureKey(_githubRepository));
	}

	function getPublicSignatureKey(string memory _githubRepository) private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_publicSignature", _githubRepository));
	}

	// callbackKicker
	function setCallbackKickerAddress(address _callbackKicker) internal {
		eternalStorage().setAddress(
			getCallbackKickerAddressKey(),
			_callbackKicker
		);
	}

	function getCallbackKickerAddress() public view returns (address) {
		return eternalStorage().getAddress(getCallbackKickerAddressKey());
	}

	function getCallbackKickerAddressKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_callbackKicker"));
	}
}
