import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { MapPin, Clock, Star, Wrench, CheckCircle, XCircle, Navigation, X, Smartphone, Download } from 'lucide-react'
import { haversineDistance, formatDistance, distanceCategories, filterByDistance } from '../utils/distanceUtils'
import { useNotifications } from '../contexts/NotificationContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
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
  const [mechanics, setMechanics] = useState([])
  const [loadingMechanics, setLoadingMechanics] = useState(true)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [clickedMechanic, setClickedMechanic] = useState(null)
  const isEmergency = searchParams.get('emergency') === 'true'

  // Fetch mechanics from Supabase
  useEffect(() => {
    const fetchMechanics = async () => {
      if (!isSupabaseConfigured) {
        setLoadingMechanics(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('mechanics')
          .select('*')
          .order('rating', { ascending: false })

        if (error) {
          console.error('Error fetching mechanics:', error)
        } else {
          // Transform data to match expected format
          const transformedMechanics = (data || []).map(mech => ({
            id: mech.id,
            name: mech.name,
            rating: mech.rating || 5.0,
            reviews: mech.reviews_count || 0,
            specialties: mech.specialties || [],
            experience: mech.experience || 'N/A',
            status: mech.status || 'available',
            phone: mech.phone,
            profileImage: mech.profile_image,
            hourlyRate: mech.hourly_rate,
            bio: mech.bio,
            latitude: mech.latitude,
            longitude: mech.longitude
          }))
          setMechanics(transformedMechanics)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoadingMechanics(false)
      }
    }

    fetchMechanics()
  }, [])

  // Get user's GPS location and calculate distances
  useEffect(() => {
    if (loadingMechanics) return // Wait for mechanics to load

    const calculateDistances = (centerLocation) => {
      const coords = {}
      const mechanicsWithDistances = mechanics.map(mechanic => {
        // Use mechanic's actual coordinates if available, otherwise generate random ones
        let mechLocation
        if (mechanic.latitude && mechanic.longitude) {
          mechLocation = [parseFloat(mechanic.latitude), parseFloat(mechanic.longitude)]
        } else {
          const offsetLat = (Math.random() - 0.5) * 0.05 // ~5km
          const offsetLng = (Math.random() - 0.5) * 0.05
          mechLocation = [centerLocation[0] + offsetLat, centerLocation[1] + offsetLng]
        }
        coords[mechanic.id] = mechLocation
        const distanceKm = haversineDistance(centerLocation, mechLocation)
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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const location = [latitude, longitude]
          setUserLocation(location)
          setMapCenter(location)
          setLocationError(null)
          calculateDistances(location)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationError('Unable to get your location. Using default location.')
          setUserLocation(ZAMBOANGA_CENTER)
          setMapCenter(ZAMBOANGA_CENTER)
          calculateDistances(ZAMBOANGA_CENTER)
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
      calculateDistances(ZAMBOANGA_CENTER)
    }
  }, [mechanics, loadingMechanics])

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

  // Handle clicking on a mechanic card - show download app modal
  const handleMechanicCardClick = (mechanic) => {
    setClickedMechanic(mechanic)
    setShowDownloadModal(true)
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
          {loadingMechanics ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-gray-600">Loading mechanics...</p>
            </div>
          ) : filteredAvailableMechanics.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No mechanics found in this distance range.</p>
              <p className="text-sm text-gray-500 mt-2">Try selecting a different distance category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailableMechanics.map((mechanic) => (
              <div
                key={mechanic.id}
                onClick={() => handleMechanicCardClick(mechanic)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {mechanic.profileImage ? (
                      <img src={mechanic.profileImage} alt={mechanic.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-primary" />
                      </div>
                    )}
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
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                    Available
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {mechanic.distance} away
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    {mechanic.experience} experience
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Wrench className="w-4 h-4 mr-2 text-primary" />
                    {mechanic.specialties?.join(', ') || 'General Repairs'}
                  </div>
                  {mechanic.hourlyRate && (
                    <div className="flex items-center text-sm font-medium text-green-600">
                      ₱{mechanic.hourlyRate}/hr
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-400 text-center">
                  Click to view details
                </div>
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
                  onClick={() => handleMechanicCardClick(mechanic)}
                  className="bg-white rounded-lg shadow-md p-6 opacity-75 cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {mechanic.profileImage ? (
                        <img src={mechanic.profileImage} alt={mechanic.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
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

                  <div className="text-xs text-gray-400 text-center">
                    Click to view details
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download App Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowDownloadModal(false)
                  setClickedMechanic(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Modal Content */}
              <div className="text-center">
                {/* App Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Download MotoZapp App
                </h3>

                {/* Mechanic Info */}
                {clickedMechanic && (
                  <p className="text-gray-500 mb-4">
                    To request service from <span className="font-semibold text-primary">{clickedMechanic.name}</span>
                  </p>
                )}

                {/* Description */}
                <p className="text-gray-600 mb-6">
                  Download our <span className="font-bold text-primary">MotoZapp</span> mobile app to use the full potential of Find a Mechanic feature including:
                </p>

                {/* Features List */}
                <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">Real-time mechanic tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">Instant service requests</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">Emergency roadside assistance</span>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <a
                    href="#"
                    className="flex-1 flex items-center justify-center space-x-2 bg-black text-white py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">App Store</span>
                  </a>
                  <a
                    href="#"
                    className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-3 px-4 rounded-xl hover:bg-primary-dark transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Play Store</span>
                  </a>
                </div>

                {/* Close Button Text */}
                <button
                  onClick={() => {
                    setShowDownloadModal(false)
                    setClickedMechanic(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MechanicFinder

