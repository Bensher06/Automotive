import { supabase } from '../lib/supabase'

/**
 * Product Service
 * Handles product-related operations
 */

export const productService = {
  /**
   * Get all products (with optional filters)
   */
  async getProducts(filters = {}) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          shops (
            id,
            name,
            status
          )
        `)

      if (filters.shopId) {
        query = query.eq('shop_id', filters.shopId)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Only show products from verified shops
      query = query.eq('shops.status', 'verified')

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get products error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          shops (
            id,
            name,
            status,
            address,
            phone,
            email
          )
        `)
        .eq('id', productId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get product error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get products by shop
   */
  async getProductsByShop(shopId) {
    return await this.getProducts({ shopId })
  },

  /**
   * Create a new product
   */
  async createProduct(productData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      // Verify user owns the shop
      const shopResult = await supabase
        .from('shops')
        .select('id')
        .eq('id', productData.shopId)
        .eq('owner_id', user.id)
        .single()

      if (shopResult.error || !shopResult.data) {
        return { success: false, error: 'Shop not found or unauthorized' }
      }

      const dbData = {
        shop_id: productData.shopId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        image_url: productData.imageUrl || productData.image,
        stock_quantity: productData.stockQuantity || 0,
        payment_modes: Array.isArray(productData.paymentModes) 
          ? productData.paymentModes 
          : [],
      }

      const { data, error } = await supabase
        .from('products')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Create product error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update product
   */
  async updateProduct(productId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      // Verify user owns the product's shop
      const productResult = await supabase
        .from('products')
        .select('shop_id, shops!inner(owner_id)')
        .eq('id', productId)
        .single()

      if (productResult.error || productResult.data.shops.owner_id !== user.id) {
        return { success: false, error: 'Product not found or unauthorized' }
      }

      const dbUpdates = {
        name: updates.name,
        description: updates.description,
        price: updates.price,
        category: updates.category,
        image_url: updates.imageUrl || updates.image,
        stock_quantity: updates.stockQuantity,
        payment_modes: Array.isArray(updates.paymentModes) ? updates.paymentModes : [],
        updated_at: new Date().toISOString(),
      }

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key]
        }
      })

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Update product error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      // Verify user owns the product's shop
      const productResult = await supabase
        .from('products')
        .select('shop_id, shops!inner(owner_id)')
        .eq('id', productId)
        .single()

      if (productResult.error || productResult.data.shops.owner_id !== user.id) {
        return { success: false, error: 'Product not found or unauthorized' }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Delete product error:', error)
      return { success: false, error: error.message }
    }
  },
}

