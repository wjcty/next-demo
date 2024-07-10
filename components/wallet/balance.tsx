import Image from 'next/image'
import style from './balance.module.css'
import { useState } from 'react'

type TValue = {
    value: any
}

const BalanceComp = ({ value }: TValue) => {
    const [isVisible, setisVisible] = useState<Boolean>(false)
    return (
        <div className='bg-[#141414] text-white p-6 rounded-lg shadow-lg flex flex-col'>
            <div className='flex justify-between'>
                <div className='flex item'>
                    Balance
                    <div className='ml-2 cursor-pointer' onClick={() => setisVisible(!isVisible)}>
                        <Image
                            src='/images/eye-visble.png'
                            width={0}
                            height={0}
                            alt=''
                            className='w-6 h-6'
                        />
                    </div>
                </div>
                <div className='bg-[#1f1f1f] cursor-pointer px-4 py-2 rounded-lg text-[#F15223] flex'>
                    <Image
                        src='/images/setting.png'
                        width={0}
                        height={0}
                        alt=''
                        className='w-6 h-6 mr-2'
                    />
                    Setting Wallet
                </div>
            </div>
            {isVisible && (
                <div className='flex items-end'>
                    <div className={style.text}>{value}</div>
                    <div className='ml-2 pb-2'>AM</div>
                </div>
            )}
            {!isVisible && <div className={style.text2}>*****</div>}
        </div>
    )
}

export default BalanceComp
