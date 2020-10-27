pragma solidity 0.6.12;

interface ILink {
	function getTokenAddress() external view returns (address);

	function getStorageLastCumulativeInterestPrice()
		external
		view
		returns (uint256);
}
