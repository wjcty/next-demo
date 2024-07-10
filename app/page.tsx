import StartJungleCard from '@/components/StartJungleCard'
import Card from '@/components/Card'
import FarmCard from '@/components/FarmCard'

const Index = () => {
    return (
        <div>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6'>
                <Card
                    isBalance
                    title='Balance'
                    value='176,127.00'
                    unit='AM'
                    subtitle=''
                    actionLabel=''
                />
                <Card
                    value='364.22'
                    subtitle='Stake your AM in exchange for even more tokens'
                    actionLabel='Star Earning Crypto'
                />
                <Card
                    value='364.33'
                    subtitle='Stake your AM in exchange for even more tokens'
                    actionLabel='star Earning Crypto'
                />

                <StartJungleCard
                    title='Stake AM token to Earn WBNB'
                    value='122.63%'
                    unit='APR'
                    actionLabel='Start Jungle'
                />
                <StartJungleCard
                    title='Stake AM token to Earn BUSD'
                    value='122.63%'
                    unit='APR'
                    actionLabel='Start Jungle'
                />
                <StartJungleCard
                    title='Stake AM token to Earn USDT'
                    value='152.12%'
                    unit='APR'
                    actionLabel='Start Jungle'
                />
            </div>
            <h2 className='text-2xl font-bold mt-6'>Top Farms</h2>
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4'>
                <FarmCard pair='AM-USDC' apr='425.85' liquidity='3,611,823' isHot={true} />
                <FarmCard pair='AM-BNB' apr='400.63' liquidity='3,611,823' isHot={true} />
                <FarmCard pair='AM-BUSD' apr='324.51' liquidity='3,611,823' isHot={false} />
                <FarmCard pair='AM-USDT' apr='205.02' liquidity='3,611,823' isHot={false} />
            </div>
        </div>
    )
}

export default Index
