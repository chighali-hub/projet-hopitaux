import { useEffect } from 'react'
import pharmacyLogo from '../assets/pharmacy-logo.svg'
import './HomePage.css'

function HomePage({ onAnimationComplete }) {
  useEffect(() => {
    // Rediriger vers le formulaire après 3 secondes
    const timer = setTimeout(() => {
      onAnimationComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onAnimationComplete])

  return (
    <div className="homepage-container">
      <div className="animation-wrapper">
        <div className="pharmacy-icon">
          <img src={pharmacyLogo} alt="Logo Pharmacie" className="logo-image" />
        </div>
        <h1 className="title-animation">Gestion de Pharmacie</h1>
        <p className="subtitle-animation">Trouvez vos médicaments en un clic</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}

export default HomePage

