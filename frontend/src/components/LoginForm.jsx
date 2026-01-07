import { useState } from 'react'
import pharmacyLogo from '../assets/pharmacy-logo.svg'
import { api } from '../utils/api'
import './LoginForm.css'

function LoginForm({ onBackToChoose, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: ''
  })
  
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Réinitialiser l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let hasErrors = false
    const newErrors = {
      username: '',
      password: '',
      general: ''
    }

    // Validation username
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis'
      hasErrors = true
    }

    // Validation password
    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // API call
    setLoading(true)
    setErrors({ username: '', password: '', general: '' })
    
    try {
      const response = await api.login(formData.username, formData.password)
      
      // Store session data
      const sessionData = {
        user_id: response.user_id || response.pharmacie_id || response.client_id,
        username: response.username,
        role: response.role,
        id_pharmacie: response.pharmacie_id,
        nom: response.nom,
        email: response.email,
        has_location: response.has_location
      }
      
      // Call success handler with session data
      if (onLoginSuccess) {
        onLoginSuccess(sessionData)
      }
    } catch (err) {
      setErrors({
        username: '',
        password: '',
        general: err.message || 'Identifiants invalides'
      })
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <button className="back-button" onClick={onBackToChoose} aria-label="Retour">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <img src={pharmacyLogo} alt="Logo Pharmacie" className="logo-image-small" />
          </div>
          <h1>Connexion</h1>
          <p>Bienvenue sur notre plateforme</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="entrez votre username"
              className={errors.username ? 'input-error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Entrez votre mot de passe"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginForm
