import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { MapPin, Clock, Star, Wrench, CheckCircle, XCircle, Navigation } from 'lucide-react'
// TODO: Fetch from API
const mechanics = []
import { haversineDistance, formatDistance, distanceCategories, filterByDistance } from '../utils/distanceUtils'
import { useNotifications } from '../contexts/NotificationContext'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Zamboanga City coordinates (approximate center)
const ZAMBOANGA_CENTER = [6.9214, 122.0790]

// Component to handle map centering on user location
function MapCenter({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, 13)
    }
  }, [map, position])
  return null
}

const MechanicFinder = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const [selectedMechanic, setSelectedMechanic] = useState(null)
  const [requestStatus, setRequestStatus] = useState(null) // 'requesting', 'accepted', 'rejected'
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [mapCenter, setMapCenter] = useState(ZAMBOANGA_CENTER)
  const [mechanicCoords, setMechanicCoords] = useState({})
  const [mechanicsWithDistance, setMechanicsWithDistance] = useState([])
  const [selectedDistanceFilter, setSelectedDistanceFilter] = useState('All Distances')
  const isEmergency = searchParams.get('emergency') === 'true'

  // Get user's GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const location = [latitude, longitude]
          setUserLocation(location)
          setMapCenter(location)
          setLocationError(null)
          
          // Generate mechanic coordinates once user location is known
          const coords = {}
          const mechanicsWithDistances = mechanics.map(mechanic => {
            const offsetLat = (Math.random() - 0.5) * 0.05 // ~5km
            const offsetLng = (Math.random() - 0.5) * 0.05
            const mechLocation = [location[0] + offsetLat, location[1] + offsetLng]
            coords[mechanic.id] = mechLocation
            const distanceKm = haversineDistance(location, mechLocation)
            return { 
              ...mechanic, 
              location: { lat: mechLocation[0], lng: mechLocation[1] }, 
              distance: formatDistance(distanceKm),
              distanceKm: distanceKm
            }
          })
          setMechanicCoords(coords)
          setMechanicsWithDistance(mechanicsWithDistances)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationError('Unable to get your location. Using default location.')
          // Use Zamboanga City center as fallback
          setUserLocation(ZAMBOANGA_CENTER)
          setMapCenter(ZAMBOANGA_CENTER)
          
          // Generate mechanic coordinates for fallback location
          const coords = {}
          const mechanicsWithDistances = mechanics.map(mechanic => {
            const offsetLat = (Math.random() - 0.5) * 0.05
            const offsetLng = (Math.random() - 0.5) * 0.05
            const mechLocation = [ZAMBOANGA_CENTER[0] + offsetLat, ZAMBOANGA_CENTER[1] + offsetLng]
            coords[mechanic.id] = mechLocation
            const distanceKm = haversineDistance(ZAMBOANGA_CENTER, mechLocation)
            return { 
              ...mechanic, 
              location: { lat: mechLocation[0], lng: mechLocation[1] }, 
              distance: formatDistance(distanceKm),
              distanceKm: distanceKm
            }
          })
          setMechanicCoords(coords)
          setMechanicsWithDistance(mechanicsWithDistances)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } else {
      setLocationError('Geolocation is not supported by your browser.')
      setUserLocation(ZAMBOANGA_CENTER)
      setMapCenter(ZAMBOANGA_CENTER)
      
      // Generate mechanic coordinates for fallback location
      const coords = {}
      const mechanicsWithDistances = mechanics.map(mechanic => {
        const offsetLat = (Math.random() - 0.5) * 0.05
        const offsetLng = (Math.random() - 0.5) * 0.05
        const mechLocation = [ZAMBOANGA_CENTER[0] + offsetLat, ZAMBOANGA_CENTER[1] + offsetLng]
        coords[mechanic.id] = mechLocation
        const distanceKm = haversineDistance(ZAMBOANGA_CENTER, mechLocation)
        return { 
          ...mechanic, 
          location: { lat: mechLocation[0], lng: mechLocation[1] }, 
          distance: formatDistance(distanceKm),
          distanceKm: distanceKm
        }
      })
      setMechanicCoords(coords)
      setMechanicsWithDistance(mechanicsWithDistances)
    }
  }, [])

  useEffect(() => {
    if (isEmergency) {
      // TODO: Fetch available mechanic from API
      // const available = mechanics.find((m) => m.status === 'available')
      // if (available) {
      //   setSelectedMechanic(available)
      // }
    }
  }, [isEmergency])

  // Get mechanic coordinates from state
  const getMechanicCoordinates = (mechanicId) => {
    return mechanicCoords[mechanicId] || null
  }

  const handleRequestService = (mechanic) => {
    setSelectedMechanic(mechanic)
    setRequestStatus('requesting')
    
    addNotification({
      type: 'mechanic',
      message: `Service request sent to ${mechanic.name}. Waiting for response...`,
    })

    // Simulate mechanic response
    setTimeout(() => {
      const accepted = Math.random() > 0.3 // 70% acceptance rate
      setRequestStatus(accepted ? 'accepted' : 'rejected')

      if (accepted) {
        addNotification({
          type: 'mechanic',
          message: `${mechanic.name} accepted your request! They are on the way.`,
        })
        navigate(`/mechanic-tracking/${mechanic.id}`, {
          state: { mechanic: mechanic },
        })
      } else {
        addNotification({
          type: 'mechanic',
          message: `${mechanic.name} is currently unavailable. Try another mechanic.`,
        })
      }
    }, 2000)
  }

  const handleRecenterMap = () => {
    if (userLocation) {
      setMapCenter(userLocation)
    } else {
      // Request location again
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setUserLocation([latitude, longitude])
            setMapCenter([latitude, longitude])
            setLocationError(null)
          },
          (error) => {
            setLocationError('Unable to get your location.')
          }
        )
      }
    }
  }

  // Filter mechanics based on distance
  const filteredAvailableMechanics = useMemo(() => {
    if (!userLocation || selectedDistanceFilter === 'All Distances') {
      return mechanicsWithDistance.filter((m) => m.status === 'available')
    }
    return filterByDistance(
      mechanicsWithDistance.filter((m) => m.status === 'available'),
      userLocation,
      selectedDistanceFilter
    )
  }, [mechanicsWithDistance, userLocation, selectedDistanceFilter])

  const busyMechanics = mechanicsWithDistance.filter((m) => m.status === 'busy')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Find a Mechanic
              </h1>
              <p className="text-gray-600">
                {isEmergency
                  ? 'Emergency service request - Finding nearest mechanic...'
                  : 'Browse available mechanics near you'}
              </p>
            </div>
            {userLocation && (
              <div className="mt-4 md:mt-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Distance
                </label>
                <select
                  value={selectedDistanceFilter}
                  onChange={(e) => setSelectedDistanceFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {distanceCategories.map((category) => (
                    <option key={category.label} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* GPS Map */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="h-64 md:h-96 relative">
            {locationError && (
              <div className="absolute top-2 left-2 right-2 z-[1000] bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                {locationError}
              </div>
            )}
            {/* Re-center Button */}
            {userLocation && (
              <button
                onClick={handleRecenterMap}
                className="absolute bottom-4 right-4 z-[1000] bg-white hover:bg-gray-50 text-primary border-2 border-primary rounded-full p-3 shadow-lg transition-all hover:scale-110"
                title="Re-center on your location"
              >
                <Navigation className="w-5 h-5" />
              </button>
            )}
            {userLocation ? (
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter position={mapCenter} />
                
                {/* User Location Marker */}
                <Marker position={userLocation}>
                  <Popup>
                    <div className="text-center">
                      <div className="text-primary mb-1">📍</div>
                      <strong>Your Location</strong>
                    </div>
                  </Popup>
                </Marker>

                {/* Available Mechanics Markers */}
                {filteredAvailableMechanics.map((mechanic) => {
                  const coords = getMechanicCoordinates(mechanic.id)
                  if (!coords) return null
                  
                  return (
                    <Marker
                      key={mechanic.id}
                      position={coords}
                      icon={L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                      })}
                    >
                      <Popup>
                        <div>
                          <strong>{mechanic.name}</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            ⭐ {mechanic.rating} ({mechanic.reviews} reviews)
                          </p>
                          <p className="text-sm text-gray-600">
                            📍 {mechanic.distance} away
                          </p>
                          <p className="text-sm text-gray-600">
                            🔧 {mechanic.specialties.join(', ')}
                          </p>
                          <button
                            onClick={() => handleRequestService(mechanic)}
                            className="mt-2 w-full bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark"
                          >
                            Request Service
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

                {/* Busy Mechanics Markers */}
                {busyMechanics.map((mechanic) => {
                  const coords = getMechanicCoordinates(mechanic.id)
                  if (!coords) return null
                  
                  return (
                    <Marker
                      key={mechanic.id}
                      position={coords}
                      icon={L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                      })}
                    >
                      <Popup>
                        <div>
                          <strong>{mechanic.name}</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            ⭐ {mechanic.rating} ({mechanic.reviews} reviews)
                          </p>
                          <p className="text-sm text-red-600 font-semibold">
                            Currently Busy
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading map...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Getting your location
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Map Legend */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                <span>Your Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" 
                  alt="Available" 
                  className="w-4 h-4"
                />
                <span>Available Mechanics</span>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" 
                  alt="Busy" 
                  className="w-4 h-4"
                />
                <span>Busy Mechanics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Request Status Modal */}
        {requestStatus && selectedMechanic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              {requestStatus === 'requesting' && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                  <p className="text-gray-700 font-medium">
                    Sending request to {selectedMechanic.name}...
                  </p>
                </div>
              )}

              {requestStatus === 'accepted' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Request Accepted!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedMechanic.name} is on the way to your location.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Estimated arrival: 15-20 minutes
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to tracking page
                      navigate(`/mechanic-tracking/${selectedMechanic.id}`, {
                        state: { mechanic: selectedMechanic },
                      })
                    }}
                    className="mt-2 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Track Mechanic
                  </button>
                </div>
              )}

              {requestStatus === 'rejected' && (
                <div className="text-center py-4">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Request Not Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedMechanic.name} is currently unavailable.
                  </p>
                  <button
                    onClick={() => {
                      setRequestStatus(null)
                      setSelectedMechanic(null)
                    }}
                    className="mt-6 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Try Another Mechanic
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Mechanics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Mechanics ({filteredAvailableMechanics.length})
          </h2>
          {filteredAvailableMechanics.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No mechanics found in this distance range.</p>
              <p className="text-sm text-gray-500 mt-2">Try selecting a different distance category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailableMechanics.map((mechanic) => (
              <div
                key={mechanic.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {mechanic.name}
                    </h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {mechanic.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({mechanic.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                    Available
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {mechanic.distance} away
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {mechanic.experience} experience
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Wrench className="w-4 h-4 mr-2" />
                    {mechanic.specialties.join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => handleRequestService(mechanic)}
                  className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Request Service
                </button>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Busy Mechanics */}
        {busyMechanics.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Currently Busy ({busyMechanics.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {busyMechanics.map((mechanic) => (
                <div
                  key={mechanic.id}
                  className="bg-white rounded-lg shadow-md p-6 opacity-75"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {mechanic.name}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {mechanic.rating}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({mechanic.reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                      Busy
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {mechanic.distance} away
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {mechanic.experience} experience
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Currently Unavailable
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MechanicFinder

