import Image from 'next/image'

const CurrencyInputPanel = ({
    label,
    currency,
    amount,
    onCurrencySelect,
    onAmountChange,
    tokens,
    tokenIcons
}) => {
    return (
        <div className='currency-input-panel'>
            <div className='label'>{label}</div>
            <div className='input-container'>
                <input
                    type='number'
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    placeholder='0.0'
                />
                <select value={currency} onChange={(e) => onCurrencySelect(e.target.value)}>
                    {tokens.map((token) => (
                        <option key={token.symbol} value={token.symbol}>
                            <Image
                                src={tokenIcons[token.symbol]}
                                alt={token.symbol}
                                className='token-icon'
                            />
                            {token.symbol}
                        </option>
                    ))}
                </select>
            </div>
            <div className='balance'>
                Balance: {amount} {currency}
            </div>
        </div>
    )
}

export default CurrencyInputPanel
