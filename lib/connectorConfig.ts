'use client'
import { BinanceWeb3Wallet } from '@/components/wallet/binanceWeb3Wallet'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
    walletConnectWallet,
    metaMaskWallet,
    trustWallet,
    rainbowWallet
} from '@rainbow-me/rainbowkit/wallets'
// walletConnect projectId
const projectId = '67a618d6039e12f4b3b6bfc589dad31b'
export const connectors = connectorsForWallets(
    [
        {
            groupName: 'Installed',
            wallets: [
                metaMaskWallet,
                trustWallet,
                walletConnectWallet,
                rainbowWallet,
                BinanceWeb3Wallet
            ]
        }
    ],
    {
        appName: 'My RainbowKit App',
        projectId
    }
)
