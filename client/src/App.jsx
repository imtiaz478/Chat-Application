import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from "react-hot-toast"
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
const App = () => {

  const { authUser } = useContext(AuthContext)


  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain">
      <Toaster></Toaster>
      <Routes>
        <Route path='/' element={authUser ? <HomePage></HomePage>: <Navigate to="/login"></Navigate>}></Route>
        <Route path='/login' element={!authUser ? <LoginPage></LoginPage> : <Navigate to="/"></Navigate>}></Route>
        <Route path='/profile' element={authUser ? <ProfilePage></ProfilePage> : <Navigate to="/login"></Navigate>}></Route>
      </Routes>
    </div>
  )
}

export default App