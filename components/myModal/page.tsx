import { Modal } from '@mantine/core'
import React, { ReactNode, useEffect, useState } from 'react'
import style from './page.module.css'

export default function MyModal({
    title,
    isOpen,
    closeFn,
    children
}: {
    isOpen: boolean
    closeFn: Function
    children: ReactNode
    title: string
}) {
    const [openState, setopenState] = useState<boolean>(false)

    useEffect(() => {
        setopenState(isOpen)
    }, [isOpen])
    return (
        <Modal
            centered
            title={title}
            className={style.modal}
            opened={openState}
            onClose={() => closeFn()}
            size='auto'
            style={{ position: 'relative' }}
        >
            {children}
        </Modal>
    )
}
