pragma solidity 0.6.12;

interface ILink {
	function getTokenAddress() external view returns (address);

	function getStorageLastCumulativeInterestPrice()
		external
		view
		returns (uint256);

	function depositFrom(
		address _from,
		address _to,
		uint256 _amount
	) external returns (bool);

	function cancel(address _property) external;
}
