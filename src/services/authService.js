import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Authentication Service
 * Handles all authentication-related operations with Supabase
 * Compatible with MotoZapp Mobile App - All profiles stored in profiles table
 */

export const authService = {
  /**
   * Sign up a new user
   * Creates profile directly in profiles table (primary source)
   * Also creates in Supabase Auth for compatibility, but profiles table is the source of truth
   */
  async signUp(email, password, name, role = 'customer') {
    try {
      // Generate UUID for new user (matches Supabase format)
      const userId = crypto.randomUUID()
      
      // Parse name into components if it's a full name
      let firstName = name
      let middleInitial = null
      let lastName = null
      
      const nameParts = name.trim().split(/\s+/)
      if (nameParts.length > 1) {
        firstName = nameParts[0]
        if (nameParts.length === 3 && nameParts[1].length === 1) {
          middleInitial = nameParts[1]
          lastName = nameParts[2]
        } else {
          lastName = nameParts.slice(1).join(' ')
        }
      }

      // Profile data structure compatible with mobile app
      const profileData = {
        id: userId,
        email: email,
        full_name: name,
        firstName: firstName,
        middleInitial: middleInitial,
        lastName: lastName,
        role: role, // 'customer', 'store_owner', or 'mechanic'
        password: password, // Store password in profiles table (primary auth source)
        phone: null,
        vehicle: null,
        specialty: null,
        experience: null,
        availability: role === 'mechanic' ? true : null,
        rating: role === 'mechanic' ? 0 : null,
        total_jobs: role === 'mechanic' ? 0 : null,
        is_online: false,
        latitude: null,
        longitude: null,
        last_online_at: null,
        address: null,
        region: null,
        province: null,
        city: null,
        barangay: null,
        street_address: null,
        vehicle_brand: null,
        vehicle_model: null,
        vehicle_year: null,
        needs_setup: true,
        avatar_url: null,
        profile_image: null,
        // Shop owner specific fields
        shop_name: null,
        shop_image: null,
        shop_description: null,
        total_reviews: role === 'store_owner' ? 0 : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Check if email already exists in profiles table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle()

      if (existingProfile) {
        return { 
          success: false, 
          error: 'An account with this email already exists. Please try logging in instead.' 
        }
      }

      // Insert profile directly into profiles table (PRIMARY SOURCE)
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select() // Select to verify what was inserted

      if (insertError) {
        console.error('Profile insert error:', insertError)
        // Log the full error details
        console.error('Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        })
        return { 
          success: false, 
          error: insertError.message || 'Failed to create account. Please try again.' 
        }
      }

      // Verify password was saved (for debugging)
      if (insertError === null) {
        const { data: verifyData } = await supabase
          .from('profiles')
          .select('id, email, password, role')
          .eq('id', userId)
          .single()
        
        if (verifyData) {
          console.log('Profile created successfully. Password saved:', verifyData.password ? 'YES' : 'NO')
        }
      }

      // OPTIONAL: Also create in Supabase Auth for compatibility (but profiles table is primary)
      try {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
            },
          },
        })
        // Don't fail if this fails - profiles table is the source of truth
      } catch (authError) {
        console.warn('Supabase Auth signup failed (this is OK, profiles table is primary):', authError.message)
      }

      // Return success with user data from profiles table
      return { 
        success: true, 
        user: {
          id: userId,
          email: email,
          name: name,
          role: role,
        },
        session: null, // No Supabase session since we're using profiles table
        needsEmailConfirmation: false
      }
    } catch (error) {
      console.error('Sign up error:', error)
      
      // Provide helpful error messages
      let errorMessage = error.message || 'Failed to create account. Please try again.'
      if (error.message?.includes('User already registered') || error.message?.includes('duplicate')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.'
      }
      
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Sign in an existing user
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle email confirmation error specifically
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and confirm your account before logging in. If you didn\'t receive the confirmation email, please contact support.')
        }
        throw error
      }

      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Sign in error:', error)
      // Provide user-friendly error messages
      let errorMessage = 'Account not found or incorrect email/password. If you haven\'t registered yet, please sign up first.'
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('User not found')) {
          errorMessage = 'Account not found or incorrect email/password. If you haven\'t registered yet, please sign up first.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = error.message
        } else {
          errorMessage = error.message
        }
      }
      
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get the current session
   */
  async getSession() {
    if (!isSupabaseConfigured) {
      return { success: true, session: null }
    }
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { success: true, session }
    } catch (error) {
      console.error('Get session error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get the current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { success: true, user }
    } catch (error) {
      console.error('Get current user error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured) {
      // Return a mock subscription object if Supabase isn't configured
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }
    }
    try {
      return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session)
      })
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }
    }
  },
}

