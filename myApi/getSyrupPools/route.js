import axios from 'axios'

const getSyrupPools = async () => {
    const apiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY
    const url = `https://api.bscscan.com/api`

    try {
        const response = await axios.get(url, {
            params: {
                module: 'account',
                action: 'txlistinternal',
                address: '0xFfF5812C35eC100dF51D5C9842e8cC3fe60f9ad7',
                startblock: 0,
                endblock: 'latest',
                sort: 'asc',
                apikey: apiKey
            }
        })

        if (response.data.status === '1') {
            return response.data.result
        } else {
            throw new Error(response.data.message)
        }
    } catch (error) {
        console.error('Error fetching transactions:', error)
        throw error
    }
}

export default getSyrupPools
