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

class Wallets {
	private readonly _provider: MockProvider
	private _deployer!: Wallet
	private _operator!: Wallet
	private _user!: Wallet

	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	constructor(provider: MockProvider) {
		this._provider = provider
	}

	public async generate(): Promise<void> {
		// Const provider = new MockProvider()
		const wallets = this._provider.getWallets()
		this._deployer = wallets[0]
		this._operator = wallets[1]
		this._user = wallets[2]
	}

	public get deployer(): Wallet {
		return this._deployer
	}

	public get operator(): Wallet {
		return this._operator
	}

	public get user(): Wallet {
		return this._user
	}

	public get provider(): MockProvider {
		return this._provider
	}
}

class IncubatorInstance {
	static get DEFAULT_MAX_PROCEED_BLOCK() {
		return 518400
	}

	static get DEFAULT_STAKE_TOKEN_VALUE() {
		return 10000
	}

	private readonly _wallets: Wallets
	private _incubator!: Contract
	private _incubatorOperator!: Contract
	private _incubatorUser!: Contract
	private _marketAddress!: string
	private _addressConfigAddress!: string

	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	constructor(wallets: Wallets) {
		this._wallets = wallets
	}

	public get incubator(): Contract {
		return this._incubator
	}

	public get incubatorOperator(): Contract {
		return this._incubatorOperator
	}

	public get incubatorUser(): Contract {
		return this._incubatorUser
	}

	public get wallets(): Wallets {
		return this._wallets
	}

	public get provider(): MockProvider {
		return this._wallets.provider
	}

	public get marketAddress(): string {
		return this._marketAddress
	}

	public get addressConfigAddress(): string {
		return this._addressConfigAddress
	}

	public async generate(): Promise<void> {
		const dev = await deployContract(this._wallets.deployer, MockDev)
		const lockup = await deployContract(this._wallets.deployer, MockLockup)
		const marketBehavior = await deployContract(
			this._wallets.deployer,
			MockMarketBehavior
		)
		const market = await deployContract(this._wallets.deployer, MockMarket, [
			marketBehavior.address,
		])
		this._marketAddress = market.address
		const addressConfig = await deployContract(
			this._wallets.deployer,
			MockAddressConfig,

			[dev.address, lockup.address]
		)
		this._addressConfigAddress = addressConfig.address
		this._incubator = await deployContract(
			this._wallets.deployer,
			GitHubMarketIncubator,
			[],
			{
				gasLimit: 5000000,
			}
		)
		await this._incubator.createStorage()
		await this._incubator.setMarket(market.address)
		await this._incubator.setOperator(this._wallets.operator.address)
		await this._incubator.setAddressConfig(addressConfig.address)
		await this._incubator.setMaxProceedBlock(
			IncubatorInstance.DEFAULT_MAX_PROCEED_BLOCK
		)
		await this._incubator.setStakeToken(
			IncubatorInstance.DEFAULT_STAKE_TOKEN_VALUE
		)
		this._incubatorOperator = this._incubator.connect(this._wallets.operator)
		this._incubatorUser = this._incubator.connect(this._wallets.user)
	}
}

describe('GitHubMarketIncubator', () => {
	const init = async (): Promise<IncubatorInstance> => {
		const provider = new MockProvider()
		const wallets = new Wallets(provider)
		await wallets.generate()
		const instance = new IncubatorInstance(wallets)
		await instance.generate()
		return instance
	}

	describe('start', () => {
		describe('success', () => {
			it('A property address and block number associated with the repository is stored in the storage.', async () => {
				const instance = await init()
				const property = instance.provider.createEmptyWallet()
				await instance.incubatorOperator.start(
					property.address,
					'hogehoge/rep',
					{
						gasLimit: 1000000,
					}
				)
				expect(
					await instance.incubator.getPropertyAddress('hogehoge/rep')
				).to.be.equal(property.address)
				const blockNumber = await instance.provider.getBlockNumber()
				expect(
					(
						await instance.incubator.getStartBlockNumber('hogehoge/rep')
					).toNumber()
				).to.be.equal(blockNumber)
			})
		})
		describe('fail', () => {
			it('only operators can execute.', async () => {
				const instance = await init()
				const property = instance.provider.createEmptyWallet()
				const tmp = instance.incubator.start(property.address, 'hogehoge/rep', {
					gasLimit: 1000000,
				})
				await expect(tmp).to.be.revertedWith('sender is not operator.')
			})
		})
	})
	describe('clearAccountAddress', () => {
		describe('success', () => {
			it('Stored account addresses can be deleted.', async () => {
				const instance = await init()
				const property = instance.provider.createEmptyWallet()
				await instance.incubatorOperator.start(
					property.address,
					'hogehoge/rep',
					{
						gasLimit: 1000000,
					}
				)
				await instance.incubatorUser.authenticate(
					'hogehoge/rep',
					'dummy-public-signature',
					{
						gasLimit: 1000000,
					}
				)
				let accountAddress = await instance.incubator.getAccountAddress(
					property.address
				)
				expect(accountAddress).to.be.equal(instance.wallets.user.address)
				await instance.incubatorOperator.clearAccountAddress(property.address)
				accountAddress = await instance.incubator.getAccountAddress(
					property.address
				)
				expect(accountAddress).to.be.equal(constants.AddressZero)
			})
		})
		describe('fail', () => {
			it('only operators can execute.', async () => {
				const instance = await init()
				const property = instance.provider.createEmptyWallet()
				const tmp = instance.incubator.clearAccountAddress(
					property.address,
					'hogehoge/rep',
					{
						gasLimit: 1000000,
					}
				)
				await expect(tmp).to.be.revertedWith('sender is not operator.')
			})
		})
	})
	describe('setter', () => {
		describe('market', () => {
			it('you can get the value you set.', async () => {
				const instance = await init()
				const marketAddress = await instance.incubator.getMarketAddress()
				expect(marketAddress).to.be.equal(instance.marketAddress)
			})
			it('only owner can set.', async () => {
				const instance = await init()
				const wallet = instance.provider.createEmptyWallet()
				await expect(
					instance.incubatorUser.setMarket(wallet.address)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
		describe('operator', () => {
			it('you can get the value you set.', async () => {
				const instance = await init()
				const operatorAddress = await instance.incubator.getOperatorAddress()
				expect(operatorAddress).to.be.equal(instance.wallets.operator.address)
			})
			it('only owner can set.', async () => {
				const instance = await init()
				const wallet = instance.provider.createEmptyWallet()
				await expect(
					instance.incubatorUser.setOperator(wallet.address)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
		describe('addressConfig', () => {
			it('you can get the value you set.', async () => {
				const instance = await init()
				const operatorAddress = await instance.incubator.getAddressConfigAddress()
				expect(operatorAddress).to.be.equal(instance.addressConfigAddress)
			})
			it('only owner can set.', async () => {
				const instance = await init()
				const wallet = instance.provider.createEmptyWallet()
				await expect(
					instance.incubatorUser.setAddressConfig(wallet.address)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
		describe('maxProceedBlock', () => {
			it('you can get the value you set.', async () => {
				const instance = await init()
				const maxProceedBlock = await instance.incubator.getMaxProceedBlockNumber()
				expect(maxProceedBlock.toNumber()).to.be.equal(
					IncubatorInstance.DEFAULT_MAX_PROCEED_BLOCK
				)
			})
			it('only owner can set.', async () => {
				const instance = await init()
				await expect(
					instance.incubatorUser.setMaxProceedBlock(10)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
		describe('stakeToken', () => {
			it('you can get the value you set.', async () => {
				const instance = await init()
				const maxProceedBlock = await instance.incubator.getStakeTokenValue()
				expect(maxProceedBlock.toNumber()).to.be.equal(
					IncubatorInstance.DEFAULT_STAKE_TOKEN_VALUE
				)
			})
			it('only owner can set.', async () => {
				const instance = await init()
				await expect(
					instance.incubatorUser.setStakeToken(100)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
})
