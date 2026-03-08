import { FaTimes, FaPills } from 'react-icons/fa'
import './NotificationPanel.css'

function PharmacyNotificationPanel({ medicines, onClose }) {
  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-panel-header">
          <h3>Demandes de notification</h3>
          <button
            type="button"
            className="notification-panel-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <FaTimes />
          </button>
        </div>

        <div className="notification-panel-content">
          {medicines.length === 0 ? (
            <div className="notification-empty">
              <FaPills />
              <p>Aucune demande de notification</p>
            </div>
          ) : (
            <div className="notification-section">
              {medicines.map((medicine) => (
                <div
                  key={medicine.medicine_name}
                  className="notification-item notification-item-unread"
                >
                  <div className="notification-item-icon">
                    <FaPills />
                  </div>
                  <div className="notification-item-content">
                    <strong>{medicine.medicine_name}</strong>
                    <div className="notification-item-pharmacy">
                      <span style={{ 
                        background: '#3b82f6', 
                        color: 'white', 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'inline-block',
                        marginTop: '8px'
                      }}>
                        {medicine.request_count} {medicine.request_count === 1 ? 'demande' : 'demandes'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PharmacyNotificationPanel

