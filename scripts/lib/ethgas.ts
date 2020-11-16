import bent from 'bent'
import { utils } from 'ethers'

type EGSResponse = {
	readonly fast: number
	readonly fastest: number
	readonly safeLow: number
	readonly average: number
}

export const ethgas = (
	token: string
): ((
	speed: keyof EGSResponse
) => Promise<ReturnType<typeof utils.parseUnits>>) => {
	const fetcher = bent(
		`https://ethgasstation.info/api/ethgasAPI.json?api-key=${token}`,
		'json'
	)
	// eslint-disable-next-line @typescript-eslint/promise-function-async
	return (
		speed: keyof EGSResponse
	): Promise<ReturnType<typeof utils.parseUnits>> =>
		fetcher('').then((res: unknown) =>
			utils.parseUnits(`${(res as EGSResponse)[speed] / 10}`, 'gwei')
		)
}
