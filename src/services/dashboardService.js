import { supabase } from '../lib/supabase'

/**
 * Dashboard Service
 * Handles dashboard data operations for shop owners
 */

export const dashboardService = {
  /**
   * Get dashboard data for a shop
   */
  async getDashboardData(shopId) {
    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('shop_id', shopId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      // If no dashboard data exists, return defaults
      if (!data) {
        return {
          success: true,
          data: {
            sales_current: 0,
            sales_previous: 0,
            profit_current: 0,
            profit_previous: 0,
            mechanics_available: 0,
            mechanics_total: 0,
            products_total: 0,
            profit_margin: 0,
            auto_calculate_profit: false,
            auto_update_sales: false,
            default_sales_period: 7,
          },
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Get dashboard data error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update dashboard data
   */
  async updateDashboardData(shopId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      // Verify user owns the shop
      const shopResult = await supabase
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .eq('owner_id', user.id)
        .single()

      if (shopResult.error || !shopResult.data) {
        return { success: false, error: 'Shop not found or unauthorized' }
      }

      // Check if dashboard data exists
      const existingResult = await supabase
        .from('dashboard_data')
        .select('id')
        .eq('shop_id', shopId)
        .single()

      const dbUpdates = {
        sales_current: updates.sales?.current,
        sales_previous: updates.sales?.previous,
        profit_current: updates.profit?.current,
        profit_previous: updates.profit?.previous,
        mechanics_available: updates.mechanics?.available,
        mechanics_total: updates.mechanics?.total,
        products_total: updates.products?.total,
        profit_margin: updates.settings?.profitMargin,
        auto_calculate_profit: updates.settings?.autoCalculateProfit,
        auto_update_sales: updates.settings?.autoUpdateSales,
        default_sales_period: updates.settings?.defaultSalesPeriod,
        updated_at: new Date().toISOString(),
      }

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key]
        }
      })

      let result
      if (existingResult.data) {
        // Update existing
        result = await supabase
          .from('dashboard_data')
          .update(dbUpdates)
          .eq('shop_id', shopId)
          .select()
          .single()
      } else {
        // Insert new
        result = await supabase
          .from('dashboard_data')
          .insert({
            shop_id: shopId,
            ...dbUpdates,
          })
          .select()
          .single()
      }

      if (result.error) throw result.error
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Update dashboard data error:', error)
      return { success: false, error: error.message }
    }
  },
}

