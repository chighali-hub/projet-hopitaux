import { useState, useRef, useEffect } from 'react'
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa'

function PharmacyChatBot({ pharmacies, userLocation }) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "Bonjour 👋 Je suis votre assistant virtuel. Je peux vous aider à trouver des informations sur les pharmacies : localisation, horaires, contacts, et bien plus encore. Posez-moi vos questions !",
    },
  ])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
    // Focus input when opening
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const addMessage = (from, text) => {
    setMessages((prev) => [...prev, { from, text }])
  }

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const buildBotReply = (text) => {
    const normalized = text.toLowerCase().trim()
    const list = pharmacies || []
    const total = list.length
    const openList = list.filter((p) => p.is_open)
    const closedList = list.filter((p) => p.is_open === false)

    // Greetings
    if (
      normalized.includes('bonjour') ||
      normalized.includes('salut') ||
      normalized.includes('hello') ||
      normalized.includes('hi') ||
      normalized.includes('hey')
    ) {
      return "Bonjour ! 😊 Comment puis-je vous aider aujourd'hui ? Je peux vous donner des informations sur les pharmacies disponibles, leurs horaires, leurs contacts, et bien plus encore."
    }

    // Help/What can you do
    if (
      normalized.includes('aide') ||
      normalized.includes('help') ||
      normalized.includes('que peux-tu') ||
      normalized.includes('que puis') ||
      normalized.includes('comment') && normalized.includes('utiliser')
    ) {
      return "Je peux vous aider à :\n• Trouver la pharmacie la plus proche de vous\n• Connaître les pharmacies ouvertes/fermées\n• Obtenir les informations de contact d'une pharmacie\n• Connaître le nombre total de pharmacies trouvées\n• Obtenir des détails sur une pharmacie spécifique\n\nPosez-moi simplement votre question !"
    }

    // If user asks about a medicine, decline (not a doctor)
    if (
      normalized.includes('médicament') ||
      normalized.includes('medicament') ||
      normalized.includes('médicaments') ||
      normalized.includes('medicine') ||
      normalized.includes('drug') ||
      normalized.includes('posologie') ||
      normalized.includes('dose') ||
      normalized.includes('dosage') ||
      normalized.includes('effet secondaire') ||
      normalized.includes('contre-indication')
    ) {
      return "⚠️ Je ne suis pas médecin et je ne peux pas donner de conseils médicaux. Pour toute question sur les médicaments, leur posologie, ou leurs effets, veuillez consulter un professionnel de santé (médecin ou pharmacien)."
    }

    if (total === 0) {
      return "🔍 Je n'ai pas encore de pharmacies dans les résultats. Veuillez d'abord effectuer une recherche de médicament pour trouver les pharmacies disponibles."
    }

    // Distance/Proximity queries
    if (
      normalized.includes('plus proche') ||
      normalized.includes('proche de moi') ||
      normalized.includes('près de moi') ||
      normalized.includes('nearest') ||
      normalized.includes('distance') ||
      normalized.includes('proximité') ||
      (normalized.includes('quelle') && normalized.includes('proche'))
    ) {
      if (
        !userLocation ||
        typeof userLocation.latitude !== 'number' ||
        typeof userLocation.longitude !== 'number'
      ) {
        return "Je ne peux pas déterminer la pharmacie la plus proche car la localisation de l'utilisateur n'est pas disponible (acceptez la géolocalisation dans votre navigateur)."
      }

      const toRad = (deg) => (deg * Math.PI) / 180

      const withDistance = list
        .filter(
          (p) =>
            typeof p.latitude === 'number' &&
            typeof p.longitude === 'number' &&
            !Number.isNaN(p.latitude) &&
            !Number.isNaN(p.longitude)
        )
        .map((p) => {
          const R = 6371 // km
          const dLat = toRad(p.latitude - userLocation.latitude)
          const dLon = toRad(p.longitude - userLocation.longitude)
          const lat1 = toRad(userLocation.latitude)
          const lat2 = toRad(p.latitude)

          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) *
              Math.sin(dLon / 2) *
              Math.cos(lat1) *
              Math.cos(lat2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = R * c

          return { ...p, _distanceKm: distance }
        })

      if (withDistance.length === 0) {
        return "Je n'ai pas de coordonnées pour calculer la pharmacie la plus proche."
      }

      withDistance.sort((a, b) => a._distanceKm - b._distanceKm)
      const nearest = withDistance[0]
      const dist = nearest._distanceKm.toFixed(1)
      const status = nearest.is_open ? 'ouverte' : 'fermée'
      const tel = nearest.telephone || 'téléphone non disponible'
      
      let response = `📍 La pharmacie la plus proche est « ${nearest.nom} », à environ ${dist} km de votre position.\n\n`
      response += `📊 Statut : ${status}\n`
      response += `📞 Téléphone : ${tel}\n`
      if (nearest.localisation) {
        response += `📍 Localisation : ${nearest.localisation}`
      }
      
      return response
    }

    // Ask about a specific pharmacy by name
    if (normalized.includes('pharmacie') || normalized.includes('info') || normalized.includes('détail')) {
      // Try to extract pharmacy name from the query
      let maybeName = ''
      
      // Check if there's a name after "pharmacie"
      const idx = normalized.indexOf('pharmacie')
      if (idx !== -1) {
        maybeName = normalized
          .slice(idx + 'pharmacie'.length)
          .replace(/[?!.,]/g, '')
          .trim()
      }
      
      // Also check for common patterns like "parle-moi de", "info sur", etc.
      const patterns = ['parle', 'info', 'détail', 'sur', 'de la', 'du']
      for (const pattern of patterns) {
        const patternIdx = normalized.indexOf(pattern)
        if (patternIdx !== -1) {
          const extracted = normalized
            .slice(patternIdx + pattern.length)
            .replace(/[?!.,]/g, '')
            .trim()
          if (extracted && extracted.length > 2) {
            maybeName = extracted
            break
          }
        }
      }

      if (maybeName) {
        const match = list.find((p) =>
          p.nom.toLowerCase().includes(maybeName) ||
          maybeName.includes(p.nom.toLowerCase())
        )

        if (match) {
          const status = match.is_open ? 'ouverte ✅' : 'fermée ❌'
          const loc = match.localisation || 'localisation non précisée'
          const tel = match.telephone || 'téléphone non disponible'
          const prix = match.prix ? `${match.prix} MRU` : 'prix non disponible'
          const quantite = match.quantite ? `${match.quantite} unités` : 'quantité non disponible'
          
          let response = `🏥 Informations sur « ${match.nom} » :\n\n`
          response += `📊 Statut : ${status}\n`
          response += `📍 Localisation : ${loc}\n`
          response += `📞 Téléphone : ${tel}\n`
          if (match.medicament_nom) {
            response += `💊 Médicament disponible : ${match.medicament_nom}\n`
            response += `💰 Prix : ${prix}\n`
            response += `📦 Quantité : ${quantite}`
          }
          
          return response
        } else {
          return `Je n'ai pas trouvé de pharmacie correspondant à "${maybeName}". Voici les pharmacies disponibles : ${list.slice(0, 5).map(p => p.nom).join(', ')}${list.length > 5 ? '...' : ''}`
        }
      }
    }

    // Count queries
    if (normalized.includes('combien') || normalized.includes('how many') || normalized.includes('nombre') || normalized.includes('total')) {
      if (normalized.includes('ouverte') || normalized.includes('open')) {
        return `Il y a ${openList.length} pharmacie${openList.length > 1 ? 's' : ''} ouverte${openList.length > 1 ? 's' : ''} dans les résultats.`
      }
      if (normalized.includes('fermée') || normalized.includes('closed')) {
        return `Il y a ${closedList.length} pharmacie${closedList.length > 1 ? 's' : ''} fermée${closedList.length > 1 ? 's' : ''} dans les résultats.`
      }
      return `📊 Il y a ${total} pharmacie${total > 1 ? 's' : ''} dans les résultats, dont ${openList.length} ouverte${openList.length > 1 ? 's' : ''} et ${closedList.length} fermée${closedList.length > 1 ? 's' : ''}.`
    }

    // Open pharmacies
    if (normalized.includes('ouverte') || normalized.includes('open') || (normalized.includes('disponible') && normalized.includes('pharmacie'))) {
      if (openList.length === 0) {
        return '❌ Aucune pharmacie ouverte dans les résultats pour le moment.'
      }
      const names = openList.slice(0, 5).map((p) => `• ${p.nom}`).join('\n')
      return `✅ Pharmacies ouvertes trouvées (${openList.length}) :\n\n${names}${openList.length > 5 ? '\n...' : ''}`
    }

    // Closed pharmacies
    if (normalized.includes('fermée') || normalized.includes('closed')) {
      if (closedList.length === 0) {
        return '✅ Toutes les pharmacies trouvées sont ouvertes.'
      }
      const names = closedList.slice(0, 5).map((p) => `• ${p.nom}`).join('\n')
      return `❌ Pharmacies fermées trouvées (${closedList.length}) :\n\n${names}${closedList.length > 5 ? '\n...' : ''}`
    }

    // Contact/Phone queries
    if (normalized.includes('téléphone') || normalized.includes('phone') || normalized.includes('contact') || normalized.includes('appeler')) {
      if (list.length > 0) {
        const withPhone = list.filter(p => p.telephone).slice(0, 3)
        if (withPhone.length > 0) {
          const phoneList = withPhone.map(p => `• ${p.nom} : ${p.telephone}`).join('\n')
          return `📞 Numéros de téléphone des pharmacies :\n\n${phoneList}${list.length > 3 ? '\n...' : ''}`
        }
        return "Aucun numéro de téléphone disponible pour les pharmacies trouvées."
      }
    }

    // Location queries
    if (normalized.includes('adresse') || normalized.includes('localisation') || normalized.includes('où') || normalized.includes('where')) {
      if (list.length > 0) {
        const withLocation = list.filter(p => p.localisation).slice(0, 3)
        if (withLocation.length > 0) {
          const locationList = withLocation.map(p => `• ${p.nom} : ${p.localisation}`).join('\n')
          return `📍 Localisations des pharmacies :\n\n${locationList}${list.length > 3 ? '\n...' : ''}`
        }
        return "Aucune localisation disponible pour les pharmacies trouvées."
      }
    }

    // Thank you
    if (normalized.includes('merci') || normalized.includes('thanks') || normalized.includes('thank you')) {
      return "De rien ! 😊 N'hésitez pas si vous avez d'autres questions."
    }

    // Default response with suggestions
    return "🤔 Je n'ai pas bien compris votre question. Voici ce que je peux faire :\n\n• Trouver la pharmacie la plus proche\n• Lister les pharmacies ouvertes/fermées\n• Donner les informations d'une pharmacie spécifique\n• Fournir les contacts et localisations\n\nEssayez de reformuler votre question ou utilisez les boutons ci-dessous !"
  }

  const handleAsk = (question) => {
    if (!question || !question.trim()) return
    
    addMessage('user', question.trim())
    setInputValue('')
    
    // Simulate typing delay for better UX
    setIsTyping(true)
    setTimeout(() => {
      const reply = buildBotReply(question)
      addMessage('bot', reply)
      setIsTyping(false)
      inputRef.current?.focus()
    }, 500)
  }

  const handleInputSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      handleAsk(inputValue)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleInputSubmit(e)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        className="chatbot-fab"
        onClick={handleToggle}
        aria-label="Ouvrir le chat sur les pharmacies"
      >
        <FaComments />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <span>Assistant Pharmacies</span>
            <button
              type="button"
              className="chatbot-close"
              onClick={handleToggle}
              aria-label="Fermer le chat"
            >
              <FaTimes />
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chatbot-message chatbot-message-${msg.from}`}
              >
                {msg.text.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-message chatbot-message-bot chatbot-typing">
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleInputSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Tapez votre question ici..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
            />
            <button
              type="submit"
              className="chatbot-send-button"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Envoyer"
            >
              <FaPaperPlane />
            </button>
          </form>

          <div className="chatbot-quick-questions">
            <button
              type="button"
              onClick={() => handleAsk("Quelle est la pharmacie la plus proche de moi ?")}
            >
              Pharmacie la plus proche
            </button>
            <button
              type="button"
              onClick={() => handleAsk('Combien de pharmacies sont ouvertes ?')}
            >
              Pharmacies ouvertes
            </button>
            <button
              type="button"
              onClick={() => handleAsk("Combien de pharmacies sont trouvées ?")}
            >
              Nombre total
            </button>
            <button
              type="button"
              onClick={() =>
                handleAsk(
                  "Questions sur les médicaments et la posologie des médicaments"
                )
              }
            >
              Question sur un médicament
            </button>
          </div>

          {pharmacies && pharmacies.length > 0 && (
            <div className="chatbot-pharmacy-list">
              <span className="chatbot-pharmacy-list-title">
                Infos rapides sur une pharmacie :
              </span>
              <div className="chatbot-pharmacy-list-buttons">
                {pharmacies.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      handleAsk(`Parle-moi de la pharmacie ${p.nom}`)
                    }
                  >
                    {p.nom}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default PharmacyChatBot


