function PharmacyList({ pharmacies }) {
  if (!pharmacies || pharmacies.length === 0) {
    return null
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
            {pharmacie.distance && (
              <span className="pharmacy-detail-item">
                Distance: {pharmacie.distance}
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


