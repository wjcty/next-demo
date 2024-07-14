'use client'
import { Button, Image, Modal, TextInput } from '@mantine/core'
import React, { useEffect, useMemo, useState } from 'react'
import tokenList from '@/constants/tokenList.json'
import bnbTestToken from '@/constants/bnbTestToken.json'
import { useAccount, useBalance, BaseError } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import style from './uniswap.module.css'
import { useDisclosure } from '@mantine/hooks'
import cakeV2RouterAbi from '@/constants/cakev2RouterAbi.json'
import cakev2FactoryAbi from '@/constants/cakev2FactoryAbi.json'
import pairAbi from '@/constants/pairAbi.json'
import bep20Abi from '@/constants/bep20Abi.json'
import { formatEther, parseEther, zeroAddress } from 'viem'
import { MyConnectBtn } from '@/components/wallet/myConnectBtn'
import { useLiquidityStore } from '@/store/liquidity'
import { readContract } from '@wagmi/core'
import { config } from '@/lib/config'
import MyModal from '@/components/myModal/page'
import { IconXboxX } from '@tabler/icons-react'

type HexAddress = `0x${string}`
type Token = {
    address: HexAddress
    ticker: string
    img: string
    name: string
    decimals: string
}

export default function Swap() {
    const { address, isConnected, chainId } = useAccount()

    const [PANCAKE_SWAP_V2_ROUTER_ADDRESS, setPANCAKE_SWAP_V2_ROUTER_ADDRESS] =
        useState<HexAddress>('0x')
    const [PANCAKE_SWAP_V2_FACTORY_ADDRESS, setPANCAKE_SWAP_V2_FACTORY_ADDRESS] =
        useState<HexAddress>('0x')
    useEffect(() => {
        setPANCAKE_SWAP_V2_ROUTER_ADDRESS(
            chainId === 56
                ? '0x10ED43C718714eb63d5aA57B78B54704E256024E'
                : '0x9ac64cc6e4415144c455bd8e4837fea55603e5c3'
            //   '0xB6BA90af76D139AB3170c7df0139636dB6120F7e'
        )
        setPANCAKE_SWAP_V2_FACTORY_ADDRESS(
            chainId === 56
                ? '0xca143ce32fe78f1f7019d7d551a6402fc5350c73'
                : '0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc'
            //   '0x6725F303b657a9451d8BA641348b6761A6CC7a17'
        )
    }, [chainId])

    const { liquidity } = useLiquidityStore()
    const [opened, { open, close }] = useDisclosure(false)
    const [tokenOneAmount, setTokenOneAmount] = useState('')
    const [tokenTwoAmount, setTokenTwoAmount] = useState('')
    const [tokenOne, setTokenOne] = useState(chainId === 56 ? tokenList[0] : bnbTestToken[0])
    const [tokenTwo, setTokenTwo] = useState(chainId === 56 ? tokenList[1] : bnbTestToken[1])
    const [changeToken, setChangeToken] = useState(1)
    const [prices, setPrices] = useState(0)

    const oneSwapAmount = parseEther(tokenOneAmount)
    const twoSwapAmount = parseEther(tokenTwoAmount)

    const [isSwapping, setIsSwapping] = useState(false) // 控制是否发起交易

    function ChangeAmount(e: any) {
        const target = e.target as HTMLInputElement
        let value = target.value
        let numberValue = Number(value)
        setTokenOneAmount(value)
        if (value && prices) {
            const amount = numberValue * prices
            setTokenTwoAmount(amount.toString())
        } else {
            setTokenTwoAmount('')
        }
    }

    function switchTokens() {
        let amount = Number(tokenOneAmount)
        const one = tokenOne
        const two = tokenTwo
        setTokenOne(two)
        setTokenTwo(one)

        settokenOneBalance(tokenTwoBalance)
        settokenTwoBalance(tokenOneBalance)

        const value = amount * prices
        setTokenOneAmount(value.toString())
        setTokenTwoAmount(amount.toString())
    }

    function openModal(asset: number) {
        setChangeToken(asset)
        open()
    }

    function modifyToken(i: number) {
        setTokenOneAmount('')
        setTokenTwoAmount('')
        changeToken === 1
            ? setTokenOne(chainId === 56 ? tokenList[i] : bnbTestToken[i])
            : setTokenTwo(chainId === 56 ? tokenList[i] : bnbTestToken[i])
        close()
    }

    // pancakeswap v2factory 获取 交易对的流动性池地址
    const [pairAddress, setPairAddress] = useState('')
    const [pairLoading, setpairLoading] = useState(false)
    useEffect(() => {
        const getPair = async () => {
            setpairLoading(true)
            try {
                const res = await readContract(config, {
                    address: PANCAKE_SWAP_V2_FACTORY_ADDRESS,
                    abi: cakev2FactoryAbi,
                    functionName: 'getPair',
                    args: [tokenOne.address, tokenTwo.address]
                })

                if (res !== zeroAddress) {
                    setPairAddress(res as string)
                } else {
                    setPairAddress(zeroAddress)
                    setpairLoading(false)
                    setPrices(0)
                }
            } catch (error) {
                setPrices(0)
                setPairAddress(zeroAddress)
                setpairLoading(false)
            }
        }

        if (tokenOne.address && tokenTwo.address && address) {
            getPair()
        }
    }, [tokenOne.address, tokenTwo.address, address, PANCAKE_SWAP_V2_FACTORY_ADDRESS])

    const [token0Data, settoken0Data] = useState('')
    useEffect(() => {
        const getToken0Address = async () => {
            try {
                const res = await readContract(config, {
                    address: pairAddress as `0x${string}`,
                    abi: pairAbi,
                    functionName: 'token0'
                })
                settoken0Data(res as string)
            } catch (error) {
                settoken0Data('')
                console.log('get token0 error', (error as BaseError).shortMessage)
            }
        }
        if (pairAddress !== zeroAddress && pairAddress !== '') {
            getToken0Address()
        }
    }, [pairAddress])

    // 获取流动性池的储备数据
    const [pairReservesData, setpairReservesData] = useState('')
    useEffect(() => {
        const getReservesData = async () => {
            try {
                const res = await readContract(config, {
                    address: pairAddress as `0x${string}`,
                    abi: pairAbi,
                    functionName: 'getReserves'
                })
                setpairReservesData(res as string)
                setpairLoading(false)
            } catch (error) {
                setpairReservesData('')
                console.log('getReserves error', (error as BaseError).shortMessage)
                setpairLoading(false)
            }
        }

        if (pairAddress !== zeroAddress && pairAddress !== '') {
            getReservesData()
        }
    }, [pairAddress])

    const [tokenOneBalance, settokenOneBalance] = useState(0)
    const [tokenTwoBalance, settokenTwoBalance] = useState(0)

    //  读取用户address 在 tokenOne 的余额
    const { data: tokenResultOne, isSuccess: isGetOneBalanceSuccess } = useBalance({
        address,
        token: tokenOne.address as `0x${string}`
    })

    useEffect(() => {
        if (isGetOneBalanceSuccess && tokenResultOne.value) {
            let value
            value = tokenResultOne.value
            value = formatEther(value)
            value = Number(value)
            settokenOneBalance(value)
        } else {
            settokenOneBalance(0)
        }
    }, [tokenResultOne, isGetOneBalanceSuccess, tokenOne.address])

    //  读取用户address 在 tokenTwo 的余额
    const { data: tokenResultTwo, isSuccess: isGetTwoBalanceSuccess } = useBalance({
        address,
        token: tokenTwo.address as `0x${string}`
    })

    useEffect(() => {
        if (isGetTwoBalanceSuccess) {
            let value
            value = tokenResultTwo.value
            value = formatEther(value)
            value = Number(value)
            settokenTwoBalance(value)
        } else {
            settokenTwoBalance(0)
        }
    }, [tokenResultTwo, isGetTwoBalanceSuccess, tokenTwo.address])

    const isSelected = useMemo(
        () => (ticker: string) => {
            return ticker === tokenOne.ticker || ticker === tokenTwo.ticker
        },
        [tokenOne, tokenTwo]
    )

    const [isTxDetailOpen, setisTxDetailOpen] = useState(false)

    // 通过router 合约的getAmountOut 计算价格 start
    const [reserveIn, setreserveIn] = useState('')
    const [reserveOut, setreserveOut] = useState('')

    // 获取 tokenone tokentwo 储备量
    useEffect(() => {
        if (pairReservesData) {
            if (tokenOne.address && token0Data.toUpperCase() === tokenOne.address.toUpperCase()) {
                setreserveIn(pairReservesData[0])
                setreserveOut(pairReservesData[1])
            } else if (
                tokenTwo.address &&
                token0Data.toUpperCase() === tokenTwo.address.toUpperCase()
            ) {
                setreserveIn(pairReservesData[1])
                setreserveOut(pairReservesData[0])
            }
        }
    }, [pairReservesData, token0Data, tokenOne.address, tokenTwo.address])

    useEffect(() => {
        const getPrice = async () => {
            try {
                const res = await readContract(config, {
                    address: PANCAKE_SWAP_V2_ROUTER_ADDRESS,
                    abi: cakeV2RouterAbi,
                    functionName: 'getAmountOut',
                    args: [parseEther('1'), reserveIn, reserveOut]
                })
                setPrices(Number(formatEther(res as bigint)))
                setpairLoading(false)
            } catch (error) {
                setPrices(0)
                console.log('get price error', (error as BaseError).shortMessage)
                setpairLoading(false)
            }
        }
        if (reserveIn && reserveOut) {
            getPrice()
        }
    }, [PANCAKE_SWAP_V2_ROUTER_ADDRESS, reserveIn, reserveOut])

    // 通过router 合约的getAmountOut 计算价格 end

    const tokenSwapToken = async () => {
        setIsSwapping(true)

        let approve1Receipt, approve2Receipt
        try {
            const res = await writeContract(config, {
                address: tokenOne.address as `0x${string}`,
                abi: bep20Abi,
                functionName: 'approve',
                args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, oneSwapAmount]
            })

            approve1Receipt = await waitForTransactionReceipt(config, {
                hash: res
            })
        } catch (error) {
            setIsSwapping(false)
            return
        }

        try {
            const res = await writeContract(config, {
                address: tokenTwo.address as `0x${string}`,
                abi: bep20Abi,
                functionName: 'approve',
                args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, twoSwapAmount]
            })

            approve2Receipt = await waitForTransactionReceipt(config, {
                hash: res
            })
        } catch (error) {
            setIsSwapping(false)
            return
        }

        // 确保两个代币都授权完之后再进行swap
        if (approve1Receipt.status === 'success' && approve2Receipt.status === 'success') {
            handeleSwapAfterApprove()
        }
    }

    const [txHash, settxHash] = useState('')
    const handeleSwapAfterApprove = async () => {
        let txReceipt
        try {
            const slippageFactor = parseEther((1 - Number(liquidity.slippage) / 100).toString()) // 滑点比例
            const minTokenTwoAmount = (twoSwapAmount * slippageFactor) / parseEther('1')
            const args = [
                oneSwapAmount,
                minTokenTwoAmount,
                [tokenOne.address, tokenTwo.address],
                address,
                Math.floor(Date.now() / 1000) + 60 * Number(liquidity.currentMinutes)
            ]
            const res = await writeContract(config, {
                address: PANCAKE_SWAP_V2_ROUTER_ADDRESS,
                abi: cakeV2RouterAbi,
                functionName: 'swapExactTokensForTokens',
                args
            })

            txReceipt = await waitForTransactionReceipt(config, {
                hash: res
            })

            if (txReceipt.status === 'success') {
                setIsSwapping(false)
                setisTxDetailOpen(true)
                settxHash(res)
                setTokenOneAmount('')
                setTokenTwoAmount('')
            }
        } catch (error) {
            setIsSwapping(false)
            setisTxDetailErrorOpen(true)
            settxDetailError((error as BaseError).shortMessage)
        }
    }

    const [isTxDetailErrorOpen, setisTxDetailErrorOpen] = useState(false)
    const [txDetailError, settxDetailError] = useState('')

    return (
        <div>
            {/* select token modal */}
            <Modal className={style.modal} opened={opened} onClose={close} title='Select a token'>
                <div className={style.modalContent}>
                    {chainId === 56 &&
                        tokenList.map((e, i) => {
                            return (
                                <div
                                    className={
                                        !isSelected(e.ticker)
                                            ? style.tokenChoice
                                            : style.selected_tokenChoice
                                    }
                                    key={i}
                                    onClick={() => {
                                        if (!isSelected(e.ticker)) modifyToken(i)
                                    }}
                                >
                                    <Image src={e.img} alt={e.ticker} className={style.tokenLogo} />
                                    <div>
                                        <div
                                            className={
                                                !isSelected(e.ticker)
                                                    ? style.tokenName
                                                    : style.selected_tokenName
                                            }
                                        >
                                            {e.name}
                                        </div>
                                        <div
                                            className={
                                                !isSelected(e.ticker)
                                                    ? style.tokenTicker
                                                    : style.selected_tokenTicker
                                            }
                                        >
                                            {e.ticker}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                    {chainId === 97 &&
                        bnbTestToken.map((e, i) => {
                            return (
                                <div
                                    className={
                                        !isSelected(e.ticker)
                                            ? style.tokenChoice
                                            : style.selected_tokenChoice
                                    }
                                    key={i}
                                    onClick={() => {
                                        if (!isSelected(e.ticker)) modifyToken(i)
                                    }}
                                >
                                    <Image src={e.img} alt={e.ticker} className={style.tokenLogo} />
                                    <div>
                                        <div
                                            className={
                                                !isSelected(e.ticker)
                                                    ? style.tokenName
                                                    : style.selected_tokenName
                                            }
                                        >
                                            {e.name}
                                        </div>
                                        <div
                                            className={
                                                !isSelected(e.ticker)
                                                    ? style.tokenTicker
                                                    : style.selected_tokenTicker
                                            }
                                        >
                                            {e.ticker}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </Modal>

            <Modal
                className={style.txModal}
                centered
                opened={isTxDetailOpen}
                onClose={() => setisTxDetailOpen(false)}
                title='Transaction Submitted'
            >
                <div className='mt-8 flex flex-col items-center'>
                    <Image
                        src='/images/success.png'
                        alt=''
                        style={{
                            width: '40px',
                            height: '40px'
                        }}
                    />
                    <Button
                        onClick={() => {
                            setisTxDetailOpen(false)
                            chainId === 56
                                ? window.open(`https://bscscan.com/tx/${txHash}`)
                                : window.open(`https://testnet.bscscan.com/tx/${txHash}`)
                        }}
                        variant='transparent'
                        className='text-[red] mt-4'
                    >
                        View On Bscscan
                    </Button>
                </div>
            </Modal>
            {/* 交易失败 弹窗 */}
            <MyModal
                title='Transaction failed'
                isOpen={isTxDetailErrorOpen}
                closeFn={() => setisTxDetailErrorOpen(false)}
            >
                <div className='mt-8 flex flex-col items-center'>
                    <IconXboxX size={40} stroke={1} className=' text-[red]' />
                    <div
                        onClick={() => {
                            setisTxDetailErrorOpen(false)
                        }}
                        color='#F15223'
                        className='mt-4'
                    >
                        {txDetailError}
                    </div>
                </div>
            </MyModal>

            {/* Swap Box */}
            <div className='text-[#999]'>
                {/* You Pay */}
                <div className='flex justify-between items-center p-4 bg-[#1f1f1f] rounded-lg'>
                    <div>
                        <div className='mb-4'>You Pay</div>
                        <TextInput
                            type='number'
                            variant='unstyled'
                            value={tokenOneAmount}
                            onChange={(event) => ChangeAmount(event)}
                            classNames={{
                                root: style.text
                            }}
                            placeholder='0'
                        />
                    </div>
                    <div>
                        <div className='mb-4'>Balance: {tokenOneBalance}</div>
                        <div className='flex items-center justify-end'>
                            <Image
                                src={tokenOne.img}
                                alt='assetOneLogo'
                                className={style.assetLogo}
                            />
                            <span className='text-white ml-2 mr-4'>{tokenOne.ticker}</span>
                            <div onClick={() => openModal(1)} className='cursor-pointer'>
                                <Image className='w-8' src='/images/downArrow.svg' alt='' />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Swap Arrow */}
                <div onClick={switchTokens} className='flex justify-center py-2 cursor-pointer'>
                    <Image
                        src='/images/toggle.png'
                        style={{
                            width: '40px',
                            height: '40px'
                        }}
                        alt=''
                    />
                </div>

                {/* You Get */}
                <div className='flex justify-between items-center p-4 bg-[#1f1f1f] rounded-lg'>
                    <div>
                        <div className='mb-4'>You Get</div>
                        <TextInput
                            type='number'
                            variant='unstyled'
                            value={tokenTwoAmount}
                            disabled
                            classNames={{
                                root: style.text
                            }}
                            placeholder='0'
                        />
                    </div>
                    <div>
                        <div className='mb-4'>Balance: {tokenTwoBalance}</div>
                        <div className='flex items-center justify-end'>
                            <Image
                                src={tokenTwo.img}
                                alt='assetOneLogo'
                                className={style.assetLogo}
                            />
                            <span className='text-white ml-2 mx-4'>{tokenTwo.ticker}</span>
                            <div onClick={() => openModal(2)} className='cursor-pointer'>
                                <Image className='w-8' src='/images/downArrow.svg' alt='' />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Exchange Rate */}
                {!pairLoading && (
                    <div className='text-center py-10'>
                        1 {tokenOne.ticker}
                        <span className='px-2'>≈ {prices.toString(10)}</span>
                        {tokenTwo.ticker}
                    </div>
                )}
                {pairLoading && <div className='text-center py-10'>Loading</div>}

                {/* Swap Button */}
                {isConnected && (
                    <>
                        {tokenOneBalance < Number(tokenOneAmount) ||
                        tokenTwoBalance < Number(tokenTwoAmount) ? (
                            <Button
                                style={{
                                    background: '#1f1f1f',
                                    marginTop: '16px',
                                    width: '100%',
                                    borderRadius: '20px',
                                    color: '#777',
                                    height: '50px'
                                }}
                                disabled
                            >
                                {tokenOneBalance < Number(tokenOneAmount) &&
                                    tokenTwoBalance > Number(tokenTwoAmount) &&
                                    `${tokenOne.ticker} Insufficient  Balance`}
                                {tokenTwoBalance < Number(tokenTwoAmount) &&
                                    tokenOneBalance > Number(tokenOneAmount) &&
                                    `${tokenTwo.ticker} Insufficient  Balance`}

                                {tokenOneBalance < Number(tokenOneAmount) &&
                                    tokenTwoBalance < Number(tokenTwoAmount) &&
                                    `${tokenOne.ticker} and ${tokenTwo.ticker} Insufficient  Balance`}
                            </Button>
                        ) : (
                            <Button
                                style={{
                                    background: `${
                                        Number(tokenOneAmount)
                                            ? 'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                                            : '#1f1f1f'
                                    }`,
                                    marginTop: '16px',
                                    width: '100%',
                                    borderRadius: '20px',
                                    color: `${Number(tokenOneAmount) ? 'white' : '#777'}`,
                                    height: '50px'
                                }}
                                disabled={!Number(tokenOneAmount)}
                                loading={isSwapping}
                                onClick={() => {
                                    tokenSwapToken()
                                }}
                            >
                                {Number(tokenOneAmount) ? 'Swap' : 'Enter an amount'}
                            </Button>
                        )}
                    </>
                )}
                {!isConnected && (
                    <div>
                        <MyConnectBtn />
                    </div>
                )}
            </div>
        </div>
    )
}
