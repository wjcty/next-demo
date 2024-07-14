import { Token, Fetcher } from '@pancakeswap/sdk'
import axios from 'axios'

const usdt_mainnet_address = '0x55d398326f99059fF775485246999027B3197955'
const usdt_testnet_address = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'

const wbnb_address = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'

type ChainId = number
type TokenOneAddress = `0x${string}`
type TokenOneSymbol = string
type TokenTwoAddress = `0x${string}`
type TokenTwoSymbolL = string

export async function fetchPairPriceInUSDT(
    chainId: ChainId,
    tokenOneAddress: TokenOneAddress,
    tokenOneSymbol: TokenOneSymbol,
    tokenTwoAddress: TokenTwoAddress,
    tokenTwoSymbol: TokenTwoSymbolL
) {
    let tokenOneprice1, tokenTwoprice1

    const usdt_address = chainId === 56 ? usdt_mainnet_address : usdt_testnet_address
    try {
        // const pair1 = await Fetcher.fetchPairData(token, wbnbToken);
        //     const pair2 = await Fetcher.fetchPairData(wbnbToken, usdtToken);

        //     const tokenPriceInWBNB = Number(pair1.token1Price.toSignificant(6));
        //     const wbnbPriceInUSDT = Number(pair2.token1Price.toSignificant(6));
        //     const tokenPriceInUSDT = tokenPriceInWBNB * wbnbPriceInUSDT;

        const onePair1 = await Fetcher.fetchPairData(
            new Token(chainId, tokenOneAddress, 18, tokenOneSymbol),
            new Token(chainId, wbnb_address, 18, 'WBNB')
        )

        const onePair2 = await Fetcher.fetchPairData(
            new Token(chainId, tokenTwoAddress, 18, tokenTwoSymbol),
            new Token(chainId, wbnb_address, 18, 'WBNB')
        )
        const onePair3 = await Fetcher.fetchPairData(
            new Token(chainId, wbnb_address, 18, 'WBNB'),
            new Token(chainId, usdt_address, 18, 'USDT')
        )

        const wbnbPerUsdt = Number(onePair3.token1Price.toSignificant())

        tokenOneprice1 = Number(onePair1.token1Price.toSignificant()) * wbnbPerUsdt

        tokenTwoprice1 = Number(onePair2.token1Price.toSignificant()) * wbnbPerUsdt
        return {
            tokenOneprice1,
            tokenTwoprice1
        }
    } catch (error) {}
}

// token 转为 usdt
export async function fetchTokenPriceInUSDT(
    chainId: ChainId,
    tokenAddress: TokenOneAddress,
    tokenSymbol: TokenOneSymbol
) {
    let tokenPrice1
    const usdt_address = chainId === 56 ? usdt_mainnet_address : usdt_testnet_address

    try {
        const onePair1 = await Fetcher.fetchPairData(
            new Token(chainId, tokenAddress, 18, tokenSymbol),
            new Token(chainId, wbnb_address, 18, 'WBNB')
        )
        const onePair3 = await Fetcher.fetchPairData(
            new Token(chainId, wbnb_address, 18, 'WBNB'),
            new Token(chainId, usdt_address, 18, 'USDT')
        )

        const wbnbPerUsdt = Number(onePair3.token1Price.toSignificant())

        tokenPrice1 = Number(onePair1.token1Price.toSignificant()) * wbnbPerUsdt
        return {
            tokenPrice1
        }
    } catch (error) {}
}

// 数组内的 token  转 u
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
export async function getTokenArrPricesInUSD(addresses: string[]) {
    try {
        const params = addresses
            .map((address) => `contract_addresses=${address.toLowerCase()}`)
            .join('&')
        const response = await axios.get(
            `${COINGECKO_API_URL}/simple/token_price/binance-smart-chain?${params}&vs_currencies=usd`
        )

        const prices: Record<string, number> = {}
        addresses.forEach((address) => {
            if (response.data[address.toLowerCase()]) {
                prices[address] = response.data[address.toLowerCase()].usd
            }
        })

        return prices
    } catch (error: any) {
        console.error('Error fetching token prices:', error.message)
        return {}
    }
}

// 单个 token pair 转 u
export async function getTokenPriceInUSD(addressOne: string, addressTwo: string) {
    try {
        const response1 = await axios.get(
            `${COINGECKO_API_URL}/simple/token_price/binance-smart-chain?contract_addresses=${addressOne}&vs_currencies=usd`
        )

        const onePriceInUSD = response1.data[addressOne.toLowerCase()].usd

        let twoPriceInUSD
        if (addressTwo) {
            const response2 = await axios.get(
                `${COINGECKO_API_URL}/simple/token_price/binance-smart-chain?contract_addresses=${addressTwo}&vs_currencies=usd`
            )

            twoPriceInUSD = response2.data[addressTwo.toLowerCase()].usd
        }

        return {
            onePriceInUSD,
            twoPriceInUSD
        }
    } catch (error: any) {
        console.error('Error fetching token price:', error.message)
        return undefined
    }
}
