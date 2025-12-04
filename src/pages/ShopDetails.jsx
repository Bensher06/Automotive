import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Star,
  MapPin,
  Phone,
  Clock,
  Calendar,
  Wrench,
  ArrowLeft,
  Store,
  Package,
  Navigation,
  CheckCircle,
} from 'lucide-react'
// TODO: Fetch from API
const shops = []
const products = []
const serviceTypes = ['Tune-up', 'Engine Repair', 'Brake Service', 'Tire Change', 'Electrical Repair', 'General Maintenance', 'Oil Change', 'Chain Adjustment']
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBookings } from '../contexts/BookingContext'
import ProductCard from '../components/ProductCard'

const ShopDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const { createBooking } = useBookings()
  const [activeTab, setActiveTab] = useState('overview')
  const [shop, setShop] = useState(null)
  const [shopProducts, setShopProducts] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Booking form state
  const [serviceType, setServiceType] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    // TODO: Fetch shop from API
    // const foundShop = shops.find((s) => s.id === parseInt(id))
    // if (foundShop) {
    //   setShop(foundShop)
    //   const shopProds = products.filter((p) => p.shopId === foundShop.id)
    //   setShopProducts(shopProds)
    // }
  }, [id])

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Shop not found</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-primary hover:underline"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  const handleBookService = (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)

    // Create booking using BookingContext
    createBooking({
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

    setLoading(false)
    setSubmitted(true)
    addNotification({
      type: 'service',
      message: `Your booking request for ${serviceType} at ${shop.name} on ${date} at ${time} has been submitted. Waiting for shop approval.`,
    })
    setTimeout(() => {
      setServiceType('')
      setDate('')
      setTime('')
      setNotes('')
      setSubmitted(false)
    }, 3000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Store },
    { id: 'about', label: 'About', icon: Package },
    { id: 'booking', label: 'Book Service', icon: Calendar },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'location', label: 'Location', icon: MapPin },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Shop Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="aspect-video bg-gray-200 relative">
            <img
              src={shop.image}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {shop.name}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">{shop.rating}</span>
                    <span className="text-gray-500">({shop.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>{shop.distance}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Shop Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Address</p>
                          <p className="text-gray-600">
                            {shop.address || '123 Main Street, Zamboanga City'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Contact</p>
                          <p className="text-gray-600">
                            {shop.phone || '+63 912 345 6789'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Business Hours</p>
                          <p className="text-gray-600">
                            {shop.hours || 'Mon-Sat: 8:00 AM - 6:00 PM'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {(shop.specialties || ['Engine Repair', 'Tire Replacement', 'Oil Change', 'Brake Service']).map(
                          (specialty, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            >
                              {specialty}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About {shop.name}
                </h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {shop.description ||
                    `${shop.name} is a trusted automotive shop in Zamboanga City, specializing in motorcycle parts and services. With years of experience, we provide high-quality products and professional service to keep your motorcycle running smoothly. Our team of skilled mechanics is dedicated to ensuring your satisfaction and safety on the road.`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Services Offered</h3>
                    <ul className="space-y-2">
                      {serviceTypes.slice(0, 5).map((service, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-gray-600">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Why Choose Us</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Experienced and certified mechanics</span>
                      </li>
                      <li className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Genuine and quality parts</span>
                      </li>
                      <li className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Competitive pricing</span>
                      </li>
                      <li className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Fast and reliable service</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Tab */}
            {activeTab === 'booking' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Book a Service
                </h2>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Booking Confirmed!
                    </h3>
                    <p className="text-gray-600">
                      Your service appointment has been scheduled with {shop.name}.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBookService} className="space-y-6 max-w-2xl">
                    {!user && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          Please{' '}
                          <Link to="/login" className="underline font-semibold">
                            log in
                          </Link>{' '}
                          to book a service.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Wrench className="w-4 h-4 inline mr-1" />
                        Service Type
                      </label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        required
                        disabled={!user}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
                      >
                        <option value="">Select service type...</option>
                        {serviceTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

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
                          disabled={!user}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
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
                          disabled={!user}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        disabled={!user}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
                        placeholder="Describe any specific issues or requirements..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !user}
                      className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>{loading ? 'Booking...' : 'Confirm Booking'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Available Products ({shopProducts.length})
                </h2>
                {shopProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {shopProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No products available from this shop</p>
                  </div>
                )}
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Shop Location
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-6 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <p className="font-medium text-gray-900 mb-2">
                      {shop.address || '123 Main Street, Zamboanga City'}
                    </p>
                    <p className="text-gray-600 mb-4">{shop.distance} from you</p>
                    <button
                      onClick={() => {
                        // In a real app, this would open maps
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            shop.address || 'Zamboanga City'
                          )}`,
                          '_blank'
                        )
                      }}
                      className="inline-flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Navigation className="w-5 h-5" />
                      <span>Open in Maps</span>
                    </button>
                  </div>
                  {shop.location && (
                    <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                      <p className="text-gray-500">Map view would be displayed here</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShopDetails

