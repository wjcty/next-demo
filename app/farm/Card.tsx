import {
    Card,
    Text,
    Badge,
    Button,
    Group,
    Image,
    Stack,
    TextInput,
    Collapse,
    Popover
} from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconSettings, IconXboxX } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import style from './page.module.scss'
import bep20Abi from '@/constants/bep20Abi.json'
import { formatEther, parseEther } from 'viem'
import { useAccount, useBalance, useReadContract, BaseError } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import masterchefv2Abi from '@/constants/masterchefv2Abi.json'
import cakeV2RouterAbi from '@/constants/cakev2RouterAbi.json'
import MyModal from '@/components/myModal/page'
import MyButton from '@/components/myButton/page'
import bnbTestToken from '@/constants/bnbTestToken.json'
import tokenList from '@/constants/tokenList.json'
import pairAbi from '@/constants/pairAbi.json'
import { useLiquidityStore } from '@/store/liquidity'
import { config } from '@/lib/config'

type TObject = {
    name: string
    apr: number
    lockup: string
    image: string
    userStakedAmount: number // 用户已经 质押的LP 数量
    pendingCake: string // 用户目前 earn 的数量
    boostMultiplier: number
    token0: `0x${string}`
    token1: `0x${string}`
    token0Symbol: string
    token1Symbol: string
    lpTokenSymbol: string
    lpTokenAddress: `0x${string}`
    poolId: number
    totalStaked: string
    cakeStakedInUsdt: number
}

export default function PoolCard({ pool }: { pool: TObject }) {
    const { address, chainId } = useAccount()
    const PANCAKE_SWAP_V2_ROUTER_ADDRESS =
        chainId === 56
            ? '0x10ED43C718714eb63d5aA57B78B54704E256024E'
            : '0xB6BA90af76D139AB3170c7df0139636dB6120F7e'

    const masterChefV2Address =
        chainId === 56
            ? '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652'
            : '0xB4A466911556e39210a6bB2FaECBB59E4eB7E43d'
    const { liquidity, setSlippage, setTxDeadline, setCurrentMinutes } = useLiquidityStore()
    const slippage = liquidity.slippage
    const currentMinutes = liquidity.currentMinutes

    const changeSlippage = (value: string) => {
        setSlippage(value)
    }
    const changeDeadLine = (value: string) => {
        setCurrentMinutes(value)
        setTxDeadline()
    }

    const [isShowConfirm, setisShowConfirm] = useState(false)
    // 控制弹窗内的按钮loading
    const [confirmLoading, setconfirmLoading] = useState(false)
    const [amount, setamount] = useState('')
    const [userLPtokenBalance, setuserLPtokenBalance] = useState(0)
    const [tokenOneBalance, settokenOneBalance] = useState(0)
    const [tokenTwoBalance, settokenTwoBalance] = useState(0)

    // 添加流动性 弹窗控制
    const [isAddLiquidityOpen, setisAddLiquidityOpen] = useState(false)

    //  读取用户address 在 LP Token 的余额
    const { data: lptokenData, isSuccess: isSuccessLpTokenBalance } = useBalance({
        address,
        token: pool.lpTokenAddress,
        // @ts-ignore
        enabled: isShowConfirm // 当用户点击approve 打开弹窗后才去获取
    })

    //  读取用户address 在  token0 的余额
    const { data: tokenOneData, isSuccess: isSuccessTokenOne } = useBalance({
        address,
        token: pool.token0,
        // @ts-ignore
        enabled: isAddLiquidityOpen // 当用户点击approve 打开弹窗后才去获取
    })
    //  读取用户address 在  token1 的余额
    const { data: tokenTwoData, isSuccess: isSuccessTokenTwo } = useBalance({
        address,
        token: pool.token1,
        // @ts-ignore
        enabled: isAddLiquidityOpen // 当用户点击approve 打开弹窗后才去获取
    })

    useEffect(() => {
        if (isSuccessTokenOne) {
            let value
            value = tokenOneData.value
            value = formatEther(value)
            value = Number(value)
            settokenOneBalance(value)
        }
        if (isSuccessTokenTwo) {
            let value
            value = tokenTwoData.value
            value = formatEther(value)
            value = Number(value)
            settokenTwoBalance(value)
        }
    }, [isSuccessTokenOne, tokenOneData, isSuccessTokenTwo, tokenTwoData])

    const [isTxDetailOpen, setisTxDetailOpen] = useState(false)
    const [isTxDetailErrorOpen, setisTxDetailErrorOpen] = useState(false)
    const [txDetailError, settxDetailError] = useState('')
    const [txHash, settxHash] = useState('')

    useEffect(() => {
        if (isSuccessLpTokenBalance) {
            let value
            value = lptokenData.value
            value = formatEther(value)
            value = Number(value)
            setuserLPtokenBalance(value)
        }
    }, [isSuccessLpTokenBalance, lptokenData])

    const ChangeAmount = (e: any) => {
        const target = e.target as HTMLInputElement
        let value = target.value
        setamount(value)
    }

    const handleTokenOneMax = () => {
        setamount(String(userLPtokenBalance))
    }

    const handleApprove = () => {
        setisShowConfirm(true)
    }

    // 用户进行staked操作
    const handleConfirm = async () => {
        setconfirmLoading(true)
        // approve
        let approveReceipt
        try {
            const res = await writeContract(config, {
                address: pool.lpTokenAddress,
                functionName: 'approve',
                args: [masterChefV2Address, parseEther(amount)],
                abi: pairAbi
            })

            approveReceipt = await waitForTransactionReceipt(config, {
                hash: res
            })
        } catch (error) {
            setconfirmLoading(false)
            return
        }

        // staked
        if (approveReceipt.status === 'success') {
            let txReceipt
            try {
                const res = await writeContract(config, {
                    address: masterChefV2Address,
                    abi: masterchefv2Abi,
                    functionName: 'deposit',
                    args: [pool.poolId, parseEther(amount)]
                })

                txReceipt = await waitForTransactionReceipt(config, {
                    hash: res
                })

                if (txReceipt.status === 'success') {
                    setconfirmLoading(false)
                    setisShowConfirm(false)
                    setisTxDetailOpen(true)
                    settxHash(res)
                }
            } catch (error) {
                setconfirmLoading(false)
                setisShowConfirm(false)
                setisTxDetailErrorOpen(true)
                settxDetailError((error as BaseError).shortMessage)
            }
        }
    }

    // 提取用户已经赚取的收益 earn
    const handleHarvest = async () => {
        let txReceipt
        try {
            const res = await writeContract(config, {
                address: masterChefV2Address,
                abi: masterchefv2Abi,
                functionName: 'deposit',
                args: [pool.poolId, parseEther('0')]
            })

            txReceipt = await waitForTransactionReceipt(config, {
                hash: res
            })

            if (txReceipt.status === 'success') {
                setconfirmLoading(false)
                setisShowConfirm(false)
                setisTxDetailOpen(true)
                settxHash(res)
            }
        } catch (error) {
            setconfirmLoading(false)
            setisShowConfirm(false)
            setisTxDetailErrorOpen(true)
            settxDetailError((error as BaseError).shortMessage)
        }
    }

    const isDisableConfirm = useMemo(() => {
        if (userLPtokenBalance === 0) return true
        if (!parseFloat(amount)) return true // 0 NAN
        return parseFloat(amount) > 0 && userLPtokenBalance < parseFloat(amount)
    }, [userLPtokenBalance, amount])

    const [isShowWithdraw, setisShowWithdraw] = useState(false)
    const [withdrawAmount, setwithdrawAmount] = useState('')
    const [withdrawLoading, setwithdrawLoading] = useState(false)

    const isAbleWithdraw = useMemo(() => {
        if (userLPtokenBalance === 0) return false
        return userLPtokenBalance > parseFloat(withdrawAmount)
    }, [userLPtokenBalance, withdrawAmount])

    const handleWithdraw = () => {
        setisShowWithdraw(true)
    }

    const handleWithdrawAll = () => {
        setwithdrawAmount(String(userLPtokenBalance))
    }

    const changeWithdrawAmount = (e: any) => {
        const target = e.target as HTMLInputElement
        let value = target.value
        setwithdrawAmount(value)
    }

    // 用户点击 - 按钮 ，减少staked的数量
    const withdrawFn = async () => {
        setwithdrawLoading(true)
        let txReceipt
        try {
            const res = await writeContract(config, {
                address: masterChefV2Address,
                abi: masterchefv2Abi,
                functionName: 'withdraw',
                args: [pool.poolId, parseEther(withdrawAmount)]
            })

            txReceipt = await waitForTransactionReceipt(config, {
                hash: res
            })

            if (txReceipt.status === 'success') {
                setisShowWithdraw(false)
                setwithdrawLoading(false)
                setisTxDetailOpen(true)
                settxHash(res)
            }
        } catch (error) {
            setisShowWithdraw(false)
            setwithdrawLoading(false)
            setisTxDetailErrorOpen(true)
            settxDetailError((error as BaseError).shortMessage)
        }
    }

    const [isDetail, setisDetail] = useState(false)

    const isEnableHarvest = useMemo(() => {
        return Number(pool.pendingCake) > 0
    }, [pool.pendingCake])

    const getPoolPairToken0Img = useMemo(() => {
        if (pool.token0Symbol) {
            const item =
                chainId === 56
                    ? tokenList.find(
                          (e) => e.ticker.toUpperCase() === pool.token0Symbol.toUpperCase()
                      )
                    : bnbTestToken.find(
                          (e) => e.ticker.toUpperCase() === pool.token0Symbol.toUpperCase()
                      )
            if (item) return item.img
        }
    }, [pool.token0Symbol, chainId])

    const getPoolPairToken1Img = useMemo(() => {
        if (pool.token1Symbol) {
            const item =
                chainId === 56
                    ? tokenList.find(
                          (e) => e.ticker.toUpperCase() === pool.token1Symbol.toUpperCase()
                      )
                    : bnbTestToken.find(
                          (e) => e.ticker.toUpperCase() === pool.token1Symbol.toUpperCase()
                      )
            if (item) return item.img
        }
    }, [pool.token1Symbol, chainId])

    const [tokenOneLiquidityAmount, settokenOneLiquidityAmount] = useState('')
    const [tokenTwoLiquidityAmount, settokenTwoLiquidityAmount] = useState('')

    const ChangeTokenOneLiquidity = (e: any) => {
        const target = e.target as HTMLInputElement
        let value = target.value
        settokenOneLiquidityAmount(value)
        if (value && prices) {
            const amount = parseFloat(value) * prices
            settokenTwoLiquidityAmount(amount.toFixed(18))
        } else {
            settokenTwoLiquidityAmount('0')
        }
    }

    const handleTokenOneLiquidityMax = () => {
        settokenOneLiquidityAmount(tokenOneBalance.toString())
        if (tokenOneBalance && prices) {
            const value = tokenOneBalance * prices
            settokenTwoLiquidityAmount(value.toFixed(18))
        } else {
            settokenTwoLiquidityAmount('0')
        }
    }

    const ChangeTokenTwoLiquidity = (e: any) => {
        const target = e.target as HTMLInputElement
        let value = target.value
        settokenTwoLiquidityAmount(value)
        if (value && switchPrices) {
            const amount = Number(value) * switchPrices
            settokenOneLiquidityAmount(amount.toFixed(18))
        } else {
            settokenOneLiquidityAmount('0')
        }
    }

    const handleTokenTwoLiquidityMax = () => {
        settokenTwoLiquidityAmount(tokenTwoBalance.toString())

        if (tokenTwoBalance && switchPrices) {
            const value = tokenOneBalance * switchPrices
            settokenOneLiquidityAmount(value.toFixed(18))
        } else {
            settokenOneLiquidityAmount('0')
        }
    }

    const isAddLiquidityDisable = useMemo(() => {
        if (!tokenOneBalance || !tokenTwoBalance) return true
        const token0LQAmount = parseFloat(tokenOneLiquidityAmount)
        const token1LQAmount = parseFloat(tokenTwoLiquidityAmount)
        if (!token0LQAmount || !token1LQAmount) return true
        return tokenOneBalance < token0LQAmount || tokenTwoBalance < token1LQAmount
    }, [tokenOneBalance, tokenTwoBalance, tokenOneLiquidityAmount, tokenTwoLiquidityAmount])

    const getAddLiquidityButtonText = useMemo(() => {
        if (
            (!isAddLiquidityDisable && !parseFloat(tokenOneLiquidityAmount)) ||
            !parseFloat(tokenTwoLiquidityAmount)
        )
            return 'Enter an amount'
        const token0LQAmount = tokenOneLiquidityAmount ? parseFloat(tokenOneLiquidityAmount) : 0
        const token1LQAmount = tokenTwoLiquidityAmount ? parseFloat(tokenTwoLiquidityAmount) : 0
        if (token0LQAmount > tokenOneBalance) return `${pool.token0Symbol} Insufficient Balance`
        if (token1LQAmount > tokenTwoBalance) return `${pool.token1Symbol} Insufficient Balance`
        return 'Add'
    }, [
        isAddLiquidityDisable,
        tokenOneLiquidityAmount,
        tokenTwoLiquidityAmount,
        pool.token0Symbol,
        pool.token1Symbol,
        tokenOneBalance,
        tokenTwoBalance
    ])

    // 获取流动性池中 token0  的地址
    const { data: token0Data } = useReadContract({
        address: pool.lpTokenAddress,
        abi: pairAbi,
        functionName: 'token0',
        // @ts-ignore
        enabled: !!isAddLiquidityOpen
    }) as {
        data: string
    }

    // 获取pair 交易对的价格，添加流动性以比例添加
    const [prices, setprices] = useState(0)
    const [switchPrices, setswitchPrices] = useState(0)
    const { data: pairReservesData } = useReadContract({
        address: pool.lpTokenAddress,
        abi: pairAbi,
        functionName: 'getReserves',
        // @ts-ignore
        enabled: !!isAddLiquidityOpen // 确保在 打开添加流动性弹窗 时才进行查询
    }) as {
        data: bigint[]
    }

    // 计算价格并更新
    useEffect(() => {
        if (pairReservesData) {
            const reserve0 = parseInt(pairReservesData[0].toString()) // reserve0 对应 token0
            const reserve1 = parseInt(pairReservesData[1].toString()) // reserve1 对应 token1

            // price == a/b
            // switchPrices = b/a
            let price, price2
            const token0 = token0Data.toUpperCase()

            if (token0 === pool.token0.toUpperCase()) {
                price = reserve1 / reserve0
                price2 = reserve0 / reserve1

                setprices(Number(price.toFixed(18)))
                setswitchPrices(Number(price2.toFixed(18)))
            } else if (token0 === pool.token1.toUpperCase()) {
                price = reserve0 / reserve1
                price2 = reserve1 / reserve0

                setprices(Number(price.toFixed(18)))
                setswitchPrices(Number(price2.toFixed(18)))
            } else {
                setprices(0)
                setswitchPrices(0)
            }
        }
    }, [pairReservesData, token0Data, pool.token0, pool.token1])

    const [confirmAddLoading, setconfirmAddLoading] = useState(false)
    // 点击打开 确认添加流动性 弹窗
    const handleAddLiquidity = () => {
        setisShowAddConfirm(true)
    }

    const [isShowAddConfirm, setisShowAddConfirm] = useState(false)
    // 获取总的LP数量
    const { data: totalSupplyLP, isSuccess: isSuccessLP } = useReadContract({
        address: pool.lpTokenAddress,
        abi: pairAbi,
        functionName: 'totalSupply',
        // @ts-ignore
        enabled: !!isShowAddConfirm //  打开 确认添加流动性 弹窗时才进行查询
    }) as {
        data: bigint
        isSuccess: Boolean
    }

    const [lpReceive, setLpReceive] = useState('0')
    const [userShare, setUserShare] = useState('0')
    useEffect(() => {
        if (
            isSuccessLP &&
            Number(tokenOneLiquidityAmount) !== 0 &&
            Number(tokenOneLiquidityAmount) !== 0 &&
            formatEther(totalSupplyLP) !== '0'
        ) {
            const reserveA = pairReservesData[0]
            const reserveB = pairReservesData[1]

            // 计算用户将收到的 LP 代币数量
            const calculatedLpReceivedA =
                (parseEther(tokenOneLiquidityAmount) * totalSupplyLP) / reserveA
            const calculatedLpReceivedB =
                (parseEther(tokenTwoLiquidityAmount) * totalSupplyLP) / reserveB

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
    }, [
        isSuccessLP,
        totalSupplyLP,
        pairReservesData,
        tokenOneLiquidityAmount,
        tokenTwoLiquidityAmount,
        lpReceive
    ])

    // 最终确认 添加流动性
    const handleConfirmAdd = async () => {
        setconfirmAddLoading(true)
        // 授权后 才能 confirm 交易

        let approve1Receipt, approve2Receipt
        try {
            const res = await writeContract(config, {
                address: pool.token0,
                abi: bep20Abi,
                functionName: 'approve',
                args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, parseEther(tokenOneLiquidityAmount)]
            })

            approve1Receipt = await waitForTransactionReceipt(config, {
                hash: res
            })
        } catch (error) {
            setconfirmAddLoading(false)
            setisShowAddConfirm(false)
            return
        }

        try {
            const res = await writeContract(config, {
                address: pool.token1,
                abi: bep20Abi,
                functionName: 'approve',
                args: [PANCAKE_SWAP_V2_ROUTER_ADDRESS, parseEther(tokenTwoLiquidityAmount)]
            })
            approve2Receipt = await waitForTransactionReceipt(config, {
                hash: res
            })
        } catch (error) {
            setconfirmAddLoading(false)
            setisShowAddConfirm(false)
            return
        }

        if (approve1Receipt.status === 'success' && approve2Receipt.status === 'success') {
            handleAddAfterApprove()
        }
    }

    const handleAddAfterApprove = async () => {
        let txReceipt
        const slippageFactor = parseEther((1 - Number(slippage) / 100).toString())
        const intputTokenOneAmount = parseEther(tokenOneLiquidityAmount)
        const intputTokenTwoAmount = parseEther(tokenTwoLiquidityAmount)
        const minTokenOneAmount = (intputTokenOneAmount * slippageFactor) / parseEther('1')
        const minTokenTwoAmount = (intputTokenTwoAmount * slippageFactor) / parseEther('1')
        try {
            const res = await writeContract(config, {
                address: PANCAKE_SWAP_V2_ROUTER_ADDRESS,
                abi: cakeV2RouterAbi,
                functionName: 'addLiquidity',
                args: [
                    pool.token0,
                    pool.token1,
                    intputTokenOneAmount,
                    intputTokenTwoAmount,
                    minTokenOneAmount,
                    minTokenTwoAmount,
                    address,
                    Math.floor(Date.now() / 1000) + 60 * Number(liquidity.currentMinutes)
                ]
            })
            txReceipt = await waitForTransactionReceipt(config, {
                hash: res
            })
            if (txReceipt.status === 'success') {
                waitForTransactionReceipt
                setisShowAddConfirm(false)
                setconfirmAddLoading(false)
                setisTxDetailOpen(true)
                settxHash(res)
            }
        } catch (error) {
            setisShowAddConfirm(false)
            setconfirmAddLoading(false)
            setisAddLiquidityOpen(false)
            setisTxDetailErrorOpen(true)
            settxDetailError((error as BaseError).shortMessage)
        }
    }

    const toThousands = function (num: any) {
        var l
        if (num < 0) {
            l = 4
        } else {
            l = 3
        }
        let tail = ''
        let ind = num.toString().indexOf('.')
        if (ind > 0) {
            tail = num.toString().substr(ind)
        }

        num = Math.floor(num)
        num = (num || 0).toString()
        let result = ''
        while (num.length > l) {
            result = ',' + num.slice(-3) + result
            num = num.slice(0, num.length - 3)
        }
        if (num) {
            result = num + result
        }
        return result + tail
    }

    const getApr = useMemo(() => {
        if (!pool.apr) return '0%'
        if (pool.apr.toFixed(2) === '0.00') {
            return '0%'
        }
        return `${pool.apr.toFixed(2)}%`
    }, [pool.apr])
    return (
        <Card shadow='sm' padding='lg' style={{ backgroundColor: '#171717', color: '#fff' }}>
            <Card.Section style={{ padding: '20px' }}>
                <Group
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '20px'
                    }}
                >
                    <div className='relative flex flex-1' style={{}}>
                        <Image
                            src={getPoolPairToken0Img}
                            alt=''
                            style={{
                                width: '25px'
                            }}
                        />
                        <Image
                            src={getPoolPairToken1Img}
                            alt=''
                            style={{
                                width: '50px',
                                position: 'absolute',
                                top: '8px',
                                left: '8px'
                            }}
                        />
                    </div>
                    <div className='flex items-center'>
                        <Badge
                            color='red'
                            variant='filled'
                            size='sm'
                            style={{
                                backgroundColor: '#7a1a15',
                                color: 'white',
                                marginRight: '.5rem'
                            }}
                        >
                            X{pool.boostMultiplier}
                        </Badge>
                        <Text size='sm'>
                            {pool.token1Symbol}-{pool.token0Symbol}
                        </Text>
                    </div>
                </Group>
            </Card.Section>

            <Stack mt='md'>
                <Group
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}
                >
                    <Text
                        size='sm'
                        style={{
                            color: '#999'
                        }}
                    >
                        APR:
                    </Text>
                    <Text size='sm' style={{ color: '#ff5c00' }}>
                        {getApr}
                    </Text>
                </Group>
                <Group
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}
                >
                    <Text
                        size='sm'
                        style={{
                            color: '#999'
                        }}
                    >
                        Deposit Fee:
                    </Text>
                    <Text size='sm'>0.25%</Text>
                </Group>
                <Group
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}
                >
                    <Text size='sm'>{pool.token0Symbol}</Text>
                    <Text size='sm'>{pool.token1Symbol}</Text>
                </Group>

                <div>
                    <div className='flex items-center'>
                        <span className='mr-2'>CAKE</span>
                        <div className={style.custom_text}>Earned</div>
                    </div>
                    <Text>{pool.pendingCake}</Text>
                </div>

                <div className='flex'>
                    <Button
                        variant='light'
                        color={isEnableHarvest ? '#F15223' : 'gray'}
                        size='xs'
                        style={{ width: '100%', borderColor: '', backgroundColor: '#1f1f1f' }}
                        disabled={!isEnableHarvest}
                        onClick={() => handleHarvest()}
                    >
                        Harvest
                    </Button>
                    {/* <Button
                        variant='outline'
                        color='gray'
                        size='xs'
                        style={{ width: '48%', borderColor: '#444' }}
                        onClick={() => handleCompund()}
                    >
                        Compound
                    </Button> */}
                </div>

                <div>
                    <div className='flex items-center'>
                        <span className='mr-2'>
                            {pool.token1Symbol}-{pool.token0Symbol} LP
                        </span>
                        <div className={style.custom_text}>Staked</div>
                    </div>
                </div>

                {pool.userStakedAmount === 0 && (
                    <MyButton fn={() => handleApprove()} text='Approve' loading={false} />
                )}
                {pool.userStakedAmount > 0 && (
                    <Group justify='space-between'>
                        <Text>{pool.userStakedAmount}</Text>

                        <Group
                            style={{
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Button
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #F15223',
                                    color: '#F15223',
                                    fontSize: '20px'
                                }}
                                onClick={() => handleWithdraw()}
                            >
                                -
                            </Button>
                            <button
                                style={{
                                    background:
                                        'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)',
                                    width: '47px',
                                    height: '36px'
                                }}
                                className={`text-[20px] rounded-[4px] text-white relative`}
                                onClick={() => handleApprove()}
                            >
                                +
                            </button>
                        </Group>
                    </Group>
                )}

                <div
                    className='flex text-[#f15223] justify-center cursor-pointer'
                    onClick={() => setisDetail(!isDetail)}
                >
                    <span>{isDetail ? 'Hide' : 'Details'}</span>
                    {isDetail ? (
                        <IconChevronUp className='w-8 text-[#f15223]' />
                    ) : (
                        <IconChevronDown className='w-8 text-[#f15223]' />
                    )}
                </div>

                <Collapse in={isDetail}>
                    <div className='flex flex-col '>
                        <div>Staked Liquidity:</div>
                        <div className='mt-2 text-end'>
                            ${' '}
                            {pool.cakeStakedInUsdt &&
                                toThousands(Math.floor(pool.cakeStakedInUsdt))}
                        </div>
                    </div>
                    <Group
                        justify='end'
                        style={{
                            marginTop: '10px'
                        }}
                    >
                        <Button
                            variant='transparent'
                            color='#f15223'
                            style={{
                                padding: '0'
                            }}
                            onClick={() => setisAddLiquidityOpen(true)}
                        >
                            Add {pool.token1Symbol}-{pool.token0Symbol} LP
                        </Button>
                    </Group>
                </Collapse>
            </Stack>

            {/* 质押 弹窗 */}
            <MyModal
                title={`Deposit ${pool.token1Symbol}-${pool.token0Symbol} LP token`}
                isOpen={isShowConfirm}
                closeFn={() => {
                    setisShowConfirm(false)
                    setamount('')
                }}
            >
                <div className='w-full flex justify-between items-center px-4 py-2 bg-[#1f1f1f] rounded-lg'>
                    <div>
                        <div className='mb-2 text-[#999] '>Amount</div>
                        <TextInput
                            type='number'
                            variant='unstyled'
                            value={amount}
                            onChange={(e) => ChangeAmount(e)}
                            classNames={{
                                root: style.text
                            }}
                            placeholder='please enter an amount'
                        />
                    </div>
                    <div className='flex flex-col items-end'>
                        <div className='mb-2 text-[#999] '>Available: {userLPtokenBalance}</div>
                        <button
                            onClick={() => handleTokenOneMax()}
                            className='cursor-pointer  text-[#F15223]  border border-[#F15223] rounded-xl px-2 py-1'
                        >
                            Max
                        </button>
                    </div>
                </div>
                {isDisableConfirm && (
                    <Button
                        style={{
                            background: '#1f1f1f',
                            marginTop: '16px',
                            width: '100%',
                            borderRadius: '8px',
                            color: '#777',
                            height: '35px',
                            borderColor: '#777'
                        }}
                        disabled
                    >
                        Insufficient Balance
                    </Button>
                )}
                {!isDisableConfirm && (
                    <MyButton text='Confirm' loading={confirmLoading} fn={() => handleConfirm()} />
                )}
            </MyModal>

            {/* 减少质押 弹窗 */}
            <MyModal
                title={`Withdraw ${pool.lpTokenSymbol} token`}
                isOpen={isShowWithdraw}
                closeFn={() => setisShowWithdraw(false)}
            >
                <div className='w-full flex justify-between items-center px-4 py-2 bg-[#1f1f1f] rounded-lg'>
                    <div>
                        <div className='mb-2 text-[#999] '>Amount</div>
                        <TextInput
                            variant='unstyled'
                            value={withdrawAmount}
                            onChange={(e) => changeWithdrawAmount(e)}
                            classNames={{
                                root: style.text
                            }}
                            placeholder='please enter an amount'
                        />
                    </div>
                    <div className='flex flex-col items-end'>
                        <div className='mb-2 text-[#999] '>
                            Available: {userLPtokenBalance} {pool.lpTokenSymbol}
                        </div>
                        <button
                            onClick={() => handleWithdrawAll()}
                            className='cursor-pointer  text-[#F15223]  border border-[#F15223] rounded-xl px-2 py-1'
                        >
                            Max
                        </button>
                    </div>
                </div>

                {!isAbleWithdraw && (
                    <Button
                        style={{
                            background: '#1f1f1f',
                            marginTop: '16px',
                            width: '100%',
                            borderRadius: '8px',
                            color: '#777',
                            height: '35px',
                            borderColor: '#777'
                        }}
                        disabled
                    >
                        Insufficient Balance
                    </Button>
                )}
                {isAbleWithdraw && (
                    <MyButton text='withdraw' loading={withdrawLoading} fn={() => withdrawFn()} />
                )}
            </MyModal>

            {/* 交易成功 弹窗 */}
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
                            const url =
                                chainId === 56
                                    ? 'https://bscscan.com'
                                    : 'https://testnet.bscscan.com'
                            window.open(`${url}/tx/${txHash}`)
                        }}
                        color='#F15223'
                        className='mt-4'
                    >
                        View On Bscscan
                    </Button>
                </div>
            </MyModal>

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

            {/* 添加池子流动性 弹窗 */}
            <MyModal
                title='Add Liquidity'
                isOpen={isAddLiquidityOpen}
                closeFn={() => setisAddLiquidityOpen(false)}
            >
                <div className='w-full flex flex-col items-center text-sm'>
                    <Popover width={350} position='bottom-end' offset={0} withArrow shadow='md'>
                        <Popover.Target>
                            <div className='w-full flex justify-end my-2'>
                                <IconSettings className='cursor-pointer' />
                            </div>
                        </Popover.Target>
                        <Popover.Dropdown className={style.dropdown}>
                            <div className='p-6 text-white'>
                                <div className='mb-6'>
                                    <h2 className='text-xl font-medium flex items-center space-x-2'>
                                        <span>Slippage Tolerance</span>
                                        <span className='text-sm border border-white rounded-full w-5 h-5 flex justify-center items-center cursor-pointer'>
                                            ?
                                        </span>
                                    </h2>
                                    <div className='flex mt-4'>
                                        <button
                                            onClick={() => setSlippage('0.1')}
                                            className={`${
                                                slippage === '0.1'
                                                    ? 'bg-red-500 text-black'
                                                    : 'bg-[#1f1f1f] text-red-500'
                                            } basis-1/3    rounded-lg py-2 px-4`}
                                        >
                                            0.1%
                                        </button>
                                        <button
                                            onClick={() => setSlippage('0.5')}
                                            className={`${
                                                slippage === '0.5'
                                                    ? 'bg-red-500 text-black'
                                                    : 'bg-[#1f1f1f] text-red-500'
                                            } basis-1/3 mx-2   rounded-lg py-2 px-4`}
                                        >
                                            0.5%
                                        </button>
                                        <button
                                            onClick={() => setSlippage('1.0')}
                                            className={`${
                                                slippage === '1.0'
                                                    ? 'bg-red-500 text-black'
                                                    : 'bg-[#1f1f1f] text-red-500'
                                            } basis-1/3    rounded-lg py-2 px-4`}
                                        >
                                            1.0%
                                        </button>
                                    </div>
                                    <div className='bg-[#1f1f1f] rounded-lg mt-4 p-4 flex items-center'>
                                        <TextInput
                                            type='number'
                                            variant='unstyled'
                                            value={slippage}
                                            onChange={(event) => changeSlippage(event.target.value)}
                                            classNames={{
                                                root: style.text
                                            }}
                                            placeholder='please enter an amount'
                                        />
                                        <span className='text-gray-400'>%</span>
                                    </div>
                                </div>
                                <div>
                                    <h2 className='font-medium flex items-center space-x-2'>
                                        <span className='text-xl'>Tx Deadline</span>
                                        <span className='text-sm border border-white rounded-full w-5 h-5 flex justify-center items-center cursor-pointer'>
                                            ?
                                        </span>
                                    </h2>
                                    <div className='bg-[#1f1f1f] rounded-lg mt-4 p-4 flex items-center justify-between'>
                                        <TextInput
                                            type='number'
                                            variant='unstyled'
                                            value={currentMinutes}
                                            onChange={(event) => changeDeadLine(event.target.value)}
                                            classNames={{
                                                root: style.text
                                            }}
                                            placeholder='please enter an amount'
                                        />
                                        <span className='text-gray-400'>Minutes</span>
                                    </div>
                                </div>
                            </div>
                        </Popover.Dropdown>
                    </Popover>
                    {/* token1 */}
                    <div className='w-full flex justify-between items-center px-4 py-2 bg-[#1f1f1f] rounded-lg'>
                        <div>
                            <div className='mb-2'>Amount</div>
                            <TextInput
                                type='number'
                                variant='unstyled'
                                value={tokenOneLiquidityAmount}
                                onChange={(e) => ChangeTokenOneLiquidity(e)}
                                classNames={{
                                    root: style.text
                                }}
                                placeholder='please enter an amount'
                            />
                        </div>
                        <div className='flex flex-col items-end'>
                            <div className='mb-2'>Balance: {tokenOneBalance}</div>
                            <div className='flex items-center justify-end'>
                                <button
                                    onClick={() => handleTokenOneLiquidityMax()}
                                    className='cursor-pointer mr-2 text-[#F15223] border border-[#F15223] rounded-xl px-2 py-1'
                                >
                                    Max
                                </button>
                                <Image
                                    src={getPoolPairToken0Img}
                                    alt=''
                                    style={{
                                        width: '40px',
                                        height: '40px'
                                    }}
                                />
                                <span className='text-white mx-2'>{pool.token0Symbol}</span>
                            </div>
                        </div>
                    </div>

                    {/* token2 */}
                    <div className='w-full flex justify-between items-center px-4 py-2 bg-[#1f1f1f] rounded-lg'>
                        <div>
                            <div className='mb-2'>Amount</div>
                            <TextInput
                                type='number'
                                variant='unstyled'
                                value={tokenTwoLiquidityAmount}
                                onChange={(e) => ChangeTokenTwoLiquidity(e)}
                                classNames={{
                                    root: style.text
                                }}
                                placeholder='please enter an amount'
                            />
                        </div>
                        <div className='flex flex-col items-end'>
                            <div className='mb-2'>Balance: {tokenTwoBalance}</div>
                            <div className='flex items-center justify-end'>
                                <button
                                    onClick={() => handleTokenTwoLiquidityMax()}
                                    className='cursor-pointer mr-2 text-[#F15223] border border-[#F15223] rounded-xl px-2 py-1'
                                >
                                    Max
                                </button>
                                <Image
                                    src={getPoolPairToken1Img}
                                    alt=''
                                    style={{
                                        width: '40px',
                                        height: '40px'
                                    }}
                                />
                                <span className='text-white ml-2 mx-2'>{pool.token1Symbol}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        style={{
                            background: !isAddLiquidityDisable
                                ? 'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                                : '#1f1f1f',
                            color: 'white',
                            cursor: isAddLiquidityDisable ? 'not-allowed' : '',
                            border: '1px solid #777'
                        }}
                        disabled={isAddLiquidityDisable}
                        className='my-8 w-full px-4 py-2 rounded-xl'
                        onClick={() => handleAddLiquidity()}
                    >
                        {getAddLiquidityButtonText}
                    </button>
                </div>
            </MyModal>

            {/* 确认添加流动性 弹窗 */}
            <MyModal title='You Will Receive' isOpen={isShowAddConfirm} closeFn={() => {}}>
                <div className='flex items-center'>
                    <div className={style.cctext}>{lpReceive}</div>
                    <Image
                        src={getPoolPairToken0Img}
                        alt=''
                        style={{
                            width: '30px',
                            height: '30px'
                        }}
                    ></Image>
                    <Image
                        src={getPoolPairToken1Img}
                        alt=''
                        style={{
                            width: '30px',
                            height: '30px',
                            marginLeft: '-10px'
                        }}
                    ></Image>

                    <div className='ml-4'>
                        {pool.token0Symbol}-{pool.token1Symbol} LP
                    </div>
                </div>

                <div className='text-[#999] text-sm my-10'>
                    Output is estimated. if the price changes by more than {liquidity.slippage}%
                    your trasaction will revert.
                </div>
                <div className='flex justify-between mb-4'>
                    {pool.token0Symbol} Deposited
                    <div className='flex items-center'>
                        {tokenOneLiquidityAmount}
                        <Image
                            src={getPoolPairToken0Img}
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
                    {pool.token1Symbol} Deposited
                    <div className='flex items-center'>
                        {tokenTwoLiquidityAmount}
                        <Image
                            src={getPoolPairToken1Img}
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
                        1 {pool.token0Symbol} ≈ {prices} {pool.token1Symbol}
                    </div>
                </div>

                <div className='flex justify-between mb-4'>
                    <div className='w-4' />
                    <div>
                        1 {pool.token1Symbol} ≈ {switchPrices} {pool.token0Symbol}
                    </div>
                </div>

                <div className='flex justify-between mb-6'>
                    Share of Pool
                    <div>{userShare}%</div>
                </div>

                <MyButton text='Confirm Add' fn={handleConfirmAdd} loading={confirmAddLoading} />
            </MyModal>
        </Card>
    )
}