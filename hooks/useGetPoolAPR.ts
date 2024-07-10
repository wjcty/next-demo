import { Token, Fetcher } from '@pancakeswap/sdk'
import axios from 'axios'

const usdt_mainnet_address = '0x55d398326f99059fF775485246999027B3197955'
const usdt_testnet_address = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'

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
        const res = await Fetcher.fetchPairData(
            new Token(chainId, tokenOneAddress, 18, tokenOneSymbol),
            new Token(chainId, usdt_address, 18, 'USDT')
        )

        tokenOneprice1 = Number(res.token1Price.numerator) / Number(res.token1Price.denominator)

        const res2 = await Fetcher.fetchPairData(
            new Token(chainId, tokenTwoAddress, 18, tokenTwoSymbol),
            new Token(chainId, usdt_address, 18, 'USDT')
        )

        tokenTwoprice1 = Number(res2.token1Price.numerator) / Number(res2.token1Price.denominator)
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
        const res = await Fetcher.fetchPairData(
            new Token(chainId, tokenAddress, 18, tokenSymbol),
            new Token(chainId, usdt_address, 18, 'USDT')
        )

        tokenPrice1 = Number(res.token1Price.numerator) / Number(res.token1Price.denominator)

        return {
            tokenPrice1
        }
    } catch (error) {}
}

// token 转 u
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
export async function getTokenPriceInUSD(addressOne: string, addressTwo: string) {
    try {
        const response1 = await axios.get(
            `${COINGECKO_API_URL}/simple/token_price/binance-smart-chain?contract_addresses=${addressOne}&vs_currencies=usd`
        )

        const onePriceInUSD = response1.data[addressOne.toLowerCase()].usd

        const response2 = await axios.get(
            `${COINGECKO_API_URL}/simple/token_price/binance-smart-chain?contract_addresses=${addressTwo}&vs_currencies=usd`
        )

        const twoPriceInUSD = response2.data[addressTwo.toLowerCase()].usd

        return {
            onePriceInUSD,
            twoPriceInUSD
        }
    } catch (error) {
        console.error('Error fetching token price:', error.message)
        return undefined
    }
}
