import {expect, use} from 'chai'
import {Contract, Wallet, constants} from 'ethers'
import {deployContract, MockProvider, solidity} from 'ethereum-waffle'
import GitHubMarketIncubator from '../../build/GitHubMarketIncubator.json'
import MockMarket from '../../build/MockMarket.json'
import MockAddressConfig from '../../build/MockAddressConfig.json'
import MockMarketBehavior from '../../build/MockMarketBehavior.json'
import MockDev from '../../build/MockDev.json'
import MockLockup from '../../build/MockLockup.json'

use(solidity)

const DEV_DECIMALS = '000000000000000000'
class Wallets {
	private readonly _provider: MockProvider
	private _deployer!: Wallet
	private _operator!: Wallet
	private _storageOwner!: Wallet
	private _user!: Wallet

	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	constructor(provider: MockProvider) {
		this._provider = provider
	}

	public async generate(): Promise<void> {
		const wallets = this._provider.getWallets()
		this._deployer = wallets[0]
		this._operator = wallets[1]
		this._storageOwner = wallets[2]
		this._user = wallets[3]
	}

	public get deployer(): Wallet {
		return this._deployer
	}

	public get storageOwner(): Wallet {
		return this._storageOwner
	}

	public get operator(): Wallet {
		return this._operator
	}

	public get user(): Wallet {
		return this._user
	}
}

class MockContract {
	private readonly _wallets: Wallets
	private _dev!: Contract
	private _lockup!: Contract
	private _marketBehavior!: Contract
	private _market!: Contract
	private _addressConfig!: Contract
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	constructor(wallets: Wallets) {
		this._wallets = wallets
	}

	public get dev(): Contract {
		return this._dev
	}

	public get lockup(): Contract {
		return this._lockup
	}

	public get marketBehavior(): Contract {
		return this._marketBehavior
	}

	public get market(): Contract {
		return this._market
	}

	public get addressConfig(): Contract {
		return this._addressConfig
	}

	public async generate(): Promise<void> {
		this._dev = await deployContract(this._wallets.deployer, MockDev)
		this._lockup = await deployContract(this._wallets.deployer, MockLockup)
		this._marketBehavior = await deployContract(
			this._wallets.deployer,
			MockMarketBehavior
		)
		this._market = await deployContract(this._wallets.deployer, MockMarket, [
			this._marketBehavior.address,
		])
		this._addressConfig = await deployContract(
			this._wallets.deployer,
			MockAddressConfig,
			[this._dev.address, this._lockup.address]
		)
	}
}

class IncubatorInstance {
	private readonly _wallets: Wallets
	private readonly _mock: MockContract
	private _incubator!: Contract
	private _incubatorStorageOwner!: Contract
	private _incubatorOperator!: Contract
	private _incubatorUser!: Contract

	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	constructor(wallets: Wallets, mock: MockContract) {
		this._wallets = wallets
		this._mock = mock
	}

	public get incubator(): Contract {
		return this._incubator
	}

	public get incubatorStorageOwner(): Contract {
		return this._incubatorStorageOwner
	}

	public get incubatorOperator(): Contract {
		return this._incubatorOperator
	}

	public get incubatorUser(): Contract {
		return this._incubatorUser
	}

	public async generate(): Promise<void> {
		this._incubator = await deployContract(
			this._wallets.deployer,
			GitHubMarketIncubator,
			[],
			{
				gasLimit: 6000000,
			}
		)
		await this._incubator.createStorage()
		await this._incubator.setMarket(this._mock.market.address)
		await this._incubator.setAddressConfig(this._mock.addressConfig.address)
		await this._incubator.addStorageOwner(this._wallets.storageOwner.address)
		await this._incubator.addOperator(this._wallets.operator.address)
		this._incubatorOperator = this._incubator.connect(this._wallets.operator)
		this._incubatorUser = this._incubator.connect(this._wallets.user)
		this._incubatorStorageOwner = this._incubator.connect(
			this._wallets.storageOwner
		)
	}
}

describe('GitHubMarketIncubator', () => {
	const init = async (): Promise<
		[IncubatorInstance, MockContract, Wallets, MockProvider]
	> => {
		const provider = new MockProvider()
		const wallets = new Wallets(provider)
		await wallets.generate()
		const mock = new MockContract(wallets)
		await mock.generate()
		const instance = new IncubatorInstance(wallets, mock)
		await instance.generate()
		return [instance, mock, wallets, provider]
	}

	describe('addOperator, deleteOperator, isOperator', () => {
		describe('success', () => {
			it('Administrators can grant or remove operator privileges.', async () => {
				const [instance, , wallets] = await init()
				let result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
				await instance.incubator.addOperator(wallets.user.address)
				result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(true)
				await instance.incubator.deleteOperator(wallets.user.address)
				result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
			})
		})
		describe('fail', () => {
			it('storage owner can not grant or remove operator privileges.', async () => {
				const [instance, , wallets] = await init()
				let result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
				await expect(
					instance.incubatorStorageOwner.addOperator(wallets.user.address)
				).to.be.revertedWith('admin only.')
				result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
				await expect(
					instance.incubatorStorageOwner.deleteOperator(wallets.user.address)
				).to.be.revertedWith('admin only.')
				result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
			})
			it('operator can not grant or remove operator privileges.', async () => {
				const [instance, , wallets] = await init()
				let result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
				await expect(
					instance.incubatorOperator.addOperator(wallets.user.address)
				).to.be.revertedWith('admin only.')
				result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
				await expect(
					instance.incubatorOperator.deleteOperator(wallets.user.address)
				).to.be.revertedWith('admin only.')
				result = await instance.incubator.isOperator(wallets.user.address)
				expect(result).to.be.equal(false)
			})
		})
	})

	describe('start', () => {
		describe('success', () => {
			it('パラメータがストレージに保存される.', async () => {
				const [instance, mock, , provider] = await init()
				const property = provider.createEmptyWallet()
				const repository = 'hogehoge/rep'
				const stakingValue = 10000
				const limitValue = 1000
				await instance.incubatorOperator.start(
					property.address,
					repository,
					stakingValue,
					limitValue,
					{
						gasLimit: 1000000,
					}
				)
				expect(
					await instance.incubator.getPropertyAddress(repository)
				).to.be.equal(property.address)
				const [
					,
					,
					lastPrice,
				] = await mock.lockup.calculateCumulativeRewardPrices()
				expect(await instance.incubator.getStartPrice(repository)).to.be.equal(
					lastPrice.toNumber()
				)
				const staking = await instance.incubator.getStaking(repository)
				expect(staking.toString()).to.be.equal(
					stakingValue.toString() + DEV_DECIMALS
				)
				const limit = await instance.incubator.getRewardLimit(repository)
				expect(limit.toString()).to.be.equal(
					limitValue.toString() + DEV_DECIMALS
				)
			})
		})
		describe('fail', () => {
			it('only operators can execute.', async () => {
				const [instance, , , provider] = await init()
				const property = provider.createEmptyWallet()
				const tmp = instance.incubatorUser.start(
					property.address,
					'hogehoge/rep',
					10000,
					1000,
					{
						gasLimit: 1000000,
					}
				)
				await expect(tmp).to.be.revertedWith('operator only.')
			})
		})
	})

	// Describe('clearAccountAddress', () => {
	// 	describe('success', () => {
	// 		it('Stored account addresses can be deleted.', async () => {
	// 			const instance = await init()
	// 			const property = instance.provider.createEmptyWallet()
	// 			await instance.incubatorOperator.start(
	// 				property.address,
	// 				'hogehoge/rep',
	// 				{
	// 					gasLimit: 1000000,
	// 				}
	// 			)
	// 			await instance.incubatorUser.authenticate(
	// 				'hogehoge/rep',
	// 				'dummy-public-signature',
	// 				{
	// 					gasLimit: 1000000,
	// 				}
	// 			)
	// 			let accountAddress = await instance.incubator.getAccountAddress(
	// 				property.address
	// 			)
	// 			expect(accountAddress).to.be.equal(instance.wallets.user.address)
	// 			await instance.incubatorOperator.clearAccountAddress(property.address)
	// 			accountAddress = await instance.incubator.getAccountAddress(
	// 				property.address
	// 			)
	// 			expect(accountAddress).to.be.equal(constants.AddressZero)
	// 		})
	// 	})
	// 	describe('fail', () => {
	// 		it('only operators can execute.', async () => {
	// 			const instance = await init()
	// 			const property = instance.provider.createEmptyWallet()
	// 			const tmp = instance.incubator.clearAccountAddress(
	// 				property.address,
	// 				'hogehoge/rep',
	// 				{
	// 					gasLimit: 1000000,
	// 				}
	// 			)
	// 			await expect(tmp).to.be.revertedWith('sender is not operator.')
	// 		})
	// 	})
	// })
	describe('rescue', () => {
		describe('success', () => {
			it('can rescue the DEV tokens.', async () => {
				const [instance, mock, wallets] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				let balance = await mock.dev.balanceOf(instance.incubator.address)
				expect(balance.toNumber()).to.be.equal(10000)
				await instance.incubator.rescue(wallets.user.address, 10000)
				balance = await mock.dev.balanceOf(instance.incubator.address)
				expect(balance.toNumber()).to.be.equal(0)
				balance = await mock.dev.balanceOf(wallets.user.address)
				expect(balance.toNumber()).to.be.equal(10000)
			})
		})
		describe('fail', () => {
			it('dev tokens that exceed the amount held cannot be rescued.', async () => {
				const [instance, mock, wallets] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				const balance = await mock.dev.balanceOf(instance.incubator.address)
				expect(balance.toNumber()).to.be.equal(10000)
				await expect(
					instance.incubator.rescue(wallets.user.address, 20000)
				).to.be.revertedWith('transfer amount exceeds balance')
			})
			it('おnly the administrator can execute the function..', async () => {
				const [instance, mock, wallets] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				const balance = await mock.dev.balanceOf(instance.incubator.address)
				expect(balance.toNumber()).to.be.equal(10000)
				await expect(
					instance.incubatorOperator.rescue(wallets.user.address, 10000)
				).to.be.revertedWith('admin only.')
				await expect(
					instance.incubatorStorageOwner.rescue(wallets.user.address, 10000)
				).to.be.revertedWith('admin only.')
				await expect(
					instance.incubatorUser.rescue(wallets.user.address, 10000)
				).to.be.revertedWith('admin only.')
			})
		})
	})
	describe('setter', () => {
		describe('market', () => {
			it('you can get the value you set.', async () => {
				const [instance, mock] = await init()
				const marketAddress = await instance.incubator.getMarketAddress()
				expect(marketAddress).to.be.equal(mock.market.address)
			})
			it('only owner can set.', async () => {
				const [instance, , , provider] = await init()
				const wallet = provider.createEmptyWallet()
				await expect(
					instance.incubatorUser.setMarket(wallet.address)
				).to.be.revertedWith('admin only.')
			})
		})
		describe('addressConfig', () => {
			it('you can get the value you set.', async () => {
				const [instance, mock] = await init()
				const operatorAddress = await instance.incubator.getAddressConfigAddress()
				expect(operatorAddress).to.be.equal(mock.addressConfig.address)
			})
			it('only owner can set.', async () => {
				const [instance, , , provider] = await init()
				const wallet = provider.createEmptyWallet()
				await expect(
					instance.incubatorUser.setAddressConfig(wallet.address)
				).to.be.revertedWith('admin only.')
			})
		})
	})
})
