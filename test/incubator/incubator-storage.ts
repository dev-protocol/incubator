import { expect, use } from 'chai'
import { Contract, constants } from 'ethers'
import { deployContract, MockProvider, solidity } from 'ethereum-waffle'
import IncubatorStorageTest from '../../build/IncubatorStorageTest.json'

use(solidity)

describe('IncubatorStorage', () => {
	const provider = new MockProvider()
	const [deployer] = provider.getWallets()
	let storageTest: Contract
	before(async () => {
		storageTest = await deployContract(deployer, IncubatorStorageTest)
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
	describe('setRewardLowerLimit, getRewardLowerLimit', () => {
		it('Initial value is 0', async () => {
			const result = await storageTest.getRewardLowerLimit('dummy')
			expect(result.toNumber()).to.be.equal(0)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setRewardLowerLimitTest('dummy', 9000000)
			const result = await storageTest.getRewardLowerLimit('dummy')
			expect(result.toNumber()).to.be.equal(9000000)
		})
	})
	describe('setPropertyAddress, getPropertyAddress', () => {
		it('Initial value is 0x0000.......', async () => {
			const result = await storageTest.getPropertyAddress('dummy')
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			const tmp = provider.createEmptyWallet()
			await storageTest.setPropertyAddressTest('dummy', tmp.address)
			const result = await storageTest.getPropertyAddress('dummy')
			expect(result).to.be.equal(tmp.address)
		})
	})
	describe('setAccountAddress, getAccountAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const tmp = provider.createEmptyWallet()
			const result = await storageTest.getAccountAddress(tmp.address)
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			const tmp1 = provider.createEmptyWallet()
			const tmp2 = provider.createEmptyWallet()
			await storageTest.setAccountAddressTest(tmp1.address, tmp2.address)
			const result = await storageTest.getAccountAddress(tmp1.address)
			expect(result).to.be.equal(tmp2.address)
		})
	})
	describe('setMarketAddress, getMarketAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getMarketAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			const tmp = provider.createEmptyWallet()
			await storageTest.setMarketAddressTest(tmp.address)
			const result = await storageTest.getMarketAddress()
			expect(result).to.be.equal(tmp.address)
		})
	})
	describe('setAddressConfigAddress, getAddressConfigAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getAddressConfigAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			const tmp = provider.createEmptyWallet()
			await storageTest.setAddressConfigAddressTest(tmp.address)
			const result = await storageTest.getAddressConfigAddress()
			expect(result).to.be.equal(tmp.address)
		})
	})
	describe('setPublicSignature, getPublicSignature', () => {
		it('Initial value is ""', async () => {
			const result = await storageTest.getPublicSignature('dummy_repo')
			expect(result).to.be.equal('')
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setPublicSignatureTest('dummy_repo', 'dummy_public_sig')
			const result = await storageTest.getPublicSignature('dummy_repo')
			expect(result).to.be.equal('dummy_public_sig')
		})
	})
	describe('setCallbackKickerAddress, getCallbackKickerAddress', () => {
		it('Initial value is 0x0000........', async () => {
			const result = await storageTest.getCallbackKickerAddress()
			expect(result).to.be.equal(constants.AddressZero)
		})
		it('The set value can be taken as it is.', async () => {
			const tmp = provider.createEmptyWallet()
			await storageTest.setCallbackKickerAddressTest(tmp.address)
			const result = await storageTest.getCallbackKickerAddress()
			expect(result).to.be.equal(tmp.address)
		})
	})
	describe('setFinished, getFinished', () => {
		it('Initial value is false', async () => {
			const result = await storageTest.getFinished('dummy_repo')
			expect(result).to.be.equal(false)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setFinishedTest('dummy_repo', true)
			const result = await storageTest.getFinished('dummy_repo')
			expect(result).to.be.equal(true)
		})
	})
	describe('setClaimed, getClaimed', () => {
		it('Initial value is false', async () => {
			const result = await storageTest.getClaimed('dummy_repo')
			expect(result).to.be.equal(false)
		})
		it('The set value can be taken as it is.', async () => {
			await storageTest.setClaimedTest('dummy_repo', true)
			const result = await storageTest.getClaimed('dummy_repo')
			expect(result).to.be.equal(true)
		})
	})
})
