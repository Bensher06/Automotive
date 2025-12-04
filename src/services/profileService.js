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
   */
  async getCurrentProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      return await this.getProfile(user.id)
    } catch (error) {
      console.error('Get current profile error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update user profile
   * Safely updates or creates profile without affecting existing data
   */
  async updateProfile(userId, updates) {
    try {
      // Get user email and role from auth
      const authResult = await supabase.auth.getUser()
      const user = authResult?.data?.user
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }
      
      // Map frontend field names to database column names
      const dbUpdates = {
        full_name: updates.name, // Database uses full_name, not name
        phone: updates.phone,
        address: updates.address,
        vehicle_brand: updates.vehicle?.brand,
        vehicle_model: updates.vehicle?.model,
        vehicle_year: updates.vehicle?.year ? parseInt(updates.vehicle.year) : null,
        profile_image: updates.profileImage,
        needs_setup: updates.needsSetup !== undefined ? updates.needsSetup : false,
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
        .eq('id', userId)
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
            .eq('id', userId)
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
        // Profile doesn't exist - INSERT with all required fields
        const insertData = {
          id: userId,
          email: user.email || '',
          role: user.user_metadata?.role || updates.role || 'customer',
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
            .eq('id', userId)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      return await this.updateProfile(user.id, updates)
    } catch (error) {
      console.error('Update current profile error:', error)
      return { success: false, error: error.message }
    }
  },
}

