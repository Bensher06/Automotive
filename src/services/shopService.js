import { supabase } from '../lib/supabase'

/**
 * Shop Service
 * Handles shop-related operations
 */

export const shopService = {
  /**
   * Get all shops (with optional filters)
   */
  async getShops(filters = {}) {
    try {
      let query = supabase
        .from('shops')
        .select('*')

      if (filters.status) {
        query = query.eq('status', filters.status)
      } else {
        // Default to verified shops for public access
        query = query.eq('status', 'verified')
      }

      if (filters.ownerId) {
        query = query.eq('owner_id', filters.ownerId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get shops error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get shop by ID
   */
  async getShopById(shopId) {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get shop error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get shops owned by current user
   */
  async getMyShops() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      return await this.getShops({ ownerId: user.id })
    } catch (error) {
      console.error('Get my shops error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Create a new shop
   */
  async createShop(shopData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      const dbData = {
        owner_id: user.id,
        name: shopData.name,
        description: shopData.description || shopData.overview,
        address: shopData.address,
        phone: shopData.phone,
        email: shopData.email || shopData.contactEmail,
        hours: shopData.hours,
        services: Array.isArray(shopData.services) ? shopData.services : [],
        tin: shopData.tin || shopData.taxId,
        image_url: shopData.imageUrl || shopData.image,
        latitude: shopData.latitude,
        longitude: shopData.longitude,
        status: 'pending',
      }

      const { data, error } = await supabase
        .from('shops')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Create shop error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update shop
   */
  async updateShop(shopId, updates) {
    try {
      const dbUpdates = {
        name: updates.name,
        description: updates.description || updates.overview,
        address: updates.address,
        phone: updates.phone,
        email: updates.email || updates.contactEmail,
        hours: updates.hours,
        services: Array.isArray(updates.services) ? updates.services : [],
        tin: updates.tin || updates.taxId,
        image_url: updates.imageUrl || updates.image,
        latitude: updates.latitude,
        longitude: updates.longitude,
        updated_at: new Date().toISOString(),
      }

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key]
        }
      })

      const { data, error } = await supabase
        .from('shops')
        .update(dbUpdates)
        .eq('id', shopId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Update shop error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update shop status (admin only)
   */
  async updateShopStatus(shopId, status) {
    try {
      const { data, error } = await supabase
        .from('shops')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', shopId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Update shop status error:', error)
      return { success: false, error: error.message }
    }
  },
}

