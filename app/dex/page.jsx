'use client'
import { Tabs } from '@mantine/core'
import classes from './demo.module.scss'
import Swap from './swap'
import Liquidity from './liquidity'
import { useState } from 'react'

const Dex = () => {
    const [activeTab, setActiveTab] = useState('Swap')

    return (
        <div className=' bg-black flex items-center justify-center '>
            <div className='w-full max-w-xl p-4 space-y-4'>
                <Tabs
                    value={activeTab}
                    variant='unstyled'
                    onChange={setActiveTab}
                    classNames={classes}
                >
                    <Tabs.List grow>
                        <Tabs.Tab value='Swap'>Swap</Tabs.Tab>
                        <Tabs.Tab value='Add Liquidity'>Add Liquidity</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value='Swap' className='mt-10'>
                        <Swap />
                    </Tabs.Panel>
                    <Tabs.Panel value='Add Liquidity' className='mt-10'>
                        <Liquidity />
                    </Tabs.Panel>
                </Tabs>
            </div>
        </div>
    )
}

export default Dex
