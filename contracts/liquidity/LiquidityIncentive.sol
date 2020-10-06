// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
	LiquidityIncentiveStorage
} from "contracts/liquidity/LiquidityIncentiveStorage.sol";
import {
	IRegistryAdapter
} from "contracts/liquidity/interface/IRegistryAdapter.sol";
import {IAddressConfig} from "contracts/liquidity/interface/IAddressConfig.sol";
import {Price} from "contracts/liquidity/Price.sol";

// コメントをかく、監査対応のため
contract LiquidityIncentive is Pausable, LiquidityIncentiveStorage {
	using SafeMath for uint256;

	address private config;
	Price price;

	event IncentiveBase(
		address _provider,
		uint256 _blockNumber,
		uint256 _cReward,
		uint256 _cLockup
	);
	event StakedUniV2(
		address _provider,
		uint256 _blockNumber,
		uint256 _stakedUniV2,
		uint256 _provision
	);
	event LiquidityIncentive(address _provider, uint256 _blockNumber, uint256 _value);
	event ConjunctionIncentive(address _provider, uint256 _blockNumber, uint256 _value);
	event Cancel(address _provider, uint256 _blockNumber);
	constructor(address _config) public {
		config = _config;
		price = new Price(_config);
	}

	function lockupUniV2() external whenNotPaused {
		address uniswapPairAddress = IAddressConfig(config).uniswapV2Pair();
		IERC20 uniswapV2Pair = IERC20(uniswapPairAddress);
		uint256 stakedUniV2 = stakeUniV2(uniswapV2Pair);
		uint256 provision = transferIncentive(
			uniswapV2Pair,
			uniswapPairAddress
		);
		// first time
		if (getStartBlockOfStaking(msg.sender) == 0) {
			setStartBlockOfStaking(msg.sender, block.number);
			IRegistryAdapter adapter = IRegistryAdapter(
				IAddressConfig(config).registryAdapter()
			);
			(uint256 cReward, ) = adapter.lockupDry();
			setLastCReward(msg.sender, cReward);
			(uint256 cLockup, , ) = adapter.lockupGetCumulativeLockedUp(
				address(0)
			);
			setLastCLockup(msg.sender, cLockup);
			emit IncentiveBase(msg.sender, block.number, cReward, cLockup);
		}
		emit StakedUniV2(msg.sender, block.number, stakedUniV2, provision);
	}

	function cancelLiquidityIncentive() external whenNotPaused {
		uint256 startBlockNumber = getStartBlockOfStaking(msg.sender);
		require(startBlockNumber != 0, "you are not staking");
		uint256 incentive = getLiquidityIncentiveReword();
		if(incentive != 0) {
			withdrawLiquidityIncentive();
		}
		incentive = getConjunctionIncentiveReword();
		if(incentive != 0) {
			withdrawConjunctionIncentive();
		}
		uint256 uniValue = getStakingUniV2Value(msg.sender);
		IERC20 uniswapV2Pair = IERC20(IAddressConfig(config).uniswapV2Pair());
		bool result = uniswapV2Pair.transfer(msg.sender, uniValue);
		require(result, "failed Uniswap V2 trasnfer");
		setStartBlockOfStaking(msg.sender, 0);
		setProvisionValue(msg.sender, 0);
		setStakingUniV2Value(msg.sender, 0);
		setLastCReward(msg.sender, 0);
		setLastCLockup(msg.sender, 0);
		setLiquidityIncentiveWithdrawn(msg.sender, 0);
		setStakingValue(msg.sender, 0);
		setConjunctionIncentiveWithdrawn(msg.sender, 0);
		emit Cancel(msg.sender, block.number);
	}

	function setStakingDevValue(address _liquidityProvider, uint256 _value)
		external
	{
		IAddressConfig addressConfig = IAddressConfig(config);
		require(msg.sender == addressConfig.operator(), "illegall address");
		setStakingValue(_liquidityProvider, _value);
	}

	function getLiquidityIncentiveReword() public view returns (uint256) {
		uint256 lastBlock = getStartBlockOfStaking(msg.sender);
		if (lastBlock == 0) {
			return 0;
		}
		IRegistryAdapter adapter = IRegistryAdapter(
			IAddressConfig(config).registryAdapter()
		);
		(uint256 cReward, ) = adapter.lockupDry();
		(uint256 cLockup, , ) = adapter.lockupGetCumulativeLockedUp(address(0));
		uint256 gapCReward = cReward.sub(getLastCReward(msg.sender));
		uint256 gapCLockup = cLockup.sub(getLastCLockup(msg.sender));
		uint256 apy = gapCReward.div(gapCLockup);
		uint256 provision = getProvisionValue(msg.sender);
		uint256 cStaking = provision.mul((block.number.sub(lastBlock)));
		uint256 reward = cStaking.mul(apy).sub(getLiquidityIncentiveWithdrawn(msg.sender));
		return reward;
	}

	function getConjunctionIncentiveReword() public view returns (uint256) {
		uint256 lastBlock = getStartBlockOfStaking(msg.sender);
		if (lastBlock == 0) {
			return 0;
		}
		// TODO 計算があっているか確認、絶対間違ってる
		uint256 incentive = (price.getDevPricePerEther()
			.mul(price.getEthPrice())
			.mul(getStakingValue(msg.sender))
			.mul((block.number - lastBlock))
			.mul(3))
		.div(1000000000);
		return incentive - getConjunctionIncentiveWithdrawn(msg.sender);
	}

	function withdrawLiquidityIncentive() public whenNotPaused {
		uint256 incentive = getLiquidityIncentiveReword();
		require(incentive != 0, "liquidity incentive is 0");
		IERC20 dev = IERC20(IAddressConfig(config).dev());
		bool result = dev.transfer(msg.sender, incentive);
		require(result, "failed dev transfer");
		setLiquidityIncentiveWithdrawn(msg.sender, getLiquidityIncentiveWithdrawn(msg.sender) + incentive);
		emit LiquidityIncentive(msg.sender, block.number, incentive);
	}

	function withdrawConjunctionIncentive() public whenNotPaused {
		// TODO *18せなあかんか、そのままでええか確認
		uint256 incentive = getConjunctionIncentiveReword();
		require(incentive != 0, "conjunction incentive is 0");
		IERC20 dev = IERC20(IAddressConfig(config).dev());
		bool result = dev.transfer(msg.sender, incentive);
		require(result, "failed dev transfer");
		setConjunctionIncentiveWithdrawn(msg.sender, getConjunctionIncentiveWithdrawn(msg.sender).add(incentive));
		emit ConjunctionIncentive(msg.sender, block.number, incentive);
	}

	function transferIncentive(
		IERC20 _uniswapV2Pair,
		address _uniswapPairAddress
	) private returns (uint256) {
		IERC20 dev = IERC20(IAddressConfig(config).dev());
		uint256 devBalanceOfUniswapV2Pair = dev.balanceOf(_uniswapPairAddress);
		uint256 liquidity = _uniswapV2Pair.balanceOf(_uniswapPairAddress);
		uint256 provision = liquidity.mul(devBalanceOfUniswapV2Pair).div(
			_uniswapV2Pair.totalSupply()
		);
		require(provision != 0, "provision is 0");
		bool result = dev.transfer(msg.sender, provision);
		require(result, "failed dev transfer");
		setProvisionValue(
			msg.sender,
			getProvisionValue(msg.sender) + provision
		);
		return provision;
	}

	function stakeUniV2(IERC20 _uniswapV2Pair) private returns (uint256) {
		uint256 uniV2Balance = _uniswapV2Pair.balanceOf(msg.sender);
		require(uniV2Balance != 0, "Uniswap V2 balance is 0");
		bool result = _uniswapV2Pair.transferFrom(
			msg.sender,
			address(this),
			uniV2Balance
		);
		setStakingUniV2Value(
			msg.sender,
			getStakingUniV2Value(msg.sender) + uniV2Balance
		);
		require(result, "failed Uniswap V2 trasnferFrom");
		return uniV2Balance;
	}
}
