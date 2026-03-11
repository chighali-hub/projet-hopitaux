import { FaTimes, FaPills, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'
import './NotificationPanel.css'

function NotificationPanel({ notifications, onClose, onMarkRead, onSearch }) {
  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  const handleNotificationClick = (notif) => {
    // Search for the medicine
    if (onSearch && notif.medicine_name) {
      onSearch(notif.medicine_name)
    }
    // Mark as read
    if (onMarkRead) {
      onMarkRead(notif.id)
    }
    // Close the panel
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-panel-header">
          <h3>Notifications</h3>
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
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <FaPills />
              <p>Aucune notification</p>
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <div className="notification-section">
                  <h4>Nouvelles notifications</h4>
                  {unreadNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="notification-item notification-item-unread"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notification-item-icon">
                        <FaPills />
                      </div>
                      <div className="notification-item-content">
                        <strong>{notif.medicine_name}</strong> est maintenant
                        disponible !
                        <div className="notification-item-pharmacy">
                          <FaMapMarkerAlt /> {notif.pharmacie_nom}
                        </div>
                        {notif.pharmacie_telephone && (
                          <div className="notification-item-phone">
                            <FaPhone /> {notif.pharmacie_telephone}
                          </div>
                        )}
                        {notif.prix && (
                          <div className="notification-item-price">
                            Prix: {notif.prix} MRU
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {readNotifications.length > 0 && (
                <div className="notification-section">
                  <h4>Notifications lues</h4>
                  {readNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="notification-item notification-item-read"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notification-item-icon">
                        <FaPills />
                      </div>
                      <div className="notification-item-content">
                        <strong>{notif.medicine_name}</strong> disponible à{' '}
                        {notif.pharmacie_nom}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationPanel

