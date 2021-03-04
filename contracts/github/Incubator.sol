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

	event Finish(
		address indexed _property,
		uint256 _status,
		string _githubRepository,
		uint256 _reword,
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
		uint256 _rewardLowerLimit
	) external onlyOperator {
		require(_staking != 0, "staking is 0.");

		uint256 lastPrice = getLastPrice();
		setPropertyAddress(_githubRepository, _property);
		setStartPrice(_githubRepository, lastPrice);
		setStaking(_githubRepository, _staking);
		_setRewardLimitAndLowerLimit(
			_githubRepository,
			_rewardLimit,
			_rewardLowerLimit
		);
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
			require(account == _msgSender(), "authentication processed.");
		}
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
		setAccountAddress(property, _msgSender());
		setPublicSignature(_githubRepository, _publicSignature);
		emit Authenticate(
			_msgSender(),
			market,
			property,
			_githubRepository,
			_publicSignature
		);
	}

	function intermediateProcess(
		string memory _githubRepository,
		address _metrics,
		string memory _twitterId,
		string memory _twitterPublicSignature
	) external {
		address property = getPropertyAddress(_githubRepository);
		require(property != address(0), "illegal repository.");
		address account = getAccountAddress(property);
		require(account != address(0), "no authenticate yet.");
		require(account == msg.sender, "illegal user.");

		address marketBehavior = IMarket(getMarketAddress()).behavior();
		string memory id = IMarketBehavior(marketBehavior).getId(_metrics);
		require(
			keccak256(abi.encodePacked(id)) ==
				keccak256(abi.encodePacked(_githubRepository)),
			"illegal metrics."
		);
		string memory githubPublicSignatur =
			getPublicSignature(_githubRepository);
		emit Twitter(
			_githubRepository,
			_twitterId,
			_twitterPublicSignature,
			githubPublicSignatur
		);
	}

	function finish(
		string memory _githubRepository,
		uint256 _status,
		string memory _errorMessage
	) external {
		require(msg.sender == getCallbackKickerAddress(), "illegal access.");
		address property = getPropertyAddress(_githubRepository);
		address account = getAccountAddress(property);
		uint256 reword = getReword(_githubRepository);
		require(reword != 0, "reword is 0.");
		uint256 staking = getStaking(_githubRepository);

		if (_status != 0) {
			emit Finish(
				property,
				_status,
				_githubRepository,
				reword,
				account,
				staking,
				_errorMessage
			);
			return;
		}
		// transfer reword
		address devToken = IAddressConfig(getAddressConfigAddress()).token();
		IERC20 dev = IERC20(devToken);
		dev.safeTransfer(account, reword);

		// change property author
		IProperty(property).changeAuthor(account);
		IERC20 propertyInstance = IERC20(property);
		uint256 balance = propertyInstance.balanceOf(address(this));
		propertyInstance.safeTransfer(account, balance);

		// event
		emit Finish(
			property,
			_status,
			_githubRepository,
			reword,
			account,
			staking,
			_errorMessage
		);
	}

	function rescue(address _to, uint256 _amount) external onlyAdmin {
		IERC20 dev = IERC20(IAddressConfig(getAddressConfigAddress()).token());
		dev.safeTransfer(_to, _amount);
	}

	function getReword(string memory _githubRepository)
		public
		view
		returns (uint256)
	{
		uint256 latestPrice = getLastPrice();
		uint256 startPrice = getStartPrice(_githubRepository);
		uint256 reword =
			latestPrice.sub(startPrice).div(BASIS_VALUE).mul(
				getStaking(_githubRepository)
			);
		uint256 rewordLimit = getRewardLimit(_githubRepository);
		if (reword <= rewordLimit) {
			return reword;
		}
		uint256 over = reword.sub(rewordLimit);
		uint256 rewordLowerLimit = getRewardLowerLimit(_githubRepository);
		if (rewordLimit < over) {
			return rewordLowerLimit;
		}
		uint256 tmp = rewordLimit.sub(over);
		return tmp <= rewordLowerLimit ? rewordLowerLimit : tmp;
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
		require(_rewardLimit != 0, "reword limit is 0.");
		require(
			_rewardLowerLimit <= _rewardLimit,
			"limit is less than lower limit."
		);
		setRewardLimit(_githubRepository, _rewardLimit);
		setRewardLowerLimit(_githubRepository, _rewardLowerLimit);
	}
}
