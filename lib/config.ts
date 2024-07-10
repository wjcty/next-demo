import { http, createStorage, cookieStorage, createConfig } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, base, bsc, opBNB, bscTestnet } from 'wagmi/chains'
import { Chain } from '@rainbow-me/rainbowkit'
import { connectors } from './connectorConfig'

const supportedChains: Chain[] = [bsc, bscTestnet]

export const config = createConfig({
    chains: supportedChains as any,
    ssr: true,
    storage: createStorage({
        storage: cookieStorage
    }),
    connectors,
    transports: supportedChains.reduce((obj, chain) => ({ ...obj, [chain.id]: http() }), {})
})
