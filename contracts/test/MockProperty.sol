// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// prettier-ignore
import {IProperty} from "@devprotocol/protocol/contracts/interface/IProperty.sol";

contract MockProperty is ERC20, IProperty {
	address public override author;
	uint256 public supply = 10000000000000000000000000;
	mapping(address => uint256) private withdrawSetting;

	constructor(
		address _own,
		string memory _name,
		string memory _symbol
	) ERC20(_name, _symbol) {
		author = _own;

		_mint(author, supply);
	}

	function changeAuthor(address _nextAuthor) external override {
		require(msg.sender == author, "not the author.");
		author = _nextAuthor;
	}

	function withdraw(address _sender, uint256 _value) external override {
		withdrawSetting[_sender] = _value;
	}
}
