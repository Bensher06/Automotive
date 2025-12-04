import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ShoppingCart,
  Star,
  Plus,
  Minus,
  ArrowLeft,
  Store,
  CreditCard,
  CheckCircle,
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
// TODO: Fetch from API
const products = []
const shops = []

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    // TODO: Fetch product from API
    // const foundProduct = products.find((p) => p.id === parseInt(id))
    // if (foundProduct) {
    //   setProduct(foundProduct)
    // }
  }, [id])

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
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

  const shop = product ? shops.find((s) => s.id === product.shopId) : null

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  const handleBuyNow = () => {
    // Navigate to checkout with product and quantity
    navigate('/checkout', {
      state: {
        buyNow: true,
        product: product,
        quantity: quantity,
      },
    })
  }

  const totalPrice = product.price * quantity

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Left: Product Image */}
            <div className="flex-shrink-0">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="flex flex-col">
              {/* Title & Price */}
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {product.title || product.name}
                </h1>
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-4xl font-bold text-primary">
                    ₱{product.price.toLocaleString()}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-medium">{product.rating}</span>
                    <span className="text-gray-500">({product.stock} in stock)</span>
                  </div>
                </div>
              </div>

              {/* Shop/Seller Name */}
              {shop && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Store className="w-5 h-5 text-primary" />
                    <span className="text-gray-600">Sold by:</span>
                    <Link
                      to={`/shop/${shop.id}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      {product.shop}
                    </Link>
                    <div className="flex items-center space-x-1 ml-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {shop.rating} ({shop.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Specifications
                  </h2>
                  <div className="space-y-2">
                    {product.specifications.map((spec, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-gray-600 font-medium min-w-[140px]">
                          {spec.label}:
                        </span>
                        <span className="text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Modes */}
              {product.paymentModes && product.paymentModes.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Mode of Payment</span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {product.paymentModes.map((mode, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{mode}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Actions */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-xl font-semibold text-gray-900 w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 ml-4">
                      {product.stock} available
                    </span>
                  </div>
                </div>

                {/* Total Price */}
                {quantity > 1 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal ({quantity} items):</span>
                      <span className="text-2xl font-bold text-primary">
                        ₱{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={`flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-colors ${
                      addedToCart
                        ? 'bg-green-500 text-white'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{addedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-colors bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails

