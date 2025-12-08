import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Filter, X, Star, ShoppingCart, Package, Store, AlertTriangle, CheckCircle, ChevronRight, Check, Loader2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedShop, setSelectedShop] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [products, setProducts] = useState([])
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const { addToCart, isInCart } = useCart()

  // Fetch products and shops from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }

      try {
        // Fetch products with shop info
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            shops:shop_id (
              id,
              name,
              image_url,
              address
            )
          `)
          .order('created_at', { ascending: false })

        if (productsError) {
          console.error('Error fetching products:', productsError)
        } else {
          // Transform products
          const transformedProducts = (productsData || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: parseFloat(p.price) || 0,
            brand: p.brand,
            quantity: p.quantity || 0,
            original_quantity: p.original_quantity || p.quantity || 0,
            image: p.image_url,
            image_url: p.image_url,
            category: p.category || 'General',
            rating: parseFloat(p.ratings) || 0,
            ratings_count: p.ratings_count || 0,
            status: p.status,
            shop: p.shops?.name || 'Unknown Shop',
            shop_id: p.shop_id,
            shop_image: p.shops?.image_url,
            shop_address: p.shops?.address
          }))
          setProducts(transformedProducts)

          // Extract unique categories
          const uniqueCategories = [...new Set(transformedProducts.map(p => p.category).filter(Boolean))]
          setCategories(uniqueCategories.map((cat, idx) => ({ id: idx, name: cat })))
        }

        // Fetch verified shops for filter
        const { data: shopsData, error: shopsError } = await supabase
          .from('shops')
          .select('id, name')
          .eq('status', 'verified')

        if (!shopsError && shopsData) {
          setShops(shopsData)
        }

      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.shop && product.shop.toLowerCase().includes(searchLower)) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower))

    const matchesCategory =
      !selectedCategory || product.category === selectedCategory

    const matchesShop =
      !selectedShop || product.shop === selectedShop

    const matchesPrice =
      !priceRange ||
      (priceRange === 'low' && product.price < 1000) ||
      (priceRange === 'medium' && product.price >= 1000 && product.price < 3000) ||
      (priceRange === 'high' && product.price >= 3000)

    return matchesSearch && matchesCategory && matchesShop && matchesPrice
  })

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedShop('')
    setPriceRange('')
    setSearchQuery('')
    setSearchParams({})
  }

  // Get stock status
  const getStockStatus = (currentQuantity, originalQuantity) => {
    if (currentQuantity <= 0) return { status: 'out', label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (originalQuantity > 0 && currentQuantity / originalQuantity <= 0.1) return { status: 'low', label: 'Low Stock', color: 'bg-amber-100 text-amber-800' }
    return { status: 'in', label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  // Handle product card click
  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
    setAddedToCart(false)
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (selectedProduct) {
      addToCart({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image_url || selectedProduct.image,
        shop: selectedProduct.shop,
        shop_id: selectedProduct.shop_id
      }, 1)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    }
  }

  // Handle place order - creates order, decrements stock, notifies shop owner
  const handlePlaceOrder = async () => {
    if (!selectedProduct || !user) {
      alert('Please login to place an order')
      return
    }

    setPlacingOrder(true)
    try {
      // 1. Create order in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          shop_id: selectedProduct.shop_id,
          total_amount: selectedProduct.price,
          payment_method: 'Pickup',
          shipping_address: 'For Pickup',
          contact_number: user.phone || 'N/A',
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: selectedProduct.id,
          quantity: 1,
          price: selectedProduct.price
        })

      if (itemError) throw itemError

      // 3. Decrement product stock
      const newQuantity = Math.max(0, selectedProduct.quantity - 1)
      const { error: stockError } = await supabase
        .from('products')
        .update({ 
          quantity: newQuantity,
          status: newQuantity === 0 ? 'out_of_stock' : newQuantity <= (selectedProduct.original_quantity * 0.1) ? 'low_stock' : 'active'
        })
        .eq('id', selectedProduct.id)

      if (stockError) console.error('Stock update error:', stockError)

      // 4. Get shop owner ID to send notification
      const { data: shopData } = await supabase
        .from('shops')
        .select('owner_id, name')
        .eq('id', selectedProduct.shop_id)
        .single()

      if (shopData?.owner_id) {
        // 5. Create notification for shop owner
        await supabase
          .from('notifications')
          .insert({
            user_id: shopData.owner_id,
            title: 'New Order Received! 🎉',
            message: `${user.name || user.email} ordered "${selectedProduct.name}" for ₱${selectedProduct.price.toLocaleString()}. Order #${orderData.id.slice(0, 8).toUpperCase()}`,
            type: 'success',
            read: false
          })

        // 6. Record sale for analytics
        await supabase
          .from('sales')
          .insert({
            shop_id: selectedProduct.shop_id,
            order_id: orderData.id,
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: 1,
            amount: selectedProduct.price,
            customer_id: user.id,
            customer_name: user.name || user.email
          })
      }

      // Update local product state
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, quantity: newQuantity }
          : p
      ))

      setOrderSuccess(true)
      setTimeout(() => {
        setShowProductModal(false)
        setOrderSuccess(false)
        setSelectedProduct(null)
      }, 2000)

    } catch (error) {
      console.error('Order error:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
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

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stockInfo = getStockStatus(product.quantity, product.original_quantity)
              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 relative">
                    {product.image_url || product.image ? (
                      <img
                        src={product.image_url || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {/* Stock Badge */}
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
                      {stockInfo.label}
                    </span>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Store className="w-3 h-3 mr-1" />
                      {product.shop}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        ₱{product.price.toLocaleString()}
                      </span>
                      {product.rating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No products found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Product Image */}
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
                  {selectedProduct.image_url || selectedProduct.image ? (
                    <img
                      src={selectedProduct.image_url || selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-24 h-24 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  {/* Name & Price */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h3>
                    <p className="text-3xl font-bold text-primary">₱{selectedProduct.price.toLocaleString()}</p>
                  </div>

                  {/* Shop Info - Clickable */}
                  <div 
                    onClick={() => {
                      setShowProductModal(false)
                      navigate(`/shop/${selectedProduct.shop_id}`)
                    }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      {selectedProduct.shop_image ? (
                        <img src={selectedProduct.shop_image} alt={selectedProduct.shop} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-primary group-hover:underline">{selectedProduct.shop}</p>
                        {selectedProduct.shop_address && (
                          <p className="text-sm text-gray-500">{selectedProduct.shop_address}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.brand && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Brand</p>
                        <p className="font-medium text-gray-900">{selectedProduct.brand}</p>
                      </div>
                    )}
                    {selectedProduct.category && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium text-gray-900">{selectedProduct.category}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Stock</p>
                      <p className={`font-medium ${
                        selectedProduct.quantity <= 0 ? 'text-red-600' : 
                        selectedProduct.quantity <= selectedProduct.original_quantity * 0.1 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {selectedProduct.quantity} available
                      </p>
                    </div>
                    {selectedProduct.rating > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Rating</p>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-gray-900">{selectedProduct.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({selectedProduct.ratings_count} reviews)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Pickup Warning */}
                  <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Product is for Pickup Only</p>
                      <p className="text-sm text-amber-700">This product must be picked up at the shop location.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {orderSuccess ? (
                      <div className="flex-1 py-3 px-6 rounded-xl font-semibold bg-green-500 text-white flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Order Placed Successfully!</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={handlePlaceOrder}
                          disabled={selectedProduct.quantity <= 0 || placingOrder}
                          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 ${
                            selectedProduct.quantity <= 0 || placingOrder
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          {placingOrder ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Placing Order...</span>
                            </>
                          ) : (
                            <>
                              <Package className="w-5 h-5" />
                              <span>Place Order</span>
                            </>
                          )}
                        </button>
                        
                        {/* Show "In Cart" or "Add to Cart" based on cart status */}
                        {isInCart(selectedProduct.id) ? (
                          <button
                            onClick={() => navigate('/cart')}
                            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-green-100 text-green-700 border-2 border-green-500 flex items-center justify-center space-x-2 hover:bg-green-200 transition-colors"
                          >
                            <Check className="w-5 h-5" />
                            <span>In Cart - View Cart</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleAddToCart}
                            disabled={selectedProduct.quantity <= 0}
                            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 ${
                              selectedProduct.quantity <= 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : addedToCart
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                            }`}
                          >
                            {addedToCart ? (
                              <>
                                <CheckCircle className="w-5 h-5" />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-5 h-5" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Marketplace
