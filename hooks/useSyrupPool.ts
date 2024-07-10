import bep20Abi from '@/constants/bep20Abi.json'
import { useCallback, useEffect, useState } from 'react'
import smartChefInitializableAbi from '@/constants/smartChefInitializableAbi.json'
import { multicall } from '@wagmi/core'
import { config } from '@/lib/config'
import getSyrupPools from '@/myApi/getSyrupPools/route'
import _ from 'lodash'
import { getBlockNumber } from '@wagmi/core'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { getTokenPriceInUSD } from './useGetPoolAPR'

export const useSyrupPool = () => {
    const { address, chainId } = useAccount()
    const [syrupPools, setsyrupPools] = useState([])
    const [loading, setloading] = useState(true)
    const [liveSyrupPools, setliveSyrupPools] = useState([])
    const [finishedSyrupPools, setfinishedSyrupPools] = useState([])

    const [liveDisplayCount, setLiveDisplayCount] = useState(6)
    const [finishedDisplayCount, setFinishedDisplayCount] = useState(6)
    const getData = async () => {
        try {
            const res = await getSyrupPools()
            if (res.length > 0) {
                setsyrupPools(res)
            }
        } catch (error) {
            console.log('fetching syrup pool error', error)
        }
    }
    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        const fetchSyrupPool = async () => {
            if (syrupPools.length === 0) return
            let pools = _.cloneDeep(syrupPools)
            let currentBlockNumber = await getBlockNumber(config)
            currentBlockNumber = Number(currentBlockNumber)

            // 准备 multicall 调用 bonusEndBlock
            const poolCalls = pools.map((e, i) => ({
                address: e.contractAddress,
                functionName: 'bonusEndBlock'
            }))

            // 使用 multicall 获取 bonusEndBlock
            const results = await multicall(config, {
                contracts: poolCalls.map((call) => ({
                    ...call,
                    abi: smartChefInitializableAbi
                }))
            })
            pools = pools.map((e, i) => ({
                ...e,
                bonusEndBlock: Number(results[i].result)
            }))

            let live = pools.filter((e) => e.bonusEndBlock > currentBlockNumber)

            // 准备 multicall 调用 pendingReward
            const poolCallsPendingReward = live.map((e, i) => ({
                address: e.contractAddress,
                functionName: 'pendingReward',
                args: [address]
            }))
            // 使用 multicall 获取 pendingReward 即earned
            const pendingRewardResults = await multicall(config, {
                contracts: poolCallsPendingReward.map((call) => ({
                    ...call,
                    abi: smartChefInitializableAbi
                }))
            })
            live = live.map((e, i) => ({
                ...e,
                pendingReward: pendingRewardResults[i].result
                    ? formatEther(pendingRewardResults[i].result)
                    : '0'
            }))

            // 准备 multicall 调用 stakedToken
            const poolCallsStakedToken = live.map((e, i) => ({
                address: e.contractAddress,
                functionName: 'stakedToken'
            }))
            // 使用 multicall 获取 stakedToken address
            const stakedTokenResults = await multicall(config, {
                contracts: poolCallsStakedToken.map((call) => ({
                    ...call,
                    abi: smartChefInitializableAbi
                }))
            })
            live = live.map((e, i) => ({
                ...e,
                stakedToken: stakedTokenResults[i].result
            }))

            // 准备 multicall 调用 rewardToken
            const poolCallsRewardToken = live.map((e, i) => ({
                address: e.contractAddress,
                functionName: 'rewardToken'
            }))
            // 使用 multicall 获取 rewardToken address
            const ResultsRewardToken = await multicall(config, {
                contracts: poolCallsRewardToken.map((call) => ({
                    ...call,
                    abi: smartChefInitializableAbi
                }))
            })
            live = live.map((e, i) => ({
                ...e,
                rewardToken: ResultsRewardToken[i].result
            }))

            // 准备 multicall 调用 stakedToken symbol
            const poolCallsStakedTokenSymbol = live.map((e, i) => ({
                address: e.stakedToken,
                functionName: 'symbol'
            }))
            // 使用 multicall 获取 stakedToken symbol
            const ResultsStakedTokenSymbol = await multicall(config, {
                contracts: poolCallsStakedTokenSymbol.map((call) => ({
                    ...call,
                    abi: bep20Abi
                }))
            })
            live = live.map((e, i) => ({
                ...e,
                stakedTokenSymbol: ResultsStakedTokenSymbol[i].result
            }))

            // 准备 multicall 调用 rewardToken symbol
            const poolCallsRewardTokenSymbol = live.map((e, i) => ({
                address: e.rewardToken,
                functionName: 'symbol'
            }))
            // 使用 multicall 获取 rewardToken symbol
            const ResultsRewardTokenSymbol = await multicall(config, {
                contracts: poolCallsRewardTokenSymbol.map((call) => ({
                    ...call,
                    abi: bep20Abi
                }))
            })
            live = live.map((e, i) => ({
                ...e,
                rewardTokenSymbol: ResultsRewardTokenSymbol[i].result
            }))

            // 准备 multicall 调用 balanceOf 获取 totalStaked
            const poolCallsTotalStaked = live.map((e, i) => ({
                address: e.stakedToken,
                functionName: 'balanceOf',
                args: [e.contractAddress]
            }))
            // 使用 multicall
            const totalStakedResults = await multicall(config, {
                contracts: poolCallsTotalStaked.map((call) => ({
                    ...call,
                    abi: bep20Abi
                }))
            })
            live = live.map((e, i) => ({
                ...e,
                totalStaked: totalStakedResults[i].result
                    ? formatEther(totalStakedResults[i].result)
                    : 0
            }))

            // 准备 multicall 调用 rewardPerBlock
            const poolCallsRewardPerBlock = live.map((e, i) => ({
                address: e.contractAddress,
                functionName: 'rewardPerBlock',
                args: []
            }))
            // 使用 multicall
            const rewardPerBlockResults = await multicall(config, {
                contracts: poolCallsRewardPerBlock.map((call) => ({
                    ...call,
                    abi: smartChefInitializableAbi
                }))
            })
            live = live.map((e, i) => ({
                ...e,
                rewardPerBlock: rewardPerBlockResults[i].result
            }))

            const currentTimestamp = Math.floor(Date.now() / 1000)

            live = live.map((e) => {
                const timeRemainingInSeconds = (e.bonusEndBlock - currentBlockNumber) * 3
                const endTimestamp = currentTimestamp + timeRemainingInSeconds
                const endDate = new Date(endTimestamp * 1000)

                return {
                    ...e,
                    endsInDay: Math.floor(timeRemainingInSeconds / (60 * 60 * 24)), // 天
                    endsInSeconds: formatDate(endDate) // 时分秒
                }
            })

            // 准备 multicall 调用 userInfo
            const poolCallsUserInfo = live.map((e, i) => ({
                address: e.contractAddress,
                functionName: 'userInfo',
                args: [address]
            }))
            // 使用 multicall
            const resultsUserInfo = await multicall(config, {
                contracts: poolCallsUserInfo.map((call) => ({
                    ...call,
                    abi: smartChefInitializableAbi
                }))
            })

            live = live.map((e, i) => ({
                ...e,
                userStakedAmount: resultsUserInfo[i].result
                    ? Number(formatEther(resultsUserInfo[i].result[0]))
                    : 0
            }))

            for (const e of live) {
                const res = await getTokenPriceInUSD(e.stakedToken, e.rewardToken)
                e.stakedTokenPriceInUSDT = res?.onePriceInUSD
                e.rewardTokenPriceInUSDT = res?.twoPriceInUSD
            }

            live = live.map((e) => ({
                ...e,
                apr:
                    ((Number(formatEther(e.rewardPerBlock)) * e.rewardTokenPriceInUSDT * 10512000) /
                        Number(e.totalStaked)) *
                    e.stakedTokenPriceInUSDT *
                    100
            }))
            const finished = pools.filter((e) => e.bonusEndBlock < currentBlockNumber)
            setliveSyrupPools(live)
            setfinishedSyrupPools(finished)
            setloading(false)
        }
        fetchSyrupPool()
    }, [syrupPools, address])

    // 加载更多 live 和 finished 的池子
    const loadMoreLivePools = useCallback(() => {
        setLiveDisplayCount((prevCount) => prevCount + 6)
    }, [])

    const loadMoreFinishedPools = useCallback(() => {
        setFinishedDisplayCount((prevCount) => prevCount + 6)
    }, [])

    const formatDate = (isoDate) => {
        const date = new Date(isoDate)

        const monthNames = [
            'JAN',
            'FEB',
            'MAR',
            'APR',
            'MAY',
            'JUN',
            'JUL',
            'AUG',
            'SEP',
            'OCT',
            'NOV',
            'DEC'
        ]
        const month = monthNames[date.getMonth()]
        const day = date.getDate()
        const year = date.getFullYear()

        let hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12 // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes

        return `${month} ${day}, ${year}, ${hours}:${minutesStr} ${ampm}`
    }

    return {
        liveSyrupPools: liveSyrupPools.slice(0, liveDisplayCount),
        liveSyrupPoolsLength: liveSyrupPools.length,
        finishedSyrupPools: finishedSyrupPools.slice(0, finishedDisplayCount),
        finishedSyrupPoolsLength: finishedSyrupPools.length,
        loading,
        loadMoreLivePools,
        loadMoreFinishedPools
    }
}
