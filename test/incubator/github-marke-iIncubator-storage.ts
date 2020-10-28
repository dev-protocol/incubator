import {expect, use} from 'chai'
import {Contract, constants} from 'ethers'
import {deployContract, MockProvider, solidity} from 'ethereum-waffle'
import GitHubMarketIncubatorStorageTest from '../../build/GitHubMarketIncubatorStorageTest.json'

use(solidity)

describe.only('GitHubMarketIncubatorStorage', () => {
	const provider = new MockProvider()
	const [deployer, user, property, test] = provider.getWallets()
	let storageTest: Contract
	before(async () => {
		storageTest = await deployContract(
			deployer,
			GitHubMarketIncubatorStorageTest
		)
		await storageTest.createStorage()
	})
	describe('setStartBlockNumber, getStartBlockNumber', () => {
		it('Initial value is 0.', async () => {
			const result = await storageTest.getStartBlockNumber('dummy')
			expect(result.toNumber()).to.be.equal(0)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setStartBlockNumberTest('dummy', 10)
			const result = await storageTest.getStartBlockNumber('dummy')
			expect(result.toNumber()).to.be.equal(10)
		})
	})
	describe('setPropertyAddress, getPropertyAddress', () => {
		it('Initial value is 0x0000.......', async () => {
			const result = await storageTest.getPropertyAddress('dummy')
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setPropertyAddressTest('dummy', property.address)
			const result = await storageTest.getPropertyAddress('dummy')
			expect(result).to.be.equal(property.address)
		})
	})
	describe('setAccountAddress, getAccountAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getAccountAddress(property.address)
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setAccountAddressTest(property.address, user.address)
			const result = await storageTest.getAccountAddress(property.address)
			expect(result).to.be.equal(user.address)
		})
	})
	describe('setMarketAddress, getMarketAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getMarketAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setMarketAddressTest(test.address)
			const result = await storageTest.getMarketAddress()
			expect(result).to.be.equal(test.address)
		})
	})
	describe('setMarketBehaviorAddress, getMarketBehaviorAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getMarketBehaviorAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setMarketBehaviorAddressTest(test.address)
			const result = await storageTest.getMarketBehaviorAddress()
			expect(result).to.be.equal(test.address)
		})
	})
	describe('setOperatorAddress, getOperatorAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getOperatorAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setOperatorAddressTest(test.address)
			const result = await storageTest.getOperatorAddress()
			expect(result).to.be.equal(test.address)
		})
	})
	describe('setLinkAddress, getLinkAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getLinkAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setLinkAddressTest(test.address)
			const result = await storageTest.getLinkAddress()
			expect(result).to.be.equal(test.address)
		})
	})
	describe('setMaxProceedBlockNumber, getMaxProceedBlockNumber', () => {
		it('Initial value is 0.', async () => {
			const result = await storageTest.getMaxProceedBlockNumber()
			expect(result.toNumber()).to.be.equal(0)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setMaxProceedBlockNumberTest(3000000000)
			const result = await storageTest.getMaxProceedBlockNumber()
			expect(result.toNumber()).to.be.equal(3000000000)
		})
	})
	describe('setStakeTokenValue, getStakeTokenValue', () => {
		it('Initial value is 0.', async () => {
			const result = await storageTest.getStakeTokenValue()
			expect(result.toNumber()).to.be.equal(0)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setStakeTokenValueTest(40000000)
			const result = await storageTest.getStakeTokenValue()
			expect(result.toNumber()).to.be.equal(40000000)
		})
	})
})
