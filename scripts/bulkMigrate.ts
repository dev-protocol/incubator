/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import bent from 'bent'
import { ethers } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import * as incubator from '../build/Incubator.json'
import * as erc20 from '../build/MockProperty.json'
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
const fetchIncubators = bent('json')(
	'https://dev-for-apps.azureedge.net/incubators'
).then((r) => (r as unknown) as Incubator[])

const PREV_INCUBATOR = '0xB243f335Ec73b9A373Dc6c377bb974e487Bd4B9b'
const NEXT_INCUBATOR = '0x7f1b8c30832ca3ABC6326A58903A3a47ade00019'

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
	const contract = new ethers.Contract(PREV_INCUBATOR, incubator.abi, wallet)
	const nextContract = new ethers.Contract(
		NEXT_INCUBATOR,
		incubator.abi,
		wallet
	)
	const createErc20 = (address: string) =>
		new ethers.Contract(address, erc20.abi, wallet)
	const fetchPrice = ethGasStationFetcher(ETHGASSTATION_TOKEN!)
	const run = async (property: string, repos: string) => {
		const token = createErc20(property)
		const balanceOf = await token.callStatic
			.balanceOf(PREV_INCUBATOR)
			.then((x) => x as ethers.BigNumber)
		const alreadyTransfered = balanceOf.isZero()
		const alreadyChangedAuthor = await token
			.author()
			.then((res: string) => res.toLowerCase() === NEXT_INCUBATOR.toLowerCase())
		if (alreadyTransfered && alreadyChangedAuthor) {
			console.log('already migrated', property, repos)
			return
		}

		const rescueGasLimit = await contract.estimateGas.rescue(
			property,
			NEXT_INCUBATOR,
			balanceOf
		)
		const changeAuthorGasLimit = await contract.estimateGas.changeAuthor(
			property,
			NEXT_INCUBATOR
		)
		const gasPrice = await fetchPrice()
		const logger = (message: string) => {
			console.log(message, {
				property,
				repos,
			})
		}

		logger('run')
		const resue: TransactionResponse = await contract.rescue(
			property,
			NEXT_INCUBATOR,
			balanceOf,
			{
				gasPrice,
				gasLimit: rescueGasLimit,
			}
		)
		const changeAuthor: TransactionResponse = await contract.changeAuthor(
			property,
			NEXT_INCUBATOR,
			{
				gasPrice,
				gasLimit: changeAuthorGasLimit,
			}
		)
		logger('sent')
		await Promise.all([resue.wait(), changeAuthor.wait()])
		logger('done')
	}

	console.log('set authority')
	if ((await nextContract.isAdmin(wallet.address)) === false) {
		await nextContract.addAdmin(wallet.address)
	}

	if ((await nextContract.isStorageOwner(wallet.address)) === false) {
		await nextContract.addStorageOwner(wallet.address)
	}

	if ((await nextContract.isOperator(wallet.address)) === false) {
		await nextContract.addOperator(wallet.address)
	}

	const incubators = await fetchIncubators
	console.log({ incubators })

	const queue = new PQueue({ concurrency: 1 })
	await queue.addAll(
		incubators.map(({ property, verifier_id }) => async () =>
			run(property.address, verifier_id)
		)
	)
	console.log('change storage')
	const storageAddress = await contract.getStorageAddress()
	console.log(`storage address:${storageAddress}`)
	await nextContract.setStorage(storageAddress)
	await contract.changeOwner(nextContract.address)
	console.log('finish')
}

void deploy()
