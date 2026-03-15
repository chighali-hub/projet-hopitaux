import { useState } from 'react'
import pharmacyLogo from '../assets/pharmacy-logo.svg'
import { api } from '../utils/api'
import './ClientRegisterForm.css'

function ClientRegisterForm({ onNavigateToLogin, onBackToChoose, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  })
  const [step, setStep] = useState(1) // 1: Registration Form, 2: OTP Verification

  const [errors, setErrors] = useState({
    nom: '',
    prenom: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let hasErrors = false
    const newErrors = {
      nom: '',
      prenom: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
      hasErrors = true
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis'
      hasErrors = true
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis'
      hasErrors = true
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'adresse e-mail est requise'
      hasErrors = true
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse e-mail valide'
      hasErrors = true
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
      hasErrors = true
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      hasErrors = true
    }

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

    // API call
    setLoading(true)
    setErrors({ ...newErrors, general: '' })
    
    try {
      if (step === 1) {
        const response = await api.registerClient({
          nom: formData.nom,
          prenom: formData.prenom,
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
        
        // Success - move to OTP step
        setStep(2)
      } else if (step === 2) {
        if (!formData.otp.trim()) {
           setErrors({ ...newErrors, general: 'Le code de vérification est requis' })
           setLoading(false)
           return
        }
        
        const response = await api.verifyRegistrationOTP(formData.email, formData.otp)
        // OTP Success - account created and logged in, close modal
        onRegisterSuccess && onRegisterSuccess(response)
      }
    } catch (err) {
      // Gérer les erreurs de validation du serializer
      let errorMessage = err.message || 'Erreur lors de l\'inscription'
      const fieldErrors = { ...newErrors }
      
      // Si l'erreur contient des détails (erreurs de validation du serializer)
      if (err.response) {
        // Si l'erreur contient un objet 'errors' avec les erreurs par champ
        if (err.response.errors && typeof err.response.errors === 'object') {
          Object.keys(err.response.errors).forEach(field => {
            if (fieldErrors.hasOwnProperty(field)) {
              const fieldError = err.response.errors[field]
              fieldErrors[field] = Array.isArray(fieldError) 
                ? fieldError[0] 
                : String(fieldError)
            }
          })
          errorMessage = err.response.error || 'Veuillez corriger les erreurs ci-dessus'
        } 
        // Si l'erreur est directement un objet avec les champs (format serializer.errors)
        else if (typeof err.response === 'object' && !err.response.error && !err.response.message) {
          Object.keys(err.response).forEach(field => {
            if (fieldErrors.hasOwnProperty(field)) {
              const fieldError = err.response[field]
              fieldErrors[field] = Array.isArray(fieldError) 
                ? fieldError[0] 
                : String(fieldError)
            }
          })
          errorMessage = 'Veuillez corriger les erreurs ci-dessus'
        }
      }
      
      setErrors({
        ...fieldErrors,
        general: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <button className="back-button" onClick={onBackToChoose} aria-label="Retour">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon">
            <img src={pharmacyLogo} alt="Logo Pharmacie" className="logo-image-small" />
          </div>
          <h1>Créer un compte Client</h1>
          <p>Rejoignez notre plateforme</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {step === 1 ? (
            <>
              {/* Form fields for step 1 */}
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
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Entrez votre username"
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
            </>
          ) : (
             <>
                <div className="form-group">
                  <label htmlFor="otp">Code de vérification (OTP)</label>
                  <p className="otp-explainer">Un code à 6 chiffres a été envoyé à <strong>{formData.email}</strong></p>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Entrez le code à 6 chiffres"
                    maxLength="6"
                    className={errors.general ? 'input-error' : ''}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}
                  />
                </div>
             </>
          )}

          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (step === 1 ? 'Création de la demande...' : 'Vérification...') : (step === 1 ? 'Créer le compte' : 'Vérifier le code')}
          </button>

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

export default ClientRegisterForm

