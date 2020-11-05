// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {
	GitHubMarketIncubatorStorage
} from "contracts/incubator/GitHubMarketIncubatorStorage.sol";

contract GitHubMarketIncubatorStorageTest is GitHubMarketIncubatorStorage {
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

	function setStakeTokenValueTest(uint256 _stakeTokenValue) external {
		setStakeTokenValue(_stakeTokenValue);
	}
}
