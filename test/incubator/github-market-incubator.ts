import {expect, use} from 'chai'
import {Contract, constants} from 'ethers'
import {deployContract, MockProvider, solidity} from 'ethereum-waffle'
import GitHubMarketIncubator from '../../build/GitHubMarketIncubator.json'
import MockMarket from '../../build/MockMarket.json'
import MockLink from '../../build/MockLink.json'

use(solidity)

describe.only('GitHubMarketIncubatorStorage', () => {
	const provider = new MockProvider()
	const [deployer, operator, property, test] = provider.getWallets()
	let incubator: Contract
	before(async () => {
		const market = await deployContract(deployer, MockMarket, ['0x00'])
		const link = await deployContract(deployer, MockLink, ['0x00', '0x00'])
		incubator = await deployContract(deployer, GitHubMarketIncubator, [
			market.address,
			operator,
			link.address,
			10000,
			518400,
		])
		await incubator.createStorage()
	})
	// Describe('setStartBlockNumber, getStartBlockNumber', () => {
	// 	it('Initial value is 0.', async () => {
	// 		const result = await storageTest.getStartBlockNumber('dummy')
	// 		expect(result.toNumber()).to.be.equal(0)
	// 	})
	// 	it('The set value can be taken as it is.', async () => {
	// 		await storageTest.setStartBlockNumberTest('dummy', 10)
	// 		const result = await storageTest.getStartBlockNumber('dummy')
	// 		expect(result.toNumber()).to.be.equal(10)
	// 	})
	// })
})
