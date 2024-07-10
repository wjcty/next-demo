import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export default async function GET(req: NextRequest) {
    const address = req.nextUrl.searchParams.get('address')
    try {
        const response = await axios.get(
            `${COINGECKO_API_URL}/simple/token_price/binance-smart-chain?contract_addresses=${address}&vs_currencies=usd`
        )

        return NextResponse.json({
            message: 'success',
            data: response.data[address!.toLowerCase()].usd
        })
    } catch (error: any) {
        console.error('Error fetching data:', error)
        return NextResponse.json({ message: 'error', error: error.message }, { status: 500 })
    }
}
