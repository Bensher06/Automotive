import { supabase } from '../lib/supabase'

/**
 * Booking Service
 * Handles service booking operations
 */

export const bookingService = {
  /**
   * Get all bookings (with optional filters)
   */
  async getBookings(filters = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          shops (
            id,
            name,
            address,
            phone,
            email
          ),
          profiles!bookings_customer_id_fkey (
            id,
            full_name,
            email,
            phone
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
      console.error('Get bookings error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          shops (
            id,
            name,
            address,
            phone,
            email
          ),
          profiles!bookings_customer_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get booking error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get current user's bookings
   */
  async getMyBookings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      return await this.getBookings({ customerId: user.id })
    } catch (error) {
      console.error('Get my bookings error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get bookings by shop
   */
  async getBookingsByShop(shopId, status = null) {
    const filters = { shopId }
    if (status) filters.status = status
    return await this.getBookings(filters)
  },

  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      const dbData = {
        customer_id: user.id,
        shop_id: bookingData.shopId,
        service_type: bookingData.serviceType,
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes,
        vehicle_brand: bookingData.vehicleBrand,
        vehicle_model: bookingData.vehicleModel,
        vehicle_year: bookingData.vehicleYear,
        status: 'pending',
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Create booking error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Update booking status error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get pending bookings for a shop
   */
  async getPendingBookings(shopId) {
    return await this.getBookingsByShop(shopId, 'pending')
  },

  /**
   * Get confirmed bookings for a shop
   */
  async getConfirmedBookings(shopId) {
    return await this.getBookingsByShop(shopId, 'confirmed')
  },

  /**
   * Get booking history for a shop
   */
  async getBookingHistory(shopId) {
    const result = await this.getBookings({ shopId })
    if (!result.success) return result

    // Filter for completed or cancelled bookings
    const history = result.data.filter(
      booking => booking.status === 'completed' || booking.status === 'cancelled'
    )

    return { success: true, data: history }
  },
}

