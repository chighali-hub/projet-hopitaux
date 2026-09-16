import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { FaBell } from 'react-icons/fa'
import PharmacyNotificationPanel from './PharmacyNotificationPanel'
import './PagePharmacie.css'

function PagePharmacie({ sessionData, onLogout }) {
  const [allMedicines, setAllMedicines] = useState([]) // Stock complet (non filtré)
  const [medicines, setMedicines] = useState([]) // Stock filtré (affiché)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [pharmacyData, setPharmacyData] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [notificationRequests, setNotificationRequests] = useState([])
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)

  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    forme: '',
    prix: '',
    quantite: '',
    date_expiration: '',
    description: ''
  })

  useEffect(() => {
    loadPharmacyData()
    loadMedicines()
    loadNotificationRequests()
    // Refresh notification requests every 30 seconds
    const interval = setInterval(loadNotificationRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationPanel && !event.target.closest('.notification-panel') && !event.target.closest('.notification-container')) {
        setShowNotificationPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotificationPanel])

  const loadPharmacyData = async () => {
    try {
      const data = await api.getMyPharmacy()
      setPharmacyData(data)
    } catch (err) {
      console.error('Error loading pharmacy data:', err)
    }
  }

  const loadNotificationRequests = async () => {
    try {
      const data = await api.getPharmacyNotificationRequests()
      setNotificationRequests(data.medicines || [])
    } catch (err) {
      console.error('Error loading notification requests:', err)
      setNotificationRequests([])
    }
  }

  const loadMedicines = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getMyStock()
      // Vérifier que data est un tableau et filtrer les éléments invalides
      const validStocks = Array.isArray(data) ? data.filter(stock => stock && stock.id && stock.medicament_nom) : []
      setAllMedicines(validStocks)
      applyFilters(validStocks, searchTerm, filterCategory)
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des médicaments')
      setAllMedicines([])
      setMedicines([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (stocks, search, category) => {
    if (!Array.isArray(stocks)) {
      setMedicines([])
      return
    }

    let filtered = stocks.filter(stock => {
      // Vérifier que stock est valide
      if (!stock || !stock.id || !stock.medicament_nom) {
        return false
      }

      // Filtre par nom (recherche)
      if (search && search.trim()) {
        const nom = (stock.medicament_nom || '').toLowerCase()
        const searchLower = search.trim().toLowerCase()
        if (!nom.includes(searchLower)) {
          return false
        }
      }

      // Filtre par catégorie
      if (category && category.trim()) {
        const stockCategory = (stock.medicament_categorie || '').trim()
        if (stockCategory !== category.trim()) {
          return false
        }
      }

      return true
    })

    setMedicines(filtered)
  }

  const handleSearch = () => {
    applyFilters(allMedicines, searchTerm, filterCategory)
  }

  // Appliquer les filtres automatiquement quand searchTerm, filterCategory ou allMedicines change
  useEffect(() => {
    if (allMedicines.length > 0) {
      applyFilters(allMedicines, searchTerm, filterCategory)
    } else if (allMedicines.length === 0 && (searchTerm || filterCategory)) {
      // Si on a des filtres mais pas de données, vider la liste
      setMedicines([])
    }
  }, [searchTerm, filterCategory, allMedicines])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingMedicine) {
        await api.updateMedicine(editingMedicine.medicament.id, {
          ...formData,
          quantite: parseInt(formData.quantite),
          prix: parseFloat(formData.prix)
        })
      } else {
        await api.createMedicine({
          ...formData,
          quantite: parseInt(formData.quantite),
          prix: parseFloat(formData.prix)
        })
      }

      setShowForm(false)
      setEditingMedicine(null)
      resetForm()
      loadMedicines()
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleEdit = (stock) => {
    // Vérifier que stock est valide
    if (!stock || !stock.id) {
      console.error('Cannot edit: invalid stock object', stock)
      setError('Impossible de modifier ce médicament: données invalides')
      return
    }

    // Vérifier que les propriétés nécessaires existent
    if (!stock.medicament_nom || stock.prix === undefined || stock.quantite === undefined) {
      console.error('Cannot edit: missing required properties', stock)
      setError('Impossible de modifier ce médicament: données incomplètes')
      return
    }

    setEditingMedicine(stock)
    setFormData({
      nom: stock.medicament_nom || '',
      categorie: stock.medicament_categorie || '',
      forme: stock.medicament?.forme || '',
      prix: stock.prix ? stock.prix.toString() : '',
      quantite: stock.quantite ? stock.quantite.toString() : '',
      date_expiration: stock.medicament?.date_expiration || '',
      description: stock.medicament?.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (stock) => {
    // Vérifier que stock est valide
    if (!stock || !stock.medicament || !stock.medicament.id) {
      console.error('Cannot delete: invalid stock object', stock)
      setError('Impossible de supprimer ce médicament: données invalides')
      return
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce médicament du stock?')) {
      return
    }

    try {
      await api.deleteMedicine(stock.medicament.id)
      loadMedicines()
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      categorie: '',
      forme: '',
      prix: '',
      quantite: '',
      date_expiration: '',
      description: ''
    })
    setEditingMedicine(null)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const data = await api.updatePharmacyPhoto(sessionData.id_pharmacie, file)
      // Force re-render by updating pharmacyData with timestamp to bust cache
      setPharmacyData({
        ...data,
        photo_profile: data.photo_profile ? `${data.photo_profile}?t=${Date.now()}` : null
      })
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload de la photo')
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
      onLogout()
    } catch (err) {
      console.error('Logout error:', err)
      onLogout() // Still logout even if API call fails
    }
  }

  const handleToggleOpenStatus = async () => {
    const newStatus = !pharmacyData?.is_open
    try {
      const updatedData = await api.updatePharmacyOpenStatus(newStatus)
      setPharmacyData(updatedData)
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du statut')
    }
  }

  return (
    <div className="pharmacy-page">
      {/* Header with Profile */}
      <header className="pharmacy-header">
        <div className="profile-section">
          <div className="profile-photo-container">
            <label htmlFor="photo-upload" className="photo-upload-label">
              {pharmacyData?.photo_profile ? (
                <img
                  src={pharmacyData.photo_profile}
                  alt="Profile"
                  className="profile-photo"
                  onError={(e) => {
                    console.error('Error loading profile image:', pharmacyData.photo_profile)
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="profile-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="photo-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-info">
            <h2>{sessionData?.nom || 'Pharmacie'}</h2>
            <p className="pharmacy-email">{sessionData?.email || ''}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="notification-container">
            <button
              className="notification-button"
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              title="Demandes de notification"
            >
              <FaBell />
              {notificationRequests.length > 0 && (
                <span className="notification-badge">{notificationRequests.length}</span>
              )}
            </button>
          </div>
          <button
            className={`open-status-button ${pharmacyData?.is_open ? 'open' : 'closed'}`}
            onClick={handleToggleOpenStatus}
          >
            {pharmacyData?.is_open ? 'Ouvert' : 'Fermé'}
          </button>
          <button
            className="logout-button"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pharmacy-main">
        {/* Search and Filter Section */}
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher un médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="search-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              // Le filtrage se fera automatiquement via useEffect
            }}
            className="category-filter"
          >
            <option value="">Toutes les catégories</option>
            <option value="Antibiotique">Antibiotique</option>
            <option value="Analgésique">Analgésique</option>
            <option value="Vitamine">Vitamine</option>
            <option value="Antihistaminique">Antihistaminique</option>
            <option value="Autre">Autre</option>
          </select>
          <button
            className="add-button"
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            + Ajouter un médicament
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Medicine Form Modal */}
        {showForm && (
          <div className="form-modal">
            <div className="form-modal-content">
              <h3>{editingMedicine ? 'Modifier' : 'Ajouter'} un médicament</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <input
                      type="text"
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Forme</label>
                    <input
                      type="text"
                      value={formData.forme}
                      onChange={(e) => setFormData({ ...formData, forme: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prix *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prix}
                      onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantité *</label>
                    <input
                      type="number"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date d'expiration</label>
                    <input
                      type="date"
                      value={formData.date_expiration}
                      onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}>
                    Annuler
                  </button>
                  <button type="submit">
                    {editingMedicine ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Medicines List */}
        <div className="medicines-section">
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : medicines.length === 0 ? (
            <div className="empty-state">
              <p>{searchTerm || filterCategory ? 'Aucun médicament trouvé' : 'Aucun médicament en stock'}</p>
            </div>
          ) : (
            <div className="medicines-grid">
              {medicines
                .filter(stock => stock && stock.id && stock.medicament_nom) // Filtrer les undefined
                .map((stock) => {
                  // Vérifications supplémentaires pour éviter les erreurs
                  if (!stock || !stock.id) {
                    return null
                  }

                  const medicamentId = stock.medicament?.id || stock.medicament_id
                  if (!medicamentId) {
                    console.warn('Stock without medicament id:', stock)
                    return null
                  }

                  return (
                    <div key={stock.id} className="medicine-card">
                      <div className="medicine-header">
                        <h4>{stock.medicament_nom || 'Nom non disponible'}</h4>
                        <span className="category-badge">{stock.medicament_categorie || 'Non catégorisé'}</span>
                      </div>
                      <div className="medicine-details">
                        <p><strong>Prix:</strong> {stock.prix !== undefined && stock.prix !== null ? `${stock.prix} €` : 'N/A'}</p>
                        <p><strong>Quantité:</strong> {stock.quantite !== undefined && stock.quantite !== null ? stock.quantite : 'N/A'}</p>
                      </div>
                      <div className="medicine-actions">
                        <button
                          onClick={() => handleEdit(stock)}
                          className="edit-button"
                          disabled={!stock || !stock.id}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(stock)}
                          className="delete-button"
                          disabled={!stock || !medicamentId}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )
                })
                .filter(card => card !== null) // Retirer les null
              }
            </div>
          )}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmer la déconnexion</h3>
            <p>Êtes-vous sûr de vouloir vous déconnecter?</p>
            <div className="modal-actions">
              <button onClick={() => setShowLogoutConfirm(false)}>Annuler</button>
              <button onClick={handleLogout} className="confirm-logout">Déconnexion</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel for Medicine Requests */}
      {showNotificationPanel && (
        <PharmacyNotificationPanel
          medicines={notificationRequests}
          onClose={() => setShowNotificationPanel(false)}
        />
      )}
    </div>
  )
}

export default PagePharmacie










