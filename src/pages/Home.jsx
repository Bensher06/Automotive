import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wrench, ShoppingBag, MapPin, Star, Store, Loader2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [topShops, setTopShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [userRatings, setUserRatings] = useState({}) // Track user's existing ratings
  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch top 5 rated shops
  useEffect(() => {
    const fetchTopShops = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('status', 'verified')
          .order('average_rating', { ascending: false, nullsFirst: false })
          .limit(5)

        if (error) throw error
        setTopShops(data || [])
      } catch (err) {
        console.error('Error fetching top shops:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopShops()
  }, [])

  // Fetch user's existing ratings
  useEffect(() => {
    const fetchUserRatings = async () => {
      if (!user?.id) return
      
      try {
        const { data, error } = await supabase
          .from('shop_ratings')
          .select('shop_id, rating')
          .eq('user_id', user.id)

        if (error) throw error
        
        const ratingsMap = {}
        data?.forEach(r => {
          ratingsMap[r.shop_id] = r.rating
        })
        setUserRatings(ratingsMap)
      } catch (err) {
        console.error('Error fetching user ratings:', err)
      }
    }

    fetchUserRatings()
  }, [user?.id])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Open rating modal
  const openRatingModal = (shop) => {
    if (!user) {
      alert('Please login to rate shops')
      navigate('/login')
      return
    }
    setSelectedShop(shop)
    setUserRating(userRatings[shop.id] || 0)
  }

  // Submit rating
  const submitRating = async () => {
    if (!selectedShop || !user || userRating === 0) return
    
    setSubmittingRating(true)
    try {
      // Upsert rating (insert or update if exists)
      const { error } = await supabase
        .from('shop_ratings')
        .upsert({
          shop_id: selectedShop.id,
          user_id: user.id,
          rating: userRating,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop_id,user_id'
        })

      if (error) throw error

      // Update local state
      setUserRatings(prev => ({ ...prev, [selectedShop.id]: userRating }))
      
      // Refresh shops to get updated average
      const { data: updatedShops } = await supabase
        .from('shops')
        .select('*')
        .eq('status', 'verified')
        .order('average_rating', { ascending: false, nullsFirst: false })
        .limit(5)
      
      if (updatedShops) setTopShops(updatedShops)
      
      setSelectedShop(null)
      setUserRating(0)
    } catch (err) {
      console.error('Error submitting rating:', err)
      alert('Failed to submit rating. Please try again.')
    } finally {
      setSubmittingRating(false)
    }
  }

  // Render stars
  const renderStars = (rating, size = 'w-5 h-5', interactive = false, onRate = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate && onRate(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoverRating || rating) : rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Trusted Automotive Partner
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Find parts, book services, and get emergency roadside assistance
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for parts or services..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/mechanic-finder')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <Wrench className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Find Mechanic</h3>
            <p className="text-gray-600 text-sm">
              Get immediate roadside assistance
            </p>
          </button>

          <button
            onClick={() => navigate('/marketplace')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <ShoppingBag className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Shop Parts</h3>
            <p className="text-gray-600 text-sm">
              Browse parts from local vendors
            </p>
          </button>

          <button
            onClick={() => navigate('/service-booking')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <MapPin className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Book Service</h3>
            <p className="text-gray-600 text-sm">
              Schedule maintenance or repairs
            </p>
          </button>
        </div>
      </section>

      {/* Top Rated Shops */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Top Rated Shops
          </h2>
          <button 
            onClick={() => navigate('/marketplace')}
            className="text-primary hover:underline font-medium"
          >
            View All Shops →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : topShops.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No verified shops yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon for top rated shops!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {topShops.map((shop, index) => (
              <div 
                key={shop.id} 
                onClick={() => navigate(`/shop/${shop.id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Rank Badge */}
                <div className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                      index === 0 ? 'bg-amber-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-700' : 
                      'bg-gray-500'
                    }`}>
                      #{index + 1}
                    </span>
                  </div>
                  {/* Shop Image */}
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {shop.image_url ? (
                      <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                </div>

                {/* Shop Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{shop.name}</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">{shop.address || 'No address'}</p>
                  
                  {/* Rating Display */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(shop.average_rating || 0, 'w-4 h-4')}
                      <span className="text-sm text-gray-600 ml-1">
                        ({shop.ratings_count || 0})
                      </span>
                    </div>
                  </div>

                  {/* Rate Button */}
                  <button
                    onClick={() => openRatingModal(shop)}
                    className="w-full mt-3 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    {userRatings[shop.id] ? 'Update Rating' : 'Rate This Shop'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rating Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Rate Shop</h3>
              <button 
                onClick={() => { setSelectedShop(null); setUserRating(0); setHoverRating(0); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Shop Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {selectedShop.image_url ? (
                  <img src={selectedShop.image_url} alt={selectedShop.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{selectedShop.name}</h4>
                <p className="text-sm text-gray-500">{selectedShop.address || 'No address'}</p>
              </div>
            </div>

            {/* Rating Selection */}
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-3">How would you rate this shop?</p>
              <div className="flex justify-center">
                {renderStars(userRating, 'w-10 h-10', true, setUserRating)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {userRating === 0 ? 'Click to rate' :
                 userRating === 1 ? 'Poor' :
                 userRating === 2 ? 'Fair' :
                 userRating === 3 ? 'Good' :
                 userRating === 4 ? 'Very Good' :
                 'Excellent!'}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                onClick={() => { setSelectedShop(null); setUserRating(0); setHoverRating(0); }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={userRating === 0 || submittingRating}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submittingRating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
