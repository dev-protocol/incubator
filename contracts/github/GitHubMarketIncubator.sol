// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
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
import {GitHubMarketIncubatorStorage} from "contracts/github/GitHubMarketIncubatorStorage.sol";

contract GitHubMarketIncubator is GitHubMarketIncubatorStorage {
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
		address indexed _sender,
		address _marketBehavior,
		address _property,
		string _githubRepository,
		address _metrics,
		uint256 _reword,
		address _account,
		uint256 _staking
	);

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
		uint256 _rewardLimit
	) external onlyOperator {
		require(_staking != 0, "staking is 0.");
		require(_rewardLimit != 0, "reword limit is 0.");

		uint256 lastPrice = getLastPrice();
		setPropertyAddress(_githubRepository, _property);
		setStartPrice(_githubRepository, lastPrice);
		setStaking(_githubRepository, _staking);
		setRewardLimit(_githubRepository, _rewardLimit);
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
		emit Authenticate(
			_msgSender(),
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
		uint256 reword = getReword(_githubRepository);
		require(reword != 0, "reword is 0.");
		address marketBehavior = IMarket(getMarketAddress()).behavior();
		string memory id = IMarketBehavior(marketBehavior).getId(_metrics);
		require(
			keccak256(abi.encodePacked(id)) ==
				keccak256(abi.encodePacked(_githubRepository)),
			"illegal metrics."
		);

		// transfer reword
		address devToken = IAddressConfig(getAddressConfigAddress()).token();
		IERC20 dev = IERC20(devToken);
		dev.safeTransfer(account, reword);

		// change property author
		IProperty(property).changeAuthor(account);
		IERC20 propertyInstance = IERC20(property);
		uint256 balance = propertyInstance.balanceOf(address(this));
		propertyInstance.safeTransfer(account, balance);

		// lockup
		uint256 staking = getStaking(_githubRepository);
		IDev(devToken).deposit(property, staking);
		setStaking(_githubRepository, 0);

		// event
		emit Finish(
			_msgSender(),
			marketBehavior,
			property,
			_githubRepository,
			_metrics,
			reword,
			account,
			staking
		);
	}

	function withdrawLockup(address _property, uint256 _amount)
		external
		onlyOperator
	{
		address lockup = IAddressConfig(getAddressConfigAddress()).lockup();
		ILockup(lockup).withdraw(_property, _amount);
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
			latestPrice.sub(startPrice).mul(getStaking(_githubRepository));
		uint256 rewordLimit = getRewardLimit(_githubRepository);
		return reword < rewordLimit ? reword : rewordLimit;
	}

	function getLastPrice() private view returns (uint256) {
		address lockup = IAddressConfig(getAddressConfigAddress()).lockup();
		(, , uint256 latestPrice) =
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
}
