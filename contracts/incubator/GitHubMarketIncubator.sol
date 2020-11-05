// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.6.12;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMarket} from "contracts/incubator/interface/IMarket.sol";
import {
	IMarketBehavior
} from "contracts/incubator/interface/IMarketBehavior.sol";
import {IProperty} from "contracts/incubator/interface/IProperty.sol";
import {IAddressConfig} from "contracts/incubator/interface/IAddressConfig.sol";
import {IDev} from "contracts/incubator/interface/IDev.sol";
import {ILockup} from "contracts/incubator/interface/ILockup.sol";
import {
	GitHubMarketIncubatorStorage
} from "contracts/incubator/GitHubMarketIncubatorStorage.sol";

contract GitHubMarketIncubator is GitHubMarketIncubatorStorage {
	event Authenticate(
		address indexed _sender,
		address market,
		address _property,
		string _githubRepository,
		string _publicSignature
	);

	modifier onlyOperator {
		require(msg.sender == getOperatorAddress(), "sender is not operator.");
		_;
	}

	function start(address _property, string memory _githubRepository)
		external
		onlyOperator
	{
		setPropertyAddress(_githubRepository, _property);
		setStartBlockNumber(_githubRepository, block.number);
	}

	function clearAccountAddress(address _property) external onlyOperator {
		setAccountAddress(_property, address(0));
	}

	function authenticate(
		string memory _githubRepository,
		string memory _publicSignature
	) external {
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal user.");
		address account = getAccountAddress(property);
		if (account != address(0)) {
			require(account == msg.sender, "authentication processed.");
		}
		address market = getMarketAddress();
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

	function finish(string memory _githubRepository, address _metrics)
		external
	{
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal repository.");
		address account = getAccountAddress(property);
		require(account != address(0), "no authenticate yet.");
		address marketBehavior = IMarket(getMarketAddress()).behavior();
		string memory id = IMarketBehavior(marketBehavior).getId(_metrics);
		require(
			keccak256(abi.encodePacked(id)) ==
				keccak256(abi.encodePacked(_githubRepository)),
			"illegal metrics."
		);

		// transfer reword
		address devToken = IAddressConfig(getAddressConfigAddress()).token();
		ERC20 dev = ERC20(devToken);
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
		uint256 decimals = dev.decimals()**10;
		IDev(devToken).deposit(property, getStakeTokenValue() * decimals);
	}

	function cancelLockup(address _property) external onlyOperator {
		address lockup = IAddressConfig(getAddressConfigAddress()).lockup();
		ILockup(lockup).cancel(_property);
	}

	function withdrawLockup(address _property) external onlyOperator {
		address lockup = IAddressConfig(getAddressConfigAddress()).lockup();
		ILockup(lockup).withdraw(_property);
	}

	function rescue(address _to, uint256 _amount) external onlyAdmin {
		IERC20 dev = IERC20(IAddressConfig(getAddressConfigAddress()).token());
		dev.transfer(_to, _amount);
	}

	function getRewordValue(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		// TODO 本当にあっているか確認
		// Lockupのアドレスを取得
		address lockup = IAddressConfig(getAddressConfigAddress()).lockup();
		// getStorageLastCumulativeInterestPriceの結果を取得
		(, , uint256 latestPrice) = ILockup(lockup)
			.calculateCumulativeRewardPrices();
		// startした時のブロック番号を取得
		uint256 proceedBlockNumber = getProceedBlockNumber(_githubRepository);
		/// DEVコントラクトのアドレスを取得
		address devToken = IAddressConfig(getAddressConfigAddress()).token();
		ERC20 dev = ERC20(devToken);
		uint256 decimals = dev.decimals()**10;
		return
			latestPrice * getStakeTokenValue() * decimals * proceedBlockNumber;
	}

	//setter
	function setMarket(address _market) external onlyAdmin {
		setMarketAddress(_market);
	}

	function setOperator(address _operator) external onlyAdmin {
		setOperatorAddress(_operator);
	}

	function setAddressConfig(address _addressConfig) external onlyAdmin {
		setAddressConfigAddress(_addressConfig);
	}

	function setMaxProceedBlock(uint256 _maxProceedBlockNumber)
		external
		onlyAdmin
	{
		setMaxProceedBlockNumber(_maxProceedBlockNumber);
	}

	function setStakeToken(uint256 _stakeTokenValue) external onlyAdmin {
		setStakeTokenValue(_stakeTokenValue);
	}

	function getProceedBlockNumber(string memory _githubRepository)
		private
		view
		returns (uint256)
	{
		uint256 proceedBlockNumber = block.number -
			getStartBlockNumber(_githubRepository);
		uint256 maxProceedBlockNumber = getMaxProceedBlockNumber();
		if (proceedBlockNumber >= maxProceedBlockNumber) {
			return maxProceedBlockNumber;
		}
		return proceedBlockNumber;
	}
}

// TODO 3ヶ月経った頃にチームが stop 関数のようなものを実行する
// 複数の捜査権限を保持させる
// https://docs.openzeppelin.com/contracts/3.x/api/access#AccessControl
