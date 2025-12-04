import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wrench, ShoppingBag, MapPin } from 'lucide-react'
// TODO: Fetch from API
const categories = []
const shops = []
import ShopCard from '../components/ShopCard'

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`)
    }
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

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                navigate(`/marketplace?category=${category.name}`)
              }
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
              </div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
            </button>
          ))}
        </div>
      </section>

      {/* Top Rated Shops */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Top Rated Shops
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

