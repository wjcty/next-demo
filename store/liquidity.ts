import { StateCreator, create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createSelectors } from '@/utils/createSelectors'
import { createJSONStorage, devtools, persist, subscribeWithSelector } from 'zustand/middleware'

type TCatStoreState = {
    liquidity: {
        slippage: string
        currentMinutes: string
        txDeadline: number
    }
    setSlippage: (newVal: string) => void
    setCurrentMinutes: (newVal: string) => void
    setTxDeadline: () => void
}

const createCatSlice: StateCreator<
    TCatStoreState,
    [
        ['zustand/immer', never],
        ['zustand/devtools', unknown],
        ['zustand/subscribeWithSelector', never],
        ['zustand/persist', unknown]
    ]
> = (set, get) => ({
    liquidity: {
        slippage: '0.5',
        currentMinutes: '20',
        txDeadline: Math.floor(Date.now() / 1000) + 60 * 20
    },
    setSlippage: (newVal) =>
        set((state) => {
            state.liquidity.slippage = newVal
        }),
    setCurrentMinutes: (newVal) =>
        set((state) => {
            state.liquidity.currentMinutes = newVal
        }),

    setTxDeadline: () =>
        set((state) => {
            state.liquidity.txDeadline =
                Math.floor(Date.now() / 1000) + 60 * Number(state.liquidity.currentMinutes)
        })
    //   summary: () => {
    //     const total = get().cats.bigCats + get().cats.smallCats;
    //     return `There are ${total} cats in total. `;
    //   },
})

// 进行导出
export const useLiquidityStore = createSelectors(
    create<TCatStoreState>()(
        immer(
            devtools(
                subscribeWithSelector(
                    persist(createCatSlice, {
                        name: 'luquidity_store',
                        storage: createJSONStorage(() => sessionStorage)
                    })
                ),
                {
                    enabled: true,
                    name: 'luquidity_store'
                }
            )
        )
    )
)
