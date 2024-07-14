import {
    Card,
    Text,
    Button,
    Group,
    Image,
    Stack,
    TextInput,
    Collapse,
    Tooltip
} from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconXboxX, IconAlarm } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import style from './page.module.scss'
import bep20Abi from '@/constants/bep20Abi.json'
import { formatEther, parseEther } from 'viem'
import { useAccount, useBalance, BaseError } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import masterchefv2Abi from '@/constants/masterchefv2Abi.json'
import MyModal from '@/components/myModal/page'
import MyButton from '@/components/myButton/page'
import bnbTestToken from '@/constants/bnbTestToken.json'
import tokenList from '@/constants/tokenList.json'
import { config } from '@/lib/config'

type TObject = {
    name: string
    apr: string
    lockup: string
    image: string
    userStakedAmount: number // 用户已经 质押的LP 数量
    pendingReward: string // 用户目前 earn 的数量
    stakedToken: `0x${string}`
    rewardToken: `0x${string}`
    poolId: number
    totalStaked: string
    stakedTokenSymbol: string
    rewardTokenSymbol: string
    endsInDay: number
    endsInSeconds: string
}

export default function PoolCard({ pool }: { pool: TObject }) {
    const { address, chainId } = useAccount()

    const masterChefV2Address =
        chainId === 56
            ? '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652'
            : '0xB4A466911556e39210a6bB2FaECBB59E4eB7E43d'

    const [isShowConfirm, setisShowConfirm] = useState(false)
    // 控制弹窗内的按钮loading
    const [confirmLoading, setconfirmLoading] = useState(false)
    const [amount, setamount] = useState('')
    const [stakedTokenBalance, setstakedTokenBalance] = useState(0)

    //  读取用户address 在 stakedToken 的余额
    const { data: lptokenData, isSuccess: isSuccessLpTokenBalance } = useBalance({
        address,
        token: pool.stakedToken,
        // @ts-ignore
        enabled: !!isShowConfirm // 当用户点击approve 打开弹窗后才去获取
    })

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
            setstakedTokenBalance(value)
        }
    }, [isSuccessLpTokenBalance, lptokenData])

    const ChangeAmount = (e: any) => {
        const target = e.target as HTMLInputElement
        let value = target.value
        setamount(value)
    }

    const handleTokenOneMax = () => {
        setamount(String(stakedTokenBalance))
    }

    const handleApprove = () => {
        setisShowConfirm(true)
    }

    // 用户进行staked操作 先approve
    const handleConfirm = async () => {
        setconfirmLoading(true)
        let approveReceipt
        try {
            const res = await writeContract(config, {
                address: pool.stakedToken,
                functionName: 'approve',
                args: [masterChefV2Address, parseEther(amount)],
                abi: bep20Abi
            })
            approveReceipt = await waitForTransactionReceipt(config, {
                hash: res
            })
        } catch (error) {
            setconfirmLoading(false)
            return
        }

        if (approveReceipt.status === 'success') handleStakedAfterApprove()
    }

    const handleStakedAfterApprove = async () => {
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

    // 提取用户已经赚取的收益 harvest
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
        if (stakedTokenBalance === 0) return true
        if (!parseFloat(amount)) return true // 0 NAN
        return parseFloat(amount) > 0 && stakedTokenBalance > parseFloat(amount)
    }, [stakedTokenBalance, amount])

    const [isShowWithdraw, setisShowWithdraw] = useState(false)
    const [withdrawAmount, setwithdrawAmount] = useState('')
    const [withdrawLoading, setwithdrawLoading] = useState(false)

    const isAbleWithdraw = useMemo(() => {
        if (stakedTokenBalance === 0) return false
        return stakedTokenBalance > parseFloat(withdrawAmount)
    }, [stakedTokenBalance, withdrawAmount])

    const handleWithdraw = () => {
        setisShowWithdraw(true)
    }

    const handleWithdrawAll = () => {
        setwithdrawAmount(String(stakedTokenBalance))
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
        return Number(pool.pendingReward) > 0
    }, [pool.pendingReward])

    const getPoolPairToken0Img = useMemo(() => {
        if (pool.stakedTokenSymbol) {
            const item =
                chainId === 56
                    ? tokenList.find(
                          (e) => e.ticker.toUpperCase() === pool.stakedTokenSymbol.toUpperCase()
                      )
                    : bnbTestToken.find(
                          (e) => e.ticker.toUpperCase() === pool.stakedTokenSymbol.toUpperCase()
                      )
            if (item) return item.img
        }
    }, [pool.stakedTokenSymbol, chainId])

    const getPoolPairToken1Img = useMemo(() => {
        if (pool.rewardTokenSymbol) {
            const item =
                chainId === 56
                    ? tokenList.find(
                          (e) => e.ticker.toUpperCase() === pool.rewardTokenSymbol.toUpperCase()
                      )
                    : bnbTestToken.find(
                          (e) => e.ticker.toUpperCase() === pool.rewardTokenSymbol.toUpperCase()
                      )
            if (item) return item.img
        }
    }, [pool.rewardTokenSymbol, chainId])

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
                    <div
                        className='relative flex '
                        style={{
                            width: '65px'
                        }}
                    >
                        <Image
                            src={getPoolPairToken1Img}
                            alt=''
                            style={{
                                width: '60px'
                            }}
                        />
                        <Image
                            src={getPoolPairToken0Img}
                            alt=''
                            style={{
                                width: '30px',
                                position: 'absolute',
                                right: '0',
                                bottom: '-5px'
                            }}
                        />
                    </div>
                    <div className='flex flex-col'>
                        <Text
                            style={{
                                fontSize: '20px'
                            }}
                            className={style.line_g_text}
                        >
                            Earn {pool.rewardTokenSymbol}
                        </Text>
                        <Text>Stake {pool.stakedTokenSymbol}</Text>
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
                        {pool.apr}%
                    </Text>
                </Group>

                <div>
                    <div className='flex items-center'>
                        <span className='mr-2'>{pool.rewardTokenSymbol}</span>
                        <div className={style.custom_text}>Earned</div>
                    </div>
                    <Text>{pool.pendingReward}</Text>
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
                        <span className='mr-2'>{pool.stakedTokenSymbol}</span>
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
                    <div className='flex justify-between'>
                        <div>Total Staked:</div>
                        <div>
                            {toThousands(Number(pool.totalStaked).toFixed())}{' '}
                            {pool.stakedTokenSymbol}
                        </div>
                    </div>
                    <Group
                        justify='space-between'
                        style={{
                            marginTop: '10px'
                        }}
                    >
                        Ends in:
                        <div className='flex'>
                            {pool.endsInDay} days
                            <Tooltip label={pool.endsInSeconds} color='blue'>
                                <IconAlarm className='cursor-pointer' />
                            </Tooltip>
                        </div>
                    </Group>
                </Collapse>
            </Stack>

            {/* 质押 弹窗 */}
            <MyModal
                title={`Deposit ${pool.stakedTokenSymbol} token`}
                isOpen={isShowConfirm}
                closeFn={() => setisShowConfirm(false)}
            >
                <div className='w-full flex justify-between items-center px-4 py-2 bg-[#1f1f1f] rounded-lg'>
                    <div>
                        <div className='mb-2 text-[#999] '>Amount</div>
                        <TextInput
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
                        <div className='mb-2 text-[#999] '>Available: {stakedTokenBalance}</div>
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
                title={`Withdraw ${pool.stakedTokenSymbol} token`}
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
                            Available: {stakedTokenBalance} {pool.stakedTokenSymbol}
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
        </Card>
    )
}
