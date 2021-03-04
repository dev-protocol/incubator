/* eslint-disable capitalized-comments */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import bent from 'bent'
import { ethers } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import * as incubator from '../build/Incubator.json'
import { ethGasStationFetcher } from '@devprotocol/util-ts'
import PQueue from 'p-queue'
require('dotenv').config()

interface Property {
	id: string
	address: string
	name: string
}
interface Incubator {
	id: number
	name: string
	verifier_id: string
	property: Property
}
const STAKES = '30000000000000000000000'
const LIMIT = '3750000000000000000000'
const fetchIncubators = bent('json')(
	'https://dev-for-apps.azureedge.net/incubators'
).then((r) => (r as unknown) as Incubator[])

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
	const contract = new ethers.Contract(
		'0xb243f335ec73b9a373dc6c377bb974e487bd4b9b',
		incubator.abi,
		wallet
	)
	const fetchPrice = ethGasStationFetcher(ETHGASSTATION_TOKEN!)
	const run = async (property: string, repos: string) => {
		const zero = await contract.callStatic
			.getReword(repos)
			.then((x) => (x as ethers.BigNumber).isZero())
		if (!zero) {
			console.log('already started', property, repos)
			return
		}

		const gasLimit = await contract.estimateGas.start(
			property,
			repos,
			STAKES,
			LIMIT,
			LIMIT
		)
		const gasPrice = await fetchPrice()
		const overrides = {
			gasLimit,
			gasPrice,
		}
		const logger = (message: string) => {
			console.log(message, {
				property,
				repos,
				overrides: { ...overrides, gasLimit: overrides.gasLimit.toNumber() },
			})
		}

		logger('run')
		const tx: TransactionResponse = await contract.start(
			property,
			repos,
			STAKES,
			LIMIT,
			LIMIT,
			overrides
		)
		logger('sent')
		await tx.wait()
		logger('done')
	}

	const incubators = await fetchIncubators
	console.log({ incubators })

	const queue = new PQueue({ concurrency: 1 })
	await queue.addAll(
		incubators.map(({ property, verifier_id }) => async () =>
			run(property.address, verifier_id)
		)
	)
	console.log('finish')
}

void deploy()
