pragma solidity 0.6.12;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMarket} from "contracts/incubator/interface/IMarket.sol";
import {IMarketBehavior} from "contracts/incubator/interface/IMarketBehavior.sol";
import {IProperty} from "contracts/incubator/interface/IProperty.sol";
import {GitHubMarketIncubatorStorage} from "contracts/incubator/GitHubMarketIncubatorStorage.sol";


contract GitHubMarketIncubator is Ownable, GitHubMarketIncubatorStorage {
	address private market;
	address private operator;
	address private reword;
	address private marketBehavior;

	event Authenticate(address indexed _sender, address market, address _property, string _githubRepository, string _publicSignature);

	modifier onlyOperator {
		require(msg.sender == operator, "sender is not operator.");
		_;
	}

	function start(address _property, string _githubRepository) external onlyOperator {
		setPropertyAddress(_githubRepository, _property);
		setStartBlockNumber(_githubRepository);
	}

	function getRewordValue(string _githubRepository) external view returns (uint256) {
		// TODO 例のロックアップのやつ
	}

	function authenticate(string _githubRepository, string _publicSignature) external {
		// TODO ロックかける
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal user.");
		bool result = IMarket(market).authenticate(property, _githubRepository, _publicSignature, "", "", "");
		require(result, "failed to authenticate.");
		setAccountAddress(property, msg.sender);
		emit Authenticate(msg.sender, market, property, _githubRepository, _publicSignature);
	}

	function finish(string _githubRepository, address _metrics) external {
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal repository.");
		address account = getAccountAddress(property);
		require(account != address(0), "no authenticate yet.");
		string id = IMarketBehavior(marketBehavior).getId(_metrics);
		require(id == _githubRepository, "illegal metrics.");

		require(IERC20(reword).transfer(account, getRewordValue(_githubRepository)), "failed to transfer reword.");
		IProperty propertyInstance = IProperty(property);
		propertyInstance.changeAuthor(account);
		uint256 balance = propertyInstance.balanceOf(address(this));
		propertyInstance.transfer(account, balance);
		setFinishedRepository(_githubRepository);
	}

	function isFinished(_githubRepository) external returns (bool) {
		return getFinishedRepository(_githubRepository);
	}

	//setter
	function setMarketAddress(address _market) external onlyOwner {
		market = _market;
	}

	function setMarketBehaviorAddress(address _marketBehavior) external onlyOwner {
		marketBehavior = _marketBehavior;
	}

	function setOperatorAddress(address _operator) external onlyOwner {
		operator = _operator;
	}

	function setRewordTokenAddress(address _reword) external onlyOwner {
		reword = _reword;
	}
}

// addPublicSignatureeを誰かが実行するようにする

