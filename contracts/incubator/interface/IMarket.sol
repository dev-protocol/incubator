pragma solidity 0.6.12;

interface IMarket {
	function authenticate(
		address _prop,
		string _args1,
		string _args2,
		string _args3,
		string _args4,
		string _args5
	)
		external
		returns (
			// solium-disable-next-line indentation
			bool
		);

	function authenticateFromPropertyFactory(
		address _prop,
		address _author,
		string _args1,
		string _args2,
		string _args3,
		string _args4,
		string _args5
	)
		external
		returns (
			// solium-disable-next-line indentation
			bool
		);

	function authenticatedCallback(address _property, bytes32 _idHash)
		external
		returns (address);

	function deauthenticate(address _metrics) external;

	function schema() external view returns (string memory);

	function behavior() external view returns (address);

	function enabled() external view returns (bool);

	function votingEndBlockNumber() external view returns (uint256);

	function toEnable() external;
}
