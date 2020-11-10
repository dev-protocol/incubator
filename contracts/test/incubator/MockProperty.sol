// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IProperty} from "contracts/incubator/interface/IProperty.sol";

contract MockProperty is ERC20, IProperty {
	address public override author;
	uint256 public supply = 10000000000000000000000000;

	constructor(
		address _own,
		string memory _name,
		string memory _symbol
	) public ERC20(_name, _symbol) {
		author = _own;

		_mint(author, supply);
	}

	function changeAuthor(address _nextAuthor) external override {
		require(msg.sender == author, "not the author.");
		author = _nextAuthor;
	}
}
