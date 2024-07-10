// lib/apolloClient.js
import { ApolloClient, InMemoryCache } from '@apollo/client'

// 配置 Apollo Client
const client = new ApolloClient({
    uri: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2', // PancakeSwap BSC Subgraph 端点
    cache: new InMemoryCache()
})

// 导出经过 withApollo 包装的客户端
export default client
