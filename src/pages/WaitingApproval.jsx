import { useNavigate } from 'react-router-dom'
import { Clock, ArrowLeft, Store, CheckCircle, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const WaitingApproval = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleBack = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Waiting for Approval
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your shop registration has been submitted successfully. Please wait{' '}
            <span className="font-semibold text-primary">2-3 business days</span>{' '}
            for our admin team to review and approve your application.
          </p>

          {/* Status Steps */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Application Status:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Account created</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Shop details submitted</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">Pending admin review</span>
              </div>
              <div className="flex items-center space-x-3">
                <Store className="w-5 h-5 text-gray-300" />
                <span className="text-sm text-gray-400">Shop activation</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              You will receive a notification once your shop is approved. You can then access your store dashboard.
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout & Go to Login</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WaitingApproval

