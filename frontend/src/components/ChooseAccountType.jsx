import { useState } from 'react'
import pharmacyLogo from '../assets/pharmacy-logo.svg'
import './ChooseAccountType.css'

function ChooseAccountType({ onSelectClient, onSelectPharmacy, onBackToHome }) {
  const [hoveredButton, setHoveredButton] = useState(null)

  return (
    <div className="choose-account-container">
      <button className="back-button" onClick={onBackToHome} aria-label="Retour à l'accueil">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="choose-account-content">
        <div className="account-header">
          <div className="account-logo">
            <img src={pharmacyLogo} alt="Logo Pharmacie" className="logo-image-account" />
          </div>
          <h1 className="account-title">Choisissez votre type de compte</h1>
          <p className="account-subtitle">Sélectionnez le type de compte qui vous correspond</p>
        </div>

        <div className="buttons-container">
          <button
            className={`account-button client-button ${hoveredButton === 'client' ? 'hovered' : ''}`}
            onClick={onSelectClient}
            onMouseEnter={() => setHoveredButton('client')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div className="button-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="button-content">
              <h3>Client</h3>
              <p>Créez un compte pour commander vos médicaments</p>
            </div>
            <div className="button-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            className={`account-button pharmacy-button ${hoveredButton === 'pharmacy' ? 'hovered' : ''}`}
            onClick={onSelectPharmacy}
            onMouseEnter={() => setHoveredButton('pharmacy')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div className="button-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                <path d="M12 12v4M8 14h8" />
              </svg>
            </div>
            <div className="button-content">
              <h3>Pharmacie</h3>
              <p>Gérez votre pharmacie et vos produits</p>
            </div>
            <div className="button-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChooseAccountType

