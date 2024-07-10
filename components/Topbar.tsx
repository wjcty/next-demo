import { GlobeIcon, MoonIcon, SunIcon } from '@heroicons/react/outline'
import Image from 'next/image'
import { MyConnectBtn } from './wallet/myConnectBtn'

const Topbar = () => {
    const iconList = [
        {
            path: 'twitter',
            src: '/images/twitter.png'
        },
        {
            path: 'telegram',
            src: '/images/telegram.png'
        },
        {
            path: 'facebook',
            src: '/images/facebook.png'
        },
        {
            path: 'youtube',
            src: '/images/youtube.png'
        },
        {
            path: 'reddit',
            src: '/images/reddit.png'
        }
    ]

    return (
        <header className=' text-white flex items-center justify-between p-4'>
            <div className='flex items-center space-x-5'>
                {iconList.map((e) => {
                    return (
                        <a key={e.path} href='#'>
                            <Image src={e.src} alt='' width={22} height={22} />
                        </a>
                    )
                })}
            </div>
            <div className='flex items-center space-x-4'>
                <Image
                    src='/images/bell.png'
                    className='cursor-pointer'
                    alt=''
                    width={30}
                    height={30}
                />
                <div className='pr-6 border-r-2 border-r-[#444]'>
                    <MyConnectBtn />
                </div>
                <div className='p-2 cursor-pointer'>
                    <MoonIcon className='h-6 w-6 text-[#888]' />
                </div>
                <GlobeIcon className='h-6 w-6' />
            </div>
        </header>
    )
}

export default Topbar
