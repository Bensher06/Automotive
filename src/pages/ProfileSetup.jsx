import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Phone, MapPin, Bike, Save } from 'lucide-react'

const ProfileSetup = () => {
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { updateProfile, user } = useAuth()
  const navigate = useNavigate()

  const vehicleBrands = [
    'Honda',
    'Yamaha',
    'Suzuki',
    'Kawasaki',
    'Kymco',
    'Other',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!phone || !address || !vehicleBrand || !vehicleModel || !vehicleYear) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const result = await updateProfile({
        name: user?.name || user?.email?.split('@')[0] || 'User', // Include name from user context
        phone,
        address,
        needsSetup: false, // Mark profile as complete
        vehicle: {
          brand: vehicleBrand,
          model: vehicleModel,
          year: vehicleYear,
        },
      })
      
      if (result.success) {
        // Navigate based on user role after profile setup
        if (user?.role === 'admin') {
          navigate('/admin/dashboard')
        } else if (user?.role === 'store_owner') {
          navigate('/store/dashboard')
        } else {
          navigate('/')
        }
      } else {
        setError(result.error || 'Failed to save profile. Please try again.')
      }
    } catch (err) {
      console.error('Profile setup error:', err)
      setError(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Help us provide you with better service
          </p>
        </div>

        {/* Profile Setup Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number (for emergency contact)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  placeholder="+63 912 345 6789"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address / Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  placeholder="Enter your address in Zamboanga City"
                />
              </div>
            </div>

            {/* Vehicle Details Section */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Bike className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Vehicle Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Vehicle Brand */}
                <div>
                  <label
                    htmlFor="vehicleBrand"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Brand
                  </label>
                  <select
                    id="vehicleBrand"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Select Brand</option>
                    {vehicleBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Model */}
                <div>
                  <label
                    htmlFor="vehicleModel"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Model
                  </label>
                  <input
                    id="vehicleModel"
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., Click 125i"
                  />
                </div>

                {/* Vehicle Year */}
                <div>
                  <label
                    htmlFor="vehicleYear"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Year
                  </label>
                  <input
                    id="vehicleYear"
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="2020"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Complete Setup'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetup

