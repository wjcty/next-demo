import style from './Card.module.css'

const StartJungleCard = (props: any) => {
    const { title, value, unit, actionLabel } = props
    return (
        <div className='bg-[#141414] text-white rounded-lg p-6 flex flex-col justify-between'>
            <div>
                <h2 className='text-xl font-bold'>{title}</h2>
                <div className={` flex items-end text-lg`}>
                    <div className={`${style.text2} text-lg font-semibold mr-4 pt-2`}>
                        {value} {unit}
                    </div>
                </div>
            </div>
            <button className='w-full bg-[#1f1f1f] mt-4 px-4 py-2 rounded-lg text-[#F15223]'>
                {actionLabel}
            </button>
        </div>
    )
}

export default StartJungleCard
