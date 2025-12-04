import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Clock,
  CheckCircle,
  Bell,
  ShoppingBag,
  Wrench,
  User,
  MapPin,
  Phone,
  Bike,
  Edit2,
  Save,
  X,
  Mail,
  Camera,
  Trash2,
} from 'lucide-react'
// TODO: Fetch from API
const orders = []
const serviceHistory = []
const notifications = []

const Dashboard = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profileImage: user?.profileImage || null,
    vehicle: {
      brand: user?.vehicle?.brand || '',
      model: user?.vehicle?.model || '',
      year: user?.vehicle?.year || '',
    },
  })
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const vehicleBrands = [
    'Honda',
    'Yamaha',
    'Suzuki',
    'Kawasaki',
    'Kymco',
    'Other',
  ]

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profileImage: user.profileImage || null,
        vehicle: {
          brand: user.vehicle?.brand || '',
          model: user.vehicle?.model || '',
          year: user.vehicle?.year || '',
        },
      })
      setImagePreview(user.profileImage || null)
    }
  }, [user])

  if (!user) {
    navigate('/login')
    return null
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original user data
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profileImage: user.profileImage || null,
        vehicle: {
          brand: user.vehicle?.brand || '',
          model: user.vehicle?.model || '',
          year: user.vehicle?.year || '',
        },
      })
      setImagePreview(user.profileImage || null)
    }
    setError('')
    setSuccess('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1]
      setFormData({
        ...formData,
        vehicle: {
          ...formData.vehicle,
          [vehicleField]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setFormData({
          ...formData,
          profileImage: base64String,
        })
        setImagePreview(base64String)
        setError('')
      }
      reader.onerror = () => {
        setError('Failed to read image file')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      profileImage: null,
    })
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Name is required')
        setLoading(false)
        return
      }

      if (!formData.phone.trim()) {
        setError('Phone number is required')
        setLoading(false)
        return
      }

      if (!formData.address.trim()) {
        setError('Address is required')
        setLoading(false)
        return
      }

      // Update profile
      updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        profileImage: formData.profileImage,
        vehicle: formData.vehicle.brand && formData.vehicle.model && formData.vehicle.year
          ? {
              brand: formData.vehicle.brand,
              model: formData.vehicle.model,
              year: formData.vehicle.year,
            }
          : null,
      })

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Profile Information
            </h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-gray-200">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors inline-flex">
                        <Camera className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-medium text-gray-700">
                          {imagePreview ? 'Change Photo' : 'Upload Photo'}
                        </span>
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG or GIF. Max size 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address / Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      placeholder="Enter your address in Zamboanga City"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Bike className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vehicle Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <select
                      name="vehicle.brand"
                      value={formData.vehicle.brand}
                      onChange={handleChange}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      name="vehicle.model"
                      value={formData.vehicle.model}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      placeholder="e.g., Click 125i"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      name="vehicle.year"
                      value={formData.vehicle.year}
                      onChange={handleChange}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      placeholder="2020"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center space-x-4 mb-6">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-primary"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.name}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.phone && (
                  <div className="flex items-start space-x-2 text-gray-600">
                    <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-start space-x-2 text-gray-600">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{user.address}</span>
                  </div>
                )}
                {user.vehicle && (
                  <div className="flex items-start space-x-2 text-gray-600">
                    <Bike className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>
                      {user.vehicle.brand} {user.vehicle.model}
                      {user.vehicle.year && ` (${user.vehicle.year})`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Active Orders</span>
            </h2>
            <button
              onClick={() => navigate('/marketplace')}
              className="text-primary hover:underline text-sm"
            >
              Shop More
            </button>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-gray-600">{order.shop}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-700">
                      {order.items.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Ordered on {order.date}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₱{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No active orders</p>
            </div>
          )}
        </div>

        {/* Service History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Wrench className="w-5 h-5" />
              <span>Service History</span>
            </h2>
            <button
              onClick={() => navigate('/service-booking')}
              className="text-primary hover:underline text-sm"
            >
              Book Service
            </button>
          </div>

          {serviceHistory.length > 0 ? (
            <div className="space-y-4">
              {serviceHistory.map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {service.service}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {service.mechanic}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < service.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {service.date}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₱{service.cost.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No service history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

