pragma solidity 0.6.12;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMarket} from "contracts/incubator/interface/IMarket.sol";
import {
	IMarketBehavior
} from "contracts/incubator/interface/IMarketBehavior.sol";
import {IProperty} from "contracts/incubator/interface/IProperty.sol";
import {ILink} from "contracts/incubator/interface/ILink.sol";
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

	function start(address _property, string _githubRepository)
		external
		onlyOperator
	{
		setPropertyAddress(_githubRepository, _property);
		setStartBlockNumber(_githubRepository);
	}

	function clearAccountAddress() external onlyOperator {
		setAccountAddress(property, address(0));
	}

	function authenticate(string _githubRepository, string _publicSignature)
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

	function finish(string _githubRepository, address _metrics) external {
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal repository.");
		address account = getAccountAddress(property);
		require(account != address(0), "no authenticate yet.");
		string id = IMarketBehavior(marketBehavior).getId(_metrics);
		require(id == _githubRepository, "illegal metrics.");

		// transfer reword
		ILink devProtocol = ILink(link);
		IERC20 dev = IERC20(devProtocol.getTokenAddress());
		require(
			dev.transfer(account, getRewordValue(_githubRepository)),
			"failed to transfer reword."
		);

		// change property author
		IProperty propertyInstance = IProperty(property);
		propertyInstance.changeAuthor(account);
		uint256 balance = propertyInstance.balanceOf(address(this));
		propertyInstance.transfer(account, balance);

		// lockup
		dev.approve(property, stakeTokenValue);
		devProtocol.depositFrom(address(this), property, stakeTokenValue);
	}

	function cancelLockup(address _property) external onlyOperator {
		ILink devProtocol = ILink(link);
		devProtocol.cancel(_property);
	}

	function cancelWithdraw(address _property) external onlyOperator {
		ILink devProtocol = ILink(link);
		devProtocol.withdraw(_property);
	}

	function rescue(address _to, uint256 _amount) external onlyOwner {
		IERC20 dev = IERC20(devProtocol.getTokenAddress());
		dev.transfer(_to, _amount);
	}

	function getRewordValue(string _githubRepository)
		external
		view
		returns (uint256)
	{
		// TODO 本当にあっているか確認
		uint256 price = ILink(link).getStorageLastCumulativeInterestPrice();
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

	function getProceedBlockNumber(string _githubRepository)
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
