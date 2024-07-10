'use client'
import { Button, Image, Modal, TextInput } from '@mantine/core'
import React, { useEffect, useMemo, useState } from 'react'
// import tokenList from '@/constants/tokenList.json'
import tokenList from '@/constants/tokenList.json'
import {
    useAccount,
    useBalance,
    useReadContract,
    useWaitForTransactionReceipt,
    useWriteContract
} from 'wagmi'
import style from './uniswap.module.css'
import { useDisclosure } from '@mantine/hooks'
import cakeV2RouterAbi from '@/constants/cakev2RouterAbi.json'
import cakev2FactoryAbi from '@/constants/cakev2FactoryAbi.json'
import pairAbi from '@/constants/pairAbi.json'
import bep20Abi from '@/constants/bep20Abi.json'
import { formatEther, parseEther, parseUnits } from 'viem'
import { MyConnectBtn } from '@/components/wallet/myConnectBtn'
import { useLiquidityStore } from '@/store/liquidity'

// const PANCAKE_SWAP_V2_ROUTER_ADDRESS= '0x10ED43C718714eb63d5aA57B78B54704E256024E'
// const PANCAKE_SWAP_V2_FACTORY_ADDRESS = '0xca143ce32fe78f1f7019d7d551a6402fc5350c73'

//testnet
// const PANCAKE_SWAP_V2_ROUTER_ADDRESS = '0xB6BA90af76D139AB3170c7df0139636dB6120F7e'
// const PANCAKE_SWAP_V2_FACTORY_ADDRESS = '0x6725F303b657a9451d8BA641348b6761A6CC7a17'

export default function Swap() {
    const { address, isConnected, chainId } = useAccount()

    const PANCAKE_SWAP_V2_ROUTER_ADDRESS =
        chainId === 56
            ? '0x10ED43C718714eb63d5aA57B78B54704E256024E'
            : '0xB6BA90af76D139AB3170c7df0139636dB6120F7e'
    const PANCAKE_SWAP_V2_FACTORY_ADDRESS =
        chainId === 56
            ? '0xca143ce32fe78f1f7019d7d551a6402fc5350c73'
            : '0x6725F303b657a9451d8BA641348b6761A6CC7a17'

    const { liquidity } = useLiquidityStore()
    const [opened, { open, close }] = useDisclosure(false)
    const [tokenOneAmount, setTokenOneAmount] = useState(0)
    const [tokenTwoAmount, setTokenTwoAmount] = useState(0)
    const [tokenOne, setTokenOne] = useState(tokenList[0])
    const [tokenTwo, setTokenTwo] = useState(tokenList[1])
    const [changeToken, setChangeToken] = useState(1)
    const [prices, setPrices] = useState(0)

    const oneSwapAmount = parseEther(tokenOneAmount.toString())
    const twoSwapAmount = parseEther(tokenTwoAmount.toString())
    const { writeContract, isSuccess, data: hash, isError, error: swapErr } = useWriteContract()
    /// startttt
    const ethSwapToken = () => {
        setIsSwapping(true)
        writeContract({
            address: PANCAKE_SWAP_V2_ROUTER_ADDRESS,
            abi: cakeV2RouterAbi,
            functionName: 'swapExactETHForTokens',
            args: [
                parseUnits('1', 18), // 最小接受的目标 token 数量
                [tokenOne.address, tokenTwo.address],
                address,
                Math.floor(Date.now() / 1000) + 60 * 20 // 超时为20分钟
            ],
            value: oneSwapAmount
        })
    }

    const tokenSwapEth = () => {
        setIsSwapping(true)
        // swapExactTokensForETH 授权
        writeForApprove({
            address: tokenOne.address,
            abi: bep20Abi,
            functionName: 'approve',
            args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, oneSwapAmount]
        })

        // swapExactTokensForETH swap
        const argsTFE = [
            oneSwapAmount,
            twoSwapAmount,
            [tokenOne.address, tokenTwo.address],
            address,
            Math.floor(Date.now() / 1000) + 60 * 20
        ]
        writeContract({
            address: PANCAKE_SWAP_V2_ROUTER_ADDRESS,
            abi: cakeV2RouterAbi,
            functionName: 'swapExactTokensForETH',
            args: argsTFE
        })
    }
    /// endddddd
    const [isSwapping, setIsSwapping] = useState(false) // 控制是否发起交易
    const [transactionHash, setTransactionHash] = useState(null) // 交易哈希

    const {
        writeContract: writeForApprove1,
        isSuccess: isApproveSuccess1,
        isError: isApproveError1
    } = useWriteContract()
    const {
        writeContract: writeForApprove2,
        isSuccess: isApproveSuccess2,
        isError: isApproveError2
    } = useWriteContract()

    const tokenSwapToken = () => {
        setIsSwapping(true)
        if (!isApproveSuccess1 || !isApproveSuccess2) {
            // swapExactTokensForTokens 授权
            writeForApprove1({
                address: tokenOne.address,
                abi: bep20Abi,
                functionName: 'approve',
                args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, oneSwapAmount]
            })
            writeForApprove2({
                address: tokenTwo.address,
                abi: bep20Abi,
                functionName: 'approve',
                args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, twoSwapAmount]
            })
        }
    }

    useEffect(() => {
        if (isApproveError1 || isApproveError2) {
            setIsSwapping(false)
        }
    }, [isApproveError1, isApproveError2])
    useEffect(() => {
        if (isApproveSuccess1 && isApproveSuccess2) {
            const slippageFactor = parseEther((1 - Number(liquidity.slippage) / 100).toString()) // 滑点比例
            const intputTokenTwoAmount = parseEther(tokenTwoAmount.toString())
            const minTokenTwoAmount = (intputTokenTwoAmount * slippageFactor) / parseEther('1')
            //swapExactTokensForTokens swap
            writeContract({
                address: PANCAKE_SWAP_V2_ROUTER_ADDRESS,
                abi: cakeV2RouterAbi,
                functionName: 'swapExactTokensForTokens',
                args: [
                    oneSwapAmount,
                    minTokenTwoAmount,
                    [tokenOne.address, tokenTwo.address],
                    address,
                    liquidity.txDeadline
                ]
            })
        }
    }, [
        isApproveSuccess1,
        isApproveSuccess2,
        writeContract
        // address,
        // oneSwapAmount,
        // tokenTwoAmount,
        // tokenOne.address,
        // tokenTwo.address,
        // liquidity.txDeadline,
        // liquidity.slippage
    ])

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        isError: isConfirmError,
        error: confirmError
    } = useWaitForTransactionReceipt({
        hash
    })
    useEffect(() => {
        if (isError) {
            console.log('swap error', swapErr)
            setIsSwapping(false)
        }
        // swap 交易被确认
        if (isSuccess && isConfirmed) {
            setIsSwapping(false)
            setTransactionHash(hash)
            setisTxDetailOpen(true)
        }
    }, [isSuccess, isConfirmed, isConfirmError, hash, isError, swapErr])

    function ChangeAmount(e) {
        setTokenOneAmount(e.target.value)
        if (e.target.value && prices) {
            const value = Number(e.target.value) * prices
            setTokenTwoAmount(Number(value.toFixed(6)))
        } else {
            setTokenTwoAmount(0)
        }
    }

    function switchTokens() {
        let amount = tokenOneAmount
        const one = tokenOne
        const two = tokenTwo
        setTokenOne(two)
        setTokenTwo(one)

        settokenOneBalance(tokenTwoBalance)
        settokenTwoBalance(tokenOneBalance)

        const value = amount * prices
        setTokenOneAmount(Number(value.toFixed(6)))
        setTokenTwoAmount(amount)
    }

    function openModal(asset) {
        setChangeToken(asset)
        open()
    }

    function modifyToken(i) {
        setTokenOneAmount(0)
        setTokenTwoAmount(0)
        changeToken === 1 ? setTokenOne(tokenList[i]) : setTokenTwo(tokenList[i])
        close()
    }

    // pancakeswap v2factory 获取 交易对的流动性池地址
    const [pairAddress, setPairAddress] = useState('')

    const {
        data: pairAddressData,
        isLoading: pairLoading,
        error: pairError
    } = useReadContract({
        address: PANCAKE_SWAP_V2_FACTORY_ADDRESS,
        abi: cakev2FactoryAbi,
        functionName: 'getPair',
        args: [tokenOne.address, tokenTwo.address],
        // 必须设置不然会一直请求
        enabled: !!tokenOne.address && !!tokenTwo.address
    })

    // 当 pairAddressData 更新时，设置 pairAddress
    useEffect(() => {
        if (pairAddressData) {
            setPairAddress(pairAddressData)
        }
    }, [tokenOne.address, tokenTwo.address, pairAddressData])

    // 获取流动性池中 token0  的地址
    const {
        data: token0Data,
        isLoading: token0Loading,
        error: token0Error
    } = useReadContract({
        address: pairAddress,
        abi: pairAbi,
        functionName: 'token0',
        enabled: !!pairAddress
    })

    // 获取流动性池的储备数据
    const {
        data: pairReservesData,
        isLoading: pairReservesLoading,
        error: pairReservesError
    } = useReadContract({
        address: pairAddress,
        abi: pairAbi,
        functionName: 'getReserves',
        enabled: !!pairAddress // 确保在有 pairAddress 时才进行查询
    })

    // 计算价格并更新
    useEffect(() => {
        if (pairReservesData) {
            const reserve0 = parseInt(pairReservesData[0]) // reserve0 对应 token0
            const reserve1 = parseInt(pairReservesData[1]) // reserve1 对应 token1

            let price
            const token0 = token0Data.toUpperCase()

            if (token0 === tokenOne.address.toUpperCase()) {
                // 如果 addressOne 是 token0，价格为 token1/token0
                price = reserve1 / reserve0
                setPrices(Number(price.toFixed(18)))
            } else if (token0 === tokenTwo.address.toUpperCase()) {
                // 如果 addressOne 是 token1，价格为 token0/token1
                price = reserve0 / reserve1
                setPrices(Number(price.toFixed(18)))
            } else {
                setPrices(0)
            }
        }
    }, [pairReservesData, token0Data, tokenOne.address, tokenTwo.address])

    const [tokenOneBalance, settokenOneBalance] = useState(0)
    const [tokenTwoBalance, settokenTwoBalance] = useState(0)

    //  读取用户address 在 tokenOne 的余额
    const { data: tokenResultOne, isSuccess: isGetOneBalanceSuccess } = useBalance({
        address,
        token: tokenOne.address
    })

    useEffect(() => {
        if (isGetOneBalanceSuccess) {
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
        token: tokenTwo.address
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
        () => (ticker) => {
            return ticker === tokenOne.ticker || ticker === tokenTwo.ticker
        },
        [tokenOne, tokenTwo]
    )

    const [isTxDetailOpen, setisTxDetailOpen] = useState(false)

    return (
        <div>
            {/* select token modal */}
            <Modal className={style.modal} opened={opened} onClose={close} title='Select a token'>
                <div className={style.modalContent}>
                    {tokenList?.map((e, i) => {
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
                            window.open(`https://bscscan.com/tx/${hash}`)
                        }}
                        variant='transparent'
                        className='text-[red] mt-4'
                    >
                        View On Bscscan
                    </Button>
                </div>
            </Modal>
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
                {!pairLoading && !pairReservesLoading && (
                    <div className='text-center py-10'>
                        1 {tokenOne.ticker}
                        <span className='px-2'>≈ {prices.toString(10)}</span>
                        {tokenTwo.ticker}
                    </div>
                )}
                {(pairLoading || pairReservesLoading) && (
                    <div className='text-center py-10'>Loading</div>
                )}

                {/* Swap Button */}
                {isConnected && (
                    <>
                        {tokenOneBalance < Number(tokenOneAmount) ? (
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
                                Insufficient Balance
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
                                    // if (tokenOne.ticker === 'WBNB' && tokenTwo.ticker !== 'WBNB') {
                                    //     ethSwapToken()
                                    // } else if (
                                    //     tokenOne.ticker !== 'WBNB' &&
                                    //     tokenTwo.ticker === 'WBNB'
                                    // ) {
                                    //     tokenSwapEth()
                                    // } else if (
                                    //     tokenOne.ticker !== 'WBNB' &&
                                    //     tokenTwo.ticker !== 'WBNB'
                                    // ) {
                                    //     tokenSwapToken()
                                    // }
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
