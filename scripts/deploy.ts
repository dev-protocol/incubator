/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import {ethers, providers} from 'ethers'
import Provider = providers.Provider

const deployContracts = async (_wallet: ethers.Wallet): Promise<void> => {}

const getDeployer = (
	deployMnemonic?: string,
	infura = '',
	network = ''
): ethers.Wallet => {
	if (!deployMnemonic) {
		throw new Error(
			`Error: No DEPLOY_MNEMONIC env var set. Please add it to .<environment>.env file it and try again. See .env.example for more info.\n`
		)
	}

	// Connect provider
	const provider: Provider = ethers.getDefaultProvider(network, {
		infura,
	})

	return ethers.Wallet.fromMnemonic(deployMnemonic).connect(provider)
}

const deploy = async (): Promise<void> => {
	const mnemonic = process.env.DEPLOY_MNEMONIC
	const infuraId = process.env.DEPLOY_INFURA_ID
	const network = process.env.DEPLOY_NETWORK
	const wallet = getDeployer(mnemonic, infuraId, network)

	console.log(`Deploying to network [${network ?? 'local'}] in 5 seconds!`)
	await deployContracts(wallet)
}

void deploy()
