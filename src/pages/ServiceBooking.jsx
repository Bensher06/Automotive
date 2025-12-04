import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useBookings } from '../contexts/BookingContext'
import { useNotifications } from '../contexts/NotificationContext'
import { Calendar, Clock, Wrench, MapPin, Bike, Save } from 'lucide-react'
// TODO: Fetch from API
const shops = []
const serviceTypes = ['Tune-up', 'Engine Repair', 'Brake Service', 'Tire Change', 'Electrical Repair', 'General Maintenance', 'Oil Change', 'Chain Adjustment']

const ServiceBooking = () => {
  const { user } = useAuth()
  const { createBooking } = useBookings()
  const { addNotification } = useNotifications()
  const [selectedShop, setSelectedShop] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Fetch shop from API
    // const shop = shops.find((s) => s.name === selectedShop)
    // if (!shop) {
    //   setLoading(false)
    //   return
    // }
    const shop = { id: null, name: selectedShop, ownerId: null } // Placeholder

    // Create booking
    const booking = createBooking({
      shopId: shop.id,
      shopName: shop.name,
      shopOwnerId: shop.ownerId,
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone || 'N/A',
      serviceType,
      date,
      time,
      notes,
      vehicle: user.vehicle,
    })

    // Add notification for customer
    addNotification({
      type: 'service',
      message: `Your booking request for ${serviceType} at ${shop.name} on ${date} at ${time} has been submitted. Waiting for shop approval.`,
    })

    setLoading(false)
    setSubmitted(true)

    // Reset form
    setTimeout(() => {
      setSelectedShop('')
      setServiceType('')
      setDate('')
      setTime('')
      setNotes('')
      setSubmitted(false)
    }, 3000)
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
            Schedule maintenance or repairs with a trusted shop
          </p>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Save className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Booking Request Submitted!
              </h3>
              <p className="text-gray-600">
                Your service appointment request has been sent to the shop. You will receive a notification once they respond.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shop Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Select Shop
                </label>
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Choose a shop...</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.name}>
                      {shop.name} ({shop.distance})
                    </option>
                  ))}
                </select>
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

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Vehicle Info (from profile) */}
              {user.vehicle && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bike className="w-5 h-5 text-primary" />
                    <span className="font-medium text-gray-900">
                      Vehicle Information
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {user.vehicle.brand} {user.vehicle.model} ({user.vehicle.year})
                  </p>
                </div>
              )}

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
                <Save className="w-5 h-5" />
                <span>{loading ? 'Booking...' : 'Submit Booking Request'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceBooking
