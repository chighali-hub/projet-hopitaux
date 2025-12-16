import { useState } from 'react'
import HomePage from './components/HomePage'
import LoginForm from './components/LoginForm'
import './App.css'

function App() {
  const [showLogin, setShowLogin] = useState(false)

  const handleAnimationComplete = () => {
    setShowLogin(true)
  }

  return (
    <>
      {!showLogin && <HomePage onAnimationComplete={handleAnimationComplete} />}
      {showLogin && <LoginForm />}
    </>
  )
}

export default App
