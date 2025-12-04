import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  Package,
  CheckCircle,
  Wallet,
  Banknote,
  Smartphone,
} from 'lucide-react'

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = useCart()
  const navigate = useNavigate()
  const [selectedPayment, setSelectedPayment] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Get all available payment methods from cart items
  const getAvailablePaymentMethods = () => {
    const allMethods = new Set()
    cartItems.forEach((item) => {
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

  const handleCheckout = () => {
    // Navigate to checkout page
    navigate('/checkout', {
      state: {
        selectedPayment: selectedPayment,
      },
    })
  }

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method)
    setShowPaymentModal(false)
  }

  if (cartItems.length === 0) {
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

          {/* Empty Cart */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Start Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const total = getCartTotal()

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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <ShoppingCart className="w-8 h-8" />
            <span>Shopping Cart</span>
            <span className="text-lg font-normal text-gray-500">
              ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const itemTotal = item.price * item.quantity
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <Link
                      to={`/product/${item.id}`}
                      className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <Link
                          to={`/product/${item.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors mb-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600 mb-2">{item.shop}</p>
                        <p className="text-xl font-bold text-primary">
                          ₱{item.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= (item.stock || 999)}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="text-lg font-bold text-gray-900">
                              ₱{itemTotal.toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Items Count */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-primary">₱{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              {availablePaymentMethods.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Method
                  </label>
                  <div className="space-y-2">
                    {availablePaymentMethods.map((method) => (
                      <button
                        key={method}
                        onClick={() => handlePaymentSelect(method)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
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
                  </div>
                  {!selectedPayment && (
                    <p className="text-xs text-red-600 mt-2">
                      Please select a payment method
                    </p>
                  )}
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={availablePaymentMethods.length > 0 && !selectedPayment}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Checkout</span>
              </button>

              {/* Payment Method Info */}
              {selectedPayment && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Selected: {selectedPayment}
                    </span>
                  </div>
                </div>
              )}

              {/* Continue Shopping */}
              <Link
                to="/marketplace"
                className="block text-center text-primary hover:text-primary-dark font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal (for mobile) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Select Payment Method
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {availablePaymentMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => handlePaymentSelect(method)}
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
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Payment Information:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>Cash on Delivery (COD):</strong> Pay when you receive
                  the item
                </li>
                <li>
                  • <strong>G-Cash/PayMaya:</strong> Mobile wallet payment
                </li>
                <li>
                  • <strong>Credit Card:</strong> Secure card payment
                </li>
                <li>
                  • <strong>Bank Transfer:</strong> Direct bank deposit
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart

