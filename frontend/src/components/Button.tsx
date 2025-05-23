import React, { type ReactNode } from 'react'

const Button = ({onClick, children}: {onClick: () => void, children: React.ReactNode}) => {
    console.log(children);
    return (
        <div onClick={onClick } className='px-8 py-4 text-2xl bg-green-500 hover:bg-green-700 text-white font-bold rounded'>
            {children}
        </div>
    )
}

export default Button