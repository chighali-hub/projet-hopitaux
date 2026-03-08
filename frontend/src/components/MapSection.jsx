import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom colored markers
const userIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconRetinaUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const openPharmacyIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const closedPharmacyIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapSection({ pharmacies, userLocation }) {
  if (!pharmacies || pharmacies.length === 0) {
    return null
  }

  // Fallback center: Nouakchott
  const defaultCenter = { latitude: 18.0735, longitude: -15.9582 }

  // Try to center on user location first, then first pharmacy
  let center = defaultCenter

  if (
    userLocation &&
    typeof userLocation.latitude === 'number' &&
    typeof userLocation.longitude === 'number'
  ) {
    center = userLocation
  } else {
    const firstWithLocation = pharmacies.find(
      (p) =>
        typeof p.latitude === 'number' &&
        !Number.isNaN(p.latitude) &&
        typeof p.longitude === 'number' &&
        !Number.isNaN(p.longitude)
    )

    if (firstWithLocation) {
      center = firstWithLocation
    }
  }

  return (
    <section className="map-section">
      <h3 className="map-title">Pharmacies sur la carte</h3>
      <p className="map-subtitle">
        Visualisez les pharmacies qui disposent du médicament recherché
      </p>

      <div className="map-wrapper">
        <MapContainer
          center={[center.latitude, center.longitude]}
          zoom={13}
          style={{ height: '380px', width: '100%', borderRadius: '18px' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Client current position marker (blue) */}
          {userLocation &&
            typeof userLocation.latitude === 'number' &&
            typeof userLocation.longitude === 'number' && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={userIcon}
              >
                <Popup>Votre position actuelle</Popup>
              </Marker>
            )}

          {/* Pharmacies markers: green if open, red if closed */}
          {pharmacies.map((pharmacie) => {
            if (
              typeof pharmacie.latitude !== 'number' ||
              Number.isNaN(pharmacie.latitude) ||
              typeof pharmacie.longitude !== 'number' ||
              Number.isNaN(pharmacie.longitude)
            ) {
              return null
            }

            return (
              <Marker
                key={pharmacie.id}
                position={[pharmacie.latitude, pharmacie.longitude]}
                icon={pharmacie.is_open ? openPharmacyIcon : closedPharmacyIcon}
              >
                <Popup>
                  <strong>{pharmacie.nom}</strong>
                  <br />
                  {pharmacie.localisation && (
                    <>
                      {pharmacie.localisation}
                      <br />
                    </>
                  )}
                  {pharmacie.telephone && (
                    <>
                      Tél: {pharmacie.telephone}
                      <br />
                    </>
                  )}
                  {typeof pharmacie.prix !== 'undefined' && (
                    <>
                      Prix: {pharmacie.prix} MRU
                      <br />
                    </>
                  )}
                  {typeof pharmacie.quantite !== 'undefined' && (
                    <>Quantité: {pharmacie.quantite}</>
                  )}
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      <div className="map-legend">
        <span className="map-legend-item">
          <span className="map-legend-dot map-legend-dot-blue" />
          <span>Vous (position actuelle)</span>
        </span>
        <span className="map-legend-item">
          <span className="map-legend-dot map-legend-dot-green" />
          <span>Pharmacie ouverte</span>
        </span>
        <span className="map-legend-item">
          <span className="map-legend-dot map-legend-dot-red" />
          <span>Pharmacie fermée</span>
        </span>
      </div>
    </section>
  )
}

export default MapSection


