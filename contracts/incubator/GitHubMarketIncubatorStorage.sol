pragma solidity 0.6.12;

import {UsingStorage} from "contracts/storage/UsingStorage.sol";

contract GitHubMarketIncubatorStorage is UsingStorage {
	// StartBlockNumber
	function setStartBlockNumber(string _githubRepository) internal {
		eternalStorage().setUint(
			getStartBlockNumberKey(_account),
			block.number
		);
	}

	function getStartBlockNumber(string _githubRepository)
		public
		view
		returns (uint256)
	{
		return eternalStorage().getUint(getStartBlockNumberKey(_account));
	}

	function getStartBlockNumberKey(string _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return
			keccak256(abi.encodePacked("_startBlockNumber", _githubRepository));
	}

	// PropertyAddress
	function setPropertyAddress(string _githubRepository, address _property)
		internal
	{
		eternalStorage().setString(
			getPropertyAddressKey(_githubRepository),
			_property
		);
	}

	function getPropertyAddress(string _githubRepository)
		public
		view
		returns (address)
	{
		return
			eternalStorage().getString(
				getPropertyAddressKey(_githubRepository)
			);
	}

	function getPropertyAddressKey(string _githubRepository)
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
			getAccountAddressKey(_githubRepository),
			_property
		);
	}

	function getAccountAddress(address _property)
		public
		view
		returns (address)
	{
		return
			eternalStorage().getAddress(
				getAccountAddressKey(_githubRepository)
			);
	}

	function getAccountAddressKey(string _property)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_accountAddress", _property));
	}

	// FinishedRepository
	function setFinishedRepository(address _githubRepository) internal {
		eternalStorage().setBool(
			getFinishedRepositoryKey(_githubRepository),
			true
		);
	}

	function getFinishedRepository(address _githubRepository)
		public
		view
		returns (bool)
	{
		return
			eternalStorage().getBool(
				getFinishedRepositoryKey(_githubRepository)
			);
	}

	function getFinishedRepositoryKey(string _githubRepository)
		private
		pure
		returns (bytes32)
	{
		return
			keccak256(
				abi.encodePacked("_finishedRepository", _githubRepository)
			);
	}
}
