// API utility for Django REST Framework
const API_BASE_URL = 'http://localhost:8000/api'

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }

  try {
    const response = await fetch(url, config)

    // Handle non-JSON responses
    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = { error: `Erreur ${response.status}: ${response.statusText}` }
    }

    if (!response.ok) {
      // Include status code in error message for better debugging
      const statusText = response.status === 401 ? 'Non authentifié'
        : response.status === 403 ? 'Accès refusé'
          : response.status === 404 ? 'Ressource non trouvée'
            : `Erreur ${response.status}`

      // Créer une erreur avec les détails complets pour les erreurs de validation
      const error = new Error(data.error || data.message || statusText)
      error.response = data  // Préserver les détails de la réponse (erreurs de validation)
      error.status = response.status
      throw error
    }

    return data
  } catch (error) {
    // Re-throw with better error message
    if (error.message) {
      throw error
    }
    throw new Error('Erreur de connexion au serveur')
  }
}

// API functions
export const api = {
  // Authentication
  registerPharmacy: (data) => apiRequest('/register/pharmacy/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  registerClient: (data) => apiRequest('/register/client/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  verifyRegistrationOTP: (email, otp) => apiRequest('/register/verify-otp/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, otp }),
}),

  login: (username, password) => apiRequest('/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),

  logout: () => apiRequest('/logout/', {
    method: 'POST',
  }),

  getSession: async () => {
    try {
      return await apiRequest('/session/')
    } catch (error) {
      // If 401 or 403, return null to indicate no session
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Aucune session')) {
        return null
      }
      throw error
    }
  },

  // Location
  updateLocation: async (latitude, longitude) => {
    console.log('🌐 Appel API updateLocation:', { latitude, longitude })
    try {
      const result = await apiRequest('/location/update/', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
      })
      console.log('✅ Réponse API updateLocation:', result)
      return result
    } catch (error) {
      console.error('❌ Erreur API updateLocation:', error)
      // Propager l'erreur avec un message clair
      const errorMessage = error.message || 'Erreur lors de la mise à jour de la localisation'
      throw new Error(errorMessage)
    }
  },

  // Pharmacy
  getMyPharmacy: () => apiRequest('/pharmacies/my_pharmacy/'),

  updatePharmacyPhoto: (pharmacieId, photoFile) => {
    const formData = new FormData()
    formData.append('photo_profile', photoFile)
    return fetch(`${API_BASE_URL}/pharmacies/${pharmacieId}/update_photo/`, {
      method: 'PATCH',
      body: formData,
      credentials: 'include',
    }).then(res => res.json())
  },

  updatePharmacyOpenStatus: (isOpen) => apiRequest('/pharmacies/set_open_status/', {
    method: 'PATCH',
    body: JSON.stringify({ is_open: isOpen }),
  }),

  // Medicines
  getMedicines: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/medicaments/${queryString ? '?' + queryString : ''}`)
  },

  getMyStock: () => apiRequest('/medicaments/my_stock/'),

  createMedicine: (data) => apiRequest('/medicaments/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateMedicine: (id, data) => apiRequest(`/medicaments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  deleteMedicine: (id) => apiRequest(`/medicaments/${id}/`, {
    method: 'DELETE',
  }),

  searchMedicines: (search, categorie = null) => {
    const params = { search }
    if (categorie) params.categorie = categorie
    return api.getMedicines(params)
  },

  // Medicine Notifications
  createNotificationRequest: (medicineName) => apiRequest('/notifications/request/', {
    method: 'POST',
    body: JSON.stringify({ medicine_name: medicineName }),
  }),

  getNotifications: () => apiRequest('/notifications/'),

  markNotificationRead: (notificationId) => apiRequest(`/notifications/${notificationId}/read/`, {
    method: 'PATCH',
  }),

  // Pharmacy notification requests
  getPharmacyNotificationRequests: () => apiRequest('/notifications/requests/'),

  // Orders
  getPharmacyOrders: () => apiRequest('/commandes/pharmacy_orders/'),
  
  createOrder: (pharmacieId, medicaments) => apiRequest('/commandes/', {
    method: 'POST',
    body: JSON.stringify({
      pharmacie_id: pharmacieId,
      medicaments: medicaments
    }),
  }),
}


