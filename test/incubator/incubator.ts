/* eslint-disable new-cap */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import { expect, use } from 'chai'
import { Contract, Wallet, constants, BigNumber } from 'ethers'
import { deployContract, MockProvider, solidity } from 'ethereum-waffle'
import { mine } from '@devprotocol/util-ts'
import Incubator from '../../build/IncubatorTest.json'
import MockMarket from '../../build/MockMarket.json'
import MockAddressConfig from '../../build/MockAddressConfig.json'
import MockMarketBehavior from '../../build/MockMarketBehavior.json'
import MockDev from '../../build/MockDev.json'
import MockLockup from '../../build/MockLockup.json'
import MockProperty from '../../build/MockProperty.json'
import MockMetrics from '../../build/MockMetrics.json'
import MockMetricsGroup from '../../build/MockMetricsGroup.json'
import { describe } from 'mocha'

use(solidity)

const DEV_DECIMALS = '000000000000000000'
class Wallets {
	private readonly _provider: MockProvider
	private _deployer!: Wallet
	private _operator!: Wallet
	private _storageOwner!: Wallet
	private _user!: Wallet
	private _callbackKicker!: Wallet

	constructor(provider: MockProvider) {
		this._provider = provider
	}

	public async generate(): Promise<void> {
		const wallets = this._provider.getWallets()
		this._deployer = wallets[0]
		this._operator = wallets[1]
		this._storageOwner = wallets[2]
		this._user = wallets[3]
		this._callbackKicker = wallets[4]
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

	public get callbackKicker(): Wallet {
		return this._callbackKicker
	}
}

class MockContract {
	private readonly _wallets: Wallets
	private _dev!: Contract
	private _lockup!: Contract
	private _marketBehavior!: Contract
	private _market!: Contract
	private _addressConfig!: Contract
	private _metrics!: Contract
	private _metricsGroup!: Contract

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

	public get metrics(): Contract {
		return this._metrics
	}

	public get metricsGroup(): Contract {
		return this._metricsGroup
	}

	public async generatePropertyMock(
		incubatorAddress: string
	): Promise<Contract> {
		const property = await deployContract(
			this._wallets.deployer,
			MockProperty,
			[incubatorAddress, 'mock', 'MOCK']
		)
		return property
	}

	public async generate(): Promise<void> {
		this._dev = await deployContract(this._wallets.deployer, MockDev)
		this._lockup = await deployContract(this._wallets.deployer, MockLockup, [
			this._dev.address,
		])
		this._marketBehavior = await deployContract(
			this._wallets.deployer,
			MockMarketBehavior
		)
		this._market = await deployContract(this._wallets.deployer, MockMarket, [
			this._marketBehavior.address,
		])
		this._metrics = await deployContract(this._wallets.deployer, MockMetrics)
		this._metricsGroup = await deployContract(
			this._wallets.deployer,
			MockMetricsGroup
		)
		this._addressConfig = await deployContract(
			this._wallets.deployer,
			MockAddressConfig,
			[this._dev.address, this._lockup.address, this._metricsGroup.address]
		)
	}
}

class IncubatorInstance {
	private readonly _wallets: Wallets
	private readonly _mock: MockContract
	private _incubator!: Contract
	private _incubatorCallbackKicker!: Contract
	private _incubatorStorageOwner!: Contract
	private _incubatorOperator!: Contract
	private _incubatorUser!: Contract

	constructor(wallets: Wallets, mock: MockContract) {
		this._wallets = wallets
		this._mock = mock
	}

	public get incubator(): Contract {
		return this._incubator
	}

	public get incubatorCallbackKicker(): Contract {
		return this._incubatorCallbackKicker
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

	public otherThanOwner(): Contract[] {
		return [
			this._incubatorCallbackKicker,
			this._incubatorStorageOwner,
			this._incubatorOperator,
			this._incubatorUser,
		]
	}

	public otherThanCallbackKicker(): Contract[] {
		return [
			this._incubator,
			this._incubatorStorageOwner,
			this._incubatorOperator,
			this._incubatorUser,
		]
	}

	public otherThanOperatorAndOwner(): Contract[] {
		return [
			this._incubatorCallbackKicker,
			this._incubatorStorageOwner,
			this._incubatorUser,
		]
	}

	public operatorAndOwner(): Contract[] {
		return [this._incubatorOperator, this._incubator]
	}

	public async generate(): Promise<void> {
		this._incubator = await deployContract(
			this._wallets.deployer,
			Incubator,
			[],
			{
				gasLimit: 6000000,
			}
		)
		await this._incubator.createStorage()
		await this._incubator.setMarket(this._mock.market.address)
		await this._incubator.setAddressConfig(this._mock.addressConfig.address)
		await this._incubator.setCallbackKicker(
			this._wallets.callbackKicker.address
		)
		await this._incubator.addStorageOwner(this._wallets.storageOwner.address)
		await this._incubator.addOperator(this._wallets.operator.address)
		this._incubatorOperator = this._incubator.connect(this._wallets.operator)
		this._incubatorUser = this._incubator.connect(this._wallets.user)
		this._incubatorStorageOwner = this._incubator.connect(
			this._wallets.storageOwner
		)
		this._incubatorCallbackKicker = this._incubator.connect(
			this._wallets.callbackKicker
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
			it('only administrators can do this.', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const wallet = provider.createEmptyWallet()

					let result = await incubator.isOperator(wallet.address)
					expect(result).to.be.equal(false)
					await expect(
						incubator.addOperator(wallet.address)
					).to.be.revertedWith('admin only.')
					result = await incubator.isOperator(wallet.address)
					expect(result).to.be.equal(false)
					await expect(
						incubator.deleteOperator(wallet.address)
					).to.be.revertedWith('admin only.')
					result = await incubator.isOperator(wallet.address)
					expect(result).to.be.equal(false)
				}

				const [instance, , , provider] = await init()
				for (const incubator of instance.otherThanOwner()) {
					await check(incubator)
				}
			})
		})
	})

	describe('start', () => {
		describe('success', () => {
			it('Store the passed parameters', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					const repository = 'hogehoge/rep'
					const stakingValue = '10000' + DEV_DECIMALS
					const limitValue = '1000' + DEV_DECIMALS
					const lowerLimitValue = '10' + DEV_DECIMALS
					const initialPriceValue = '10' + DEV_DECIMALS

					await incubator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						initialPriceValue,
						{
							gasLimit: 1000000,
						}
					)
					expect(await incubator.getPropertyAddress(repository)).to.be.equal(
						property.address
					)
					const startPrice = await incubator.getStartPrice(repository)
					expect(startPrice.toString()).to.be.equal(
						initialPriceValue.toString()
					)
					const staking = await incubator.getStaking(repository)
					expect(staking.toString()).to.be.equal(stakingValue.toString())
					const limit = await incubator.getRewardLimit(repository)
					expect(limit.toString()).to.be.equal(limitValue.toString())
				}

				const [instance, , , provider] = await init()
				for (const incubator of instance.operatorAndOwner()) {
					await check(incubator)
				}
			})
			it('Get and store the value of `calculateCumulativeRewardPrices` when the passed 6th args is 0', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					const repository = 'hogehoge/rep'
					const stakingValue = '10000' + DEV_DECIMALS
					const limitValue = '1000' + DEV_DECIMALS
					const lowerLimitValue = '10' + DEV_DECIMALS

					await incubator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
					expect(await incubator.getPropertyAddress(repository)).to.be.equal(
						property.address
					)
					const [
						,
						lastPrice,
					] = await mock.lockup.calculateCumulativeRewardPrices()
					const startPrice = await incubator.getStartPrice(repository)
					expect(startPrice.toString()).to.be.equal(lastPrice.toString())
					const staking = await incubator.getStaking(repository)
					expect(staking.toString()).to.be.equal(stakingValue.toString())
					const limit = await incubator.getRewardLimit(repository)
					expect(limit.toString()).to.be.equal(limitValue.toString())
				}

				const [instance, mock, , provider] = await init()
				for (const incubator of instance.operatorAndOwner()) {
					await check(incubator)
				}
			})
		})
		describe('fail', () => {
			it('Should fail to call when the passed 4rd arg is 0', async () => {
				const [instance, , , provider] = await init()
				const property = provider.createEmptyWallet()
				await expect(
					instance.incubatorOperator.start(
						property.address,
						'hogehoge/rep',
						10,
						0,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('reward limit is 0.')
			})
			it('Should fail to call when the passed 4rd arg is less than 5th args', async () => {
				const [instance, , , provider] = await init()
				const property = provider.createEmptyWallet()
				await expect(
					instance.incubatorOperator.start(
						property.address,
						'hogehoge/rep',
						10,
						10,
						15,
						0,
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('limit is less than lower limit.')
			})
			it('Should fail to call when the sender is not admins or operators', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					const tmp = incubator.start(
						property.address,
						'hogehoge/rep',
						10000,
						1000,
						10,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await expect(tmp).to.be.revertedWith('operator only.')
				}

				const [instance, , , provider] = await init()
				for (const incubator of instance.otherThanOperatorAndOwner()) {
					await check(incubator)
				}
			})
		})
	})

	describe('authenticate', () => {
		describe('success', () => {
			it('Emit `Authenticate` event and update storage', async () => {
				const [instance, mock, wallets, provider] = await init()
				const property = provider.createEmptyWallet()
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				const lowerLimitValue = '1' + DEV_DECIMALS

				// Prepare
				await (async () => {
					await instance.incubator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
				})()

				await expect(
					instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
						gasLimit: 1000000,
					})
				)
					.to.emit(instance.incubator, 'Authenticate')
					.withArgs(
						wallets.deployer.address,
						mock.market.address,
						property.address,
						'hogehoge/rep',
						'dummy-public'
					)
				expect(
					await instance.incubator.getAccountAddress(property.address)
				).to.be.equal(wallets.deployer.address)
				expect(
					await instance.incubator.getPublicSignature('hogehoge/rep')
				).to.be.equal('dummy-public')
			})
			it('Can be running every times', async () => {
				const [instance, , , provider] = await init()
				const property = provider.createEmptyWallet()
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				const lowerLimitValue = '10' + DEV_DECIMALS

				// Prepare
				await (async () => {
					await instance.incubator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
				})()

				await instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
					gasLimit: 1000000,
				})
				await instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
					gasLimit: 1000000,
				})
			})
		})
		describe('fail', () => {
			it('Should fail to call when the passed project is not started', async () => {
				const [instance] = await init()
				await expect(
					instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
						gasLimit: 1000000,
					})
				).to.be.revertedWith('illegal user.')
			})
			it('Should fail to call when the passed project is already authenticated', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await mock.metricsGroup.setMetricsCountPerProperty(
						property.address,
						1
					)
				})()

				await expect(
					instance.incubator.authenticate(repository, 'dummy-public', {
						gasLimit: 1000000,
					})
				).to.be.revertedWith('already authenticated.')
			})
		})
	})

	describe('intermediateProcess', () => {
		describe('success', () => {
			it('Emits `Twitter` event', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
				})()

				await instance.incubatorUser.intermediateProcess(
					repository,
					mock.metrics.address,
					'1362570196712497157',
					'public-twitter-sig',
					{
						gasLimit: 1000000,
					}
				)

				const filterTwitter = instance.incubator.filters.Twitter()
				const events = await instance.incubator.queryFilter(filterTwitter)
				expect(events[0].args?.[0]).to.be.equal(repository)
				expect(events[0].args?.[1]).to.be.equal('1362570196712497157')
				expect(events[0].args?.[2]).to.be.equal('public-twitter-sig')
				expect(events[0].args?.[3]).to.be.equal('dummy-public')
			})
		})
		describe('fail', () => {
			it('Should fail to call when the passed metrics address is invalid address', async () => {
				const [instance, mock] = await init()
				await expect(
					instance.incubatorUser.intermediateProcess(
						'hogehoge/rep',
						mock.metrics.address,
						'1362570196712497157',
						'public-twitter-sig',
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('illegal repository.')
			})
			it('Should fail to call when not set account address', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
				})()

				await expect(
					instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'public-twitter-sig',
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('no authenticate yet.')
			})
			it('Should fail to call when the account address set but the address is difference', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
				})()

				await expect(
					instance.incubator.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'public-twitter-sig',
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('illegal user.')
			})
			it('Should fail to call when the passed Metrics address is not correct', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, 'foo/bar')
				})()

				await expect(
					instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'public-twitter-sig',
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('illegal metrics.')
			})
			it('Should fail to call when the passed project is already finished', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
					await instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'public-twitter-sig',
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorCallbackKicker.finish(repository, 0, '', {
						gasLimit: 1000000,
					})
				})()

				await expect(
					instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'public-twitter-sig',
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('already finished.')
			})
		})
	})
	describe('finish', () => {
		describe('success', () => {
			it('Transfer authorship to the author of the passed Property', async () => {
				const [instance, mock, wallets] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				const lowerLimitValue = '10' + DEV_DECIMALS

				// Before check
				let userPropertyBalance = await property.balanceOf(wallets.user.address)
				expect(userPropertyBalance.toNumber()).to.be.equal(0)

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
					await instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'dummy-twitter-public',
						{
							gasLimit: 1000000,
						}
					)
				})()

				await instance.incubatorCallbackKicker.finish(repository, 0, '', {
					gasLimit: 1000000,
				})

				// After check
				userPropertyBalance = await property.balanceOf(wallets.user.address)
				const supply = await property.supply()
				expect(userPropertyBalance.toString()).to.be.equal(supply.toString())
				const filterFinish = instance.incubator.filters.Finish(property.address)
				const events = await instance.incubator.queryFilter(filterFinish)
				expect(events[0].args?.[0]).to.be.equal(property.address)
				expect(events[0].args?.[1]).to.be.equal('0')
				expect(events[0].args?.[2]).to.be.equal(repository)
				expect(events[0].args?.[3]).to.be.equal(wallets.user.address)
				expect(events[0].args?.[4].toString()).to.be.equal(stakingValue)
				expect(events[0].args?.[5].toString()).to.be.equal('')
			})
			it('Emit the event without transfering reward when the passed 2nd arg is not 0', async () => {
				const [instance, mock, wallets] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				const lowerLimitValue = '10' + DEV_DECIMALS

				// Before check
				let userPropertyBalance = await property.balanceOf(wallets.user.address)
				expect(userPropertyBalance.toNumber()).to.be.equal(0)

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
					await instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'dummy-twitter-public',
						{
							gasLimit: 1000000,
						}
					)
				})()

				await instance.incubatorCallbackKicker.finish(repository, 1, '', {
					gasLimit: 1000000,
				})

				// After check
				userPropertyBalance = await property.balanceOf(wallets.user.address)
				expect(userPropertyBalance.toString()).to.be.equal('0')
				const filterFinish = instance.incubator.filters.Finish(property.address)
				const events = await instance.incubator.queryFilter(filterFinish)
				expect(events[0].args?.[0]).to.be.equal(property.address)
				expect(events[0].args?.[1]).to.be.equal('1')
				expect(events[0].args?.[2]).to.be.equal(repository)
				expect(events[0].args?.[3]).to.be.equal(wallets.user.address)
				expect(events[0].args?.[4].toString()).to.be.equal(stakingValue)
				expect(events[0].args?.[5].toString()).to.be.equal('')
			})
		})
		describe('fail', () => {
			it('Should fail to call when the sender is not callback kicker', async () => {
				const [instance] = await init()
				for (const incubator of instance.otherThanCallbackKicker()) {
					await expect(
						incubator.finish('hogehoge/rep', 0, {
							gasLimit: 1000000,
						})
					).to.be.revertedWith('illegal access.')
				}
			})
			it('Should fail to call when the Property is already transferred', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				const lowerLimitValue = '10' + DEV_DECIMALS

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
					await instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'dummy-twitter-public',
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorCallbackKicker.finish(repository, 0, '', {
						gasLimit: 1000000,
					})
				})()

				await expect(
					instance.incubatorCallbackKicker.finish('hogehoge/rep', 0, {
						gasLimit: 1000000,
					})
				).to.be.revertedWith('not the author.')
			})
		})
	})
	describe('claim', () => {
		describe('success', () => {
			it('Transfer reward to the author of the passed Property', async () => {
				const [instance, mock, wallets, provider] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '5' + DEV_DECIMALS
				const lowerLimitValue = '5' + DEV_DECIMALS

				// Before check
				let userDevBalance = await mock.dev.balanceOf(wallets.user.address)
				expect(userDevBalance.toNumber()).to.be.equal(0)

				// Prepare
				await (async () => {
					await mock.dev.transfer(
						instance.incubator.address,
						'1000000' + DEV_DECIMALS
					)
					await instance.incubatorOperator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
					await instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'dummy-twitter-public',
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorCallbackKicker.finish(repository, 0, '', {
						gasLimit: 1000000,
					})
					await mine(provider, 10)
				})()

				await instance.incubatorUser.claim(repository, {
					gasLimit: 1000000,
				})

				// After check
				const rewards = await instance.incubator.getReward(repository)
				userDevBalance = await mock.dev.balanceOf(wallets.user.address)
				expect(userDevBalance.toString()).to.be.equal(rewards.toString())
				const filterClaimed = instance.incubator.filters.Claimed()
				const events = await instance.incubator.queryFilter(filterClaimed)
				expect(events[0].args?.[0]).to.be.equal(repository)
				expect(events[0].args?.[1]).to.be.equal(rewards.toString())
			})
		})
		describe('fail', () => {
			it('Should fail to call when the passed project is not finished', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
				})()

				await expect(
					instance.incubatorUser.claim(repository)
				).to.be.revertedWith('not finished.')
			})
			it('Should fail to call when the passed project is not reached the reward limit', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				const lowerLimitValue = '10000' + DEV_DECIMALS

				// Prepare
				await (async () => {
					await instance.incubatorOperator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						lowerLimitValue,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
					await instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'dummy-twitter-public',
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorCallbackKicker.finish(repository, 0, '', {
						gasLimit: 1000000,
					})
				})()

				await expect(
					instance.incubatorUser.claim(repository)
				).to.be.revertedWith('not fulfilled.')
			})
			it('Should fail to call when the passed project is already claimed', async () => {
				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				const repository = 'hogehoge/rep'

				// Prepare
				await (async () => {
					await mock.dev.transfer(
						instance.incubator.address,
						'1000000' + DEV_DECIMALS
					)
					await instance.incubatorOperator.start(
						property.address,
						repository,
						1,
						1,
						0,
						0,
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorUser.authenticate(
						repository,
						'dummy-public',
						{
							gasLimit: 1000000,
						}
					)
					await mock.marketBehavior.setId(mock.metrics.address, repository)
					await instance.incubatorUser.intermediateProcess(
						repository,
						mock.metrics.address,
						'1362570196712497157',
						'dummy-twitter-public',
						{
							gasLimit: 1000000,
						}
					)
					await instance.incubatorCallbackKicker.finish(repository, 0, '', {
						gasLimit: 1000000,
					})
					await instance.incubatorUser.claim(repository, {
						gasLimit: 1000000,
					})
				})()

				await expect(
					instance.incubatorUser.claim(repository)
				).to.be.revertedWith('already claimed.')
			})
		})
	})
	describe('clearAccountAddress', () => {
		describe('success', () => {
			it('Delete the set account address', async () => {
				const check = async (
					incubator: Contract,
					property: string
				): Promise<void> => {
					await incubator.setAccountAddressTest(property, mock.metrics.address)
					expect(await incubator.getAccountAddress(property)).to.be.equal(
						mock.metrics.address
					)
					await incubator.clearAccountAddress(property)
					expect(await incubator.getAccountAddress(property)).to.be.equal(
						constants.AddressZero
					)
				}

				const [instance, mock] = await init()
				const property = await mock.generatePropertyMock(
					instance.incubator.address
				)
				for (const incubator of instance.operatorAndOwner()) {
					await check(incubator, property.address)
				}
			})
		})
		describe('fail', () => {
			it('Should fail to call when the sender is not admins or operators', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					await expect(
						incubator.clearAccountAddress(property.address)
					).to.be.revertedWith('operator only.')
					await expect(
						incubator.clearAccountAddress(property.address)
					).to.be.revertedWith('operator only.')
				}

				const [instance, , , provider] = await init()
				for (const incubator of instance.otherThanOperatorAndOwner()) {
					await check(incubator)
				}
			})
		})
	})
	describe('rescue', () => {
		describe('success', () => {
			it('Transfer the passed token from the contract', async () => {
				const [instance, mock, wallets] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				let balance = await mock.dev.balanceOf(instance.incubator.address)
				expect(balance.toNumber()).to.be.equal(10000)
				await instance.incubator.rescue(
					mock.dev.address,
					wallets.user.address,
					10000
				)
				balance = await mock.dev.balanceOf(instance.incubator.address)
				expect(balance.toNumber()).to.be.equal(0)
				balance = await mock.dev.balanceOf(wallets.user.address)
				expect(balance.toNumber()).to.be.equal(10000)
			})
		})
		describe('fail', () => {
			it('Should fail to call when the passed destination is zero', async () => {
				const [instance, mock] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				await expect(
					instance.incubator.rescue(
						mock.dev.address,
						constants.AddressZero,
						10000,
						{
							gasLimit: 1000000,
						}
					)
				).to.be.revertedWith('ERC20: transfer to the zero address')
			})
			it('Transfer 0 token', async () => {
				const [instance, mock, wallets] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				await instance.incubator.rescue(
					mock.dev.address,
					wallets.user.address,
					0,
					{
						gasLimit: 1000000,
					}
				)
			})
			it('Should fail to call when the contract has not the passed amount', async () => {
				const [instance, mock, wallets] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				const balance = await mock.dev.balanceOf(instance.incubator.address)
				expect(balance.toNumber()).to.be.equal(10000)
				await expect(
					instance.incubator.rescue(
						mock.dev.address,
						wallets.user.address,
						20000
					)
				).to.be.revertedWith('ERC20: transfer amount exceeds balance')
			})
			it('Should fail to call when the sender is not admins', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					const balance = await mock.dev.balanceOf(incubator.address)
					expect(balance.toNumber()).to.be.equal(10000)
					await expect(
						incubator.rescue(mock.dev.address, property.address, 10000)
					).to.be.revertedWith('admin only.')
				}

				const [instance, mock, , provider] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				for (const incubator of instance.otherThanOwner()) {
					await check(incubator)
				}
			})
		})
	})
	describe('changeAuthor', () => {
		describe('success', () => {
			it('call changeAuthor', async () => {
				const [instance, mock, wallets] = await init()
				const property = await mock.generatePropertyMock(wallets.user.address)
				await property
					.connect(wallets.user)
					.changeAuthor(instance.incubator.address)
				expect(await property.author()).to.be.equal(instance.incubator.address)
				await instance.incubator.changeAuthor(
					property.address,
					wallets.user.address
				)
				expect(await property.author()).to.be.equal(wallets.user.address)
			})
		})
		describe('fail', () => {
			it('should fail to call when the contract is not author', async () => {
				const [instance, mock, wallets] = await init()
				const property = await mock.generatePropertyMock(wallets.user.address)
				await expect(
					instance.incubator.changeAuthor(
						property.address,
						instance.incubator.address
					)
				).to.be.revertedWith('not the author.')
			})
			it('Should fail to call when the sender is not admins', async () => {
				const check = async (
					incubator: Contract,
					dest: string
				): Promise<void> => {
					const property = await mock.generatePropertyMock(
						instance.incubator.address
					)
					await expect(
						incubator.changeAuthor(property.address, dest)
					).to.be.revertedWith('admin only.')
				}

				const [instance, mock, wallets] = await init()
				for (const incubator of instance.otherThanOwner()) {
					await check(incubator, wallets.user.address)
				}
			})
		})
	})
	describe('getReward', () => {
		const toString = (x: BigNumber): string => x.toString()

		it('Returns 0 when the passed project is not configured', async () => {
			const [instance] = await init()
			const reward = await instance.incubator
				.getReward('hogehoge/hugahuga')
				.then(toString)
			expect(reward).to.be.equal('0')
		})
		describe('Returns the difference amount between the startPrice and the latest value', () => {
			it('10.', async () => {
				const [instance, , , provider] = await init()
				const wallet = provider.createEmptyWallet()

				await instance.incubator.start(
					wallet.address,
					'user/repository',
					'10' + DEV_DECIMALS,
					'10000' + DEV_DECIMALS,
					'10' + DEV_DECIMALS,
					0
				)
				for (let i = 0; i < 5; i++) {
					await mine(provider, 1)
					const result = await instance.incubator
						.getReward('user/repository')
						.then(toString)
					const expected = (i + 1).toString() + '000' + DEV_DECIMALS
					expect(result).to.be.equal(expected)
				}
			})
			it('20.', async () => {
				const [instance, , , provider] = await init()
				const wallet = provider.createEmptyWallet()

				await instance.incubator.start(
					wallet.address,
					'user/repository',
					'20' + DEV_DECIMALS,
					'10000' + DEV_DECIMALS,
					'10' + DEV_DECIMALS,
					0
				)
				for (let i = 0; i < 5; i++) {
					await mine(provider, 1)
					const result = await instance.incubator
						.getReward('user/repository')
						.then(toString)
					const expected = ((i + 1) * 2).toString() + '000' + DEV_DECIMALS
					expect(result).to.be.equal(expected)
				}
			})
		})
		it('Returns the rewardLimit amount when the limit is exceeded', async () => {
			const [instance, , , provider] = await init()
			const wallet = provider.createEmptyWallet()

			await instance.incubator.start(
				wallet.address,
				'user/repository',
				'10' + DEV_DECIMALS,
				'10000' + DEV_DECIMALS,
				'10' + DEV_DECIMALS,
				0
			)
			await mine(provider, 9)
			let result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('9000' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10000' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('9000' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('8000' + DEV_DECIMALS)
			await mine(provider, 7)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('1000' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10' + DEV_DECIMALS)
			await mine(provider, 10)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10' + DEV_DECIMALS)
		})
		it('Returns the rewardLowerLimit amount when the rewardLowerLimit is exceeded', async () => {
			const [instance, , , provider] = await init()
			const wallet = provider.createEmptyWallet()

			await instance.incubator.start(
				wallet.address,
				'user/repository',
				'10' + DEV_DECIMALS,
				'10000' + DEV_DECIMALS,
				'10000' + DEV_DECIMALS,
				0
			)
			await mine(provider, 9)
			let result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('9000' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10000' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10000' + DEV_DECIMALS)
			await mine(provider, 1)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10000' + DEV_DECIMALS)
			await mine(provider, 7)
			result = await instance.incubator
				.getReward('user/repository')
				.then(toString)
			expect(result).to.be.equal('10000' + DEV_DECIMALS)
		})
	})
	describe('setter', () => {
		describe('market', () => {
			describe('success', () => {
				it('you can get the value you set.', async () => {
					const [instance, mock] = await init()
					const marketAddress = await instance.incubator.getMarketAddress()
					expect(marketAddress).to.be.equal(mock.market.address)
				})
			})
			describe('fail', () => {
				it('can not set 0 address.', async () => {
					const [instance] = await init()
					await expect(
						instance.incubator.setMarket(constants.AddressZero)
					).to.be.revertedWith('address is 0.')
				})
				it('only owner can set.', async () => {
					const check = async (incubator: Contract): Promise<void> => {
						const wallet = provider.createEmptyWallet()
						await expect(
							incubator.setMarket(wallet.address)
						).to.be.revertedWith('admin only.')
					}

					const [instance, , , provider] = await init()
					for (const incubator of instance.otherThanOwner()) {
						await check(incubator)
					}
				})
			})
		})
		describe('addressConfig', () => {
			describe('success', () => {
				it('you can get the value you set.', async () => {
					const [instance, mock] = await init()
					const addressConfigAddress = await instance.incubator.getAddressConfigAddress()
					expect(addressConfigAddress).to.be.equal(mock.addressConfig.address)
				})
			})
			describe('fail', () => {
				it('can not set 0 address.', async () => {
					const [instance] = await init()
					await expect(
						instance.incubator.setAddressConfig(constants.AddressZero)
					).to.be.revertedWith('address is 0.')
				})
				it('only owner can set.', async () => {
					const check = async (incubator: Contract): Promise<void> => {
						const wallet = provider.createEmptyWallet()
						await expect(
							incubator.setAddressConfig(wallet.address)
						).to.be.revertedWith('admin only.')
					}

					const [instance, , , provider] = await init()
					for (const incubator of instance.otherThanOwner()) {
						await check(incubator)
					}
				})
			})
		})
		describe('callbackKicker', () => {
			describe('success', () => {
				it('you can get the value you set.', async () => {
					const [instance, , wallets] = await init()
					const callbackKickerAddress = await instance.incubator.getCallbackKickerAddress()
					expect(callbackKickerAddress).to.be.equal(
						wallets.callbackKicker.address
					)
				})
			})
			describe('fail', () => {
				it('can not set 0 address.', async () => {
					const [instance] = await init()
					await expect(
						instance.incubator.setCallbackKicker(constants.AddressZero)
					).to.be.revertedWith('address is 0.')
				})
				it('only owner can set.', async () => {
					const check = async (incubator: Contract): Promise<void> => {
						const wallet = provider.createEmptyWallet()
						await expect(
							incubator.setAddressConfig(wallet.address)
						).to.be.revertedWith('admin only.')
					}

					const [instance, , , provider] = await init()
					for (const incubator of instance.otherThanOwner()) {
						await check(incubator)
					}
				})
			})
		})
		describe('setRewardLimitAndLowerLimit', () => {
			describe('success', () => {
				it('update RewardLimit and RewardLowerLimit', async () => {
					const [instance] = await init()
					const resRL = await instance.incubator.getRewardLimit('foo/bar')
					const resRLL = await instance.incubator.getRewardLowerLimit('foo/bar')
					expect(resRL).to.be.equal('0')
					expect(resRLL).to.be.equal('0')
					await instance.incubator.setRewardLimitAndLowerLimit(
						'foo/bar',
						456,
						123
					)
					const nextResRL = await instance.incubator.getRewardLimit('foo/bar')
					const nextResRLL = await instance.incubator.getRewardLowerLimit(
						'foo/bar'
					)
					expect(nextResRL).to.be.equal('456')
					expect(nextResRLL).to.be.equal('123')
				})
			})
			describe('fail', () => {
				it('can not set RewardLimit with 0', async () => {
					const [instance] = await init()
					await expect(
						instance.incubator.setRewardLimitAndLowerLimit('foo/bar', 0, 123)
					).to.be.revertedWith('reward limit is 0.')
				})
				it('can not set RewardLowerLimit less than RewardLimit', async () => {
					const [instance] = await init()
					await expect(
						instance.incubator.setRewardLimitAndLowerLimit('foo/bar', 122, 123)
					).to.be.revertedWith('limit is less than lower limit.')
				})
				it('should fail to call when sent from other then operator and owner', async () => {
					const check = async (incubator: Contract): Promise<void> => {
						await expect(
							incubator.setRewardLimitAndLowerLimit('foo/bar', 456, 123)
						).to.be.revertedWith('operator only.')
					}

					const [instance] = await init()
					for (const incubator of instance.otherThanOperatorAndOwner()) {
						await check(incubator)
					}
				})
			})
		})
	})
})
