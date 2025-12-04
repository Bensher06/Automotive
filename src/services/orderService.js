import { supabase } from '../lib/supabase'

/**
 * Order Service
 * Handles order-related operations
 */

export const orderService = {
  /**
   * Get all orders (with optional filters)
   */
  async getOrders(filters = {}) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              image_url,
              price
            )
          ),
          shops (
            id,
            name
          ),
          profiles!orders_customer_id_fkey (
            id,
            name,
            email
          )
        `)

      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }

      if (filters.shopId) {
        query = query.eq('shop_id', filters.shopId)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get orders error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              image_url,
              price
            )
          ),
          shops (
            id,
            name,
            address,
            phone,
            email
          ),
          profiles!orders_customer_id_fkey (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get order error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get current user's orders
   */
  async getMyOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      return await this.getOrders({ customerId: user.id })
    } catch (error) {
      console.error('Get my orders error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Create a new order
   */
  async createOrder(orderData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          shop_id: orderData.shopId,
          total_amount: orderData.totalAmount,
          payment_method: orderData.paymentMethod,
          shipping_address: orderData.shippingAddress,
          contact_number: orderData.contactNumber,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.productId || item.id,
          quantity: item.quantity,
          price: item.price,
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError
      }

      return { success: true, data: order }
    } catch (error) {
      console.error('Create order error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Update order status error:', error)
      return { success: false, error: error.message }
    }
  },
}

