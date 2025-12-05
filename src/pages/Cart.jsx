import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
  CheckCircle,
  X,
  AlertTriangle,
  Loader2,
  Store,
} from 'lucide-react'

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = useCart()
  const { user } = useAuth()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')

  const handleGoBack = () => {
    // Navigate back to marketplace, never to shop_owner pages
    window.location.href = '/marketplace'
  }

  const handleCheckout = () => {
    if (!user) {
      alert('Please login to checkout')
      window.location.href = '/login'
      return
    }
    setShowCheckoutModal(true)
    setOrderError('')
  }

  const handleConfirmOrder = async () => {
    if (!user) return

    setPlacingOrder(true)
    setOrderError('')

    try {
      // Group cart items by shop
      const itemsByShop = {}
      cartItems.forEach(item => {
        const shopId = item.shop_id || 'unknown'
        if (!itemsByShop[shopId]) {
          itemsByShop[shopId] = []
        }
        itemsByShop[shopId].push(item)
      })

      // Process each shop's order
      for (const [shopId, items] of Object.entries(itemsByShop)) {
        if (shopId === 'unknown') continue

        const shopTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // Calculate total items for this shop
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

        // 1. Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            shop_id: shopId,
            total_amount: shopTotal,
            payment_method: 'Pickup',
            shipping_address: 'For Pickup',
            contact_number: user.phone || 'N/A',
            customer_name: user.name || user.email,
            customer_email: user.email,
            status: 'pending'
          })
          .select()
          .single()

        if (orderError) {
          console.error('Error creating order:', orderError)
          throw orderError
        }
        
        console.log('Order created:', orderData)

        // 2. Create order items and update stock
        for (const item of items) {
          // Create order item
          const { data: orderItemData, error: orderItemError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderData.id,
              product_id: item.id,
              product_name: item.name, // Save product name for easier queries
              quantity: item.quantity,
              price: item.price
            })
            .select()
            .single()

          if (orderItemError) {
            console.error('Error creating order item:', orderItemError)
          } else {
            console.log('Order item created:', orderItemData)
          }

          // Decrement product stock by the quantity ordered
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

          // Record sale for analytics
          const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
              shop_id: shopId,
              order_id: orderData.id,
              product_id: item.id,
              product_name: item.name,
              quantity: item.quantity,
              amount: item.price * item.quantity,
              customer_id: user.id,
              customer_name: user.name || user.email
            })
            .select()
            .single()

          if (saleError) {
            console.error('Error creating sale record:', saleError)
          } else {
            console.log('Sale record created:', saleData)
          }
        }

        // 3. Get shop owner and send notification
        const { data: shopData } = await supabase
          .from('shops')
          .select('owner_id, name')
          .eq('id', shopId)
          .single()

        if (shopData?.owner_id) {
          const itemNames = items.map(i => `${i.name} (x${i.quantity})`).join(', ')
          await supabase
            .from('notifications')
            .insert({
              user_id: shopData.owner_id,
              title: 'New Order Received! 🎉',
              message: `${user.name || user.email} ordered: ${itemNames}. Total: ₱${shopTotal.toLocaleString()}. Order #${orderData.id.slice(0, 8).toUpperCase()}`,
              type: 'success',
              read: false
            })
        }
      }

      setOrderSuccess(true)
      setTimeout(() => {
        clearCart()
        setShowCheckoutModal(false)
        setOrderSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Order error:', error)
      setOrderError('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Marketplace</span>
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
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Marketplace</span>
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
                    <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 flex items-center">
                          <Store className="w-3 h-3 mr-1" />
                          {item.shop}
                        </p>
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
                  <span>Items ({totalItems})</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free (Pickup)</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-primary">₱{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Pickup Warning */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    All products are for <strong>pickup only</strong> at the shop location.
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 mb-4"
              >
                <Package className="w-5 h-5" />
                <span>Proceed to Checkout</span>
              </button>

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

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {orderSuccess ? 'Order Confirmed!' : 'Confirm Your Order'}
              </h2>
              {!orderSuccess && !placingOrder && (
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="p-6">
              {orderSuccess ? (
                /* Success State */
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-600 mb-4">Your order has been placed successfully.</p>
                  <p className="text-sm text-gray-500">The shop owner has been notified and will prepare your order for pickup.</p>
                </div>
              ) : (
                <>
                  {/* Order Items Summary */}
                  <div className="space-y-3 mb-6">
                    <h3 className="font-semibold text-gray-900">Order Items</h3>
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × ₱{item.price.toLocaleString()}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₱{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total ({totalItems} items)</span>
                      <span className="text-2xl font-bold text-primary">₱{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pickup Notice */}
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Pickup Only</p>
                        <p className="text-sm text-amber-700">Please pick up your order at the shop location. The shop owner will notify you when your order is ready.</p>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {orderError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {orderError}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      disabled={placingOrder}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmOrder}
                      disabled={placingOrder}
                      className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {placingOrder ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Confirm Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
