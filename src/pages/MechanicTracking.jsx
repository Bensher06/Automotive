import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Star,
  MapPin,
  Clock,
  Car,
  Navigation,
  CheckCircle,
  CreditCard,
  DollarSign,
} from 'lucide-react'
// TODO: Fetch from API
const mechanics = []
import { useAuth } from '../contexts/AuthContext'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icons
const carIcon = L.divIcon({
  className: 'custom-car-icon',
  html: '<div style="background-color: #1e3a8a; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 18px;">🚗</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

const destinationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Component to handle map updates
function MapUpdater({ mechanicLocation, userLocation }) {
  const map = useMap()
  
  useEffect(() => {
    if (mechanicLocation && userLocation) {
      // Fit map to show both locations
      const bounds = L.latLngBounds([mechanicLocation, userLocation])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, mechanicLocation, userLocation])
  
  return null
}

const MechanicTracking = () => {
  const { mechanicId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  const [mechanic, setMechanic] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [mechanicLocation, setMechanicLocation] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState(15) // minutes
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [hasArrived, setHasArrived] = useState(false)
  const [serviceCompleted, setServiceCompleted] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [serviceCost, setServiceCost] = useState(0)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  useEffect(() => {
    // TODO: Fetch mechanic from API
    // const foundMechanic = mechanics.find((m) => m.id === parseInt(mechanicId))
    // if (foundMechanic) {
    //   setMechanic(foundMechanic)
    // } else 
    if (location.state?.mechanic) {
      setMechanic(location.state.mechanic)
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
        },
        () => {
          // Fallback to Zamboanga City center
          setUserLocation([6.9214, 122.0790])
        }
      )
    } else {
      setUserLocation([6.9214, 122.0790])
    }
  }, [mechanicId, location.state])

  // Simulate mechanic location moving towards user
  useEffect(() => {
    if (!mechanic || !userLocation) return

    // Initial mechanic location (workshop or nearby)
    const initialMechanicLocation = [
      userLocation[0] + (Math.random() - 0.5) * 0.1,
      userLocation[1] + (Math.random() - 0.5) * 0.1,
    ]
    setMechanicLocation(initialMechanicLocation)

    // Generate route coordinates (simplified - in real app, use routing API)
    const generateRoute = () => {
      const steps = 20
      const route = []
      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps
        route.push([
          initialMechanicLocation[0] + (userLocation[0] - initialMechanicLocation[0]) * ratio,
          initialMechanicLocation[1] + (userLocation[1] - initialMechanicLocation[1]) * ratio,
        ])
      }
      setRouteCoordinates(route)
    }
    generateRoute()

    // Simulate mechanic moving towards user
    const interval = setInterval(() => {
      setMechanicLocation((prev) => {
        if (!prev || !userLocation) return prev
        
        // Move 1% closer to user each update
        const newLat = prev[0] + (userLocation[0] - prev[0]) * 0.01
        const newLng = prev[1] + (userLocation[1] - prev[1]) * 0.01
        
        // Calculate distance to update ETA
        const distance = Math.sqrt(
          Math.pow(userLocation[0] - newLat, 2) + Math.pow(userLocation[1] - newLng, 2)
        )
        const newTime = Math.max(1, Math.ceil(distance * 111 * 60 / 50)) // Rough estimate
        setEstimatedTime(newTime)
        
        // Check if mechanic has arrived (within ~50 meters)
        if (distance < 0.0005) {
          setHasArrived(true)
          setEstimatedTime(0)
          // Generate random service cost
          setServiceCost(Math.floor(Math.random() * 1000) + 500) // 500-1500 pesos
        }
        
        return [newLat, newLng]
      })
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [mechanic, userLocation])

  // Handle service completion
  const handleServiceComplete = () => {
    setServiceCompleted(true)
    setShowPayment(true)
  }

  // Handle payment
  const handlePayment = (method) => {
    setPaymentMethod(method)
    // Simulate payment processing
    setTimeout(() => {
      setPaymentCompleted(true)
      setShowPayment(false)
      setShowRating(true)
    }, 2000)
  }

  // Handle rating submission
  const handleSubmitRating = () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }
    // In a real app, this would submit to API
    alert('Thank you for your feedback!')
    navigate('/dashboard')
  }

  if (!mechanic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Mechanic not found</p>
          <button
            onClick={() => navigate('/mechanic-finder')}
            className="text-primary hover:underline"
          >
            Back to Mechanic Finder
          </button>
        </div>
      </div>
    )
  }

  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const handleCall = () => {
    window.location.href = `tel:${mechanic.phone}`
  }

  const handleMessage = () => {
    // In a real app, this would open a chat interface
    alert(`Messaging ${mechanic.name}...`)
  }

  // Payment Modal
  if (showPayment && !paymentCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Service Completed!
              </h2>
              <p className="text-gray-600">
                {mechanic.name} has completed the service
              </p>
            </div>

            {/* Service Cost */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Service Fee</span>
                <span className="text-3xl font-bold text-primary">
                  ₱{serviceCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Payment Method
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handlePayment('Cash')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-900">Cash</span>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={() => handlePayment('G-Cash')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-900">G-Cash</span>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={() => handlePayment('PayMaya')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-900">PayMaya</span>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={() => handlePayment('Credit Card')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-900">Credit Card</span>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Rating Screen
  if (showRating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for using MotoZapp
              </p>
            </div>

            {/* Mechanic Info */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <img
                src={mechanic.photo}
                alt={mechanic.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{mechanic.name}</h3>
                <p className="text-sm text-gray-600">Mechanic</p>
              </div>
            </div>

            {/* Rating Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                How was your experience?
              </h3>
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 transition-colors ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    {rating === 5
                      ? 'Excellent!'
                      : rating === 4
                      ? 'Great!'
                      : rating === 3
                      ? 'Good'
                      : rating === 2
                      ? 'Fair'
                      : 'Poor'}
                  </p>
                </div>
              )}
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write a review (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitRating}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Submit Rating
            </button>

            {/* Skip Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/mechanic-finder')}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {user?.address || 'Your Location'}
            </h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="relative h-96 bg-gray-200">
        {userLocation && mechanicLocation && (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater mechanicLocation={mechanicLocation} userLocation={userLocation} />
            
            {/* Route Line */}
            {routeCoordinates.length > 0 && (
              <Polyline
                positions={routeCoordinates}
                color="#1e3a8a"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* Mechanic Location (Car Icon) */}
            <Marker position={mechanicLocation} icon={carIcon}>
              <Popup>
                <div className="text-center">
                  <strong>{mechanic.name}</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    {estimatedTime} min left
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* User Location (Destination) */}
            <Marker position={userLocation} icon={destinationIcon}>
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    {user?.address || 'Destination'}
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        )}

        {/* ETA Badge */}
        {!hasArrived && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-gray-600">Estimated Arrival</p>
              <p className="text-lg font-bold text-gray-900">{estimatedTime} min</p>
            </div>
          </div>
        )}

        {/* Arrived Badge */}
        {hasArrived && !serviceCompleted && (
          <div className="absolute top-4 left-4 bg-green-500 text-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="text-xs">Mechanic Has Arrived!</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Service Completion Button */}
        {hasArrived && !serviceCompleted && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mechanic Has Arrived!
              </h3>
              <p className="text-gray-600 mb-6">
                {mechanic.name} is ready to service your motorcycle
              </p>
              <button
                onClick={handleServiceComplete}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Service Completed
              </button>
            </div>
          </div>
        )}

        {/* Mechanic Details Card */}
        {!hasArrived && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={mechanic.photo}
                alt={mechanic.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-primary"
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {mechanic.name}
                </h2>
                <p className="text-gray-600">Mechanic</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{mechanic.rating}</span>
                  <span className="text-gray-500 text-sm">
                    ({mechanic.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMessage}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                title="Message"
              >
                <MessageCircle className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleCall}
                className="p-3 bg-primary hover:bg-primary-dark rounded-full transition-colors"
                title="Call"
              >
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          </div>
        )}

        {/* Workshop & Destination Card */}
        {!hasArrived && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
            {/* Workshop */}
            <div className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Workshop</p>
                <p className="font-semibold text-gray-900">
                  {mechanic.workshop?.name || `${mechanic.name}'s Workshop`}
                </p>
                <p className="text-sm text-gray-600">
                  {mechanic.workshop?.address || 'Zamboanga City'}
                </p>
                <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate} {formattedTime}</span>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Destination</p>
                <p className="font-semibold text-gray-900">
                  {user?.address || 'Your Location'}
                </p>
                <p className="text-sm text-gray-600">
                  Zamboanga City
                </p>
                <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Estimated: {formattedDate} {formattedTime}</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Customer Reviews Card */}
        {!hasArrived && mechanic.customerReviews && mechanic.customerReviews.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Reviews
            </h3>
            <div className="space-y-4">
              {mechanic.customerReviews.map((review) => (
                <div key={review.id} className="flex items-start space-x-3">
                  <img
                    src={review.customerPhoto}
                    alt={review.customerName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {review.customerName}
                      </span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(review.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : i < review.rating
                                ? 'fill-yellow-400 text-yellow-400 opacity-50'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">{review.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MechanicTracking

