/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
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
				await check(instance.incubatorStorageOwner)
				await check(instance.incubatorOperator)
				await check(instance.incubatorUser)
			})
		})
	})

	describe('start', () => {
		describe('success', () => {
			it('Parameters are stored in storage.', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					const repository = 'hogehoge/rep'
					const stakingValue = '10000' + DEV_DECIMALS
					const limitValue = '1000' + DEV_DECIMALS
					await incubator.start(
						property.address,
						repository,
						stakingValue,
						limitValue,
						{
							gasLimit: 1000000,
						}
					)
					expect(await incubator.getPropertyAddress(repository)).to.be.equal(
						property.address
					)
					const [
						,
						,
						lastPrice,
					] = await mock.lockup.calculateCumulativeRewardPrices()
					expect(await incubator.getStartPrice(repository)).to.be.equal(
						lastPrice.toNumber()
					)
					const staking = await incubator.getStaking(repository)
					expect(staking.toString()).to.be.equal(stakingValue.toString())
					const limit = await incubator.getRewardLimit(repository)
					expect(limit.toString()).to.be.equal(limitValue.toString())
				}

				const [instance, mock, , provider] = await init()
				await check(instance.incubator)
				await check(instance.incubatorOperator)
			})
		})
		describe('fail', () => {
			it('only administrators and operators can do this.', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					const tmp = incubator.start(
						property.address,
						'hogehoge/rep',
						10000,
						1000,
						{
							gasLimit: 1000000,
						}
					)
					await expect(tmp).to.be.revertedWith('operator only.')
				}

				const [instance, , , provider] = await init()
				await check(instance.incubatorUser)
				await check(instance.incubatorStorageOwner)
			})
		})
	})

	describe('authenticate', () => {
		describe('success', () => {
			it('the approval process is executed.', async () => {
				const [instance, mock, wallets, provider] = await init()
				const property = provider.createEmptyWallet()
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				await instance.incubator.start(
					property.address,
					repository,
					stakingValue,
					limitValue,
					{
						gasLimit: 1000000,
					}
				)
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
			})
			it('Theres nothing wrong with running it multiple times.', async () => {
				const [instance, , , provider] = await init()
				const property = provider.createEmptyWallet()
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				await instance.incubator.start(
					property.address,
					repository,
					stakingValue,
					limitValue,
					{
						gasLimit: 1000000,
					}
				)
				await instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
					gasLimit: 1000000,
				})
				await instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
					gasLimit: 1000000,
				})
			})
		})
		describe('fail', () => {
			it('If the start function is not executed, an error occurs.', async () => {
				const [instance] = await init()
				await expect(
					instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
						gasLimit: 1000000,
					})
				).to.be.revertedWith('illegal user.')
			})
			it('An error occurs when a different user executes it than the first time.', async () => {
				const [instance, , , provider] = await init()
				const property = provider.createEmptyWallet()
				const repository = 'hogehoge/rep'
				const stakingValue = '10' + DEV_DECIMALS
				const limitValue = '10000' + DEV_DECIMALS
				await instance.incubator.start(
					property.address,
					repository,
					stakingValue,
					limitValue,
					{
						gasLimit: 1000000,
					}
				)
				await instance.incubator.authenticate('hogehoge/rep', 'dummy-public', {
					gasLimit: 1000000,
				})

				await expect(
					instance.incubatorUser.authenticate('hogehoge/rep', 'dummy-public', {
						gasLimit: 1000000,
					})
				).to.be.revertedWith('authentication processed.')
			})
		})
	})

	describe('clearAccountAddress', () => {
		describe('success', () => {
			it('Stored account addresses can be deleted.', async () => {
				const check = async (
					incubator: Contract,
					incubatorUser: Contract
				): Promise<void> => {
					const property = provider.createEmptyWallet()
					await incubator.start(property.address, 'hogehoge/rep', 10000, 1000, {
						gasLimit: 1000000,
					})
					await incubatorUser.authenticate(
						'hogehoge/rep',
						'dummy-public-signature',
						{
							gasLimit: 1000000,
						}
					)
					let accountAddress = await incubator.getAccountAddress(
						property.address
					)
					expect(accountAddress).to.be.equal(wallets.user.address)
					await incubator.clearAccountAddress(property.address)
					accountAddress = await incubator.getAccountAddress(property.address)
					expect(accountAddress).to.be.equal(constants.AddressZero)
				}

				const [instance, , wallets, provider] = await init()
				await check(instance.incubator, instance.incubatorUser)
				await check(instance.incubatorOperator, instance.incubatorUser)
			})
		})
		describe('fail', () => {
			it('only administrators and operators can do this.', async () => {
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
				await check(instance.incubatorStorageOwner)
				await check(instance.incubatorUser)
			})
		})
	})

	describe('clearAccountAddress', () => {
		describe('success', () => {
			it('Stored account addresses can be deleted.', async () => {
				const check = async (
					incubator: Contract,
					incubatorUser: Contract
				): Promise<void> => {
					const property = provider.createEmptyWallet()
					await incubator.start(property.address, 'hogehoge/rep', 10000, 1000, {
						gasLimit: 1000000,
					})
					await incubatorUser.authenticate(
						'hogehoge/rep',
						'dummy-public-signature',
						{
							gasLimit: 1000000,
						}
					)
					let accountAddress = await incubator.getAccountAddress(
						property.address
					)
					expect(accountAddress).to.be.equal(wallets.user.address)
					await incubator.clearAccountAddress(property.address)
					accountAddress = await incubator.getAccountAddress(property.address)
					expect(accountAddress).to.be.equal(constants.AddressZero)
				}

				const [instance, , wallets, provider] = await init()
				await check(instance.incubator, instance.incubatorUser)
				await check(instance.incubatorOperator, instance.incubatorUser)
			})
		})
		describe('fail', () => {
			it('only administrators and operators can do this.', async () => {
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
				await check(instance.incubatorStorageOwner)
				await check(instance.incubatorUser)
			})
		})
	})
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
			it('only the administrator can execute the function..', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const property = provider.createEmptyWallet()
					const balance = await mock.dev.balanceOf(incubator.address)
					expect(balance.toNumber()).to.be.equal(10000)
					await expect(
						incubator.rescue(property.address, 10000)
					).to.be.revertedWith('admin only.')
				}

				const [instance, mock, , provider] = await init()
				await mock.dev.transfer(instance.incubator.address, 10000)
				await check(instance.incubatorOperator)
				await check(instance.incubatorStorageOwner)
				await check(instance.incubatorUser)
			})
		})
	})
	describe('getReword', () => {
		it('if the repository is not registered, it returns 0.', async () => {
			const [instance] = await init()
			const reword = await instance.incubator.getReword('hogehoge/hugahuga')
			expect(reword.toNumber()).to.be.equal(0)
		})
		describe('It returns a value proportional to the difference between the initial value and the staking.', () => {
			it('10.', async () => {
				const [instance, , , provider] = await init()
				const wallet = provider.createEmptyWallet()

				await instance.incubator.start(
					wallet.address,
					'user/repository',
					'10' + DEV_DECIMALS,
					'10000' + DEV_DECIMALS
				)
				for (let i = 0; i < 5; i++) {
					await provider.send('evm_mine', [])
					const result = await instance.incubator.getReword('user/repository')
					expect(result.toString()).to.be.equal(
						(i + 1).toString() + '000' + DEV_DECIMALS
					)
				}
			})
			it('20.', async () => {
				const [instance, , , provider] = await init()
				const wallet = provider.createEmptyWallet()

				await instance.incubator.start(
					wallet.address,
					'user/repository',
					'20' + DEV_DECIMALS,
					'10000' + DEV_DECIMALS
				)
				for (let i = 0; i < 5; i++) {
					await provider.send('evm_mine', [])
					const result = await instance.incubator.getReword('user/repository')
					expect(result.toString()).to.be.equal(
						((i + 1) * 2).toString() + '000' + DEV_DECIMALS
					)
				}
			})
		})
		it('if the limit is exceeded, the value of the limit is returned.', async () => {
			const [instance, , , provider] = await init()
			const wallet = provider.createEmptyWallet()

			await instance.incubator.start(
				wallet.address,
				'user/repository',
				'10' + DEV_DECIMALS,
				'10000' + DEV_DECIMALS
			)
			for (let i = 0; i < 9; i++) {
				await provider.send('evm_mine', [])
			}

			let result = await instance.incubator.getReword('user/repository')
			expect(result.toString()).to.be.equal('9000' + DEV_DECIMALS)
			await provider.send('evm_mine', [])
			result = await instance.incubator.getReword('user/repository')
			expect(result.toString()).to.be.equal('10000' + DEV_DECIMALS)
			await provider.send('evm_mine', [])
			result = await instance.incubator.getReword('user/repository')
			expect(result.toString()).to.be.equal('10000' + DEV_DECIMALS)
			await provider.send('evm_mine', [])
			result = await instance.incubator.getReword('user/repository')
			expect(result.toString()).to.be.equal('10000' + DEV_DECIMALS)
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
				const check = async (incubator: Contract): Promise<void> => {
					const wallet = provider.createEmptyWallet()
					await expect(incubator.setMarket(wallet.address)).to.be.revertedWith(
						'admin only.'
					)
				}

				const [instance, , , provider] = await init()
				await check(instance.incubatorOperator)
				await check(instance.incubatorStorageOwner)
				await check(instance.incubatorUser)
			})
		})
		describe('addressConfig', () => {
			it('you can get the value you set.', async () => {
				const [instance, mock] = await init()
				const operatorAddress = await instance.incubator.getAddressConfigAddress()
				expect(operatorAddress).to.be.equal(mock.addressConfig.address)
			})
			it('only owner can set.', async () => {
				const check = async (incubator: Contract): Promise<void> => {
					const wallet = provider.createEmptyWallet()
					await expect(
						incubator.setAddressConfig(wallet.address)
					).to.be.revertedWith('admin only.')
				}

				const [instance, , , provider] = await init()
				await check(instance.incubatorOperator)
				await check(instance.incubatorStorageOwner)
				await check(instance.incubatorUser)
			})
		})
	})
})
