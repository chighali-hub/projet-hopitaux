import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect({ latitude: lat, longitude: lng })
    },
  })
  return null
}

function MapPicker({ onLocationSelect, initialLocation = null }) {
  const [position, setPosition] = useState(
    initialLocation || { latitude: 18.0735, longitude: -15.9582 } // Nouakchott par défaut
  )

  useEffect(() => {
    if (initialLocation) {
      setPosition(initialLocation)
    }
  }, [initialLocation])

  const handleLocationSelect = (location) => {
    setPosition(location)
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }

  return (
    <MapContainer
      center={[position.latitude, position.longitude]}
      zoom={13}
      style={{ height: '500px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[position.latitude, position.longitude]}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target
            const newPosition = marker.getLatLng()
            const location = {
              latitude: newPosition.lat,
              longitude: newPosition.lng
            }
            handleLocationSelect(location)
          },
        }}
      >
        <Popup>
          Position sélectionnée<br />
          Lat: {position.latitude.toFixed(6)}<br />
          Lng: {position.longitude.toFixed(6)}
        </Popup>
      </Marker>
      <MapClickHandler onLocationSelect={handleLocationSelect} />
    </MapContainer>
  )
}

export default MapPicker













