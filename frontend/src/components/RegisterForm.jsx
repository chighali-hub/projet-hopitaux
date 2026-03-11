import { useState } from 'react'
import pharmacyLogo from '../assets/pharmacy-logo.svg'
import './RegisterForm.css'

function RegisterForm({ onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    password: '',
    confirmPassword: ''
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

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9+\-\s()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    let hasErrors = false
    const newErrors = {
      nom: '',
      prenom: '',
      email: '',
      tel: '',
      password: '',
      confirmPassword: ''
    }

    // Validation nom
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
      hasErrors = true
    }

    // Validation prenom
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis'
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

    // Validation téléphone
    if (!formData.tel.trim()) {
      newErrors.tel = 'Le numéro de téléphone est requis'
      hasErrors = true
    } else if (!validatePhone(formData.tel)) {
      newErrors.tel = 'Veuillez entrer un numéro de téléphone valide'
      hasErrors = true
    }

    // Validation password
    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
      hasErrors = true
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      hasErrors = true
    }

    // Validation confirmation password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise'
      hasErrors = true
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // Ici vous pouvez ajouter la logique de soumission
    console.log('Formulaire d\'inscription soumis:', formData)
    alert('Inscription réussie! (Cette fonctionnalité sera implémentée plus tard)')
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon">
            <img src={pharmacyLogo} alt="Logo Pharmacie" className="logo-image-small" />
          </div>
          <h1>Créer un compte</h1>
          <p>Rejoignez notre plateforme</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Entrez votre nom"
                className={errors.nom ? 'input-error' : ''}
              />
              {errors.nom && <span className="error-message">{errors.nom}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Entrez votre prénom"
                className={errors.prenom ? 'input-error' : ''}
              />
              {errors.prenom && <span className="error-message">{errors.prenom}</span>}
            </div>
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

          <div className="form-group">
            <label htmlFor="tel">Téléphone</label>
            <input
              type="tel"
              id="tel"
              name="tel"
              value={formData.tel}
              onChange={handleChange}
              placeholder="Entrez votre numéro de téléphone"
              className={errors.tel ? 'input-error' : ''}
            />
            {errors.tel && <span className="error-message">{errors.tel}</span>}
          </div>

          <div className="form-row">
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmation du mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmez votre mot de passe"
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

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

          <button type="submit" className="submit-button">
            Créer le compte
          </button>

          <div className="login-link-container">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} className="login-link">
              Vous avez déjà un compte? Connectez-vous ici
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterForm




















