import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, X } from 'lucide-react'
// TODO: Fetch from API
const products = []
const categories = []
const shops = []
import ProductCard from '../components/ProductCard'

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedShop, setSelectedShop] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Get initial filters from URL
  useEffect(() => {
    const category = searchParams.get('category') || ''
    const shop = searchParams.get('shop') || ''
    const search = searchParams.get('search') || ''

    setSelectedCategory(category)
    setSelectedShop(shop)
    setSearchQuery(search)
  }, [searchParams])

  // Filter products
  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchLower) ||
      (product.title && product.title.toLowerCase().includes(searchLower)) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.shop.toLowerCase().includes(searchLower)

    const matchesCategory =
      !selectedCategory || product.category === selectedCategory

    const matchesShop =
      !selectedShop || product.shop === selectedShop

    const matchesPrice =
      !priceRange ||
      (priceRange === 'low' && product.price < 1000) ||
      (priceRange === 'medium' &&
        product.price >= 1000 &&
        product.price < 3000) ||
      (priceRange === 'high' && product.price >= 3000)

    return matchesSearch && matchesCategory && matchesShop && matchesPrice
  })

  // Cart is now managed by CartContext, no need for local state

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedShop('')
    setPriceRange('')
    setSearchQuery('')
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Marketplace</h1>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shop Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop
                  </label>
                  <select
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">All Shops</option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.name}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Prices</option>
                    <option value="low">Under ₱1,000</option>
                    <option value="medium">₱1,000 - ₱3,000</option>
                    <option value="high">Over ₱3,000</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No products found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Marketplace

