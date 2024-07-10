import { Wallet, getWalletConnectConnector } from '@rainbow-me/rainbowkit'
export interface MyWalletOptions {
    projectId: string
}

const ASSET_CDN = 'https://assets.pancakeswap.finance'
export const BinanceWeb3Wallet = ({ projectId }: MyWalletOptions): Wallet => ({
    id: 'BinanceW3W',
    name: 'Binance Web3 Wallet',
    iconUrl: `${ASSET_CDN}/web/wallets/binance-w3w.png`,
    iconBackground: '#0c2f78',
    // downloadUrls: {
    //     android: 'https://play.google.com/store/apps/details?id=my.wallet',
    //     ios: 'https://apps.apple.com/us/app/my-wallet',
    //     chrome: 'https://chrome.google.com/webstore/detail/my-wallet',
    //     qrCode: 'https://my-wallet/qr'
    // },
    mobile: {
        getUri: (uri: string) => uri
    },
    qrCode: {
        getUri: (uri: string) => uri
        // instructions: {
        //     learnMoreUrl: 'https://my-wallet/learn-more',
        //     steps: [
        //         {
        //             description:
        //                 'We recommend putting My Wallet on your home screen for faster access to your wallet.',
        //             step: 'install',
        //             title: 'Open the My Wallet app'
        //         },
        //         {
        //             description:
        //                 'After you scan, a connection prompt will appear for you to connect your wallet.',
        //             step: 'scan',
        //             title: 'Tap the scan button'
        //         }
        //     ]
        // }
    },
    createConnector: getWalletConnectConnector({ projectId })
})
