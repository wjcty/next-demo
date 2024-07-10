import { Button } from '@mantine/core'

export default function MyButton({
    fn,
    text,
    loading = false
}: {
    fn: Function
    text: string
    loading: boolean
}) {
    const callFn = () => {
        fn()
    }

    return (
        <Button
            loading={loading}
            onClick={() => callFn()}
            style={{
                background: 'linear-gradient( 270deg, #FF5F14 0%, #B33BF6 44%, #455EFF 88%)',
                width: '100%'
            }}
            className={`mt-4 px-4 py-2 rounded-xl text-white relative`}
        >
            {text}
        </Button>
    )
}
