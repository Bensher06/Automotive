import { Phone, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const EmergencyButton = () => {
  const [showModal, setShowModal] = useState(false)
  const [isFinding, setIsFinding] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleEmergencyClick = () => {
    if (!user) {
      navigate('/login')
      return
    }

    setShowModal(true)
    setIsFinding(true)

    // Simulate finding a mechanic
    setTimeout(() => {
      setIsFinding(false)
      // In a real app, this would navigate to mechanic finder with active request
      navigate('/mechanic-finder?emergency=true')
      setShowModal(false)
    }, 3000)
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleEmergencyClick}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg z-50 transition-all hover:scale-110 flex items-center space-x-2"
        aria-label="Emergency Mechanic"
      >
        <Phone className="w-6 h-6" />
        <span className="hidden sm:inline font-semibold">Emergency</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Emergency Mechanic Request
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isFinding ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                <p className="text-gray-700 font-medium">
                  Finding nearest available mechanic...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Please stay where you are
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-700">Mechanic found! Redirecting...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default EmergencyButton

