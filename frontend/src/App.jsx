import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './App.css'
import Game from './screens/Game'
import GameModeSelector from './screens/GameModeSelector'
function App() {
  

  return (
    <div >  
      <BrowserRouter>
        <Routes>
          <Route path="/game/*" element={<Game/>}/>
          <Route path="/" element={<GameModeSelector/>}/>
        </Routes>
      </BrowserRouter>
    </div>
    
  )
}

export default App
