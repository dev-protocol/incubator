// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMarket} from "contracts/incubator/interface/IMarket.sol";
import {
	IMarketBehavior
} from "contracts/incubator/interface/IMarketBehavior.sol";
import {IProperty} from "contracts/incubator/interface/IProperty.sol";
import {ILink} from "contracts/incubator/interface/ILink.sol";
import {IDev} from "contracts/incubator/interface/IDev.sol";
import {ILockup} from "contracts/incubator/interface/ILockup.sol";
import {
	GitHubMarketIncubatorStorage
} from "contracts/incubator/GitHubMarketIncubatorStorage.sol";

contract GitHubMarketIncubator is Ownable, GitHubMarketIncubatorStorage {
	address private market;
	address private marketBehavior;
	address private operator;
	address private link;
	uint256 constant maxProceedBlockNumber = 518400;
	uint256 constant stakeTokenValue = 10000;

	event Authenticate(
		address indexed _sender,
		address market,
		address _property,
		string _githubRepository,
		string _publicSignature
	);

	modifier onlyOperator {
		require(msg.sender == operator, "sender is not operator.");
		_;
	}

	function start(address _property, string memory _githubRepository)
		external
		onlyOperator
	{
		setPropertyAddress(_githubRepository, _property);
		setStartBlockNumber(_githubRepository);
	}

	function clearAccountAddress(address _property) external onlyOperator {
		setAccountAddress(_property, address(0));
	}

	function authenticate(string memory _githubRepository, string memory _publicSignature)
		external
	{
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal user.");
		address account = getAccountAddress(property);
		if (account != address(0)) {
			require(account == msg.sender, "authentication processed.");
		}

		bool result = IMarket(market).authenticate(
			property,
			_githubRepository,
			_publicSignature,
			"",
			"",
			""
		);
		require(result, "failed to authenticate.");
		setAccountAddress(property, msg.sender);
		emit Authenticate(
			msg.sender,
			market,
			property,
			_githubRepository,
			_publicSignature
		);
	}

	function finish(string memory _githubRepository, address _metrics) external {
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal repository.");
		address account = getAccountAddress(property);
		require(account != address(0), "no authenticate yet.");
		string memory id = IMarketBehavior(marketBehavior).getId(_metrics);
		require(keccak256(abi.encodePacked(id)) == keccak256(abi.encodePacked(_githubRepository)), "illegal metrics.");

		// transfer reword
		address devToken = ILink(link).getTokenAddress();
		IERC20 dev = IERC20(devToken);
		require(
			dev.transfer(account, getRewordValue(_githubRepository)),
			"failed to transfer reword."
		);

		// change property author
		IProperty(property).changeAuthor(account);
		IERC20 propertyInstance = IERC20(property);
		uint256 balance = propertyInstance.balanceOf(address(this));
		propertyInstance.transfer(account, balance);

		// lockup
		IDev(devToken).deposit(property, stakeTokenValue);
	}

	function cancelLockup(address _property) external onlyOperator {
		address lockup = ILink(link).getLockupAddress();
		ILockup(lockup).cancel(_property);
	}

	function withdrawLockup(address _property) external onlyOperator {
		address lockup = ILink(link).getLockupAddress();
		ILockup(lockup).withdraw(_property);
	}

	function rescue(address _to, uint256 _amount) external onlyOwner {
		IERC20 dev = IERC20(ILink(link).getTokenAddress());
		dev.transfer(_to, _amount);
	}

	function getRewordValue(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		// TODO 本当にあっているか確認
		address lockup = ILink(link).getLockupAddress();
		uint256 price = ILockup(lockup).getStorageLastCumulativeInterestPriceLink();
		uint256 proceedBlockNumber = getProceedBlockNumber(_githubRepository);
		return price * stakeTokenValue * proceedBlockNumber;
	}

	//setter
	function setMarketAddress(address _market) external onlyOwner {
		market = _market;
	}

	function setMarketBehaviorAddress(address _marketBehavior)
		external
		onlyOwner
	{
		marketBehavior = _marketBehavior;
	}

	function setOperatorAddress(address _operator) external onlyOwner {
		operator = _operator;
	}

	function setLinkAddress(address _link) external onlyOwner {
		link = _link;
	}

	function getProceedBlockNumber(string memory _githubRepository)
		private
		view
		returns (uint256)
	{
		uint256 proceedBlockNumber = block.number -
			getStartBlockNumber(_githubRepository);
		if (proceedBlockNumber >= maxProceedBlockNumber) {
			return maxProceedBlockNumber;
		}
		return proceedBlockNumber;
	}
}
