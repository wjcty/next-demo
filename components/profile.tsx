'use client'
import { useAccount, useBalance, useEnsName } from 'wagmi'
import { formatUnits } from 'viem'
import BalanceComp from './wallet/balance'
import CurrencyListComp from './wallet/currency'
import { MyConnectBtn } from './wallet/myConnectBtn'

export default function Profile() {
    const { address, chain, isConnected } = useAccount()

    const { data } = useBalance({
        address
    })
    const userBalance = data ? Number(formatUnits(data.value, data.decimals)).toFixed(4) : 0.0
    const ens = useEnsName({
        address
    })

    return (
        <div>
            {isConnected && (
                <div className='flex flex-col'>
                    <BalanceComp value={userBalance} />
                    <CurrencyListComp />
                </div>
            )}
            {!isConnected && (
                <div className='relative flex items-center flex-col '>
                    <div className='absolute top-20'>
                        <div className='mb-4'>please connect to your wallet</div>
                        <MyConnectBtn />
                    </div>
                </div>
            )}
        </div>
    )
}
