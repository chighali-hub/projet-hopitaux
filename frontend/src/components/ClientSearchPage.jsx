import { useState, useEffect } from 'react'
import SearchBar from './SearchBar'
import PharmacyList from './PharmacyList'
import MapSection from './MapSection'
import PharmacyChatBot from './PharmacyChatBot'
import NotificationPanel from './NotificationPanel'
import { FaPills, FaHospital, FaSignOutAlt, FaBell } from 'react-icons/fa'
import { api } from '../utils/api'
import './ClientSearchPage.css'

function ClientSearchPage({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Get client current position once, when the page loads
  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => {
        console.warn('Geolocation error:', err)
      }
    )
  }, [])

  // Load notifications on mount and poll for updates
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await api.getNotifications()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = async (query) => {
    setSearchQuery(query)
    setHasSearched(true)
    setLoading(true)

    try {
      const data = await api.searchStocks(query)

      const pharmaciesFromApi = data.map((stock) => {
        const loc = stock.pharmacie_localisation || ''
        const [latStr, lonStr] = loc.split(',')
        const latitude = parseFloat(latStr)
        const longitude = parseFloat(lonStr)

        return {
          id: stock.id,
          nom: stock.pharmacie_nom,
          distance: '—',
          medicament_nom: stock.medicament_nom,
          localisation: stock.pharmacie_localisation,
          telephone: stock.pharmacie_telephone,
          is_open: stock.pharmacie_is_open,
          prix: stock.prix,
          quantite: stock.quantite,
          latitude: Number.isFinite(latitude) ? latitude : null,
          longitude: Number.isFinite(longitude) ? longitude : null,
        }
      })

      setPharmacies(pharmaciesFromApi)
      setSubscribed(false) // Reset subscription status on new search
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
      setPharmacies([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!searchQuery.trim()) return
    
    try {
      await api.createNotificationRequest(searchQuery.trim())
      setSubscribed(true)
      alert(`Vous serez notifié lorsque "${searchQuery}" sera disponible dans une pharmacie.`)
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('Erreur lors de l\'abonnement. Veuillez réessayer.')
    }
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

  const handleLogout = async () => {
    try {
      await api.logout()
      if (onLogout) {
        onLogout()
      }
    } catch (err) {
      console.error('Logout error:', err)
      if (onLogout) {
        onLogout() // Toujours déconnecter côté frontend même si l'API échoue
      }
    }
  }

  return (
    <div dir="ltr" className="client-search-app">
      <header className="client-search-header">
        <div className="client-search-header-content">
          <div className="client-search-header-top">
            <div className="client-search-title">
              <FaPills className="client-search-title-icon" />
              <h1>Rechercher un médicament</h1>
            </div>
            <div className="client-search-header-actions">
              {/* Notification bell */}
              <button
                type="button"
                className="client-search-notification-button"
                onClick={handleNotificationClick}
                aria-label="Notifications"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              {onLogout && (
                <button
                  type="button"
                  className="client-search-logout-button"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <FaSignOutAlt />
                  <span>Déconnexion</span>
                </button>
              )}
            </div>
          </div>
          <p className="client-search-subtitle">
            Recherchez le médicament dont vous avez besoin et trouvez la
            pharmacie la plus proche disponible
          </p>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </header>

      <main className="client-search-main">
        {hasSearched && (
          <div className="client-search-section">
            <div className="client-search-section-header">
              <FaHospital className="client-search-section-icon" />
              <h2 className="client-search-section-title">
                {searchQuery
                  ? `Résultats de recherche pour : "${searchQuery}"`
                  : 'Pharmacies disponibles'}
              </h2>
            </div>

            {loading ? (
              <div className="client-search-loading">
                <div className="client-search-spinner-wrapper">
                  <div className="client-search-spinner" />
                  <FaPills className="client-search-spinner-icon" />
                </div>
              </div>
            ) : pharmacies.length > 0 ? (
              <div className="client-search-pharmacy-grid">
                <PharmacyList pharmacies={pharmacies} userLocation={userLocation} />
              </div>
            ) : (
              <div className="client-search-empty">
                <FaPills className="client-search-empty-icon" />
                <h3 className="client-search-empty-title">
                  Aucun résultat trouvé
                </h3>
                <p className="client-search-empty-text">
                  Essayez de rechercher avec des mots différents ou vérifiez
                  l&apos;orthographe
                </p>
                {!subscribed && (
                  <button
                    type="button"
                    className="client-search-subscribe-button"
                    onClick={handleSubscribe}
                  >
                    <FaBell />
                    Me notifier quand ce médicament sera disponible
                  </button>
                )}
                {subscribed && (
                  <p className="client-search-subscribed-message">
                    ✓ Vous serez notifié lorsque &quot;{searchQuery}&quot; sera disponible
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="client-search-welcome">
            <FaPills className="client-search-welcome-icon" />
            <h2 className="client-search-welcome-title">
              Commencez à rechercher un médicament
            </h2>
            <p className="client-search-welcome-text">
              Recherchez le médicament dont vous avez besoin dans la barre de
              recherche ci-dessus
            </p>
          </div>
        )}

        {pharmacies.length > 0 && (
          <div className="client-search-map-wrapper">
            <MapSection pharmacies={pharmacies} userLocation={userLocation} />
          </div>
        )}
      </main>

      <footer className="client-search-footer">
        <p className="client-search-footer-text">
          © 2024 Système de gestion des pharmacies. Tous droits réservés.
        </p>
      </footer>

      {/* Modal de confirmation de déconnexion */}
      {showLogoutConfirm && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirmer la déconnexion</h3>
            <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div className="logout-modal-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="confirm-logout"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating assistant about pharmacies info */}
      <PharmacyChatBot pharmacies={pharmacies} userLocation={userLocation} />

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onSearch={handleSearch}
          onMarkRead={async (id) => {
            try {
              await api.markNotificationRead(id)
              setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
              )
              setUnreadCount((prev) => Math.max(0, prev - 1))
            } catch (error) {
              console.error('Error marking notification as read:', error)
            }
          }}
        />
      )}
    </div>
  )
}

export default ClientSearchPage


