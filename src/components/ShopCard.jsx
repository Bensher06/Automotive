import { Star, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const ShopCard = ({ shop }) => {
  return (
    <Link
      to={`/shop/${shop.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow block"
    >
      <div className="aspect-video bg-gray-200 relative">
        <img
          src={shop.image}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{shop.name}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{shop.rating}</span>
            <span className="text-sm text-gray-500">({shop.reviews})</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{shop.distance}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ShopCard

