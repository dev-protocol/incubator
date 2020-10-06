// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

// TODO いらないやつは後で消す
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
	AggregatorV3Interface
} from "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import {
	UniswapV2Library
} from "@unisawap/contracts/libraries/UniswapV2Library.sol";
import {IAddressConfig} from "contracts/liquidity/interface/IAddressConfig.sol";
import {
	IRegistryAdapter
} from "contracts/liquidity/interface/IRegistryAdapter.sol";
import {
	Price
} from "contracts/liquidity/Price.sol";

// TODO EternaiStorage　対応するかどうか、した方がいいと思うけど
// TODO Ownableで止める関数を決める
// 外部から実行されたくない関数にvalidateをしこむ
// 必要なイベントをしこむ
// コメントをかく、監査対応のため
// TODO event追加する
// TODO Pausableで止める関数を決める
contract ConjunctionIncentive is Ownable, Price {
	using SafeMath for uint256;

	mapping(address => uint256) private stakingValue;
	mapping(address => uint256) private startBlock;
	mapping(address => uint256) private withdrawn;

	address private config;

	constructor(address _config) {
		config = _config;
	}

	function start(address _provier) external {
		startBlock[_provier] = block.number;
	}

	function getIncentiveValue() public view returns (uint256) {
		uint256 blockNumber = IRegistryAdapter(liquidityIncentive)
			.getStartBlockNumber(msg.sender);
		if (blockNumber == 0) {
			return 0;
		}
		// TODO safemathで書き換える
		// TODO 計算があっているか確認、絶対間違ってる
		uint256 incentive = (getDevPricePerEther() *
			getEthPrice() *
			stakingValue[msg.sender] *
			(block.number - blockNumber) *
			3) / 1000000000;
		return incentive - withdrawn[msg.sender];
	}

	function withdraw() external {
		// TODO *18せなあかんか、そのままでええか確認
		uint256 incentive = getIncentiveValue();
		withdrawn[msg.sender] = withdrawn[msg.sender].add(incentive);
		IERC20(dev).transfer(msg.sender, incentive);
	}

	function setStakingValue(address _liquidityProvider, uint256 _value)
		external
	{
		IAddressConfig addressConfig = IAddressConfig(config);
		require(msg.sender == addressConfig.operator(), "illegall address");
		stakingValue[_liquidityProvider] = _value;
	}
}
