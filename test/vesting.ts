/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import {expect} from 'chai'
import {Contract} from 'ethers'
import {deployContract, MockProvider} from 'ethereum-waffle'
import Vesting from '../build/Vesting.json'
import Token from '../build/Token.json'
import {mine} from './libs'

const err = (e: Error) => e

describe('contract', () => {
	const provider = new MockProvider()
	const [deployer, user, user1] = provider.getWallets()
	const createContract = async () =>
		deployContract(deployer, Vesting, [token.address, 5])
	let token: Contract

	before(async () => {
		token = await deployContract(deployer, Token, [100000000])
	})

	describe('constracting', () => {
		it('Initialize by specifying a token address and the value of unit per block', async () => {
			const contract = await deployContract(deployer, Vesting, [
				token.address,
				7,
			])
			const address = await contract.token()
			const unitPerBlock = await contract.unitPerBlock()

			expect(address).to.be.equal(token.address)
			expect(unitPerBlock.toNumber()).to.be.equal(7)
		})
	})

	describe('_setAmounts', () => {
		it('Set an amount for a user', async () => {
			const contract = await createContract()
			await contract._setAmounts(user.address, 100)
			const [, , amount] = await contract.getAmounts(user.address)
			expect(amount.toNumber()).to.be.equal(100)
		})
		it('Should fail to call when from the non-owner account', async () => {
			const contract = await createContract()
			const res = await contract
				.connect(user)
				._setAmounts(user.address, 100)
				.catch(err)
			const [, , amount] = await contract.getAmounts(user.address)
			expect(res).to.be.instanceOf(Error)
			expect(amount.toNumber()).to.be.equal(0)
		})
	})

	describe('_setUnitPerBlock', () => {
		it('Set the value of unit per block', async () => {
			const contract = await createContract()
			await contract._setUnitPerBlock(99)
			const value = await contract.unitPerBlock()
			expect(value.toNumber()).to.be.equal(99)
		})
		it('Should fail to call when from the non-owner account', async () => {
			const contract = await createContract()
			const res = await contract.connect(user)._setUnitPerBlock(99).catch(err)
			const value = await contract.unitPerBlock()
			expect(res).to.be.instanceOf(Error)
			expect(value.toNumber()).to.be.equal(5)
		})
	})

	describe('_close', () => {
		it('Refunds all balance of the contract to the owner', async () => {
			const contract = await createContract()
			await token.transfer(contract.address, 1000)
			const beforeBalanceOfUser = await token.balanceOf(deployer.address)
			const beforeBalanceOfContract = await token.balanceOf(contract.address)
			await contract._close()
			const afterBalanceOfUser = await token.balanceOf(deployer.address)
			const afterBalanceOfContract = await token.balanceOf(contract.address)

			expect(
				afterBalanceOfUser.toNumber() - beforeBalanceOfUser.toNumber()
			).to.be.equal(1000)
			expect(
				beforeBalanceOfContract.toNumber() - afterBalanceOfContract.toNumber()
			).to.be.equal(1000)
		})
		it('Should fail to call when from the non-owner account', async () => {
			const contract = await createContract()
			await token.transfer(contract.address, 1000)
			const res = await contract.connect(user)._close().catch(err)
			const balance = await token.balanceOf(contract.address)
			expect(res).to.be.instanceOf(Error)
			expect(balance.toNumber()).to.be.equal(1000)
		})
	})

	describe('getAmounts', () => {
		describe('Returns a withdrawable amount according to the elapsed block', () => {
			const amount = (x: any[]) => x[0].toNumber()
			let contract: Contract

			before(async () => {
				contract = await createContract()
				await token.transfer(contract.address, 1000)
				await contract._setAmounts(user.address, 100)
			})

			it('0 block has passed', async () => {
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(0)
			})
			it('5 block has passed', async () => {
				await mine(provider, 5)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(25)
			})
			it('10 block has passed', async () => {
				await mine(provider, 5)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(50)
			})
			it('20 block has passed', async () => {
				await mine(provider, 10)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(100)
			})
			it('21 block has passed', async () => {
				await mine(provider, 1)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(100)
			})
			it('31 block has passed', async () => {
				await mine(provider, 10)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(100)
			})
			it('restarted: 0 block has passed', async () => {
				await contract._setAmounts(user.address, 100)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(100)
			})
			it('restarted: 5 block has passed', async () => {
				await mine(provider, 5)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(125)
			})
			it('restarted: 10 block has passed', async () => {
				await mine(provider, 5)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(150)
			})
			it('restarted: 20 block has passed', async () => {
				await mine(provider, 10)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(200)
			})
			it('restarted: 21 block has passed', async () => {
				await mine(provider, 1)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(200)
			})
			it('restarted: 31 block has passed', async () => {
				await mine(provider, 10)
				const withdrawable = await contract
					.getAmounts(user.address)
					.then(amount)
				expect(withdrawable).to.be.equal(200)
			})
		})

		it('Returns the cumulative withdrawable amount', async () => {
			const contract = await createContract()
			await token.transfer(contract.address, 1000)
			await contract._setAmounts(user.address, 100)
			await mine(provider, 5)
			const total = await contract
				.getAmounts(user.address)
				.then((x: any) => x[1].toNumber())
			expect(total).to.be.equal(25)
		})
		it('Returns the total amount', async () => {
			const contract = await createContract()
			await token.transfer(contract.address, 1000)
			await contract._setAmounts(user.address, 100)
			const total = await contract
				.getAmounts(user.address)
				.then((x: any) => x[2].toNumber())
			expect(total).to.be.equal(100)
		})
	})

	describe('tap', () => {
		const amount = (x: any[]) => x[0].toNumber()
		let contract: Contract

		before(async () => {
			contract = await createContract()
			await token.transfer(contract.address, 1000)
			await contract._setAmounts(user.address, 80)
		})

		it('Withdraw amount the same value of `getAmounts`', async () => {
			const before = await token.balanceOf(user.address)
			await mine(provider, 10)
			const expected = await contract.getAmounts(user.address).then(amount)
			await contract.connect(user).tap()
			const after = await token.balanceOf(user.address)
			expect(after.toNumber() - before.toNumber()).to.be.equal(expected + 5)
			expect(expected + 5).to.be.equal(55)
		})
		it('Withdraw amount is always the difference', async () => {
			const before = await token.balanceOf(user.address)
			await mine(provider, 20)
			const expected = await contract.getAmounts(user.address).then(amount)
			await contract.connect(user).tap()
			const after = await token.balanceOf(user.address)
			expect(after.toNumber() - before.toNumber()).to.be.equal(expected)
			expect(expected).to.be.equal(25)
		})
		it('When the withdrawable amount is 0, withdrawn nothing', async () => {
			const before = await token.balanceOf(user.address)
			await mine(provider, 5)
			await contract.connect(user).tap()
			const after = await token.balanceOf(user.address)
			expect(after.toNumber() - before.toNumber()).to.be.equal(0)
		})
		it('When the amount is 0, withdrawn nothing', async () => {
			const before = await token.balanceOf(user1.address)
			await mine(provider, 5)
			await contract.connect(user1).tap()
			const after = await token.balanceOf(user1.address)
			expect(after.toNumber() - before.toNumber()).to.be.equal(0)
		})
	})
})
