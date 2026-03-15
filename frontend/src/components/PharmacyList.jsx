function PharmacyList({ pharmacies, userLocation }) {
  if (!pharmacies || pharmacies.length === 0) {
    return null
  }

  const toRad = (value) => (value * Math.PI) / 180

  const distance = (pharmacie, userLocation) => {
    const R = 6371

    const dLat = toRad(pharmacie.latitude - userLocation.latitude)
    const dLon = toRad(pharmacie.longitude - userLocation.longitude)

    const lat1 = toRad(userLocation.latitude)
    const lat2 = toRad(pharmacie.latitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *
        Math.cos(lat1) *
        Math.cos(lat2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <div className="pharmacy-list">
      {pharmacies.map((pharmacie) => (
        <div key={pharmacie.id} className="pharmacy-card">
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-name">{pharmacie.nom}</h3>

            {pharmacie.is_open !== undefined && (
              <span
                className={`pharmacy-status ${
                  pharmacie.is_open ? 'open' : 'closed'
                }`}
              >
                {pharmacie.is_open ? 'Ouverte' : 'Fermée'}
              </span>
            )}
          </div>

          {pharmacie.medicament_nom && (
            <div className="pharmacy-medicine">
              <strong>Médicament:</strong> {pharmacie.medicament_nom}
            </div>
          )}

          {pharmacie.localisation && (
            <p className="pharmacy-location">{pharmacie.localisation}</p>
          )}

          <div className="pharmacy-details">
            {userLocation && (
              <span className="pharmacy-detail-item">
                Distance: {distance(pharmacie, userLocation).toFixed(2)} km
              </span>
            )}

            {typeof pharmacie.prix !== 'undefined' && (
              <span className="pharmacy-detail-item">
                Prix: {pharmacie.prix} MRU
              </span>
            )}

            {typeof pharmacie.quantite !== 'undefined' && (
              <span className="pharmacy-detail-item">
                Quantité: {pharmacie.quantite}
              </span>
            )}
          </div>

          {pharmacie.telephone && (
            <p className="pharmacy-phone">Tél: {pharmacie.telephone}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default PharmacyList