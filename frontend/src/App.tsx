import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './App.css'
import Landing from './screens/Landing'
import Game from './screens/Game'
import Login from './screens/Login'
import Signup from './screens/Signup'

function App() {
  

  return (
    <div className="h-screen bg-slate-950">  
      <BrowserRouter>
        <Routes>
          <Route path="/" element = {<Landing/>}/>
          <Route path="/game" element={<Game/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/signup" element={<Signup/>}/>
        </Routes>
      </BrowserRouter>
    </div>
    
  )
}

export default App
