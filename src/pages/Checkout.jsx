import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Phone,
  User,
  CheckCircle,
  Package,
  Wallet,
  Banknote,
  Smartphone,
  Edit2,
  Truck,
} from 'lucide-react'

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { cartItems, getCartTotal, clearCart } = useCart()
  
  // Get items from location state (for Buy Now) or from cart
  const [orderItems, setOrderItems] = useState([])
  const [isBuyNow, setIsBuyNow] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderError, setOrderError] = useState('')

  useEffect(() => {
    // Check if this is a "Buy Now" from ProductDetails
    if (location.state?.buyNow && location.state?.product) {
      setOrderItems([{ ...location.state.product, quantity: location.state.quantity || 1 }])
      setIsBuyNow(true)
    } else {
      // Regular cart checkout
      setOrderItems(cartItems)
      setIsBuyNow(false)
    }

    // Load user address and phone if available
    if (user) {
      setShippingAddress(user.address || '')
      setContactNumber(user.phone || '')
    }
  }, [location.state, cartItems, user])

  // Get available payment methods
  const getAvailablePaymentMethods = () => {
    const allMethods = new Set()
    orderItems.forEach((item) => {
      if (item.paymentModes && Array.isArray(item.paymentModes)) {
        item.paymentModes.forEach((method) => allMethods.add(method))
      }
    })
    return Array.from(allMethods)
  }

  const availablePaymentMethods = getAvailablePaymentMethods()

  const getPaymentIcon = (method) => {
    if (method.includes('COD') || method.includes('Cash')) {
      return <Banknote className="w-5 h-5" />
    } else if (method.includes('G-Cash') || method.includes('PayMaya')) {
      return <Smartphone className="w-5 h-5" />
    } else if (method.includes('Credit Card')) {
      return <CreditCard className="w-5 h-5" />
    } else if (method.includes('Bank')) {
      return <Wallet className="w-5 h-5" />
    }
    return <CreditCard className="w-5 h-5" />
  }

  const calculateSubtotal = () => {
    return orderItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() // Shipping is free
  }

  const handlePlaceOrder = async () => {
    // Validation
    if (!user) {
      alert('Please login to place an order')
      navigate('/login')
      return
    }
    if (!selectedPayment) {
      alert('Please select a payment method')
      return
    }
    if (!shippingAddress.trim()) {
      alert('Please enter your shipping address')
      return
    }
    if (!contactNumber.trim()) {
      alert('Please enter your contact number')
      return
    }

    setPlacingOrder(true)
    setOrderError('')

    try {
      // Group order items by shop
      const itemsByShop = {}
      orderItems.forEach(item => {
        const shopId = item.shop_id || 'unknown'
        if (!itemsByShop[shopId]) {
          itemsByShop[shopId] = []
        }
        itemsByShop[shopId].push(item)
      })

      // Process each shop's order
      for (const [shopId, items] of Object.entries(itemsByShop)) {
        if (shopId === 'unknown') {
          console.error('Item missing shop_id:', items)
          continue
        }

        const shopTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // 1. Create order in database with full customer info
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            shop_id: shopId,
            total_amount: shopTotal,
            payment_method: selectedPayment,
            shipping_address: shippingAddress,
            contact_number: contactNumber,
            customer_name: user.name || user.full_name || user.email,
            customer_email: user.email,
            customer_phone: contactNumber || user.phone || '',
            customer_profile_image: user.profileImage || user.profile_image || '',
            status: 'pending',
            created_at: new Date().toISOString() // Explicit order time
          })
          .select()
          .single()

        if (orderError) {
          console.error('Error creating order:', orderError)
          console.error('Order error details:', {
            message: orderError.message,
            details: orderError.details,
            hint: orderError.hint,
            code: orderError.code
          })
          throw new Error(`Failed to create order: ${orderError.message}`)
        }
        
        console.log('✅ Order created successfully:', orderData)

        // 2. Create order items and update stock
        for (const item of items) {
          // Create order item
          const { data: orderItemData, error: orderItemError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderData.id,
              product_id: item.id,
              product_name: item.name,
              quantity: item.quantity,
              price: item.price
            })
            .select()
            .single()

          if (orderItemError) {
            console.error('Error creating order item:', orderItemError)
            console.error('Order item error details:', {
              message: orderItemError.message,
              details: orderItemError.details,
              hint: orderItemError.hint,
              code: orderItemError.code
            })
            throw new Error(`Failed to create order item: ${orderItemError.message}`)
          }
          
          console.log('✅ Order item created successfully:', orderItemData)

          // Decrement product stock
          const { data: productData } = await supabase
            .from('products')
            .select('quantity, original_quantity')
            .eq('id', item.id)
            .single()

          if (productData) {
            const newQuantity = Math.max(0, productData.quantity - item.quantity)
            const originalQty = productData.original_quantity || productData.quantity
            
            await supabase
              .from('products')
              .update({ 
                quantity: newQuantity,
                status: newQuantity === 0 ? 'out_of_stock' : newQuantity <= (originalQty * 0.1) ? 'low_stock' : 'active'
              })
              .eq('id', item.id)
            
            console.log(`Product ${item.name} stock updated: ${productData.quantity} -> ${newQuantity}`)
          }
        }
      }

      // Success - clear cart and show success message
      setPlacingOrder(false)
      setOrderPlaced(true)
      
      // Clear cart if not Buy Now
      if (!isBuyNow) {
        clearCart()
      }

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (error) {
      console.error('❌ Error placing order:', error)
      console.error('Full error object:', error)
      const errorMessage = error.message || error.details || 'Failed to place order. Please try again.'
      setOrderError(errorMessage)
      setPlacingOrder(false)
      alert(`Order failed: ${errorMessage}\n\nCheck browser console for details.`)
    }
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-4">
            Your order has been successfully placed. You will receive a confirmation shortly.
          </p>
          <p className="text-sm text-gray-500">Redirecting to home...</p>
        </div>
      </div>
    )
  }

  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No items to checkout</p>
          <Link
            to="/marketplace"
            className="text-primary hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = calculateSubtotal()
  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Order Summary</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Order Items</span>
              </h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">{item.shop}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-semibold text-primary">
                          ₱{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Shipping Address</span>
                </h2>
                {user && (
                  <button
                    onClick={() => navigate('/')}
                    className="text-sm text-primary hover:underline flex items-center space-x-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit in Profile</span>
                  </button>
                )}
              </div>
              {user ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+63 912 345 6789"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address
                    </label>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-2" />
                      <textarea
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter your complete delivery address"
                        rows={3}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Please log in to continue with checkout
                  </p>
                  <Link
                    to="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Method</span>
              </h2>
              {availablePaymentMethods.length > 0 ? (
                <div className="space-y-2">
                  {availablePaymentMethods.map((method) => (
                    <button
                      key={method}
                      onClick={() => setSelectedPayment(method)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedPayment === method
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`${
                            selectedPayment === method
                              ? 'text-primary'
                              : 'text-gray-400'
                          }`}
                        >
                          {getPaymentIcon(method)}
                        </div>
                        <span className="font-medium text-gray-900">{method}</span>
                      </div>
                      {selectedPayment === method && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                  {!selectedPayment && (
                    <p className="text-sm text-red-600 mt-2">
                      Please select a payment method
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No payment methods available</p>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Summary Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Items ({orderItems.reduce((sum, item) => sum + item.quantity, 0)})
                  </span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Truck className="w-4 h-4" />
                    <span>Shipping</span>
                  </span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-primary">₱{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Selected Payment Method */}
              {selectedPayment && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{selectedPayment}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {orderError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{orderError}</p>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={
                  placingOrder ||
                  !selectedPayment ||
                  !shippingAddress.trim() ||
                  !contactNumber.trim() ||
                  !user
                }
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Place Order</span>
                  </>
                )}
              </button>

              {!user && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Please log in to place order
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

