// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAddressConfig} from "contracts/liquidity/interface/IAddressConfig.sol";

contract AddressConfig is Ownable, IAddressConfig {
	address private _dev = 0x5cAf454Ba92e6F2c929DF14667Ee360eD9fD5b26;
	address private _pair = 0x4168CEF0fCa0774176632d86bA26553E3B9cF59d;
	address private _factory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
	address private _weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
	address private _aggregator = 0x9326BFA02ADD2366b30bacB125260Af641031331;
	address private _registryAdapter;
	address private _operator;

	/* SET */
	/**
	 * Set the latest Dev contract address.
	 * Only the owner can execute this function.
	 */
	function setDev(address _addr) external override onlyOwner {
		_dev = _addr;
	}

	/**
	 * Set the latest Uniswap V2 pair contract address.
	 * Only the owner can execute this function.
	 */
	function setUniswapV2Pair(address _addr) external override onlyOwner {
		_pair = _addr;
	}

	/**
	 * Set the latest Uniswap V2 factory contract address.
	 * Only the owner can execute this function.
	 */
	function setUniswapV2Factory(address _addr) external override onlyOwner {
		_factory = _addr;
	}

	/**
	 * Set the latest weth contract address.
	 * Only the owner can execute this function.
	 */
	function setWeth(address _addr) external override onlyOwner {
		_weth = _addr;
	}

	/**
	 * Set the latest registry adapter contract address.
	 * Only the owner can execute this function.
	 */
	function setRegistryAdapter(address _addr) external override onlyOwner {
		_registryAdapter = _addr;
	}

	/**
	 * Set the latest aggregator contract address.
	 * Only the owner can execute this function.
	 */
	function setAggregator(address _addr) external override onlyOwner {
		_aggregator = _addr;
	}

	/**
	 * Set the latest operator address.
	 * Only the owner can execute this function.
	 */
	function setOperator(address _addr) external override onlyOwner {
		_operator = _addr;
	}

	/* GET */
	/**
	 * Get the latest Dev contract address.
	 */
	function dev() external override view returns (address) {
		return _dev;
	}

	/**
	 * Get the latest Uniswap V2 pair contract address.
	 */
	function uniswapV2Pair() external override view returns (address) {
		return _pair;
	}

	/**
	 * Get the latest Uniswap V2 factory contract address.
	 */
	function uniswapV2Factory() external override view returns (address) {
		return _factory;
	}

	/**
	 * Get the latest weth contract address.
	 */
	function weth() external override view returns (address) {
		return _weth;
	}

	/**
	 * Get the latest registry adapter contract address.
	 */
	function registryAdapter() external override view returns (address) {
		return _registryAdapter;
	}

	/**
	 * Get the latest aggregator contract address.
	 */
	function aggregator() external override view returns (address) {
		return _aggregator;
	}

	/**
	 * Get the latest operator address.
	 */
	function operator() external override view returns (address) {
		return _operator;
	}
}
