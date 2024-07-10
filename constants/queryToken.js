const QUERY_TOKEN = `
{
  tokens(first: 1000, skip: 1000) {
    id
    symbol
    name
    derivedBNB
    derivedUSD
    decimals
    totalLiquidity
  }
}
`

export default QUERY_TOKEN
// 0x094616f0bdfb0b526bd735bf66eca0ad254ca81f
// {
//   "address": "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
//   "ticker": "BNB",
//   "ids": "binancecoin",
//   "img": "/images/BNB.svg",
//   "name": "BNB Chain Native Token",
//   "derivedBNB": "1",
//   "derivedUSD": "572.3457196366796945665047941868706",
//   "decimals": "18",
//   "totalLiquidity": ""
// },

// 获取每个token的ids
// const url = 'https://api.coingecko.com/api/v3/coins/list'

// 获取token的图片
// const ids = 'wbnb'
// const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`
// axios.get(url).then((res) => {
//     console.log(222, res.data[0].image)
// })

// const url2 =
//     'https://open-platform.nodereal.io/d772e8bd855444eea3519c2ab34ad18e/pancakeswap-free/graphql'
// axios
//     .post(
//         url2,
//         {
//             query: QUERY_TOKEN
//         },
//         {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }
//     )
//     .then((res) => {
//         console.log(222, res)
//     })
//     .catch((err) => {
//         console.log(err)
//     })
