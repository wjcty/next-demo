import { Popover, TextInput } from '@mantine/core'
import style from './liquidity.module.css'
import { IconSettings, IconClock } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useLiquidityStore } from '@/store/liquidity'
import _ from 'lodash'

export default function Liquidity() {
    const { liquidity, setSlippage, setTxDeadline, setCurrentMinutes } = useLiquidityStore()
    const router = useRouter()

    const slippage = _.cloneDeep(liquidity.slippage)
    const currentMinutes = _.cloneDeep(liquidity.currentMinutes)

    const changeSlippage = (e) => {
        setSlippage(e.target.value)
    }
    const changeDeadLine = (e) => {
        setCurrentMinutes(e.target.value)
        setTxDeadline()
    }

    return (
        <div className='bg-[#141414] rounded-xl p-6 text-white  mx-auto'>
            <div className='flex justify-between items-center'>
                <h1 className='text-xl font-semibold'>Liquidity</h1>
                <div className='flex space-x-2'>
                    <Popover width={350} position='bottom-end' offset={0} withArrow shadow='md'>
                        <Popover.Target>
                            <IconSettings className='cursor-pointer' />
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
                                                liquidity.slippage === '0.1'
                                                    ? 'bg-red-500 text-black'
                                                    : 'bg-[#1f1f1f] text-red-500'
                                            } basis-1/3    rounded-lg py-2 px-4`}
                                        >
                                            0.1%
                                        </button>
                                        <button
                                            onClick={() => setSlippage('0.5')}
                                            className={`${
                                                liquidity.slippage === '0.5'
                                                    ? 'bg-red-500 text-black'
                                                    : 'bg-[#1f1f1f] text-red-500'
                                            } basis-1/3 mx-2   rounded-lg py-2 px-4`}
                                        >
                                            0.5%
                                        </button>
                                        <button
                                            onClick={() => setSlippage('1.0')}
                                            className={`${
                                                liquidity.slippage === '1.0'
                                                    ? 'bg-red-500 text-black'
                                                    : 'bg-[#1f1f1f] text-red-500'
                                            } basis-1/3    rounded-lg py-2 px-4`}
                                        >
                                            1.0%
                                        </button>
                                    </div>
                                    <div className='bg-[#1f1f1f] rounded-lg mt-4 p-4 flex items-center'>
                                        <TextInput
                                            variant='unstyled'
                                            value={slippage}
                                            onChange={(e) => changeSlippage(e)}
                                            classNames={{
                                                root: style.text
                                            }}
                                            placeholder=''
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
                                            variant='unstyled'
                                            value={currentMinutes}
                                            onChange={(e) => changeDeadLine(e)}
                                            classNames={{
                                                root: style.text
                                            }}
                                            placeholder=''
                                        />
                                        <span className='text-gray-400'>Minutes</span>
                                    </div>
                                </div>
                            </div>
                        </Popover.Dropdown>
                    </Popover>

                    <Popover width={350} position='bottom-end' offset={0} withArrow shadow='md'>
                        <Popover.Target>
                            <IconClock className='cursor-pointer' />
                        </Popover.Target>
                        <Popover.Dropdown className={style.dropdown}>
                            <div className='text-white p-6'>No recent transactions</div>
                        </Popover.Dropdown>
                    </Popover>
                </div>
            </div>
            <div className='mt-6'>
                <h2 className='text-lg font-medium flex items-center space-x-2'>
                    <span>Your Liquidity</span>
                    <span className='text-sm border border-white rounded-full w-5 h-5 flex justify-center items-center cursor-pointer'>
                        ?
                    </span>
                </h2>
                <div className='bg-[#1f1f1f] rounded-lg p-6 text-center mt-4'>
                    <p>No liquidity found.</p>
                </div>
                <p className='mt-4 text-white text-sm'>
                    Do not see a pool you joined?
                    <span className='ml-2 text-red-500 cursor-pointer'>Import it</span>
                </p>
                <p className='mt-2 text-white text-sm'>
                    Or, if you staked your AM-LP tokens in a farm, unstake them to see them here.
                </p>
                <div className='mt-10 text-[#777] text-center w-full'>
                    Add liquidity to receive AM-LP tokens
                </div>
                <button
                    onClick={() => {
                        router.push('dex/addLiquidity')
                    }}
                    style={{
                        background: 'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                    }}
                    className='mt-4 w-full px-4 py-2 rounded-xl text-white'
                >
                    + Add Liquidity
                </button>
            </div>
        </div>
    )
}
