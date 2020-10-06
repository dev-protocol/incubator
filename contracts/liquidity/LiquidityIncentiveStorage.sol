// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import {UsingStorage} from "contracts/storage/UsingStorage.sol";

contract LiquidityIncentiveStorage is UsingStorage {
	// startBlockOfStaking
	function setStartBlockOfStaking(
		address _provider,
		uint256 _blockNumber
	) internal {
		bytes32 key = getStartBlockOfStakingKey(_provider);
		eternalStorage().setUint(key, _blockNumber);
	}

	function getStartBlockOfStaking(
		address _provider
	) public view returns (uint256) {
		bytes32 key = getStartBlockOfStakingKey(_provider);
		return eternalStorage().getUint(key);
	}

	function getStartBlockOfStakingKey(
		address _provider
	) private pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					"_startBlockOfStaking",
					_provider
				)
			);
	}

	// provisionValue
	function setProvisionValue(
		address _provider,
		uint256 _value
	) internal {
		bytes32 key = getProvisionValueKey(_provider);
		eternalStorage().setUint(key, _value);
	}

	function getProvisionValue(
		address _provider
	) public view returns (uint256) {
		bytes32 key = getProvisionValueKey(_provider);
		return eternalStorage().getUint(key);
	}

	function getProvisionValueKey(
		address _provider
	) private pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					"_provisionValue",
					_provider
				)
			);
	}

	// stakingUniV2Value
	function setStakingUniV2Value(
		address _provider,
		uint256 _value
	) internal {
		bytes32 key = getStakingUniV2ValueKey(_provider);
		eternalStorage().setUint(key, _value);
	}

	function getStakingUniV2Value(
		address _provider
	) public view returns (uint256) {
		bytes32 key = getStakingUniV2ValueKey(_provider);
		return eternalStorage().getUint(key);
	}

	function getStakingUniV2ValueKey(
		address _provider
	) private pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					"_stakingUniV2Value",
					_provider
				)
			);
	}

	// lastCReward
	function setLastCReward(
		address _provider,
		uint256 _value
	) internal {
		bytes32 key = getLastCRewardKey(_provider);
		eternalStorage().setUint(key, _value);
	}

	function getLastCReward(
		address _provider
	) public view returns (uint256) {
		bytes32 key = getLastCRewardKey(_provider);
		return eternalStorage().getUint(key);
	}

	function getLastCRewardKey(
		address _provider
	) private pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					"_lastCReward",
					_provider
				)
			);
	}

	// lastCLockup
	function setLastCLockup(
		address _provider,
		uint256 _value
	) internal {
		bytes32 key = getLastCLockupKey(_provider);
		eternalStorage().setUint(key, _value);
	}

	function getLastCLockup(
		address _provider
	) public view returns (uint256) {
		bytes32 key = getLastCLockupKey(_provider);
		return eternalStorage().getUint(key);
	}

	function getLastCLockupKey(
		address _provider
	) private pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					"_lastCLockup",
					_provider
				)
			);
	}

	// withdrawn
	function setWithdrawn(
		address _provider,
		uint256 _value
	) internal {
		bytes32 key = getWithdrawnKey(_provider);
		eternalStorage().setUint(key, _value);
	}

	function getWithdrawn(
		address _provider
	) public view returns (uint256) {
		bytes32 key = getWithdrawnKey(_provider);
		return eternalStorage().getUint(key);
	}

	function getWithdrawnKey(
		address _provider
	) private pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					"_withdrawn",
					_provider
				)
			);
	}
}
