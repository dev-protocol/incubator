// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.7.6;

contract MockMetricsGroup {
	mapping(address => uint256) public metricsCountPerProperty;

	function getMetricsCountPerProperty(address _property)
		external
		view
		returns (uint256)
	{
		return metricsCountPerProperty[_property];
	}

	function setMetricsCountPerProperty(address _property, uint256 _value)
		external
	{
		metricsCountPerProperty[_property] = _value;
	}
}
