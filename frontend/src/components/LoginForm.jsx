import { useState } from 'react'
import pharmacyLogo from '../assets/pharmacy-logo.svg'
import './LoginForm.css'

function LoginForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  })

  const [errors, setErrors] = useState({
    username: '',
    email: ''
  })

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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    let hasErrors = false
    const newErrors = {
      username: '',
      email: ''
    }

    // Validation username
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis'
      hasErrors = true
    }

    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'adresse e-mail est requise'
      hasErrors = true
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse e-mail valide'
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // Ici vous pouvez ajouter la logique de soumission
    console.log('Formulaire soumis:', formData)
    alert('Connexion réussie! (Cette fonctionnalité sera implémentée plus tard)')
  }

  return (
    <div className="login-container">
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
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Entrez votre nom d'utilisateur"
              className={errors.username ? 'input-error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Entrez votre adresse e-mail"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <button type="submit" className="submit-button">
            Se connecter
          </button>
        </form>

        <div className="info-message">
          <svg viewBox="0 0 24 24" fill="none" stroke="#87CEEB" strokeWidth="2" className="info-icon">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4 M12 8h.01" />
          </svg>
          <p>
            Pour une utilisation optimale du site, veuillez fournir une adresse e-mail valide.
            Des notifications importantes vous seront envoyées par e-mail.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm

