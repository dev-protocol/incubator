/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ethers } from 'ethers'
import * as gitHubMarketIncubator from './../build/GitHubMarketIncubator.json'
import { ethgas } from './lib/ethgas'
require('dotenv').config()

const deploy = async (): Promise<void> => {
	const { NETWORK, INFURA_ID, MNEMONIC, ETHGASSTATION_TOKEN } = process.env
	console.log(`network:${NETWORK}`)
	console.log(`infura id:${INFURA_ID}`)
	console.log(`mnemonic:${MNEMONIC}`)
	console.log(`ethgasstation token:${ETHGASSTATION_TOKEN}`)
	const provider = ethers.getDefaultProvider(NETWORK, {
		infura: INFURA_ID,
	})
	const wallet = ethers.Wallet.fromMnemonic(MNEMONIC!).connect(provider)
	const factory = new ethers.ContractFactory(
		gitHubMarketIncubator.abi,
		gitHubMarketIncubator.bytecode,
		wallet
	)
	const gasPrice = ethgas(ETHGASSTATION_TOKEN!)
	const contract = await factory.deploy({
		gasLimit: 6721975,
		gasPrice: await gasPrice('fastest'),
	})
	await contract.deployed()
	console.log(contract.address)
}

void deploy()
