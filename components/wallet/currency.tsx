import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

type CObject = {
    name: string
    amount: string
    price: string
    price2: string
}

const currencies: CObject[] = [
    { price2: '360.44', name: 'AM', amount: '10.000000', price: '10.000000' },
    { price2: '360.44', name: 'BNB', amount: '209.99', price: '75,547.35' },
    { price2: '360.44', name: 'ETH', amount: '0.25', price: '580.52' },
    { price2: '360.44', name: 'BUSD', amount: '0.00', price: '0.00' },
    { price2: '360.44', name: 'USDT', amount: '0.00', price: '0.00' },
    { price2: '360.44', name: 'USDC', amount: '0.00', price: '0.00' },
    { price2: '360.44', name: 'BTC', amount: '0.00', price: '0.00' }
]
const CurrencyItem = ({
    currency
}: Readonly<{
    currency: CObject
}>) => {
    const router = useRouter()
    const handleSend = useCallback(() => {}, [])
    const handleReceive = useCallback(() => {}, [])
    const handleBuy = useCallback(() => {}, [])
    const handleDetail = useCallback(() => {
        router.push('/wallet/walletDetail')
    }, [router])
    return (
        <tr>
            <td className='py-2 flex cursor-pointer' onClick={handleDetail}>
                <Image src='/logo.png' width={40} height={40} alt='' />
                <div className='ml-2'>
                    <div>{currency.name}</div>
                    <div className='text-sm text-[#999] flex'>
                        <div>${currency.price2}</div>
                        <div className='ml-2 text-[#2D9F64]'> +0.3%</div>
                    </div>
                </div>
            </td>
            <td className='py-2'>{currency.amount}</td>
            <td className='py-2'>${currency.price}</td>
            <td className='py-2  text-[#F15223]'>
                <div className='flex'>
                    <div className='cursor-pointer mr-4' onClick={handleSend}>
                        Send
                    </div>
                    <div className='cursor-pointer mr-4' onClick={handleReceive}>
                        Receive
                    </div>
                    <div className='cursor-pointer ' onClick={handleBuy}>
                        Buy
                    </div>
                </div>
            </td>
        </tr>
    )
}

export default function CurrencyListComp() {
    return (
        <div className='bg-[#141414]  p-6 rounded-lg shadow-lg mt-6'>
            <table className='w-full text-left'>
                <thead className='text-[#999999]'>
                    <tr>
                        <th className='py-2'>Currency</th>
                        <th className='py-2'>Amount</th>
                        <th className='py-2'>Price</th>
                        <th className='py-2'>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currencies.map((currency, index) => (
                        <CurrencyItem key={index} currency={currency} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
