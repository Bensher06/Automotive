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
  Loader2,
  X,
  ShoppingCart,
  AlertTriangle,
  Mail,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBookings } from '../contexts/BookingContext'
import { useCart } from '../contexts/CartContext'

const ShopDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const { createBooking } = useBookings()
  const { addToCart } = useCart()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [shop, setShop] = useState(null)
  const [shopProducts, setShopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  
  // Rating state
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [existingRating, setExistingRating] = useState(null)

  // Product detail state
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Booking form state
  const [serviceType, setServiceType] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const today = new Date().toISOString().split('T')[0]

  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      setLoading(true)
      try {
        // Fetch shop details
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('id', id)
          .single()

        if (shopError) throw shopError
        setShop(shopData)

        // Fetch shop products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (!productsError) {
          setShopProducts(productsData || [])
        }

        // Fetch user's existing rating
        if (user?.id) {
          const { data: ratingData } = await supabase
            .from('shop_ratings')
            .select('rating')
            .eq('shop_id', id)
            .eq('user_id', user.id)
            .single()

          if (ratingData) {
            setExistingRating(ratingData.rating)
            setUserRating(ratingData.rating)
          }
        }
      } catch (err) {
        console.error('Error fetching shop:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchShopData()
    }
  }, [id, user?.id])

  // Submit rating
  const submitRating = async () => {
    if (!user) {
      alert('Please login to rate this shop')
      navigate('/login')
      return
    }
    if (userRating === 0) return

    setSubmittingRating(true)
    try {
      const { error } = await supabase
        .from('shop_ratings')
        .upsert({
          shop_id: id,
          user_id: user.id,
          rating: userRating,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop_id,user_id'
        })

      if (error) throw error

      // Refresh shop data to get updated rating
      const { data: updatedShop } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single()

      if (updatedShop) setShop(updatedShop)
      
      setExistingRating(userRating)
      setShowRatingModal(false)
    } catch (err) {
      console.error('Error submitting rating:', err)
      alert('Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  // Render stars
  const renderStars = (rating, size = 'w-5 h-5', interactive = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setUserRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoverRating || userRating) : rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  // Handle add to cart
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      shopId: shop.id,
      shopName: shop.name,
      quantity: 1
    })
    addNotification({
      type: 'cart',
      message: `${product.name} added to cart`
    })
  }

  const handleBookService = (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    setBookingLoading(true)

    createBooking({
      shopId: shop.id,
      shopName: shop.name,
      shopOwnerId: shop.owner_id,
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone || 'N/A',
      serviceType,
      date,
      time,
      notes,
      vehicle: user.vehicle,
    })

    setBookingLoading(false)
    setSubmitted(true)
    addNotification({
      type: 'service',
      message: `Your booking request for ${serviceType} at ${shop.name} on ${date} at ${time} has been submitted.`,
    })
    setTimeout(() => {
      setServiceType('')
      setDate('')
      setTime('')
      setNotes('')
      setSubmitted(false)
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Shop not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Store },
    { id: 'products', label: `Products (${shopProducts.length})`, icon: Package },
    { id: 'booking', label: 'Book Service', icon: Calendar },
    { id: 'location', label: 'Location', icon: MapPin },
  ]

  const serviceTypes = shop.services || ['Tune-up', 'Engine Repair', 'Brake Service', 'Tire Change', 'Oil Change', 'General Maintenance']

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
          <div className="h-64 bg-gray-200 relative">
            {shop.image_url ? (
              <img
                src={shop.image_url}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-24 h-24 text-gray-300" />
              </div>
            )}
            {/* Verification Badge */}
            {shop.status === 'verified' && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Verified</span>
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {shop.name}
                </h1>
                <p className="text-gray-600 mb-3">Owned by {shop.owner_name}</p>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {/* Rating */}
                  <div className="flex items-center space-x-2">
                    {renderStars(shop.average_rating || 0, 'w-5 h-5')}
                    <span className="text-lg font-semibold">{shop.average_rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-500">({shop.ratings_count || 0} reviews)</span>
                  </div>
                  {/* Rate Button */}
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {existingRating ? 'Update your rating' : 'Rate this shop'}
                  </button>
                </div>
                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-gray-600">
                  {shop.address && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{shop.address}</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{shop.phone}</span>
                    </div>
                  )}
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
                  {shop.description && (
                    <p className="text-gray-700 mb-6">{shop.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Address</p>
                          <p className="text-gray-600">{shop.address || 'No address provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Contact</p>
                          <p className="text-gray-600">{shop.phone || 'No phone provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Mail className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Email</p>
                          <p className="text-gray-600">{shop.email || 'No email provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Business Hours</p>
                          <p className="text-gray-600">{shop.hours || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-3">Services Offered</p>
                      <div className="flex flex-wrap gap-2">
                        {(shop.services || []).length > 0 ? (
                          shop.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500">No services listed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Available Products
                </h2>
                {shopProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {shopProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-12 h-12 text-gray-300" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                          <p className="text-lg font-bold text-primary">₱{parseFloat(product.price).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No products available from this shop yet</p>
                  </div>
                )}
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
                      Booking Submitted!
                    </h3>
                    <p className="text-gray-600">
                      Your service appointment request has been sent to {shop.name}.
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
                      disabled={bookingLoading || !user}
                      className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>{bookingLoading ? 'Booking...' : 'Confirm Booking'}</span>
                    </button>
                  </form>
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
                      {shop.address || 'Address not provided'}
                    </p>
                    <button
                      onClick={() => {
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Rate {shop.name}</h3>
              <button onClick={() => setShowRatingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">How would you rate this shop?</p>
              <div className="flex justify-center mb-2">
                {renderStars(userRating, 'w-10 h-10', true)}
              </div>
              <p className="text-sm text-gray-500">
                {userRating === 0 ? 'Click to rate' :
                 userRating === 1 ? 'Poor' :
                 userRating === 2 ? 'Fair' :
                 userRating === 3 ? 'Good' :
                 userRating === 4 ? 'Very Good' :
                 'Excellent!'}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={userRating === 0 || submittingRating}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center"
              >
                {submittingRating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
                <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="max-w-full max-h-64 object-contain" />
                  ) : (
                    <Package className="w-24 h-24 text-gray-300" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h4>
                    {selectedProduct.brand && (
                      <p className="text-gray-500">Brand: {selectedProduct.brand}</p>
                    )}
                  </div>

                  <p className="text-3xl font-bold text-primary">₱{parseFloat(selectedProduct.price).toLocaleString()}</p>

                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedProduct.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} in stock` : 'Out of Stock'}
                    </span>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                      <p className="text-gray-600">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Ratings */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-5 h-5 ${star <= (selectedProduct.ratings || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">({selectedProduct.ratings_count || 0} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Product is for Pickup Only</p>
                  <p className="text-sm text-amber-700">You must collect this item from {shop.name}.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct)
                    setSelectedProduct(null)
                  }}
                  disabled={selectedProduct.quantity <= 0}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShopDetails
