// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {UsingStorage} from "contracts/storage/UsingStorage.sol";

contract GitHubMarketIncubatorStorage is UsingStorage {
	// StartBlockNumber
	function setStartBlockNumber(
		string memory _githubRepository,
		uint256 _blockNymber
	) internal {
		eternalStorage().setUint(
			getStartBlockNumberKey(_githubRepository),
			_blockNymber
		);
	}

	function getStartBlockNumber(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		return
			eternalStorage().getUint(getStartBlockNumberKey(_githubRepository));
	}

	function getStartBlockNumberKey(string memory _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return
			keccak256(abi.encodePacked("_startBlockNumber", _githubRepository));
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

	// Operator
	function setOperatorAddress(address _operator) internal {
		eternalStorage().setAddress(getOperatorAddressKey(), _operator);
	}

	function getOperatorAddress() public view returns (address) {
		return eternalStorage().getAddress(getOperatorAddressKey());
	}

	function getOperatorAddressKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_operatorAddress"));
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

	// MaxProceedBlockNumber
	function setMaxProceedBlockNumber(uint256 _maxProceedBlockNumber) internal {
		eternalStorage().setUint(
			getMaxProceedBlockNumberKey(),
			_maxProceedBlockNumber
		);
	}

	function getMaxProceedBlockNumber() public view returns (uint256) {
		return eternalStorage().getUint(getMaxProceedBlockNumberKey());
	}

	function getMaxProceedBlockNumberKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_maxProceedBlockNumber"));
	}

	// StakeTokenValue
	function setStakeTokenValue(uint256 _stakeTokenValue) internal {
		eternalStorage().setUint(getStakeTokenValueKey(), _stakeTokenValue);
	}

	function getStakeTokenValue() public view returns (uint256) {
		return eternalStorage().getUint(getStakeTokenValueKey());
	}

	function getStakeTokenValueKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_stakeTokenValue"));
	}
}
