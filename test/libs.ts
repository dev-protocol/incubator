/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import { providers } from 'ethers'

export async function mine(
	provider: providers.Web3Provider,
	count: number
): Promise<void> {
	for (let i = 0; i < count; i++) {
		// eslint-disable-next-line no-await-in-loop
		await provider.send('evm_mine', [])
	}
}
