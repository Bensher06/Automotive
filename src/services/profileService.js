import { supabase } from '../lib/supabase'

/**
 * Profile Service
 * Handles user profile operations
 */

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle missing profiles gracefully

      // If no profile exists, that's OK - return success with null data
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      // If profile doesn't exist, return success with null
      if (!data) {
        return { success: true, data: null }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Get profile error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get current user's profile
   * Works with profiles table authentication (doesn't require Supabase Auth)
   */
  async getCurrentProfile(userId = null) {
    try {
      // If userId provided, use it directly
      if (userId) {
        return await this.getProfile(userId)
      }

      // Try to get from localStorage (profiles table auth)
      const storedUser = localStorage.getItem('motoZapp_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        return await this.getProfile(userData.id)
      }

      // Fallback: Try Supabase Auth (for web-created accounts)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          return await this.getProfile(user.id)
        }
      } catch (authError) {
        // Not authenticated via Supabase Auth - that's OK
      }

      return { success: false, error: 'Not authenticated' }
    } catch (error) {
      console.error('Get current profile error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update user profile
   * Works with profiles table authentication (doesn't require Supabase Auth)
   */
  async updateProfile(userId, updates) {
    try {
      // Get userId from parameter, localStorage, or Supabase Auth (fallback)
      let targetUserId = userId
      
      if (!targetUserId) {
        // Try to get from localStorage (profiles table auth)
        const storedUser = localStorage.getItem('motoZapp_user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          targetUserId = userData.id
        } else {
          // Fallback: Try Supabase Auth
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              targetUserId = user.id
            }
          } catch (authError) {
            // Not authenticated via Supabase Auth
          }
        }
      }

      if (!targetUserId) {
        return { success: false, error: 'Not authenticated' }
      }
      
      // Map frontend field names to database column names
      const dbUpdates = {
        // Name fields
        full_name: updates.full_name || updates.name,
        firstName: updates.firstName,
        middleInitial: updates.middleInitial,
        lastName: updates.lastName,
        // Contact
        phone: updates.phone,
        // Address (full combined)
        address: updates.address,
        // Address breakdown
        region: updates.region,
        province: updates.province,
        city: updates.city,
        barangay: updates.barangay,
        street_address: updates.street_address,
        // Vehicle details
        vehicle_brand: updates.vehicle_brand || updates.vehicle?.brand,
        vehicle_model: updates.vehicle_model || updates.vehicle?.model,
        vehicle_year: updates.vehicle_year || (updates.vehicle?.year ? parseInt(updates.vehicle.year) : null),
        profile_image: updates.profileImage,
        needs_setup: updates.needsSetup !== undefined ? updates.needsSetup : false,
        updated_at: new Date().toISOString(),
      }

      // Remove undefined and null values (but keep false and 0)
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined || (dbUpdates[key] === null && key !== 'vehicle_year')) {
          delete dbUpdates[key]
        }
      })

      // Strategy: Always try UPDATE first (safer - won't cause 409 conflicts)
      // UPDATE is idempotent and won't fail if profile doesn't exist (just returns 0 rows)
      let result = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', targetUserId)
        .select()

      // If update succeeded and returned data, we're done
      if (!result.error && result.data && result.data.length > 0) {
        return { success: true, data: result.data[0] }
      }

      // Handle 406 error - this means UPDATE was rejected (likely RLS or format issue)
      // Profile likely exists, so DON'T try INSERT (would cause 409)
      // Instead, try to get the existing profile and return it
      if (result.error) {
        // Check if it's a 406 or other error that suggests profile exists
        const isProfileExistsError = result.error.status === 406 || 
                                    result.error.code === 'PGRST204' ||
                                    result.error.message?.includes('Not Acceptable')
        
        if (isProfileExistsError) {
          // Profile exists but update was blocked - try to fetch it
          const fetchResult = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .maybeSingle()
          
          if (fetchResult.data) {
            // Return existing profile (update failed but profile exists)
            console.warn('Update was blocked, but profile exists:', result.error)
            return { success: true, data: fetchResult.data }
          }
        }
        
        // For other errors, throw them
        throw result.error
      }

      // If update returned 0 rows (profile doesn't exist) and no error, try INSERT
      if (!result.data || result.data.length === 0) {
        // Get email from stored user or updates
        const storedUser = localStorage.getItem('motoZapp_user')
        let userEmail = ''
        let userRole = 'customer'
        
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          userEmail = userData.email || ''
          userRole = userData.role || 'customer'
        } else {
          // Try Supabase Auth as fallback
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              userEmail = user.email || ''
              userRole = user.user_metadata?.role || updates.role || 'customer'
            }
          } catch (authError) {
            // Not authenticated
          }
        }

        // Profile doesn't exist - INSERT with all required fields
        const insertData = {
          id: targetUserId,
          email: userEmail || updates.email || '',
          role: userRole || updates.role || 'customer',
          ...dbUpdates,
        }

        result = await supabase
          .from('profiles')
          .insert(insertData)
          .select()
          .maybeSingle()

        // If insert succeeded, return success
        if (!result.error && result.data) {
          return { success: true, data: result.data }
        }

        // If insert failed with duplicate key (409) - profile was created between operations
        // This means profile exists, so try UPDATE one more time
        if (result.error && (result.error.code === '23505' || 
                            result.error.code === 'PGRST204' ||
                            result.error.message?.includes('duplicate') ||
                            result.error.message?.includes('unique constraint') ||
                            result.error.message?.includes('already exists'))) {
          // Profile exists - retry UPDATE
          result = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', targetUserId)
            .select()
            .maybeSingle()
          
          if (!result.error && result.data) {
            return { success: true, data: result.data }
          }
          
          // If update still fails, return the error
          if (result.error) {
            throw result.error
          }
        }
        
        // If insert failed for other reasons, throw the error
        if (result.error) {
          throw result.error
        }
      }

      // If we get here, there was an error
      if (result.error) {
        throw result.error
      }

      // Fallback: return success even if no data (shouldn't happen, but safe)
      return { success: true, data: null }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update current user's profile
   */
  async updateCurrentProfile(updates) {
    try {
      // Get userId from localStorage or Supabase Auth
      let userId = null
      
      const storedUser = localStorage.getItem('motoZapp_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        userId = userData.id
      } else {
        // Fallback: Try Supabase Auth
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            userId = user.id
          }
        } catch (authError) {
          // Not authenticated via Supabase Auth
        }
      }

      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }

      return await this.updateProfile(userId, updates)
    } catch (error) {
      console.error('Update current profile error:', error)
      return { success: false, error: error.message }
    }
  },
}

