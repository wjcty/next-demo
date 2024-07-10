import React from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import './globals.css'

import { Inter } from 'next/font/google'

// ranbowkit配置 start
import '@rainbow-me/rainbowkit/styles.css'
import Providers from './providers'
// import { headers } from 'next/headers'
// import { cookieToInitialState } from 'wagmi'
// import { config } from '@/lib/config'
// ranbowkit end

const inter = Inter({ subsets: ['latin'] })
import NextBreadcrumb from '@/components/breadcrumbs/page'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
// apolloClient
import { ApolloWrapper } from '@/components/ApolloWrapper'

export default function Layout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    // const initialState = cookieToInitialState(config, headers().get('cookie'))
    return (
        <html lang='en'>
            <body className={inter.className}>
                <MantineProvider>
                    <Providers>
                        <ApolloWrapper>
                            <div
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    height: '100vh',
                                    background: 'black'
                                }}
                            >
                                <Sidebar />
                                <div
                                    style={{}}
                                    className='w-full h-full bg-black text-white p-6 overflow-y-scroll'
                                >
                                    <Topbar />
                                    <NextBreadcrumb
                                        homeElement={'Home'}
                                        separator={<span> / </span>}
                                        activeClasses='text-[#F15223]'
                                        containerClasses='flex'
                                        listClasses='hover:underline mx-2 font-bold'
                                        capitalizeLinks
                                    />
                                    {children}
                                </div>
                            </div>
                        </ApolloWrapper>
                    </Providers>
                </MantineProvider>
            </body>
        </html>
    )
}
