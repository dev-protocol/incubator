// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vesting is Ownable {
	using SafeMath for uint256;

	uint256 public unitPerBlock;
	address public token;
	mapping(address => uint256) private amounts;
	mapping(address => uint256) private pendings;
	mapping(address => uint256) private beginningBlocks;
	mapping(address => uint256) private lastValues;

	constructor(address _token, uint256 _unitPerBlock) public {
		token = _token;
		unitPerBlock = _unitPerBlock;
	}

	function tap() public {
		(uint256 withdrawable, uint256 cumulative, ) = getAmounts(msg.sender);
		require(
			IERC20(token).transfer(msg.sender, withdrawable),
			"fail to transfer"
		);
		// solhint-disable-next-line reentrancy
		lastValues[msg.sender] = cumulative;
	}

	function getAmounts(address _user)
		public
		view
		returns (
			uint256 _withdrawable,
			uint256 _cumulative,
			uint256 _total
		)
	{
		uint256 total = amounts[_user];
		uint256 blocks = block.number.sub(beginningBlocks[_user]);
		uint256 max = blocks.mul(unitPerBlock);
		uint256 maxReward = (total > max ? max : total).add(pendings[_user]);
		uint256 withdrawable = maxReward.sub(lastValues[_user]);
		return (withdrawable, maxReward, total);
	}

	function _setAmounts(address _user, uint256 _value) public onlyOwner {
		(uint256 withdrawable, , ) = getAmounts(_user);
		pendings[_user] = withdrawable;
		beginningBlocks[_user] = block.number;
		amounts[_user] = _value;
	}

	function _setUnitPerBlock(uint256 _value) public onlyOwner {
		unitPerBlock = _value;
	}

	function _close() public onlyOwner {
		IERC20 _token = IERC20(token);
		require(
			_token.transfer(owner(), _token.balanceOf(address(this))),
			"fail to transfer"
		);
	}
}
