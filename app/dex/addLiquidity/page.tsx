'use client'

import React, { useEffect, useMemo, useState } from 'react'
import tokenList from '@/constants/tokenList.json'
import { Button, Image, Modal, TextInput } from '@mantine/core'
import { IconChevronDown, IconPlus, IconXboxX } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import style from './page.module.css'
import { useAccount, useBalance, useReadContract, useWriteContract } from 'wagmi'
import bep20Abi from '@/constants/bep20Abi.json'
import pairAbi from '@/constants/pairAbi.json'
import cakev2FactoryAbi from '@/constants/cakev2FactoryAbi.json'
import cakeV2RouterAbi from '@/constants/cakev2RouterAbi.json'
import MyModal from '@/components/myModal/page'
import MyButton from '@/components/myButton/page'
import { formatEther, parseEther } from 'viem'
import { useLiquidityStore } from '@/store/liquidity'

// const PANCAKE_SWAP_V2_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
// const PANCAKE_SWAP_V2_FACTORY_ADDRESS = '0xca143ce32fe78f1f7019d7d551a6402fc5350c73'

//testnet
// const PANCAKE_SWAP_V2_ROUTER_ADDRESS = '0xB6BA90af76D139AB3170c7df0139636dB6120F7e'
// const PANCAKE_SWAP_V2_FACTORY_ADDRESS = '0x6725F303b657a9451d8BA641348b6761A6CC7a17'

type TObject = {
    ticker: string
    img: string
    address: string
}
export default function Page() {
    const { address, chainId } = useAccount()

    const PANCAKE_SWAP_V2_ROUTER_ADDRESS =
        chainId === 56
            ? '0x10ED43C718714eb63d5aA57B78B54704E256024E'
            : '0xB6BA90af76D139AB3170c7df0139636dB6120F7e'
    const PANCAKE_SWAP_V2_FACTORY_ADDRESS =
        chainId === 56
            ? '0xca143ce32fe78f1f7019d7d551a6402fc5350c73'
            : '0x6725F303b657a9451d8BA641348b6761A6CC7a17'

    const [tokenOne, setTokenOne] = useState<TObject>({ ticker: '', img: '', address: '' })
    const [tokenTwo, setTokenTwo] = useState<TObject>({ ticker: '', img: '', address: '' })
    const [tokenOneAmount, setTokenOneAmount] = useState('')
    const [tokenTwoAmount, setTokenTwoAmount] = useState('')
    const [tokenOneBalance, settokenOneBalance] = useState(0)
    const [tokenTwoBalance, settokenTwoBalance] = useState(0)

    const [opened, { open, close }] = useDisclosure(false)
    const [changeToken, setChangeToken] = useState(1)
    const [prices, setPrices] = useState(0)
    const [switchPrices, setswitchPrices] = useState(0)

    const [isShowAdd, setisShowAdd] = useState<Boolean>(false)

    const { liquidity } = useLiquidityStore()
    function openModal(asset: number) {
        setChangeToken(asset)
        open()
    }

    function modifyToken(i: number) {
        setTokenOneAmount('')
        setTokenTwoAmount('')
        changeToken === 1 ? setTokenOne(tokenList[i]) : setTokenTwo(tokenList[i])
        close()
    }
    const isSelected = useMemo(
        () => (ticker: string) => {
            return ticker === tokenOne.ticker || ticker === tokenTwo.ticker
        },
        [tokenOne, tokenTwo]
    )

    useEffect(() => {
        if (!tokenOne.ticker || !tokenTwo.ticker) {
            setisShowAdd(false)
        }
    }, [tokenOne.ticker, tokenTwo.ticker])

    const handleAdd = () => {
        setisShowAdd(true)
    }

    function ChangeAmount(e) {
        setTokenOneAmount(e.target.value)
        if (e.target.value && prices) {
            const value = parseFloat(e.target.value) * prices
            setTokenTwoAmount(value.toFixed(6))
        } else {
            setTokenTwoAmount('')
        }
    }

    const ChangeTwoAmount = (e) => {
        setTokenTwoAmount(e.target.value)
        if (e.target.value && prices) {
            const value = parseFloat(e.target.value) * prices
            setTokenOneAmount(value.toFixed(6))
        } else {
            setTokenOneAmount('')
        }
    }

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
            value = parseFloat(value)
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
            value = parseFloat(value)
            settokenTwoBalance(value)
        } else {
            settokenTwoBalance(0)
        }
    }, [tokenResultTwo, isGetTwoBalanceSuccess, tokenTwo.address])

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

    // 获取用户 LP的 余额
    const [lpTokenBalance, setlpTokenBalance] = useState('')
    const {
        data: lpTokenBalanceData,
        isSuccess: isSuccessLpTokenBalance,
        isError: isErrorLpTokenBalance
    } = useReadContract({
        address: pairAddress,
        abi: pairAbi,
        functionName: 'balanceOf',
        args: [address],
        enabled: !!pairAddress
    })

    useEffect(() => {
        if (isSuccessLpTokenBalance) {
            setlpTokenBalance(formatEther(lpTokenBalanceData))
        }
    }, [isSuccessLpTokenBalance, lpTokenBalanceData])

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

            // price == a/b
            // Price2 = b/a
            let price, price2
            const token0 = token0Data.toUpperCase()

            if (token0 === tokenOne.address.toUpperCase()) {
                price = reserve1 / reserve0
                price2 = reserve0 / reserve1

                setPrices(parseFloat(price.toFixed(6)))
                setswitchPrices(parseFloat(price2.toFixed(6)))
            } else if (token0 === tokenTwo.address.toUpperCase()) {
                price = reserve0 / reserve1
                price2 = reserve1 / reserve0

                setPrices(parseFloat(price.toFixed(6)))
                setswitchPrices(parseFloat(price2.toFixed(6)))
            } else {
                setPrices(0)
                setswitchPrices(0)
            }
        }
    }, [pairReservesData, token0Data, tokenOne.address, tokenTwo.address])

    // 设置 token1添加到流动性池子的数量为用户钱包的余额
    const handleTokenOneMax = () => {
        setTokenOneAmount(tokenTwoBalance.toString())
        // 假如是原生代币 这里设置最大值需要减去gas费
        if (tokenOneBalance && prices) {
            const value = tokenOneBalance * prices
            setTokenTwoAmount(value.toFixed(6))
        } else {
            setTokenTwoAmount('')
        }
    }

    // 设置 token2添加到流动性池子的数量为用户钱包的余额
    const handleTokenTwoMax = () => {
        setTokenTwoAmount(tokenTwoBalance.toString())
        // 假如是原生代币 这里设置最大值需要减去gas费
        if (tokenOneBalance && switchPrices) {
            const value = tokenOneBalance * switchPrices
            setTokenOneAmount(value.toFixed(6))
        } else {
            setTokenOneAmount('')
        }
    }

    // supply 按钮禁用控制
    const isSupplyDisable = useMemo(() => {
        if (!parseFloat(tokenOneAmount) || !parseFloat(tokenTwoAmount)) return true
        return (
            tokenOneBalance < parseFloat(tokenOneAmount) ||
            tokenTwoBalance < parseFloat(tokenTwoAmount)
        )
    }, [tokenOneBalance, tokenTwoBalance, tokenOneAmount, tokenTwoAmount])
    // }, [])

    // 点击supply后 控制弹窗显示
    const [isShowConfirm, setisShowConfirm] = useState<boolean>(false)

    // 获取总的LP数量
    const { data: totalSupplyLP, isSuccess: isSuccessLP } = useReadContract({
        address: pairAddress,
        abi: pairAbi,
        functionName: 'totalSupply',
        enabled: !!isShowConfirm //  打开confirm 弹窗时才进行查询
    })

    const [lpReceive, setLpReceive] = useState('0')
    const [userShare, setUserShare] = useState('0')
    useEffect(() => {
        if (isSuccessLP) {
            const reserveA = pairReservesData[0]
            const reserveB = pairReservesData[1]

            // 计算用户将收到的 LP 代币数量
            const calculatedLpReceivedA = (parseEther(tokenOneAmount) * totalSupplyLP) / reserveA
            const calculatedLpReceivedB = (parseEther(tokenTwoAmount) * totalSupplyLP) / reserveB

            const minCalculatedLP =
                calculatedLpReceivedA < calculatedLpReceivedB
                    ? calculatedLpReceivedA
                    : calculatedLpReceivedB

            let finalTotalLP = formatEther(minCalculatedLP)
            finalTotalLP = String(Math.floor(Number(finalTotalLP) * 1000000) / 1000000)
            setLpReceive(finalTotalLP)

            // 计算用户在池子中的比例
            const calculatedUserShare =
                (minCalculatedLP * parseEther('100')) / (totalSupplyLP + minCalculatedLP)
            let val = formatEther(calculatedUserShare)
            val = Number(val).toFixed(6)
            setUserShare(val)
        }
    }, [isSuccessLP, totalSupplyLP, pairReservesData, tokenOneAmount, tokenTwoAmount, lpReceive])

    const handleSupply = async () => {
        setisShowConfirm(true)
    }

    // 控制弹窗内的Confirm supply按钮loading
    const [confirmLoading, setconfirmLoading] = useState<boolean>(false)

    // 授权 token 给pancakeswap v2 router
    const {
        writeContract: writeForApprove1,
        isSuccess: approveSuccess1,
        isError: isApproveError1
    } = useWriteContract()
    const {
        writeContract: writeForApprove2,
        isSuccess: approveSuccess2,
        isError: isApproveError2
    } = useWriteContract()

    // 使用 BigNumber 进行滑点计算，避免浮点数操作
    const slippageFactor = parseEther((1 - Number(liquidity.slippage) / 100).toString()) // 滑点比例
    const intputTokenOneAmount = parseEther(tokenOneAmount)
    const intputTokenTwoAmount = parseEther(tokenTwoAmount)
    const minTokenOneAmount = (intputTokenOneAmount * slippageFactor) / parseEther('1')
    const minTokenTwoAmount = (intputTokenTwoAmount * slippageFactor) / parseEther('1')

    const {
        writeContract: writeForAddLiquidity,
        data: addLiquidityData,
        isSuccess: isSuccessAddLiquidity,
        isError: isErrorAddLiquidity,
        error: addLiquidityError
    } = useWriteContract()
    useEffect(() => {
        // 两个token 授权后才能进行添加流动性
        if (approveSuccess1 && approveSuccess2) {
            console.log(11111)
            writeForAddLiquidity({
                address: PANCAKE_SWAP_V2_ROUTER_ADDRESS,
                abi: cakeV2RouterAbi,
                functionName: 'addLiquidity',
                args: [
                    tokenOne.address,
                    tokenTwo.address,
                    intputTokenOneAmount,
                    intputTokenTwoAmount,
                    minTokenOneAmount,
                    minTokenTwoAmount,
                    address,
                    liquidity.txDeadline
                ]
                // enabled: !!isApprovaAll
            })
        } else if (isApproveError1 && isApproveError2) {
            setconfirmLoading(false)
        }
    }, [approveSuccess1, approveSuccess2, isApproveError1, isApproveError2])

    // 点击弹窗内的Confirm supply按钮
    const handleConfirmSupply = () => {
        setconfirmLoading(true)
        // 授权后 才能 confirm 交易
        writeForApprove1({
            address: tokenOne.address,
            abi: bep20Abi,
            functionName: 'approve',
            args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, parseEther(tokenOneAmount)]
        })
        writeForApprove2({
            address: tokenTwo.address,
            abi: bep20Abi,
            functionName: 'approve',
            args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, parseEther(tokenTwoAmount)]
        })
    }

    useEffect(() => {
        if (isSuccessAddLiquidity) {
            setisShowConfirm(false)
            setconfirmLoading(false)
            setisTxDetailOpen(true)
            setliquidityHash(addLiquidityData)
        }
    }, [isSuccessAddLiquidity, addLiquidityData])

    useEffect(() => {
        if (isErrorAddLiquidity) {
            setisShowConfirm(false)
            setconfirmLoading(false)
            setisTxDetailErrorOpen(true)
            console.log(123, addLiquidityError)
        }
    }, [isErrorAddLiquidity, addLiquidityError])

    const [isTxDetailOpen, setisTxDetailOpen] = useState<boolean>(false)
    const [isTxDetailErrorOpen, setisTxDetailErrorOpen] = useState<boolean>(false)
    const [liquidityHash, setliquidityHash] = useState<string>('')

    return (
        <div className=' bg-black flex justify-center'>
            <div className='w-full max-w-xl p-4 space-y-4 flex flex-col justify-center items-center'>
                <div className='mb-4'>Add Liquidity</div>

                {!isShowAdd && (
                    <div className='w-full flex flex-col items-center text-sm'>
                        <div className='#1f1f1f py-3 w-full  bg-[#1f1f1f] rounded-xl text-[#f15223] flex justify-center items-center'>
                            {tokenOne.img && (
                                <Image
                                    style={{
                                        width: '30px',
                                        height: '30px'
                                    }}
                                    src={tokenOne.img}
                                    alt=''
                                ></Image>
                            )}
                            <span className='mx-2'>
                                {tokenOne.ticker ? tokenOne.ticker : 'Select a token'}
                            </span>
                            <IconChevronDown
                                className='w-8 text-[#f15223] cursor-pointer'
                                onClick={() => openModal(1)}
                            />
                        </div>

                        <IconPlus className='w-8 text-[#f15223] my-4' />

                        <div className='#1f1f1f py-3 w-full  bg-[#1f1f1f] rounded-xl text-[#f15223] flex justify-center items-center'>
                            {tokenTwo.img && (
                                <Image
                                    style={{
                                        width: '30px',
                                        height: '30px'
                                    }}
                                    src={tokenTwo.img}
                                    alt=''
                                ></Image>
                            )}
                            <span className='mx-2'>
                                {tokenTwo.ticker ? tokenTwo.ticker : 'Select a token'}
                            </span>
                            <IconChevronDown
                                className='w-8 text-[#f15223] cursor-pointer'
                                onClick={() => openModal(2)}
                            />
                        </div>

                        <div className='py-8 text-[#999]'>
                            Select a token to find your liquidity.
                        </div>

                        {(!tokenOne.ticker || !tokenTwo.ticker) && (
                            <div className='#1f1f1f py-3 w-full  bg-[#1f1f1f] rounded-xl text-[#999] flex justify-center items-center'>
                                Add Liquidity
                            </div>
                        )}
                        {tokenOne.ticker && tokenTwo.ticker && (
                            <button
                                style={{
                                    background:
                                        'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                                }}
                                className='mt-4 w-full px-4 py-2 rounded-xl text-white'
                                onClick={() => handleAdd()}
                            >
                                Add Liquidity
                            </button>
                        )}
                    </div>
                )}

                {isShowAdd && (
                    <div className='w-full flex flex-col items-center text-sm'>
                        {/* token1 */}
                        <div className='w-full flex justify-between items-center px-4 py-2 bg-[#1f1f1f] rounded-lg'>
                            <div>
                                <div className='mb-2'>Amount</div>
                                <TextInput
                                    variant='unstyled'
                                    value={tokenOneAmount}
                                    onChange={(e) => ChangeAmount(e)}
                                    classNames={{
                                        root: style.text
                                    }}
                                    placeholder='0'
                                />
                            </div>
                            <div className='flex flex-col items-end'>
                                <div className='mb-2'>Balance: {tokenOneBalance}</div>
                                <div className='flex items-center justify-end'>
                                    <button
                                        onClick={() => handleTokenOneMax()}
                                        className='cursor-pointer mr-2 text-[#F15223] border border-[#F15223] rounded-xl px-2 py-1'
                                    >
                                        Max
                                    </button>
                                    <Image
                                        src={tokenOne.img}
                                        alt='assetOneLogo'
                                        className={style.assetLogo}
                                    />
                                    <span className='text-white mx-2'>{tokenOne.ticker}</span>
                                    <button onClick={() => openModal(1)} className='w-10'>
                                        <Image src='/images/downArrow.svg' alt='' />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <IconPlus className='w-8 text-[#f15223] my-4' />

                        {/* token2 */}
                        <div className='w-full flex justify-between items-center px-4 py-2 bg-[#1f1f1f] rounded-lg'>
                            <div>
                                <div className='mb-2'>Amount</div>
                                <TextInput
                                    variant='unstyled'
                                    value={tokenTwoAmount}
                                    onChange={(e) => ChangeTwoAmount(e)}
                                    classNames={{
                                        root: style.text
                                    }}
                                    placeholder='0'
                                />
                            </div>
                            <div className='flex flex-col items-end'>
                                <div className='mb-2'>Balance: {tokenTwoBalance}</div>
                                <div className='flex items-center justify-end'>
                                    <button
                                        onClick={() => handleTokenTwoMax()}
                                        className='cursor-pointer mr-2 text-[#F15223] border border-[#F15223] rounded-xl px-2 py-1'
                                    >
                                        Max
                                    </button>
                                    <Image
                                        src={tokenTwo.img}
                                        alt='assetOneLogo'
                                        className={style.assetLogo}
                                    />
                                    <span className='text-white ml-2 mx-4'>{tokenTwo.ticker}</span>
                                    <button onClick={() => openModal(2)} className='w-10'>
                                        <Image src='/images/downArrow.svg' alt='' />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className='w-full'>
                            <div className='mb-4 mt-8'>Prices and Pool Share</div>
                            <div className='bg-[#141414] rounded-xl text-white p-4 flex'>
                                <div className='text-center'>
                                    <div>{prices}</div>
                                    <div className='text-[#999] mt-2'>
                                        {tokenOne.ticker} per {tokenTwo.ticker}
                                    </div>
                                </div>

                                <div className='flex-grow text-center'>
                                    <div>{switchPrices}</div>
                                    <div className='text-[#999] mt-2'>
                                        {tokenTwo.ticker} per {tokenOne.ticker}
                                    </div>
                                </div>

                                <div className='text-center'>
                                    <div className='flex items-center'>
                                        {/* <IconChevronLeft className='w-4' /> */}
                                        {userShare}%
                                    </div>
                                    <div className='text-[#999] mt-2'>Share of Pool</div>
                                </div>
                            </div>

                            <button
                                style={{
                                    background: !isSupplyDisable
                                        ? 'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                                        : '#1f1f1f',
                                    color: 'white'
                                }}
                                disabled={isSupplyDisable}
                                className='my-8 w-full px-4 py-2 rounded-xl'
                                onClick={() => handleSupply()}
                            >
                                {!isSupplyDisable ? 'Supply' : `Insufficient Balance`}
                            </button>

                            <div className='my-4'>LP Token in your wallet</div>
                            <div className='flex justify-between'>
                                <div className='flex'>
                                    <Image
                                        style={{
                                            width: '25px',
                                            height: '25px'
                                        }}
                                        src={tokenOne.img}
                                        alt=''
                                    ></Image>
                                    <Image
                                        style={{
                                            width: '25px',
                                            height: '25px'
                                        }}
                                        src={tokenTwo.img}
                                        alt=''
                                    ></Image>
                                    <span className='ml-4'>
                                        {tokenOne.ticker} - {tokenTwo.ticker}
                                    </span>
                                </div>
                                <span> {lpTokenBalance} </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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

            <MyModal
                title='You Will Receive'
                isOpen={isShowConfirm}
                closeFn={() => setisShowConfirm(false)}
            >
                <div className='flex items-center'>
                    <div className={style.cctext}>{lpReceive}</div>
                    <Image
                        src={tokenOne.img}
                        alt=''
                        style={{
                            width: '30px',
                            height: '30px'
                        }}
                    ></Image>
                    <Image
                        src={tokenTwo.img}
                        alt=''
                        style={{
                            width: '30px',
                            height: '30px',
                            marginLeft: '-10px'
                        }}
                    ></Image>

                    <div className='ml-4'>
                        {tokenOne.ticker}-{tokenTwo.ticker} LP
                    </div>
                </div>

                <div className='text-[#999] text-sm my-10'>
                    Output is estimated. if the price changes by more than {liquidity.slippage}%
                    your trasaction will revert.
                </div>
                <div className='flex justify-between mb-4'>
                    {tokenOne.ticker} Deposited
                    <div className='flex items-center'>
                        {tokenOneAmount}
                        <Image
                            src={tokenOne.img}
                            alt=''
                            style={{
                                width: '30px',
                                height: '30px',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                </div>
                <div className='flex justify-between mb-4'>
                    {tokenTwo.ticker} Deposited
                    <div className='flex items-center'>
                        {tokenTwoAmount}
                        <Image
                            src={tokenTwo.img}
                            alt=''
                            style={{
                                width: '30px',
                                height: '30px',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                </div>

                <div className='flex justify-between mb-4'>
                    Rates
                    <div>
                        1 {tokenOne.ticker} ≈ {prices} {tokenTwo.ticker}
                    </div>
                </div>

                <div className='flex justify-between mb-4'>
                    <div className='w-4' />
                    <div>
                        1 {tokenTwo.ticker} ≈ {switchPrices} {tokenOne.ticker}
                    </div>
                </div>

                <div className='flex justify-between mb-6'>
                    Share of Pool
                    <div>{userShare}%</div>
                </div>

                <MyButton text='Confirm Supply' fn={handleConfirmSupply} loading={confirmLoading} />
            </MyModal>

            <MyModal
                title='Transaction Submitted'
                isOpen={isTxDetailOpen}
                closeFn={() => setisTxDetailOpen(false)}
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
                        variant='transparent'
                        onClick={() => {
                            setisTxDetailOpen(false)
                            window.open(`https://bscscan.com/tx/${liquidityHash}`)
                        }}
                        color='#F15223'
                        className='mt-4'
                    >
                        View On Bscscan
                    </Button>
                </div>
            </MyModal>

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
                        {/* {addLiquidityError} */}
                        ffff
                    </div>
                </div>
            </MyModal>
        </div>
    )
}
