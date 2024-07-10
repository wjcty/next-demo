'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    IconHome,
    IconWallet,
    IconArrowsExchange,
    IconPool,
    IconBuildingCottage
} from '@tabler/icons-react'

export default function Sidebar() {
    const menu = [
        {
            icon: <IconHome className='h-6 w-6 mr-3' />,
            title: 'Home',
            path: '/'
        },
        {
            icon: <IconWallet className='h-6 w-6 mr-3' />,
            title: 'Wallet',
            path: '/wallet'
        },
        {
            icon: <IconArrowsExchange className='h-6 w-6 mr-3' />,
            title: 'Dex',
            path: '/dex'
        },
        {
            icon: <IconBuildingCottage className='h-6 w-6 mr-3' />,
            title: 'Farm',
            path: '/farm'
        },
        {
            icon: <IconPool className='h-6 w-6 mr-3' />,
            title: 'Pool',
            path: '/pool'
        }
        // {
        //     icon: <HomeIcon className='h-6 w-6 mr-3' />,
        //     title: 'Jungle',
        //     path: '/jungle'
        // }
    ]
    const [activeIndex, setactiveIndex] = useState(0)
    const router = useRouter()
    const HandleDelegation = (target: HTMLElement) => {
        let item = menu.find((j, index) => {
            if (j.title === target.innerText) {
                setactiveIndex(index)
                return j
            }
        })
        if (item) router.push(item!.path)
    }

    // 路由更改 菜单也随之更改
    const currentPaths = usePathname()
    useEffect(() => {
        menu.find((e, i) => {
            if (currentPaths.includes(e.path)) {
                setactiveIndex(i)
            }
        })
    }, [currentPaths])
    return (
        <aside
            style={{
                height: '100vh'
            }}
            className='bg-[#141414] text-white w-64  flex flex-col px-4'
        >
            <div className='flex items-center justify-center h-20 w-full'>
                <Image src={'/logo.png'} height={100} width={50} alt=''></Image>
                <div className='ml-2 text-1.8 font-bold'>Amando</div>
            </div>
            <nav className='flex-grow text-[#999999] mt-4'>
                <ul
                    className='mt-4 px-2'
                    onClick={(e) => HandleDelegation(e.target as HTMLElement)}
                >
                    {menu.map((e, i) => {
                        return (
                            <li
                                key={e.title}
                                className={`mb-2 cursor-pointer p-4 flex items-center hover:bg-gray-800 rounded-xl ${
                                    activeIndex === i ? 'bg-gray-800 text-[#F15223]' : ''
                                }`}
                            >
                                {e.icon}
                                {e.title}
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className='text-sm p-4 bg-[#1F1F1F] mb-20 rounded-xl'>
                Live Trading Deals
                <div className='mt-6 mb-1 flex justify-between flex-wrap'>
                    <div>Swap</div>
                    <div className='text-[#777]'>ID:20:01 AM</div>
                </div>
                <div className='flex justify-between flex-wrap'>
                    <div>WBNM/BUSD</div>
                    <div className='text-[#2D9F64]'>$ 3,122.51</div>
                </div>
                <div className='mt-6 mb-1 flex justify-between flex-wrap'>
                    <div>Swap</div>
                    <div className='text-[#777]'>ID:20:01 AM</div>
                </div>
                <div className='flex justify-between flex-wrap'>
                    <div>WBNM/BUSD</div>
                    <div className='text-[#2D9F64]'>$ 3,122.51</div>
                </div>
            </div>
        </aside>
    )
}
