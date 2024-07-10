import pairAbi from '@/constants/pairAbi.json'
import { useState, useEffect, useCallback } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import { multicall } from '@wagmi/core'
import { formatEther } from 'viem'
import masterchefv2Abi from '@/constants/masterchefv2Abi.json'
import bep20Abi from '@/constants/bep20Abi.json'
import chainlinkFeedAbi from '@/constants/chainlinkFeedAbi.json'
import { fetchPairPriceInUSDT } from './useGetPoolAPR'
import { config } from '@/lib/config'

//testnet
// const chainlink_cake_usd_address = '0x81faeDDfeBc2F8Ac524327d70Cf913001732224C'
// const masterChefV2Address = '0xB4A466911556e39210a6bB2FaECBB59E4eB7E43d'

// const chainlink_cake_usd_address = '0xB6064eD41d4f67e353768aA239cA86f4F73665a1'
// const masterChefV2Address = '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652'

export const usePancakeSwapPools = () => {
    const { address, chainId } = useAccount()
    const chainlink_cake_usd_address =
        chainId === 56
            ? '0xB6064eD41d4f67e353768aA239cA86f4F73665a1'
            : '0x81faeDDfeBc2F8Ac524327d70Cf913001732224C'
    const masterChefV2Address =
        chainId === 56
            ? '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652'
            : '0xB4A466911556e39210a6bB2FaECBB59E4eB7E43d'

    const [pools, setPools] = useState([])
    const [livePools, setLivePools] = useState([])
    const [finishedPools, setFinishedPools] = useState([])
    const [loading, setLoading] = useState(true)
    const [liveDisplayCount, setLiveDisplayCount] = useState(6)
    const [finishedDisplayCount, setFinishedDisplayCount] = useState(6)

    const [isRegularCakePerBlock, setisRegularCakePerBlock] = useState()
    const [notRegularCakePerBlock, setnotRegularCakePerBlock] = useState()

    const [totalRegularAllocPoint, settotalRegularAllocPoint] = useState()
    const [totalNotRegularAllocPoint, settotalNotRegularAllocPoint] = useState()
    const [cakePrice, setCakePrice] = useState(null)

    // 使用 useReadContract 获取 poolLength
    const { data: poolLengthData } = useReadContract({
        address: masterChefV2Address,
        abi: masterchefv2Abi,
        functionName: 'poolLength'
    })

    // 计算 regular 的 cakePerBlock
    const { data: isRegularData, isSuccess: isRegularSuccess } = useReadContract({
        address: masterChefV2Address,
        abi: masterchefv2Abi,
        functionName: 'cakePerBlock',
        args: [true]
    })
    // 计算 非 regular 的 cakePerBlock
    const { data: notRegularData, isSuccess: notRegularSuccess } = useReadContract({
        address: masterChefV2Address,
        abi: masterchefv2Abi,
        functionName: 'cakePerBlock',
        args: [false]
    })

    // 计算 regular 的 AllocPoint
    const { data: regularAllocPointData, isSuccess: isRegularAllocPointSuccess } = useReadContract({
        address: masterChefV2Address,
        abi: masterchefv2Abi,
        functionName: 'totalRegularAllocPoint'
    })
    // 计算 非 regular 的 AllocPoint
    const { data: notRegularAllocPointData, isSuccess: notRegularAllocPointSuccess } =
        useReadContract({
            address: masterChefV2Address,
            abi: masterchefv2Abi,
            functionName: 'totalSpecialAllocPoint'
        })

    // 获取 CAKE 的价格
    const { data: cakePriceData, isSuccess: isCakePriceSuccess } = useReadContract({
        address: chainlink_cake_usd_address,
        abi: chainlinkFeedAbi,
        functionName: 'latestAnswer'
    })

    useEffect(() => {
        if (isCakePriceSuccess) {
            setCakePrice(cakePriceData)
        }
    }, [isCakePriceSuccess, cakePriceData])

    useEffect(() => {
        if (isRegularSuccess) {
            setisRegularCakePerBlock(isRegularData)
        }
        if (notRegularSuccess) {
            setnotRegularCakePerBlock(notRegularData)
        }
    }, [isRegularSuccess, isRegularData, notRegularSuccess, notRegularData])

    useEffect(() => {
        if (isRegularAllocPointSuccess) {
            settotalRegularAllocPoint(regularAllocPointData)
        }
        if (notRegularAllocPointSuccess) {
            settotalNotRegularAllocPoint(notRegularAllocPointData)
        }
    }, [
        isRegularAllocPointSuccess,
        regularAllocPointData,
        notRegularAllocPointSuccess,
        notRegularAllocPointData
    ])

    useEffect(() => {
        if (
            isRegularAllocPointSuccess &&
            notRegularAllocPointSuccess &&
            isRegularCakePerBlock &&
            notRegularCakePerBlock &&
            isCakePriceSuccess &&
            address
        ) {
            const fetchPools = async () => {
                if (!poolLengthData) return
                const poolLength = Number(poolLengthData)

                // 准备 multicall 调用 poolInfo
                const poolCalls = Array.from({ length: poolLength }, (_, i) => ({
                    address: masterChefV2Address,
                    functionName: 'poolInfo',
                    args: [i]
                }))

                // 使用 multicall 获取所有池子的信息
                const results = await multicall(config, {
                    contracts: poolCalls.map((call) => ({
                        ...call,
                        abi: masterchefv2Abi
                    }))
                })

                // 解析返回数据
                const poolsData = results.map((result, index) => {
                    const decodedResult = result.result

                    const accCakePerShare = decodedResult[0] // 每份 LP 代币累计的 CAKE 奖励数量。这通常是一个大整数
                    const lastRewardBlock = decodedResult[1] // 上次奖励分配的区块号。这是一个整数，表示上次奖励 CAKE 的区块号。
                    const allocPoint = decodedResult[2] // 分配给此池子的分配点数。通常为一个整数，表示此池子在总分配中的权重。
                    const totalBoostedShare = decodedResult[3] // 总共被增加了分享的份额数量。这是一个大整数，表示增加了分享的总量。
                    const isRegular = decodedResult[4] // 表示此池子是否为常规池子

                    return {
                        poolId: index,
                        accCakePerShare: accCakePerShare ? formatEther(accCakePerShare) : '0',
                        lastRewardBlock: Number(lastRewardBlock),
                        allocPoint: allocPoint,
                        totalBoostedShare: totalBoostedShare ? formatEther(totalBoostedShare) : '0',
                        isRegular: isRegular
                    }
                })

                // 准备 multicall 调用 lpToken
                const poolCalls2 = Array.from({ length: poolLength }, (e, i) => ({
                    address: masterChefV2Address,
                    functionName: 'lpToken',
                    args: [i]
                }))

                // 使用 multicall 获取每个池子的lpToken 地址
                const results2 = await multicall(config, {
                    contracts: poolCalls2.map((call) => ({
                        ...call,
                        abi: masterchefv2Abi
                    }))
                })

                const poolsDataAddLpToken = poolsData.map((e, i) => {
                    return {
                        ...e,
                        lpTokenAddress: results2[i].result
                    }
                })

                // 准备 multicall 调用 token0
                const poolCallsToken0 = poolsDataAddLpToken.map((e, i) => {
                    return {
                        address: e.lpTokenAddress,
                        functionName: 'token0'
                    }
                })

                // 使用 multicall 获取 token0
                const token0Result = await multicall(config, {
                    contracts: poolCallsToken0.map((call) => ({
                        ...call,
                        abi: pairAbi
                    }))
                })

                // 准备 multicall 调用 token1
                const poolCallsToken1 = poolsDataAddLpToken.map((e, i) => {
                    return {
                        address: e.lpTokenAddress,
                        functionName: 'token1'
                    }
                })

                // 使用 multicall 获取 token1
                const token1Result = await multicall(config, {
                    contracts: poolCallsToken1.map((call) => ({
                        ...call,
                        abi: pairAbi
                    }))
                })
                let poolsDataAddTotalStaked = poolsDataAddLpToken.map((e, i) => ({
                    ...e,
                    token0: token0Result[i].result ? token0Result[i].result : '',
                    token1: token1Result[i].result ? token1Result[i].result : ''
                }))

                // 过滤掉不需要的池子 减少请求次数
                poolsDataAddTotalStaked = poolsDataAddTotalStaked.filter(
                    (e) => e.token0 && e.token1
                )

                // 准备 multicall 调用 balanceOf
                const poolCalls3 = poolsDataAddTotalStaked.map((e, i) => {
                    return {
                        address: e.lpTokenAddress,
                        functionName: 'balanceOf',
                        args: [masterChefV2Address]
                    }
                })

                // 使用 multicall 获取lpToken 地址的balance 得到total staked
                const results3 = await multicall(config, {
                    contracts: poolCalls3.map((call) => ({
                        ...call,
                        abi: bep20Abi
                    }))
                })

                poolsDataAddTotalStaked = poolsDataAddTotalStaked.map((e, i) => ({
                    ...e,
                    // todo 这里可能每个token 的精度不同
                    totalStaked: formatEther(results3[i].result)
                }))

                // 计算池子的每块奖励
                poolsDataAddTotalStaked = poolsDataAddTotalStaked.map((e, i) => ({
                    ...e,
                    poolCakePerBlock: e.isRegular
                        ? (isRegularCakePerBlock * e.allocPoint) / totalRegularAllocPoint
                        : (notRegularCakePerBlock * e.allocPoint) / totalNotRegularAllocPoint
                }))

                // 准备 multicall 调用 totalSupply
                const poolCalls4 = poolsDataAddTotalStaked.map((e, i) => {
                    return {
                        address: e.lpTokenAddress,
                        functionName: 'totalSupply'
                    }
                })

                // 使用 multicall 获取lpToken 地址的totalSupply
                const results4 = await multicall(config, {
                    contracts: poolCalls4.map((call) => ({
                        ...call,
                        abi: bep20Abi
                    }))
                })

                poolsDataAddTotalStaked = poolsDataAddTotalStaked.map((e, i) => ({
                    ...e,
                    totalSupply: results4[i].result
                }))

                // 准备 multicall 调用 getReserves
                const poolCalls5 = poolsDataAddTotalStaked.map((e, i) => {
                    return {
                        address: e.lpTokenAddress,
                        functionName: 'getReserves'
                    }
                })

                // 使用 multicall 获取getReserves
                const results5 = await multicall(config, {
                    contracts: poolCalls5.map((call) => ({
                        ...call,
                        abi: pairAbi
                    }))
                })

                // let isvailarr = poolsDataAddTotalStaked.filter((e) => e.token0 && e.token1)
                // 准备 multicall 调用 token0 symbol
                const poolCallsToken0Symbol = poolsDataAddTotalStaked.map((e, i) => {
                    return {
                        address: e.token0,
                        functionName: 'symbol'
                    }
                })

                // 使用 multicall 获取 token0 symbol
                const token0RSymbolRes = await multicall(config, {
                    contracts: poolCallsToken0Symbol.map((call) => ({
                        ...call,
                        abi: bep20Abi
                    }))
                })

                // 准备 multicall 调用 token1 symbol
                const poolCallsToken1Symbol = poolsDataAddTotalStaked.map((e, i) => {
                    return {
                        address: e.token1,
                        functionName: 'symbol'
                    }
                })

                // 使用 multicall 获取 token1 symbol
                const token1RSymbolRes = await multicall(config, {
                    contracts: poolCallsToken1Symbol.map((call) => ({
                        ...call,
                        abi: bep20Abi
                    }))
                })
                poolsDataAddTotalStaked = poolsDataAddTotalStaked.map((e, i) => {
                    return {
                        ...e,
                        token0Symbol: token0RSymbolRes[i].result,
                        token1Symbol: token1RSymbolRes[i].result
                    }
                })

                // let updatedArrayA = poolsDataAddTotalStaked.map((itemA) => {
                //     // 在 arrayB 中查找与 arrayA 中的 id 匹配的对象
                //     const matchedItemB = isvailarr.find((itemB) => itemB.poolId === itemA.poolId)
                //     // 如果找到了匹配的对象，就添加属性，否则保持不变
                //     return matchedItemB
                //         ? {
                //               ...itemA,
                //               token0Symbol: matchedItemB.token0Symbol,
                //               token1Symbol: matchedItemB.token1Symbol
                //           }
                //         : itemA
                // })
                let updatedArrayA = poolsDataAddTotalStaked.map((e) => {
                    return {
                        ...e
                    }
                })

                for (const e of updatedArrayA) {
                    if (e.token0 && e.token1) {
                        const res = await fetchPairPriceInUSDT(
                            chainId,
                            e.token0,
                            e.token0Symbol,
                            e.token1,
                            e.token1Symbol
                        )
                        e.price0 = res?.tokenOneprice1
                        e.price1 = res?.tokenTwoprice1
                    }
                }
                updatedArrayA = updatedArrayA.map((e, i) => {
                    const tempResult = results5[i].result
                    return {
                        ...e,
                        reserve0: tempResult ? Number(tempResult[0]) : 0,
                        reserve1: tempResult ? Number(tempResult[1]) : 0
                    }
                })

                updatedArrayA = updatedArrayA.map((e, i) => {
                    return {
                        ...e,
                        lpTokenPrice:
                            e.price0 && e.price1 && e.reserve0 && e.reserve1
                                ? e.price0 * e.reserve0 +
                                  (e.price1 * e.reserve1) / Number(formatEther(e.totalSupply))
                                : 0
                    }
                })
                updatedArrayA = updatedArrayA.map((e, i) => {
                    return {
                        ...e,
                        apr: e.lpTokenPrice
                            ? (Number(formatEther(e.poolCakePerBlock)) *
                                  10512000 *
                                  Number(formatEther(cakePrice))) /
                              (Number(e.totalStaked) * e.lpTokenPrice)
                            : 0
                    }
                })

                // 准备 multicall 调用 LP token symbol
                const poolCallsLPtokenSymbol = updatedArrayA.map((e, i) => {
                    return {
                        address: e.lpTokenAddress,
                        functionName: 'symbol'
                    }
                })

                // 使用 multicall 获取 LP token symbol
                const lpTokenSymbolResult = await multicall(config, {
                    contracts: poolCallsLPtokenSymbol.map((call) => ({
                        ...call,
                        abi: pairAbi
                    }))
                })
                updatedArrayA = updatedArrayA.map((e, i) => ({
                    ...e,
                    name: `${lpTokenSymbolResult[i].result} Pool`,
                    lpTokenSymbol: lpTokenSymbolResult[i].result,
                    image: '/logo.png'
                }))

                // 准备 multicall 调用 pendingCake
                const poolCallsPendingCake = updatedArrayA.map((e, i) => {
                    return {
                        address: masterChefV2Address,
                        functionName: 'pendingCake',
                        args: [e.poolId, address]
                    }
                })

                // 使用 multicall 获取 pendingCake
                const pendingCakeResult = await multicall(config, {
                    contracts: poolCallsPendingCake.map((call) => ({
                        ...call,
                        abi: masterchefv2Abi
                    }))
                })

                updatedArrayA = updatedArrayA.map((e, i) => ({
                    ...e,
                    pendingCake: formatEther(pendingCakeResult[i].result)
                }))

                // 准备 multicall 调用 userInfo
                const poolCallsUserInfo = updatedArrayA.map((e, i) => {
                    return {
                        address: masterChefV2Address,
                        functionName: 'userInfo',
                        args: [e.poolId, address]
                    }
                })

                // 使用 multicall 获取 userInfo
                const userInfoResult = await multicall(config, {
                    contracts: poolCallsUserInfo.map((call) => ({
                        ...call,
                        abi: masterchefv2Abi
                    }))
                })
                updatedArrayA = updatedArrayA.map((e, i) => ({
                    ...e,
                    userStakedAmount: Number(formatEther(userInfoResult[i].result[0])),
                    boostMultiplier: Number(userInfoResult[i].result[1])
                }))

                for (const e of updatedArrayA) {
                    if (e.token0 && e.token1) {
                        e.cakeStakedInUsdt = Number(e.totalStaked) * Number(formatEther(cakePrice))
                    }
                }

                // 更新状态
                setPools(updatedArrayA)

                // 分类 live 和 finished
                const live = pools.filter((pool) => Number(pool.allocPoint) > 0)
                const finished = pools.filter((pool) => Number(pool.allocPoint) === 0)
                console.log(333, live, pools)
                setLivePools(live)
                setFinishedPools(finished)
                setLoading(false)
            }
            fetchPools()
        }
    }, [
        isRegularAllocPointSuccess,
        notRegularAllocPointSuccess,
        isRegularCakePerBlock,
        notRegularCakePerBlock,
        isCakePriceSuccess,
        address,
        cakePrice,
        chainId
    ])

    // 加载更多 live 和 finished 的池子
    const loadMoreLivePools = useCallback(() => {
        setLiveDisplayCount((prevCount) => prevCount + 6)
    }, [])

    const loadMoreFinishedPools = useCallback(() => {
        setFinishedDisplayCount((prevCount) => prevCount + 6)
    }, [])

    return {
        livePools: livePools.slice(0, liveDisplayCount),
        livePoolsLength: livePools.length,
        finishedPools: finishedPools.slice(0, finishedDisplayCount),
        finishedPoolsLength: finishedPools.length,
        loading,
        loadMoreLivePools,
        loadMoreFinishedPools
    }
}
