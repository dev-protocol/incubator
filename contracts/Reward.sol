// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Reward is Ownable {
	using SafeMath for uint256;

	uint256 public rewardPerBlock;
	address public token;
	mapping(address => uint256) private amounts;
	mapping(address => uint256) private beginningBlocks;
	mapping(address => uint256) private lastValues;

	constructor(address _token, uint256 _rewardPerBlock) public {
		token = _token;
		rewardPerBlock = _rewardPerBlock;
	}

	function tap() public {
		(uint256 withdrawable, uint256 cumulative, ) = getAmounts();
		require(
			IERC20(token).transfer(msg.sender, withdrawable),
			"fail to transfer"
		);
		lastValues[msg.sender] = cumulative;
	}

	function getAmounts()
		public
		view
		returns (
			uint256 _withdrawable,
			uint256 _cumulative,
			uint256 _total
		)
	{
		uint256 total = amounts[msg.sender];
		uint256 blocks = block.number.sub(beginningBlocks[msg.sender]);
		uint256 max = blocks.mul(rewardPerBlock);
		uint256 maxReward = total > max ? max : total;
		uint256 withdrawable = maxReward.sub(lastValues[msg.sender]);
		return (withdrawable, maxReward, total);
	}

	function _setAmounts(address _user, uint256 _value) public onlyOwner {
		amounts[_user] = _value;
		if (beginningBlocks[_user] == 0) {
			beginningBlocks[_user] = block.number;
		}
	}

	function _setRewardPerBlock(uint256 _value) public onlyOwner {
		rewardPerBlock = _value;
	}

	function _close() public onlyOwner {
		IERC20 _token = IERC20(token);
		require(
			_token.transfer(owner(), _token.balanceOf(address(this))),
			"fail to transfer"
		);
	}
}
