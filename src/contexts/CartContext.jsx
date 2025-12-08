import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  // Get user ID from localStorage (from profiles table login)
  useEffect(() => {
    const loadUserId = () => {
      const storedUser = localStorage.getItem('motoZapp_user')
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          setUserId(user.id)
        } catch (error) {
          console.error('Error parsing user:', error)
        }
      }
    }
    loadUserId()
    
    // Listen for user changes
    const handleStorageChange = () => {
      loadUserId()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Load cart from database when user is logged in
  useEffect(() => {
    const loadCartFromDatabase = async () => {
      if (!userId) {
        // No user logged in - load from localStorage as fallback
        const savedCart = localStorage.getItem('motoZapp_cart')
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart))
          } catch (error) {
            console.error('Error loading cart from localStorage:', error)
          }
        }
        setLoading(false)
        return
      }

      try {
        // Load cart from database
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading cart from database:', error)
          // Fallback to localStorage
          const savedCart = localStorage.getItem('motoZapp_cart')
          if (savedCart) {
            try {
              setCartItems(JSON.parse(savedCart))
            } catch (e) {
              console.error('Error loading cart from localStorage:', e)
            }
          }
        } else {
          // Transform database cart items to app format
          const transformedCart = data.map(item => ({
            id: item.product_id,
            name: item.product_name || '',
            price: parseFloat(item.price),
            quantity: item.quantity,
            shop_id: item.shop_id,
            image: item.product_image || '',
            shop: item.shop_name || ''
          }))
          setCartItems(transformedCart)
        }
      } catch (error) {
        console.error('Error in loadCartFromDatabase:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCartFromDatabase()
  }, [userId])

  // Save cart to database whenever it changes (if user is logged in)
  useEffect(() => {
    const saveCartToDatabase = async () => {
      if (!userId || loading) return

      try {
        // Delete all existing cart items for this user
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId)

        // Insert all current cart items
        if (cartItems.length > 0) {
          const cartItemsToInsert = cartItems.map(item => ({
            user_id: userId,
            product_id: item.id,
            shop_id: item.shop_id || 'unknown',
            quantity: item.quantity,
            price: item.price,
            product_name: item.name,
            product_image: item.image || item.image_url || ''
          }))

          const { error } = await supabase
            .from('cart_items')
            .insert(cartItemsToInsert)

          if (error) {
            console.error('Error saving cart to database:', error)
          } else {
            console.log('✅ Cart saved to database')
          }
        }
      } catch (error) {
        console.error('Error in saveCartToDatabase:', error)
      }

      // Also save to localStorage as backup
      localStorage.setItem('motoZapp_cart', JSON.stringify(cartItems))
    }

    if (!loading) {
      saveCartToDatabase()
    }
  }, [cartItems, userId, loading])

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)

      // Ensure shop_id is set (handle both shop_id and shopId)
      const shopId = product.shop_id || product.shopId || 'unknown'

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity, shop_id: shopId }
            : item
        )
      } else {
        // Add new item to cart with shop_id
        return [...prevItems, { ...product, quantity, shop_id: shopId }]
      }
    })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId)
  }

  const getCartItem = (productId) => {
    return cartItems.find((item) => item.id === productId)
  }

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isInCart,
    getCartItem,
    loading,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

