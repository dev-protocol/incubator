// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IAddressConfig {
	function setDev(address _addr) external;

	function setUniswapV2Pair(address _addr) external;

	function setUniswapV2Factory(address _addr) external;

	function setWeth(address _addr) external;

	function setRegistryAdapter(address _addr) external;

	function setAggregator(address _addr) external;

	function setOperator(address _addr) external;

	function dev() external view returns (address);

	function uniswapV2Pair() external view returns (address);

	function uniswapV2Factory() external view returns (address);

	function weth() external view returns (address);

	function registryAdapter() external view returns (address);

	function aggregator() external view returns (address);

	function operator() external view returns (address);
}
