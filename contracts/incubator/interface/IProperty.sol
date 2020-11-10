// SPDX-License-Identifier: MPL-2.0

pragma solidity 0.6.12;

interface IProperty {
	function author() external view returns (address);

	function changeAuthor(address _nextAuthor) external;
}
