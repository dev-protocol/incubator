// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

// TODO いらないやつは後で消す
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
	ILinkExternalSystem
} from "contracts/liquidity/interface/ILinkExternalSystem.sol";
import {
	ILiquidityIncentive
} from "contracts/liquidity/interface/ILiquidityIncentive.sol";

// TODO EternaiStorage　対応するかどうか、した方がいいと思うけど
// TODO Ownableで止める関数を決める
contract LiquidityIncentive is Ownable, ILiquidityIncentive {
	using SafeMath for uint256;

	mapping(address => uint256) private startBlockOfStaking;
	mapping(address => uint256) private stakingValue;
	mapping(address => uint256) private stakingUniV2Value;
	mapping(address => uint256) private lastCReward;
	mapping(address => uint256) private lastCLockup;
	mapping(address => uint256) private withdrawn;

	IERC20 private uniswapV2Pair;
	IERC20 private dev;
	ILinkExternalSystem private link;
	address private uniswapV2PairAddress = 0x4168CEF0fCa0774176632d86bA26553E3B9cF59d;
	address private devToken = 0x5cAf454Ba92e6F2c929DF14667Ee360eD9fD5b26;

	event LiquidityProvider(address _provider);

	constructor(
		address _linkExternalSystem,
		address _uniswapV2PairAddress,
		address _devToken
	) public {
		link = ILinkExternalSystem(_linkExternalSystem);
		if (_uniswapV2PairAddress != address(0)) {
			uniswapV2PairAddress = _uniswapV2PairAddress;
		}
		uniswapV2Pair = IERC20(uniswapV2PairAddress);

		if (_devToken != address(0)) {
			devToken = _devToken;
		}
		dev = IERC20(devToken);
	}

	// 複数回実行されてもいいようにする
	// 流動性撤退されている場合はどう動くか確認する
	function getIncentive() external {
		// TODO event追加する
		uint256 uniV2Balance = uniswapV2Pair.balanceOf(msg.sender);
		require(uniV2Balance != 0, "Uniswap V2 balance is 0");
		bool result = uniswapV2Pair.transferFrom(
			msg.sender,
			address(this),
			uniV2Balance
		);
		stakingUniV2Value[msg.sender] = uniV2Balance;
		require(result, "failed Uniswap V2 trasnferFrom");
		uint256 devBalanceOfUniswapV2Pair = dev.balanceOf(uniswapV2PairAddress);
		uint256 liquidity = uniswapV2Pair.balanceOf(uniswapV2PairAddress);
		uint256 provision = liquidity.mul(devBalanceOfUniswapV2Pair).div(
			uniswapV2Pair.totalSupply()
		);
		result = dev.transfer(msg.sender, provision);
		require(result, "failed dev transfer");
		// TODO CIどうしよう、別に管理する？
		startBlockOfStaking[msg.sender] = block.number;
		stakingValue[msg.sender] = provision;
		(uint256 cReward, ) = link.lockupDry();
		lastCReward[msg.sender] = cReward;
		(uint256 cLockup, , ) = link.lockupGetCumulativeLockedUp(address(0));
		lastCLockup[msg.sender] = cLockup;
		emit LiquidityProvider(msg.sender);
	}

	function getReword() public view returns (uint256) {
		(uint256 cReward, ) = link.lockupDry();
		(uint256 cLockup, , ) = link.lockupGetCumulativeLockedUp(address(0));
		uint256 gapCReward = cReward - lastCReward[msg.sender];
		uint256 gapCLockup = cLockup - lastCLockup[msg.sender];
		uint256 apy = gapCReward / gapCLockup;
		uint256 provision = stakingValue[msg.sender];
		uint256 lastBlock = startBlockOfStaking[msg.sender];
		uint256 cStaking = provision * (block.number - lastBlock);
		uint256 reward = cStaking * apy - withdrawn[msg.sender];
		return reward;
	}

	function withdraw() external {
		withdrawDev();
	}

	function cancel() external {
		uint256 startBlockNumber = startBlockOfStaking[msg.sender];
		require(startBlockNumber != 0, "you are not staking");
		withdrawDev();
		uint256 uniValue = stakingUniV2Value[msg.sender];
		bool result = uniswapV2Pair.transfer(msg.sender, uniValue);
		require(result, "failed Uniswap V2 trasnfer");
		// TODO やりすぎかな。。。
		startBlockOfStaking[msg.sender] = 0;
		stakingValue[msg.sender] = 0;
		stakingUniV2Value[msg.sender] = 0;
		lastCReward[msg.sender] = 0;
		lastCLockup[msg.sender] = 0;
		withdrawn[msg.sender] = 0;
	}

	function getStartBlockNumber(address _provider)
		external
		view
		returns (uint256)
	{
		return startBlockOfStaking[_provider];
	}

	function withdrawDev() private {
		uint256 value = getReword();
		require(value != 0, "reword is 0");
		bool result = dev.transfer(msg.sender, value);
		require(result, "failed dev transfer");
		withdrawn[msg.sender] = withdrawn[msg.sender] + value;
	}
}
