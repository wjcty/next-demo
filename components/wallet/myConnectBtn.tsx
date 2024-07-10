'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
export const MyConnectBtn = () => {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted
            }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading'
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus || authenticationStatus === 'authenticated')
                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        style={{
                                            background:
                                                'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                                        }}
                                        className='w-full px-4 py-2 rounded-xl text-white'
                                        onClick={openConnectModal}
                                        type='button'
                                    >
                                        Connect Wallet
                                    </button>
                                )
                            }
                            if (chain.unsupported) {
                                return (
                                    <button
                                        style={{
                                            background:
                                                'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                                        }}
                                        className='w-full px-4 py-2 rounded-xl text-white'
                                        onClick={openChainModal}
                                        type='button'
                                    >
                                        Wrong network
                                    </button>
                                )
                            }
                            return (
                                <div
                                    style={{ display: 'flex', gap: 12 }}
                                    className='bg-[#1F1F1F] rounded-xl py-1 px-4 text-[#F15223]'
                                >
                                    <button
                                        onClick={openChainModal}
                                        style={{ display: 'flex', alignItems: 'center' }}
                                        type='button'
                                    >
                                        {chain.hasIcon && (
                                            <div
                                                style={{
                                                    background: chain.iconBackground,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 999,
                                                    overflow: 'hidden',
                                                    marginRight: 4
                                                }}
                                            >
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={chain.name ?? 'Chain icon'}
                                                        src={chain.iconUrl}
                                                        style={{ width: 12, height: 12 }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {chain.name}
                                    </button>
                                    <button onClick={openAccountModal} type='button'>
                                        {account.displayName}
                                        {account.displayBalance
                                            ? ` (${account.displayBalance})`
                                            : ''}
                                    </button>
                                </div>
                            )
                        })()}
                    </div>
                )
            }}
        </ConnectButton.Custom>
    )
}
