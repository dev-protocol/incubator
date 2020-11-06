import {expect, use} from 'chai'
import {Contract, constants} from 'ethers'
import {deployContract, MockProvider, solidity} from 'ethereum-waffle'
import GitHubMarketIncubatorStorageTest from '../../build/GitHubMarketIncubatorStorageTest.json'

use(solidity)

describe('GitHubMarketIncubatorStorage', () => {
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
	describe('setStartPrice, getStartPrice', () => {
		it('Initial value is 0', async () => {
			const result = await storageTest.getStartPrice('dummy')
			expect(result.toNumber()).to.be.equal(0)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setStartPriceTest('dummy', 1000000)
			const result = await storageTest.getStartPrice('dummy')
			expect(result.toNumber()).to.be.equal(1000000)
		})
	})
	describe('setStaking, getStaking', () => {
		it('Initial value is 0', async () => {
			const result = await storageTest.getStaking('dummy')
			expect(result.toNumber()).to.be.equal(0)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setStakingTest('dummy', 2000000)
			const result = await storageTest.getStaking('dummy')
			expect(result.toNumber()).to.be.equal(2000000)
		})
	})
	describe('setRewardLimit, getRewardLimit', () => {
		it('Initial value is 0', async () => {
			const result = await storageTest.getRewardLimit('dummy')
			expect(result.toNumber()).to.be.equal(0)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setRewardLimitTest('dummy', 3000000)
			const result = await storageTest.getRewardLimit('dummy')
			expect(result.toNumber()).to.be.equal(3000000)
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
	describe('setAddressConfigAddress, getAddressConfigAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getAddressConfigAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setAddressConfigAddressTest(test.address)
			const result = await storageTest.getAddressConfigAddress()
			expect(result).to.be.equal(test.address)
		})
	})
})
