import Image from 'next/image'
import style from './Card.module.css'

const Card = (props: any) => {
    const { isBalance = false, title, subtitle, value, unit, actionLabel } = props
    if (isBalance)
        return (
            <div className='bg-[#141414] text-white rounded-2xl p-6 flex  justify-between'>
                <div>
                    <h2 className='text-xl font-bold'>{title}</h2>
                    <div className='flex items-end'>
                        <div className={`${style.text2} text-lg font-semibold mr-4 pt-2`}>
                            {value}
                        </div>
                        <div className='text-white text-xs'>{unit}</div>
                    </div>
                </div>
            </div>
        )
    return (
        <div className='bg-[#141414] text-white rounded-2xl  flex  justify-between relative'>
            <div className='basis-1/2 p-6 '>
                <p className='text-sm'>{subtitle}</p>
                <button
                    style={{
                        background:
                            'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)',
                    }}
                    className='w-full  mt-4 px-4 py-2 rounded-lg text-white text-sm'
                >
                    {actionLabel}
                </button>
            </div>
            <div className='basis-1/2 relative '>
                <Image
                    src={'/images/BG.png'}
                    width={100}
                    height={100}
                    alt=''
                    style={{ width: '100%', height: '100%', borderRadius: '.75rem' }}
                ></Image>
                <div
                    style={{ width: '95%' }}
                    className=' absolute top-4 left-0 bg-[rgba(255,255,255,0.05)] rounded-xl py-4 px-8 font-semibold'
                >
                    <div className='flex items-center mb-2'>
                        <Image
                            className='mr-2'
                            src={'/logo.png'}
                            width={40}
                            height={40}
                            alt=''
                        ></Image>
                        <div>Earn AM</div>
                    </div>
                    <div className={style.text}>{value}% APR</div>
                </div>
            </div>
        </div>
    )
}

export default Card
