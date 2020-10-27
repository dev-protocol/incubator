// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {UsingStorage} from "contracts/storage/UsingStorage.sol";

contract GitHubMarketIncubatorStorage is UsingStorage {
	// StartBlockNumber
	function setStartBlockNumber(string memory _githubRepository) internal {
		eternalStorage().setUint(
			getStartBlockNumberKey(_githubRepository),
			block.number
		);
	}

	function getStartBlockNumber(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		return eternalStorage().getUint(getStartBlockNumberKey(_githubRepository));
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
	function setPropertyAddress(string memory _githubRepository, address _property)
		internal
	{
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

	// PropertyAddress
	function setAccountAddress(address _property, address _account) internal {
		eternalStorage().setAddress(
			getAccountAddressKey(_property),
			_account
		);
	}

	function getAccountAddress(address _property)
		public
		view
		returns (address)
	{
		return
			eternalStorage().getAddress(
				getAccountAddressKey(_property)
			);
	}

	function getAccountAddressKey(address _property)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_accountAddress", _property));
	}
}
