// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {
	AggregatorV3Interface
} from "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import {
	UniswapV2Library
} from "@unisawap/contracts/libraries/UniswapV2Library.sol";
import {IAddressConfig} from "contracts/liquidity/interface/IAddressConfig.sol";

contract Price {
	using SafeMath for uint256;

	address private config;

	constructor(address _config) {
		config = _config;
	}

	/**
	 * Get the price of DEV tokens per ether.
	 *
	 * @returns price of DEV tokens per ether.
	 */
	function getDevPricePerEther() external view returns (uint256) {
		// TODO 確認する
		IAddressConfig addressConfig = IAddressConfig(config);
		(uint256 reserveA, uint256 reserveB) = UniswapV2Library.getReserves(
			addressConfig.uniswapV2Factory(),
			addressConfig.dev(),
			addressConfig.weth()
		);
		return reserveA.div(reserveB);
	}

	/**
	 * Get the price of 1ether in dollar terms.
	 *
	 * @returns price of 1ether in dollar terms.
	 */
	function getEthPrice() external view returns (uint256) {
		// https://docs.chain.link/docs/get-the-latest-price
		(, uint256 price, , uint256 timeStamp, , ) = AggregatorV3Interface(
			IAddressConfig(config).aggregator()
		)
			.latestRoundData();
		// If the round is not complete yet, timestamp is 0
		require(timeStamp > 0, "Round not complete");
		return price;
	}
}
