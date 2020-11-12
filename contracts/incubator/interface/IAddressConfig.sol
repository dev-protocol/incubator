// SPDX-License-Identifier: MPL-2.0

pragma solidity 0.6.12;

interface IAddressConfig {
	function token() external view returns (address);

	function lockup() external view returns (address);
}
