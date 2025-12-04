import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Store, User, MapPin, Phone, Mail, Clock, FileText, Image,
  Upload, CheckCircle, AlertCircle, X, ChevronRight, Search
} from 'lucide-react'

// Zamboanga City Barangays/Areas
const locations = [
  'Ayala, Zamboanga City',
  'Baliwasan, Zamboanga City',
  'Boalan, Zamboanga City',
  'Cabatangan, Zamboanga City',
  'Cabaluay, Zamboanga City',
  'Canelar, Zamboanga City',
  'Camino Nuevo, Zamboanga City',
  'Campo Islam, Zamboanga City',
  'Culianan, Zamboanga City',
  'Curuan, Zamboanga City',
  'Divisoria, Zamboanga City',
  'Guiwan, Zamboanga City',
  'Guisao, Zamboanga City',
  'La Paz, Zamboanga City',
  'Labuan, Zamboanga City',
  'Lanzones, Zamboanga City',
  'Lapakan, Zamboanga City',
  'Latuan, Zamboanga City',
  'Licomo, Zamboanga City',
  'Lubigan, Zamboanga City',
  'Lunzuran, Zamboanga City',
  'Maasin, Zamboanga City',
  'Malagutay, Zamboanga City',
  'Mampang, Zamboanga City',
  'Mercedes, Zamboanga City',
  'Pasonanca, Zamboanga City',
  'Putik, Zamboanga City',
  'Recodo, Zamboanga City',
  'Rio Hondo, Zamboanga City',
  'Salaan, Zamboanga City',
  'San Jose Cawa-Cawa, Zamboanga City',
  'San Jose Gusu, Zamboanga City',
  'San Roque, Zamboanga City',
  'Santa Barbara, Zamboanga City',
  'Santa Catalina, Zamboanga City',
  'Santa Maria, Zamboanga City',
  'Santo Niño, Zamboanga City',
  'Sinunuc, Zamboanga City',
  'Sta. Lucia, Zamboanga City',
  'Talon-Talon, Zamboanga City',
  'Taluksangay, Zamboanga City',
  'Tetuan, Zamboanga City',
  'Tictapul, Zamboanga City',
  'Tugbungan, Zamboanga City',
  'Tumaga, Zamboanga City',
  'Vitali, Zamboanga City',
  'Zambowood, Zamboanga City',
  'Zone I (Poblacion), Zamboanga City',
  'Zone II (Poblacion), Zamboanga City',
  'Zone III (Poblacion), Zamboanga City',
  'Zone IV (Poblacion), Zamboanga City',
]

const serviceOptions = [
  'Tune-up',
  'Engine Repair',
  'Brake Service',
  'Tire Change',
  'Electrical Repair',
  'General Maintenance',
  'Oil Change',
  'Chain Adjustment',
  'Body Repair',
  'Paint Job',
  'Parts Sales',
  'Accessories',
]

const ShopVerification = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Form state
  const [ownerName, setOwnerName] = useState('')
  const [shopName, setShopName] = useState('')
  const [location, setLocation] = useState('')
  const [completeAddress, setCompleteAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [operatingHours, setOperatingHours] = useState('')
  const [tinNumber, setTinNumber] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  
  // File state
  const [credentials, setCredentials] = useState(null)
  const [credentialsPreview, setCredentialsPreview] = useState(null)
  const [shopPicture, setShopPicture] = useState(null)
  const [shopPicturePreview, setShopPicturePreview] = useState(null)
  const [validId, setValidId] = useState(null)
  const [validIdPreview, setValidIdPreview] = useState(null)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')

  // Filter locations
  const filteredLocations = locations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  )

  // Handle location selection
  const handleSelectLocation = (loc) => {
    setLocation(loc)
    setShowLocationModal(false)
    setLocationSearch('')
  }

  // Handle file changes
  const handleCredentialsChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCredentials(file)
      setCredentialsPreview(URL.createObjectURL(file))
    }
  }

  const handleShopPictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setShopPicture(file)
      setShopPicturePreview(URL.createObjectURL(file))
    }
  }

  const handleValidIdChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setValidId(file)
      setValidIdPreview(URL.createObjectURL(file))
    }
  }

  // Toggle service selection
  const toggleService = (service) => {
    setSelectedServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  // Upload file to Supabase Storage
  const uploadFile = async (file, bucket, path) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${path}_${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!ownerName || !shopName || !location || !phone || !credentials || !shopPicture) {
        setError('Please fill in all required fields and upload required documents.')
        setLoading(false)
        return
      }

      if (selectedServices.length === 0) {
        setError('Please select at least one service your shop offers.')
        setLoading(false)
        return
      }

      let credentialsUrl = null
      let shopPictureUrl = null
      let validIdUrl = null

      // Upload files to Supabase Storage
      try {
        if (credentials) {
          credentialsUrl = await uploadFile(credentials, 'shop-documents', `credentials_${user.id}`)
        }
        if (shopPicture) {
          shopPictureUrl = await uploadFile(shopPicture, 'shop-images', `shop_${user.id}`)
        }
        if (validId) {
          validIdUrl = await uploadFile(validId, 'shop-documents', `valid_id_${user.id}`)
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError)
        // Continue without file URLs if storage isn't set up
      }

      // Create shop record
      const shopData = {
        owner_id: user.id,
        name: shopName,
        description: description,
        address: `${completeAddress}, ${location}`,
        phone: phone,
        email: email,
        hours: operatingHours,
        services: selectedServices,
        tin: tinNumber,
        image_url: shopPictureUrl,
        credentials_url: credentialsUrl,
        valid_id_url: validIdUrl,
        owner_name: ownerName,
        status: 'pending', // Pending admin verification
      }

      const { data, error: insertError } = await supabase
        .from('shops')
        .insert(shopData)
        .select()
        .single()

      if (insertError) throw insertError

      setSuccess(true)

      // Redirect to waiting approval page after 3 seconds
      setTimeout(() => {
        navigate('/waiting-approval')
      }, 3000)

    } catch (err) {
      console.error('Shop registration error:', err)
      setError(err.message || 'Failed to register shop. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowLocationModal(false)
      }
    }
    if (showLocationModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showLocationModal])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to register your shop</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Shop Registration Submitted!
          </h2>
          <p className="text-gray-600 mb-4">
            Your shop registration is now pending verification. Our admin team will review your application and notify you once approved.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Your Shop
          </h1>
          <p className="text-gray-600">
            Complete the form below to register your motorcycle shop on MotoZapp
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Owner Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                Owner Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner's Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    placeholder="Juan Dela Cruz"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="owner@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+63 912 345 6789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                {/* TIN Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="123-456-789-000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Shop Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Store className="w-5 h-5 mr-2 text-primary" />
                Shop Information
              </h3>

              {/* Shop Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  placeholder="Juan's Motorcycle Shop"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Barangay/Area <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-left bg-white flex items-center justify-between"
                >
                  <span className={location ? 'text-gray-900' : 'text-gray-400'}>
                    {location || 'Select barangay/area...'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Complete Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complete Address/Street <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={completeAddress}
                  onChange={(e) => setCompleteAddress(e.target.value)}
                  required
                  placeholder="123 Main Street, Near Landmark"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* Operating Hours */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="Mon-Sat: 8:00 AM - 6:00 PM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your shop, specialties, and what makes it unique..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Services Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Services Offered <span className="text-red-500 text-sm ml-1">*</span>
              </h3>
              <p className="text-sm text-gray-500 mb-3">Select all services your shop offers:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {serviceOptions.map((service) => (
                  <label
                    key={service}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedServices.includes(service)
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service)}
                      onChange={() => toggleService(service)}
                      className="sr-only"
                    />
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${
                      selectedServices.includes(service) 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`} />
                    <span className="text-sm font-medium">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary" />
                Required Documents
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Credentials */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Permit/DTI Registration <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {credentialsPreview ? (
                      <div className="relative">
                        <img
                          src={credentialsPreview}
                          alt="Credentials preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCredentials(null)
                            setCredentialsPreview(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileText className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">Click to upload</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleCredentialsChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Valid ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Government ID
                  </label>
                  <div className="mt-1">
                    {validIdPreview ? (
                      <div className="relative">
                        <img
                          src={validIdPreview}
                          alt="Valid ID preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setValidId(null)
                            setValidIdPreview(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileText className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">Click to upload</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleValidIdChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Shop Picture */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Image className="w-4 h-4 inline mr-1" />
                    Shop Photo <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {shopPicturePreview ? (
                      <div className="relative">
                        <img
                          src={shopPicturePreview}
                          alt="Shop preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShopPicture(null)
                            setShopPicturePreview(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Image className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> shop photo
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleShopPictureChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Store className="w-5 h-5" />
              <span>{loading ? 'Submitting...' : 'Submit for Verification'}</span>
            </button>

            <p className="text-center text-sm text-gray-500">
              Your shop will be reviewed by our admin team. You'll be notified once approved.
            </p>
          </form>
        </div>
      </div>

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowLocationModal(false)}
          />
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search barangay..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredLocations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No locations found
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredLocations.map((loc) => (
                    <li key={loc}>
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          location === loc ? 'bg-primary/5 text-primary' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <MapPin className={`w-4 h-4 ${location === loc ? 'text-primary' : 'text-gray-400'}`} />
                          <span className="font-medium">{loc}</span>
                        </div>
                        {location === loc && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShopVerification

