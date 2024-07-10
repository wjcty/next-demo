import Image from 'next/image'
import style from './FarmCard.module.css'

const FarmCard = (props: any) => {
    const { pair, apr, liquidity, isHot } = props
    return (
        <div className='bg-[#141414] text-white rounded-lg p-6'>
            <div className='flex items-center justify-between'>
                <div className='w-full flex items-start justify-between'>
                    <Image src='/logo.png' alt='' width={50} height={50} />
                    {isHot && (
                        <span className='bg-[#402017] text-sm px-2 py-1 rounded-full text-[#F15223]'>
                            HOT
                        </span>
                    )}
                </div>
            </div>
            <div className='text-xl font-bold py-2'>{pair}</div>
            <p className='text-sm text-gray-400'>Liquidity ${liquidity}</p>
            <div className={`${style.text} text-1.5 font-semibold mt-4`}>{apr}% APR</div>
            <button
                style={{
                    background: 'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)'
                }}
                className='w-full mt-4 px-4 py-2 rounded-xl'
            >
                Farm
            </button>
        </div>
    )
}

export default FarmCard
