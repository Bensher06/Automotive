import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, LogIn, ShoppingBag, MapPin, CheckCircle, X } from 'lucide-react'

const SignUp = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSignUpClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedRole) {
      setError('Please select your role first')
      return
    }
    setIsModalOpen(true)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRole) {
      setError('Please select your role first')
      return
    }
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const result = await signup(email, password, name, selectedRole)
      if (result.success) {
        // Close signup modal
        setIsModalOpen(false)
        
        // Show success modal
        setSuccessMessage('Your account has been created successfully!')
        setShowSuccessModal(true)
      } else {
        // Show error message if signup failed
        setError(result.error || 'Failed to create account. Please try again.')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    setSuccessMessage('')
    // Redirect based on role after closing success modal
    if (selectedRole === 'store_owner') {
      navigate('/shop-verification')
    } else {
      navigate('/profile-setup')
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    // Reset form state when closing
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isModalOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
        // Reset form state when closing
        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setError('')
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isModalOpen])

  // Only Motorist and Shop Owner can sign up - Admin accounts are hardcoded
  const roles = [
    {
      id: 'customer',
      name: "I'm a Motorist",
      description: 'Find mechanics, shop for parts, and get roadside assistance',
      icon: User,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      borderColor: 'border-amber-500',
      bgGradient: 'from-amber-500 to-amber-600',
    },
    {
      id: 'store_owner',
      name: "I Own a Shop",
      description: 'Manage inventory, track sales, and handle appointments',
      icon: ShoppingBag,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      borderColor: 'border-blue-500',
      bgGradient: 'from-blue-500 to-blue-600',
    },
  ]

  const features = [
    {
      icon: MapPin,
      title: 'GPS On-Call Mechanics',
      description: 'Stuck on the road? Find the nearest registered mechanic instantly using our GPS integration.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      icon: ShoppingBag,
      title: 'Multi-Vendor Marketplace',
      description: 'Browse parts from multiple Zamboanga shops without leaving your home.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: CheckCircle,
      title: 'Verified & Secure',
      description: 'We verify all mechanics and shops to ensure quality service and safe transactions.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center transform rotate-45">
                <div className="w-6 h-6 bg-amber-500 rounded-md transform -rotate-45"></div>
              </div>
              <span className="ml-3 text-4xl font-bold tracking-tight">MotoZapp</span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Your Trusted <span className="text-amber-500">Automotive Partner</span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 max-w-2xl mx-auto">
              Create your account and become part of Zamboanga's premier automotive platform with MotoZapp.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {roles.map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id
              return (
                <div
                  key={role.id}
                  className={`
                    relative p-8 rounded-2xl border-2 transition-all duration-300 transform
                    ${isSelected 
                      ? `${role.borderColor} bg-white text-slate-900 shadow-2xl scale-105` 
                      : 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 hover:scale-[1.02]'
                    }
                  `}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id)
                      setError('')
                    }}
                    className="w-full text-left"
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className={`inline-flex p-4 rounded-xl mb-4 ${isSelected ? 'bg-slate-100' : 'bg-white/20'}`}>
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-slate-900' : 'text-white'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                      {role.name}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-slate-600' : 'text-slate-300'}`}>
                      {role.description}
                    </p>
                  </button>
                  
                  {/* Sign Up Button - Only shows when role is selected */}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={handleSignUpClick}
                      className={`
                        w-full mt-4 py-3 rounded-lg font-semibold text-white transition-all duration-200
                        flex items-center justify-center space-x-2
                        ${role.color} ${role.hoverColor}
                        shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                      `}
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Sign Up</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sign Up Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal()
            }
          }}
        >
          {/* Backdrop with blur */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* Modal Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</h2>
                <p className="text-slate-600 text-sm">
                  Sign up as {roles.find(r => r.id === selectedRole)?.name}
                </p>
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 bg-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 bg-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full py-3 rounded-lg font-semibold text-white transition-all duration-200
                    flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed
                    ${roles.find(r => r.id === selectedRole)?.color} ${roles.find(r => r.id === selectedRole)?.hoverColor}
                    shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                  `}
                >
                  <LogIn className="w-5 h-5" />
                  <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-amber-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Email Verification */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Account Created!</h2>
              
              {/* Message */}
              <p className="text-slate-600 mb-6">
                {successMessage}
              </p>
              
              {/* Continue Button */}
              <button
                onClick={handleSuccessModalClose}
                className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Why MotoZapp?</h2>
          <p className="mt-2 text-slate-600">Bridging the gap in the local automotive industry.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${feature.bgColor} ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SignUp
