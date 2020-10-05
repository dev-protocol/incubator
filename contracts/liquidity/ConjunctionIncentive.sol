// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

// TODO いらないやつは後で消す
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ILinkExternalSystem} from "contracts/liquidity/interface/ILinkExternalSystem.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import {UniswapV2Library} from "@unisawap/contracts/libraries/UniswapV2Library.sol";
import {ILiquidityIncentive} from "contracts/liquidity/interface/ILiquidityIncentive.sol";

// TODO EternaiStorage　対応するかどうか、した方がいいと思うけど
// TODO Ownableで止める関数を決める
// 外部から実行されたくない関数にvalidateをしこむ
// 必要なイベントをしこむ
contract ConjunctionIncentive is Ownable {
	using SafeMath  for uint256;
	// https://docs.chain.link/docs/get-the-latest-price
	AggregatorV3Interface private aggregator = AggregatorV3Interface(0x9326BFA02ADD2366b30bacB125260Af641031331);
	address private factory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
	address private dev = 0x5cAf454Ba92e6F2c929DF14667Ee360eD9fD5b26;
	address private weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
	address private liquidityIncentive;

	mapping(address => uint256) private stakingValue;
	mapping(address => uint256) private startBlock;
	mapping(address => uint256) private withdrawn;

	// TODO addressconfigみたいなの作った方がいい
	constructor(address _factory, address _dev, address _weth, address _aggregator, address _liquidityIncentive) {
		if(_factory != address(0)){
			factory = _factory;
		}
		if(_dev != address(0)){
			dev = _dev;
		}
		if(_weth != address(0)){
			weth = _weth;
		}
		if(_aggregator != address(0)){
			aggregator = AggregatorV3Interface(_aggregator);
		}
		liquidityIncentive = _liquidityIncentive;
	}

	function start(address _provier) external {
		startBlock[_provier] = block.number;
	}

	function getDevPricePerEth() private view returns (uint256) {
		(uint256 reserveA, uint256 reserveB) = UniswapV2Library.getReserves(factory, dev, weth);
		// TODO 確認する
		return reserveA.div(reserveB);
	}

	function getEthPrice() private view returns (uint256) {
		(,uint256 price,,uint256 timeStamp,,) = aggregator.latestRoundData();
        // If the round is not complete yet, timestamp is 0
		require(timeStamp > 0, "Round not complete");
		return price;
	}

	function getIncentiveValue() public view returns (uint256) {
		uint256 blockNumber = ILiquidityIncentive(liquidityIncentive).getStartBlockNumber(msg.sender);
		if (blockNumber == 0) {
			return 0;
		}
		// TODO safemathで書き換える
		// TODO 計算があっているか確認、絶対間違ってる
		uint256 incentive = getDevPricePerEth() * getEthPrice() * stakingValue[msg.sender] * (block.number - blockNumber) * 3 / 1000000000;
		return incentive - withdrawn[msg.sender];
	}

	function withdraw() external {
		// TODO *18せなあかんか、そのままでええか確認
		uint256 incentive = getIncentiveValue();
		withdrawn[msg.sender] = withdrawn[msg.sender].add(incentive);
		IERC20(dev).transfer(msg.sender, incentive);
	}

	function setStakingValue(address _liquidityProvider, uint256 _value) external {
		stakingValue[_liquidityProvider] = _value;
	}


}
