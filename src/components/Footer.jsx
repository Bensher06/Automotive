import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4">MotoZapp</h3>
            <p className="text-gray-400">
              Your trusted partner for automotive services and parts in
              Zamboanga City.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/marketplace"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  to="/mechanic-finder"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Find Mechanic
                </Link>
              </li>
              <li>
                <Link
                  to="/service-booking"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Book Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>+63 912 345 6789</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>support@motozapp.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Zamboanga City, Philippines</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 MotoZapp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

