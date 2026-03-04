import { useState } from 'react'
import { api } from '../utils/api'
import './TestClient.css'

function TestClient({ sessionData, onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    try {
      await api.logout()
      onLogout()
    } catch (err) {
      console.error('Logout error:', err)
      onLogout() // Still logout even if API call fails
    }
  }

  return (
    <div className="test-client-page">
      <div className="test-client-container">
        <div className="client-header">
          <h1>Page Client</h1>
          <button
            className="logout-button"
            onClick={() => setShowLogoutConfirm(true)}
            aria-label="Déconnexion"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </div>
        
        <div className="client-welcome">
          <p className="welcome-text">Bienvenue, <strong>{sessionData?.username || 'Client'}</strong>!</p>
        </div>
        
        <div className="test-info">
          <p>Cette page est temporaire et sert uniquement pour les tests.</p>
          <p><strong>Rôle:</strong> {sessionData?.role || 'client'}</p>
          {sessionData?.id_client && (
            <p><strong>ID Client:</strong> {sessionData.id_client}</p>
          )}
          {sessionData?.email && (
            <p><strong>Email:</strong> {sessionData.email}</p>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la déconnexion</h3>
            <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div className="logout-modal-buttons">
              <button onClick={() => setShowLogoutConfirm(false)} className="cancel-button">
                Annuler
              </button>
              <button onClick={handleLogout} className="confirm-logout">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestClient








