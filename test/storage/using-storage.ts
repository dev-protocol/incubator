import {expect, use} from 'chai'
import {Contract, utils} from 'ethers'
import {deployContract, MockProvider, solidity} from 'ethereum-waffle'
import UsingStorageTest from '../../build/UsingStorageTest.json'

use(solidity)

describe('contract', () => {
	const provider = new MockProvider()
	const [deployer] = provider.getWallets()

	describe('UsingStorage: eternalStorage', () => {
		it('returns EternalStorage instance.', async () => {
			const us = await deployContract(deployer, UsingStorageTest)
			await us.createStorage()
			const result = await us.getEternalStorageAddress()
			const expected = await us.getStorageAddress()
			expect(result).to.be.equal(expected)
		})
	})
	describe('UsingStorage; hasStorage, createStorage', () => {
		let usingStorage: Contract
		beforeEach(async () => {
			usingStorage = await deployContract(deployer, UsingStorageTest)
		})
		it('If storage has not been created, an error will occur when trying to get the storage address.', async () => {
			await expect(usingStorage.getStorageAddress()).to.be.revertedWith(
				'storage is not set'
			)
		})
		it('If storage has not been created, an error will occur when accessing storage.', async () => {
			await expect(usingStorage.getUInt()).to.be.revertedWith(
				'storage is not set'
			)
		})
		it('If storage has been created, the storage address can be obtained.', async () => {
			await usingStorage.createStorage()
			const result = await usingStorage.getStorageAddress()
			expect(utils.isAddress(result)).to.be.equal(true)
		})
		it('If the storage has been created, you can access the storage.', async () => {
			await usingStorage.createStorage()
			const result = await usingStorage.getUInt()
			expect(result.toNumber()).to.be.equal(0)
		})
		it('Creating storage again after storage has been created results in an error.', async () => {
			await usingStorage.createStorage()
			await expect(usingStorage.createStorage()).to.be.revertedWith(
				'storage is set'
			)
		})
	})
	describe('UsingStorage; getStorageAddress, setStorage, changeOwner', () => {
		let usingStorage: Contract
		let usingStorageNext: Contract
		beforeEach(async () => {
			usingStorage = await deployContract(deployer, UsingStorageTest)
			await usingStorage.createStorage()
			await usingStorage.setUInt(1)
			usingStorageNext = await deployContract(deployer, UsingStorageTest)
		})

		it('Can get the value set in the storage.', async () => {
			const result = await usingStorage.getUInt()
			expect(result.toNumber()).to.be.equal(1)
		})
		it('the storage address is taken over, the same storage can be accessed from the takeover destination.', async () => {
			const storageAddress = await usingStorage.getStorageAddress()
			await usingStorageNext.setStorage(storageAddress)
			const result = await usingStorageNext.getUInt()
			expect(result.toNumber()).to.be.equal(1)
		})
		it('Before delegating authority, you can not write.', async () => {
			const storageAddress = await usingStorage.getStorageAddress()
			await usingStorageNext.setStorage(storageAddress)
			await expect(usingStorageNext.setUInt(2)).to.be.revertedWith(
				'not current owner'
			)
		})
		it('Delegation of authority is not possible from the delegate.', async () => {
			const storageAddress = await usingStorage.getStorageAddress()
			await usingStorageNext.setStorage(storageAddress)
			await expect(
				usingStorageNext.changeOwner(usingStorageNext.address)
			).to.be.revertedWith('not current owner')
		})
		it('When delegating authority, the delegate can write to storage', async () => {
			const storageAddress = await usingStorage.getStorageAddress()
			await usingStorageNext.setStorage(storageAddress)
			await usingStorage.changeOwner(usingStorageNext.address)
			await usingStorageNext.setUInt(2)
			const result = await usingStorageNext.getUInt()
			expect(result.toNumber()).to.be.equal(2)
		})
		it('When delegating authority, delegation source can not write to storage.', async () => {
			const storageAddress = await usingStorage.getStorageAddress()
			await usingStorageNext.setStorage(storageAddress)
			await usingStorage.changeOwner(usingStorageNext.address)
			await expect(usingStorage.setUInt(2)).to.be.revertedWith(
				'not current owner'
			)
		})
	})
})
