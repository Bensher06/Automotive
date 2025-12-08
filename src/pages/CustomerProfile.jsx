import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Package,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
  Camera,
  CheckCircle,
  Clock,
  Star,
  Upload,
  Trash2
} from 'lucide-react'

const CustomerProfile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    profile_image: ''
  })
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('profile')

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setProfileData({
            name: data.full_name || data.name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            address: data.address || '',
            vehicle_brand: data.vehicle_brand || '',
            vehicle_model: data.vehicle_model || '',
            vehicle_year: data.vehicle_year || '',
            profile_image: data.profile_image || ''
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            shops:shop_id (name, image_url),
            order_items (
              id,
              quantity,
              price,
              product_name
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (err) {
        console.error('Error fetching orders:', err)
      }
    }

    fetchOrders()
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    setSaveError('')

    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      const imageUrl = urlData.publicUrl

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: imageUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setProfileData(prev => ({ ...prev, profile_image: imageUrl }))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)

    } catch (err) {
      console.error('Error uploading image:', err)
      setSaveError('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Remove profile image
  const handleRemoveImage = async () => {
    if (!profileData.profile_image) return

    setUploadingImage(true)
    setSaveError('')

    try {
      // Update profile in database to remove image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: null })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setProfileData(prev => ({ ...prev, profile_image: '' }))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)

    } catch (err) {
      console.error('Error removing image:', err)
      setSaveError('Failed to remove image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.name,
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          vehicle_brand: profileData.vehicle_brand,
          vehicle_model: profileData.vehicle_model,
          vehicle_year: profileData.vehicle_year ? parseInt(profileData.vehicle_year) : null
        })
        .eq('id', user.id)

      if (error) throw error

      setSaveSuccess(true)
      setEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'delivered':
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>Profile updated successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <X className="w-5 h-5" />
            <span>{saveError}</span>
            <button onClick={() => setSaveError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center space-x-6">
            {/* Profile Image Section */}
            <div className="relative group">
              {uploadingImage ? (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : profileData.profile_image ? (
                <img
                  src={profileData.profile_image}
                  alt={profileData.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              
              {/* Image Upload/Change Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white text-primary rounded-full hover:bg-gray-100 transition-colors"
                    title="Upload new photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  {profileData.profile_image && (
                    <button
                      onClick={handleRemoveImage}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Camera Button (visible on mobile) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-white text-primary p-2 rounded-full shadow-lg hover:bg-gray-100 md:hidden"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profileData.name || 'User'}</h1>
              <p className="text-blue-100">{profileData.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                {user?.role === 'customer' ? '🏍️ Motorist' : user?.role || 'Customer'}
              </span>
            </div>

            {/* Quick Edit Button in Header */}
            <button
              onClick={() => {
                setActiveTab('profile')
                setEditing(true)
              }}
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Image Upload Help Text */}
          <p className="mt-4 text-sm text-blue-100 opacity-75">
            Hover over your photo to change it • Max 5MB • JPG, PNG, GIF
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-5 h-5 inline-block mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5 inline-block mr-2" />
              My Orders ({orders.length})
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 text-primary hover:text-primary-dark"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-1 px-4 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{profileData.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="09XX XXX XXXX"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your address"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.address || 'Not set'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    {editing ? (
                      <input
                        type="text"
                        name="vehicle_brand"
                        value={profileData.vehicle_brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Honda"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.vehicle_brand || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    {editing ? (
                      <input
                        type="text"
                        name="vehicle_model"
                        value={profileData.vehicle_model}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Click 125i"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.vehicle_model || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    {editing ? (
                      <input
                        type="number"
                        name="vehicle_year"
                        value={profileData.vehicle_year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., 2023"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.vehicle_year || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No orders yet</p>
                  <p className="text-gray-500 text-sm mt-1">Your order history will appear here</p>
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Order Header */}
                      <div className="bg-gray-50 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-gray-400">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                          {order.status === 'delivered' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      
                      {/* Order Items */}
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {order.shops?.image_url ? (
                            <img src={order.shops.image_url} alt={order.shops?.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{order.shops?.name || 'Shop'}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {order.order_items?.map(item => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-t border-gray-100">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{item.product_name || 'Product'}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">₱{(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                          <span className="font-medium text-gray-700">Total</span>
                          <span className="text-lg font-bold text-primary">₱{parseFloat(order.total_amount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerProfile

