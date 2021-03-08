// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// prettier-ignore
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {IMarket} from "@devprotocol/protocol/contracts/interface/IMarket.sol";
// prettier-ignore
import {IMarketBehavior} from "@devprotocol/protocol/contracts/interface/IMarketBehavior.sol";
// prettier-ignore
import {IProperty} from "@devprotocol/protocol/contracts/interface/IProperty.sol";
// prettier-ignore
import {IAddressConfig} from "@devprotocol/protocol/contracts/interface/IAddressConfig.sol";
import {IDev} from "@devprotocol/protocol/contracts/interface/IDev.sol";
import {ILockup} from "@devprotocol/protocol/contracts/interface/ILockup.sol";
import {IMetrics} from "@devprotocol/protocol/contracts/interface/IMetrics.sol";
// prettier-ignore
import {IncubatorStorage} from "contracts/github/IncubatorStorage.sol";

contract Incubator is IncubatorStorage {
	using SafeMath for uint256;
	using SafeERC20 for IERC20;

	event Authenticate(
		address indexed _sender,
		address _market,
		address _property,
		string _githubRepository,
		string _publicSignature
	);

	event Authenticated(
		address indexed _property,
		string _githubRepository,
		address _account
	);

	event Claimed(
		address indexed _property,
		uint256 _status,
		string _githubRepository,
		uint256 _reward,
		address _account,
		uint256 _staking,
		string _errorMessage
	);

	event Twitter(
		string _githubRepository,
		string _twitterId,
		string _twitterPublicSignature,
		string _githubPublicSignature
	);

	uint120 private constant BASIS_VALUE = 1000000000000000000;
	bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

	constructor() {
		_setRoleAdmin(OPERATOR_ROLE, DEFAULT_ADMIN_ROLE);
		grantRole(OPERATOR_ROLE, _msgSender());
	}

	modifier onlyOperator {
		require(isOperator(_msgSender()), "operator only.");
		_;
	}

	function isOperator(address account) public view returns (bool) {
		return hasRole(OPERATOR_ROLE, account);
	}

	function addOperator(address _operator) external onlyAdmin {
		grantRole(OPERATOR_ROLE, _operator);
	}

	function deleteOperator(address _operator) external onlyAdmin {
		revokeRole(OPERATOR_ROLE, _operator);
	}

	function start(
		address _property,
		string memory _githubRepository,
		uint256 _staking,
		uint256 _rewardLimit,
		uint256 _rewardLowerLimit,
		uint256 _initialPrice
	) external onlyOperator {
		setPropertyAddress(_githubRepository, _property);
		setStartPrice(
			_githubRepository,
			_initialPrice > 0 ? _initialPrice : getLastPrice()
		);
		setStaking(_githubRepository, _staking);
		_setRewardLimitAndLowerLimit(
			_githubRepository,
			_rewardLimit,
			_rewardLowerLimit
		);
	}

	function authenticate(
		string memory _githubRepository,
		string memory _publicSignature
	) external {
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal user.");
		bool authenticated = getIsAuthenticated(_githubRepository);
		require(!authenticated, "already authenticated.");

		address market = getMarketAddress();
		bool result =
			IMarket(market).authenticate(
				property,
				_githubRepository,
				_publicSignature,
				"",
				"",
				""
			);
		require(result, "failed to authenticate.");
		setAccountAddress(_publicSignature, _msgSender());
		setPublicSignature(_githubRepository, _publicSignature);
		emit Authenticate(
			_msgSender(),
			market,
			property,
			_githubRepository,
			_publicSignature
		);
	}

	function claimAuthorship(string memory _publicSignature, address _metrics)
		external
	{
		address account = getAccountAddress(_publicSignature);
		address marketBehavior = IMarket(getMarketAddress()).behavior();
		string memory githubRepository =
			IMarketBehavior(marketBehavior).getId(_metrics);
		address property = IMetrics(_metrics).property();
		require(
			getPropertyAddress(githubRepository) == property,
			"illegal property."
		);

		setIsAuthenticated(githubRepository, true);

		// change property author
		IProperty(property).changeAuthor(account);
		IERC20 propertyInstance = IERC20(property);
		uint256 balance = propertyInstance.balanceOf(address(this));
		propertyInstance.safeTransfer(account, balance);

		// event
		emit Authenticated(property, githubRepository, account);
	}

	function claim(
		string memory _githubRepository,
		string memory _twitterId,
		string memory _twitterPublicSignature
	) external {
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal repository.");
		bool authenticated = getIsAuthenticated(_githubRepository);
		require(authenticated, "not authenticated.");
		bool used = getUsedTwitterId(_twitterId);
		require(!used, "already used twitter id.");
		setUsedTwitterId(_twitterId);

		string memory githubPublicSignatur =
			getPublicSignature(_githubRepository);
		emit Twitter(
			_githubRepository,
			_twitterId,
			_twitterPublicSignature,
			githubPublicSignatur
		);
	}

	function claimed(
		string memory _githubRepository,
		uint256 _status,
		string memory _errorMessage
	) external {
		require(msg.sender == getCallbackKickerAddress(), "illegal access.");
		address property = getPropertyAddress(_githubRepository);
		address account = IProperty(property).author();
		(uint256 reward, uint256 latestPrice) = _getReward(_githubRepository);
		require(reward != 0, "reward is 0.");
		uint256 staking = getStaking(_githubRepository);

		if (_status != 0) {
			emit Claimed(
				property,
				_status,
				_githubRepository,
				reward,
				account,
				staking,
				_errorMessage
			);
			return;
		}
		setStartPrice(_githubRepository, latestPrice);

		// transfer reward
		address devToken = IAddressConfig(getAddressConfigAddress()).token();
		IERC20 dev = IERC20(devToken);
		dev.safeTransfer(account, reward);

		// event
		emit Claimed(
			property,
			_status,
			_githubRepository,
			reward,
			account,
			staking,
			_errorMessage
		);
	}

	function rescue(
		address _token,
		address _to,
		uint256 _amount
	) external onlyAdmin {
		IERC20 token = IERC20(_token);
		token.safeTransfer(_to, _amount);
	}

	function changeAuthor(address _token, address _author) external onlyAdmin {
		IProperty(_token).changeAuthor(_author);
	}

	function getReward(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		(uint256 reward, ) = _getReward(_githubRepository);
		return reward;
	}

	function _getReward(string memory _githubRepository)
		private
		view
		returns (uint256 _reward, uint256 _latestPrice)
	{
		uint256 latestPrice = getLastPrice();
		uint256 startPrice = getStartPrice(_githubRepository);
		uint256 reward =
			latestPrice.sub(startPrice).mul(getStaking(_githubRepository)).div(
				BASIS_VALUE
			);
		uint256 rewardLimit = getRewardLimit(_githubRepository);
		if (reward <= rewardLimit) {
			return (reward, latestPrice);
		}
		uint256 over = reward.sub(rewardLimit);
		uint256 rewardLowerLimit = getRewardLowerLimit(_githubRepository);
		if (rewardLimit < over) {
			return (rewardLowerLimit, latestPrice);
		}
		uint256 remained = rewardLimit.sub(over);
		return (
			remained > rewardLowerLimit ? remained : rewardLowerLimit,
			latestPrice
		);
	}

	function getLastPrice() private view returns (uint256) {
		address lockup = IAddressConfig(getAddressConfigAddress()).lockup();
		(, uint256 latestPrice, ) =
			ILockup(lockup).calculateCumulativeRewardPrices();
		return latestPrice;
	}

	//setter
	function setMarket(address _market) external onlyAdmin {
		require(_market != address(0), "address is 0.");
		setMarketAddress(_market);
	}

	function setAddressConfig(address _addressConfig) external onlyAdmin {
		require(_addressConfig != address(0), "address is 0.");
		setAddressConfigAddress(_addressConfig);
	}

	function setCallbackKicker(address _callbackKicker) external onlyAdmin {
		require(_callbackKicker != address(0), "address is 0.");
		setCallbackKickerAddress(_callbackKicker);
	}

	function setRewardLimitAndLowerLimit(
		string memory _githubRepository,
		uint256 _rewardLimit,
		uint256 _rewardLowerLimit
	) external onlyOperator {
		_setRewardLimitAndLowerLimit(
			_githubRepository,
			_rewardLimit,
			_rewardLowerLimit
		);
	}

	function _setRewardLimitAndLowerLimit(
		string memory _githubRepository,
		uint256 _rewardLimit,
		uint256 _rewardLowerLimit
	) private {
		require(_rewardLimit != 0, "reward limit is 0.");
		require(
			_rewardLowerLimit <= _rewardLimit,
			"limit is less than lower limit."
		);
		setRewardLimit(_githubRepository, _rewardLimit);
		setRewardLowerLimit(_githubRepository, _rewardLowerLimit);
	}
}
