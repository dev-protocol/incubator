// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface ILiquidityIncentive {
	function getStartBlockNumber(address _provider) external view returns (uint256);
}
