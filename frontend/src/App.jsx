import { useState, useEffect } from 'react'
import HomePage from './components/HomePage'
import ChooseAccountType from './components/ChooseAccountType'
import LoginForm from './components/LoginForm'
import ClientRegisterForm from './components/ClientRegisterForm'
import PharmacyRegisterForm from './components/PharmacyRegisterForm'
import LocationPage from './components/LocationPage'
import PagePharmacie from './components/PagePharmacie'
import ClientSearchPage from './components/ClientSearchPage'
import { api } from './utils/api'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount - ALWAYS verify with backend
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const data = await api.getSession()
      
      // If getSession returns null (401/403), no valid session
      if (!data || !data.role) {
        setSessionData(null)
        setCurrentPage('home')
        setLoading(false)
        return
      }

      // Valid session - set session data
      setSessionData(data)
      
      // Redirect based on role and location status FROM BACKEND
      if (data.role === 'pharmacien') {
        // Use has_location from backend response (not from separate API call)
        if (data.has_location === true || data.has_location === 'true') {
          setCurrentPage('pharmacy')
        } else {
          setCurrentPage('location')
        }
      } else if (data.role === 'client') {
        setCurrentPage('client-search')
      } else {
        // Unknown role, go to home
        setSessionData(null)
        setCurrentPage('home')
      }
    } catch (err) {
      // Any error means no valid session
      console.error('Session check failed:', err)
      setSessionData(null)
      setCurrentPage('home')
    } finally {
      setLoading(false)
    }
  }

  const handleAnimationComplete = () => {
    setCurrentPage('choose')
  }

  const handleSelectClient = () => {
    setCurrentPage('client-register')
  }

  const handleSelectPharmacy = () => {
    setCurrentPage('pharmacy-register')
  }

  const handleNavigateToLogin = () => {
    setCurrentPage('login')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setSessionData(null)
  }

  const handleBackToChoose = () => {
    setCurrentPage('choose')
  }

  const handleLoginSuccess = async (data) => {
    // After login, verify session with backend
    setSessionData(data)
    
    if (data.role === 'pharmacien') {
      // Use has_location from login response
      if (data.has_location === true || data.has_location === 'true') {
        setCurrentPage('pharmacy')
      } else {
        setCurrentPage('location')
      }
    } else if (data.role === 'client') {
      setCurrentPage('client-search')
    }
  }

  const handleRegisterSuccess = async (data) => {
    // After pharmacy registration, user is automatically authenticated by backend
    if (data.authenticated && data.role === 'pharmacien') {
      console.log('✅ Inscription réussie, vérification de la session...', data)
      
      // CRITICAL: Wait a bit for cookies to be set, then verify session with backend
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for cookie propagation
      
      // Verify session with backend to ensure cookies are received
      try {
        const session = await api.getSession()
        if (session && session.role === 'pharmacien') {
          console.log('✅ Session vérifiée avec succès:', session)
          // User is authenticated, set session data from backend response
          setSessionData(session)
          
          // Redirect based on has_location from backend
          if (session.has_location === true || session.has_location === 'true') {
            setCurrentPage('pharmacy')
          } else {
            setCurrentPage('location')
          }
        } else {
          console.warn('⚠️ Session non valide après inscription, redirection vers login')
          // Session not valid, redirect to login
          setCurrentPage('login')
        }
      } catch (err) {
        console.error('❌ Erreur lors de la vérification de session après inscription:', err)
        // If session check fails, still try to use registration data
        setSessionData({
          user_id: data.user_id,
          username: data.username,
          role: data.role,
          id_pharmacie: data.pharmacie_id,
          nom: data.nom,
          email: data.email,
          has_location: data.has_location
        })
        
        // Redirect based on has_location
        if (data.has_location === true || data.has_location === 'true') {
          setCurrentPage('pharmacy')
        } else {
          setCurrentPage('location')
        }
      }
    }
    else if (data.authenticated && data.role === 'client') {
      console.log('✅ Inscription client réussie, vérification de la session...', data)
      
      // CRITICAL: Wait a bit for cookies to be set, then verify session with backend
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for cookie propagation
      
      // Verify session with backend to ensure cookies are received
      try {
        const session = await api.getSession()
        console.log(session)
        if (session && session.role === 'client') {
          console.log('✅ Session client vérifiée avec succès:', session)
          // User is authenticated, set session data from backend response
          setSessionData(session)
          setCurrentPage('client-search')
        } else {
          console.warn('⚠️ Session client non valide après inscription, redirection vers login')
          // Session not valid, redirect to login
          setCurrentPage('client-search')
        }
      } catch (err) {
        console.error('❌ Erreur lors de la vérification de session client après inscription:', err)
        // If session check fails, still try to use registration data
        setSessionData({
          user_id: data.user_id,
          username: data.username,
          role: data.role,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email
        })
        setCurrentPage('client-search')
      }
    } else {
      // For registration without auto-auth or if authentication failed, redirect to login
      setCurrentPage('login')
    }
  }

  const handleLocationConfirmed = async () => {
    // After location confirmation, refresh session to get updated has_location
    try {
      const updatedSession = await api.getSession()
      if (updatedSession) {
        setSessionData(updatedSession)
        setCurrentPage('pharmacy')
      } else {
        // Session lost, redirect to login
        setSessionData(null)
        setCurrentPage('login')
      }
    } catch (err) {
      console.error('Failed to refresh session after location update:', err)
      // Still redirect to pharmacy if we have session data
      if (sessionData) {
        setSessionData({ ...sessionData, has_location: true })
        setCurrentPage('pharmacy')
      } else {
        setCurrentPage('login')
      }
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setSessionData(null)
      setCurrentPage('home')
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <>
      {currentPage === 'home' && <HomePage onAnimationComplete={handleAnimationComplete} />}
      {currentPage === 'choose' && (
        <ChooseAccountType 
          onSelectClient={handleSelectClient}
          onSelectPharmacy={handleSelectPharmacy}
          onBackToHome={handleBackToHome}
        />
      )}
      {currentPage === 'login' && (
        <LoginForm 
          onBackToChoose={handleBackToChoose}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {currentPage === 'client-register' && (
        <ClientRegisterForm 
          onNavigateToLogin={handleNavigateToLogin}
          onBackToChoose={handleBackToChoose}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
      {currentPage === 'pharmacy-register' && (
        <PharmacyRegisterForm 
          onNavigateToLogin={handleNavigateToLogin}
          onBackToChoose={handleBackToChoose}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
      {/* Location page ONLY accessible if session is valid and role is pharmacien */}
      {currentPage === 'location' && sessionData && sessionData.role === 'pharmacien' && (
        <LocationPage 
          onLocationConfirmed={handleLocationConfirmed}
          sessionData={sessionData}
        />
      )}
      {/* Pharmacy page ONLY accessible if session is valid and role is pharmacien */}
      {currentPage === 'pharmacy' && sessionData && sessionData.role === 'pharmacien' && (
        <PagePharmacie 
          sessionData={sessionData}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'client-search' && sessionData && sessionData.role === 'client' && (
        <ClientSearchPage onLogout={handleLogout} />
      )}
      {/* Fallback: if trying to access protected page without session, redirect to home */}
      {(currentPage === 'location' || currentPage === 'pharmacy' || currentPage === 'testclient') && !sessionData && (
        <HomePage onAnimationComplete={handleAnimationComplete} />
      )}
    </>
  )
}

export default App
