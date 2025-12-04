import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { bookingService } from '../services/bookingService'
import { Calendar, Wrench, MapPin, CheckCircle, AlertCircle, Bike, X, Search, ChevronRight } from 'lucide-react'

const serviceTypes = ['Tune-up', 'Engine Repair', 'Brake Service', 'Tire Change', 'Electrical Repair', 'General Maintenance', 'Oil Change', 'Chain Adjustment']

const vehicleBrands = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Kymco', 'TVS', 'Rusi', 'Motorstar', 'Other']

// Zamboanga City Barangays/Areas
const locations = [
  'Ayala, Zamboanga City',
  'Baliwasan, Zamboanga City',
  'Boalan, Zamboanga City',
  'Cabatangan, Zamboanga City',
  'Cabaluay, Zamboanga City',
  'Canelar, Zamboanga City',
  'Camino Nuevo, Zamboanga City',
  'Campo Islam, Zamboanga City',
  'Culianan, Zamboanga City',
  'Curuan, Zamboanga City',
  'Divisoria, Zamboanga City',
  'Guiwan, Zamboanga City',
  'Guisao, Zamboanga City',
  'La Paz, Zamboanga City',
  'Labuan, Zamboanga City',
  'Lanzones, Zamboanga City',
  'Lapakan, Zamboanga City',
  'Latuan, Zamboanga City',
  'Licomo, Zamboanga City',
  'Lubigan, Zamboanga City',
  'Lunzuran, Zamboanga City',
  'Maasin, Zamboanga City',
  'Malagutay, Zamboanga City',
  'Mampang, Zamboanga City',
  'Mercedes, Zamboanga City',
  'Pasonanca, Zamboanga City',
  'Putik, Zamboanga City',
  'Recodo, Zamboanga City',
  'Rio Hondo, Zamboanga City',
  'Salaan, Zamboanga City',
  'San Jose Cawa-Cawa, Zamboanga City',
  'San Jose Gusu, Zamboanga City',
  'San Roque, Zamboanga City',
  'Santa Barbara, Zamboanga City',
  'Santa Catalina, Zamboanga City',
  'Santa Maria, Zamboanga City',
  'Santo Niño, Zamboanga City',
  'Sinunuc, Zamboanga City',
  'Sta. Lucia, Zamboanga City',
  'Talon-Talon, Zamboanga City',
  'Taluksangay, Zamboanga City',
  'Tetuan, Zamboanga City',
  'Tictapul, Zamboanga City',
  'Tugbungan, Zamboanga City',
  'Tumaga, Zamboanga City',
  'Tumalutab, Zamboanga City',
  'Vitali, Zamboanga City',
  'Zambowood, Zamboanga City',
  'Zone I (Poblacion), Zamboanga City',
  'Zone II (Poblacion), Zamboanga City',
  'Zone III (Poblacion), Zamboanga City',
  'Zone IV (Poblacion), Zamboanga City',
]

const ServiceBooking = () => {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [location, setLocation] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [schedule, setSchedule] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Vehicle information state
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')

  // Filter locations based on search
  const filteredLocations = locations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  )

  // Handle location selection
  const handleSelectLocation = (loc) => {
    setLocation(loc)
    setShowLocationModal(false)
    setLocationSearch('')
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowLocationModal(false)
      }
    }
    if (showLocationModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showLocationModal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Save booking to database
      const result = await bookingService.createBooking({
        serviceType,
        location,
        schedule,
        notes,
        vehicleBrand,
        vehicleModel,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
      })

      if (result.success) {
        // Add notification for customer
        addNotification({
          type: 'service',
          message: `Your booking for ${serviceType} at ${location} (${schedule}) has been sent to mechanics.`,
        })

        setSubmitted(true)

        // Reset form after delay
        setTimeout(() => {
          setLocation('')
          setServiceType('')
          setSchedule('')
          setNotes('')
          setVehicleBrand('')
          setVehicleModel('')
          setVehicleYear('')
          setSubmitted(false)
        }, 3000)
      } else {
        setError(result.error || 'Failed to create booking. Please try again.')
      }
    } catch (err) {
      console.error('Error creating booking:', err)
      setError('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to book a service</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book a Service
          </h1>
          <p className="text-gray-600">
            Schedule maintenance or repairs with a trusted mechanic
          </p>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h3>
              <p className="text-gray-600">
                Your service request has been sent to mechanics. We'll notify you when one accepts.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Your Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Your Location
                </label>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-left bg-white flex items-center justify-between"
                >
                  <span className={location ? 'text-gray-900' : 'text-gray-400'}>
                    {location || 'Select your location...'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <input type="hidden" value={location} required />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wrench className="w-4 h-4 inline mr-1" />
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Select service type...</option>
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Schedule
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  required
                  placeholder="Enter preferred date and time..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* Vehicle Information */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Bike className="w-5 h-5 text-primary" />
                  <span className="font-medium text-gray-900">Vehicle Information</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Vehicle Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <select
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white text-sm"
                    >
                      <option value="">Select brand...</option>
                      {vehicleBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      required
                      placeholder="e.g. Click 125"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white text-sm"
                    />
                  </div>

                  {/* Vehicle Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      placeholder="e.g. 2022"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  placeholder="Describe any specific issues or requirements..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{loading ? 'Processing...' : 'Confirm Booking'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowLocationModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search barangay..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Location List */}
            <div className="flex-1 overflow-y-auto">
              {filteredLocations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No locations found
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredLocations.map((loc) => (
                    <li key={loc}>
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          location === loc ? 'bg-primary/5 text-primary' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <MapPin className={`w-4 h-4 ${location === loc ? 'text-primary' : 'text-gray-400'}`} />
                          <span className="font-medium">{loc}</span>
                        </div>
                        {location === loc && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceBooking
