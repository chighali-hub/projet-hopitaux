import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import MapPicker from './MapPicker'
import './LocationPage.css'

function LocationPage({ onLocationConfirmed }) {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sessionValid, setSessionValid] = useState(true)

  // Verify session before allowing location update
  useEffect(() => {
    verifySession()
  }, [])

  const verifySession = async () => {
    try {
      const session = await api.getSession()
      if (!session || session.role !== 'pharmacien') {
        setSessionValid(false)
        setError('Session invalide. Veuillez vous reconnecter.')
      }
    } catch {
      setSessionValid(false)
      setError('Erreur de session. Veuillez vous reconnecter.')
    }
  }

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation)
    setError(null)
  }

  const confirmLocation = async () => {
    if (!location) {
      setError('Veuillez choisir une position sur la carte en cliquant ou en déplaçant le marqueur')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ÉTAPE 1: Vérifier la session avec le backend
      console.log('🔍 Vérification de la session avant mise à jour de localisation...')
      const session = await api.getSession()
      
      if (!session) {
        throw new Error('Aucune session active. Veuillez vous reconnecter.')
      }
      
      // Normaliser le rôle pour la comparaison (gérer majuscules/minuscules)
      const userRole = String(session.role || '').trim().toLowerCase()
      if (userRole !== 'pharmacien') {
        throw new Error(`Rôle incorrect: ${session.role}. Accès réservé aux pharmaciens.`)
      }
      
      console.log('✅ Session valide:', { 
        user_id: session.user_id, 
        role: session.role, 
        id_pharmacie: session.id_pharmacie 
      })

      // ÉTAPE 2: Mettre à jour la localisation
      console.log('📍 Mise à jour de la localisation...', { 
        latitude: location.latitude, 
        longitude: location.longitude 
      })
      
      const result = await api.updateLocation(location.latitude, location.longitude)
      
      console.log('✅ Localisation mise à jour avec succès:', result)
      
      // ÉTAPE 3: Succès - appeler le handler de confirmation (redirige vers la page pharmacie)
      setLoading(false)
      onLocationConfirmed()
    } catch (err) {
      // Afficher le message d'erreur exact de l'API
      const errorMessage = err.message || 'Erreur lors de l\'enregistrement de la localisation'
      console.error('❌ Erreur lors de la mise à jour de localisation:', err)
      setError(errorMessage)
      setLoading(false)
      
      // Si erreur 401 ou 403, la session est invalide
      const errorLower = errorMessage.toLowerCase()
      if (errorLower.includes('401') || 
          errorLower.includes('403') || 
          errorLower.includes('session') || 
          errorLower.includes('non authentifié') || 
          errorLower.includes('accès refusé') ||
          errorLower.includes('non authentifie')) {
        setSessionValid(false)
      }
    }
  }

  // If session invalid, show error message
  if (!sessionValid) {
    return (
      <div className="location-page">
        <div className="location-container">
          <div className="error-message" style={{ margin: '20px 0' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error || 'Session invalide. Veuillez vous reconnecter.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="location-page">
      <div className="location-container">
        <div className="location-header">
          <h1>📍 Localisation de la Pharmacie</h1>
          <p>Cliquez sur la carte ou déplacez le marqueur pour choisir l'emplacement de votre pharmacie</p>
        </div>

        <div className="location-content">
          <div className="map-wrapper">
            <MapPicker 
              onLocationSelect={handleLocationSelect}
              initialLocation={location}
            />
          </div>

          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {location && (
            <div className="location-info">
              <div className="coordinates">
                <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
              </div>

              <button
                className="confirm-button"
                onClick={confirmLocation}
                disabled={loading || !sessionValid}
              >
                {loading ? 'Enregistrement...' : 'Confirmer la localisation'}
              </button>
            </div>
          )}

          {!location && (
            <div className="location-hint">
              <p>👆 Cliquez sur la carte pour sélectionner l'emplacement de votre pharmacie</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LocationPage
