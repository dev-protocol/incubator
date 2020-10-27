// SPDX-License-Identifier: MPL-2.0

pragma solidity 0.6.12;

interface ILink {
	function getTokenAddress() external view returns (address);

	function getLockupAddress() external view returns (address);
}
