'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Button, Grid, Switch, Tabs } from '@mantine/core'
import classes from './page.module.scss'
import FarmCard from './Card'
import { useSyrupPool } from '@/hooks/useSyrupPool'
import _ from 'lodash'

const PoolPage = () => {
    const [activeTab, setActiveTab] = useState('Active')
    const [livePoolList, setlivePoolList] = useState([])
    const [finishedPoolList, setfinishedPoolList] = useState([])
    const changeActiveTab = (val) => {
        setActiveTab(val)
    }
    const [isStakedOnly, setisStakedOnly] = useState(false)

    const {
        liveSyrupPools,
        liveSyrupPoolsLength,
        finishedSyrupPools,
        finishedSyrupPoolsLength,
        loading,
        loadMoreLivePools,
        loadMoreFinishedPools
    } = useSyrupPool()

    // 处理加载更多逻辑
    const loadMorePools = () => {
        if (activeTab === 'Active') {
            loadMoreLivePools()
        } else {
            loadMoreFinishedPools()
        }
    }

    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (!loading) setVisible(false)
    }, [loading])
    useEffect(() => {
        // 当加载完成或 liveSyrupPools 或 finishedSyrupPools 发生变化时才更新列表
        if (!loading) {
            // 更新 livePoolList
            const updatedLivePools = isStakedOnly
                ? liveSyrupPools.filter((e) => e.userStakedAmount !== 0)
                : liveSyrupPools
            setlivePoolList((prevLivePools) => {
                // 使用函数式更新，避免依赖项变化导致的重复更新问题
                if (!_.isEqual(updatedLivePools, prevLivePools)) {
                    return updatedLivePools
                }
                return prevLivePools
            })

            // 更新 finishedPoolList
            const updatedFinishedPools = isStakedOnly
                ? finishedSyrupPools.filter((e) => e.userStakedAmount !== 0)
                : finishedSyrupPools
            setfinishedPoolList((prevFinishedPools) => {
                // 使用函数式更新，避免依赖项变化导致的重复更新问题
                if (!_.isEqual(updatedFinishedPools, prevFinishedPools)) {
                    return updatedFinishedPools
                }
                return prevFinishedPools
            })
        }
    }, [isStakedOnly, loading, liveSyrupPools, finishedSyrupPools])

    // 定义样式对象，根据 checked 状态设置不同的背景色
    const switchStyles = {
        track: {
            backgroundColor: isStakedOnly ? '#e25169' : '#1f1f1f',
            border: 'none'
        },
        thumb: {
            backgroundColor: '#ffffff' // 可选：设置滑块的背景色
        }
    }

    const isLoadMoreDisabled = useMemo(() => {
        if (activeTab === 'Active' && livePoolList.length > 0) {
            return livePoolList.length === liveSyrupPoolsLength
        } else if (activeTab === 'Active' && livePoolList.length === 0) {
            return true
        }
        if (activeTab === 'Inactive' && finishedPoolList.length > 0) {
            return finishedPoolList.length === finishedSyrupPoolsLength
        } else if (activeTab === 'Inactive' && finishedPoolList.length === 0) {
            return true
        }
    }, [livePoolList, finishedPoolList, liveSyrupPoolsLength, finishedSyrupPoolsLength, activeTab])

    return (
        <div className='bg-black flex items-center justify-center '>
            <div className='w-full'>
                {visible && <>Loading</>}
                {!visible && (
                    <>
                        <Tabs
                            value={activeTab}
                            variant='unstyled'
                            classNames={classes}
                            onChange={(val) => changeActiveTab(val)}
                        >
                            <Tabs.List
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <Tabs.Tab
                                    style={{
                                        width: '12.5rem'
                                    }}
                                    value='Active'
                                >
                                    Active
                                </Tabs.Tab>
                                <Tabs.Tab
                                    style={{
                                        width: '12.5rem'
                                    }}
                                    value='Inactive'
                                >
                                    Inactive
                                </Tabs.Tab>
                            </Tabs.List>
                            <Switch
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}
                                size='md'
                                classNames={classes}
                                checked={isStakedOnly}
                                label='Staked Only'
                                onChange={(event) => setisStakedOnly(event.currentTarget.checked)}
                                styles={switchStyles}
                            />

                            <Tabs.Panel value='Active' className='mt-10'>
                                <Grid gutter='xl'>
                                    {livePoolList.map((pool, index) => (
                                        <Grid.Col key={index} span={4}>
                                            <FarmCard pool={pool} />
                                        </Grid.Col>
                                    ))}
                                </Grid>
                            </Tabs.Panel>
                            <Tabs.Panel value='Inactive' className='mt-10'>
                                <Grid gutter='xl' grow>
                                    {finishedPoolList.map((pool, index) => (
                                        <Grid.Col key={index} span={4}>
                                            <FarmCard pool={pool} />
                                        </Grid.Col>
                                    ))}
                                </Grid>
                            </Tabs.Panel>
                        </Tabs>

                        <div className='w-full flex justify-center mt-4'>
                            <Button onClick={() => loadMorePools()} disabled={isLoadMoreDisabled}>
                                {isLoadMoreDisabled ? 'There are no more pools' : 'Load more pools'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PoolPage
