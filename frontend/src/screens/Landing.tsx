import React from 'react'
import Button from '../components/Button'
import chessboard from "../assets/chessboard.png"
import { useNavigate } from 'react-router-dom'
const Landing = () => {
    const navigate = useNavigate();
    return (
        <div className="flex justify-center">
            <div className="pt-8 max-w-screen-lg">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className=" flex justify-center">
                        <img src = {chessboard} className="max-w-96"></img>
                    </div>
                    <div className='pt-16'>
                        <div className="flex justify-center">
                            <h1 className="text-4xl front-bold text-white">Play chess online on the #2 Site</h1>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button
                                onClick={() => navigate("/game")}
                            >
                                Play online
                            </Button>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button
                                onClick={() => navigate("/login")}
                            >
                                login
                            </Button>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button
                                onClick={() => navigate("/signup")}
                            >
                                signup
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Landing