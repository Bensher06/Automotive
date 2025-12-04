import { ShoppingCart, Star } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

const ProductCard = ({ product }) => {
  const [added, setAdded] = useState(false)
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const handleAddToCart = (e) => {
    e.stopPropagation() // Prevent navigation when clicking add to cart
    addToCart(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleCardClick = () => {
    navigate(`/product/${product.id}`)
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="aspect-square bg-gray-200 relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{product.shop}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-primary">
            ₱{product.price.toLocaleString()}
          </span>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600">{product.rating}</span>
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            added
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{added ? 'Added!' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  )
}

export default ProductCard

