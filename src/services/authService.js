import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Authentication Service
 * Handles all authentication-related operations with Supabase
 */

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(email, password, name, role = 'customer') {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      })

      if (error) throw error

      // Profile is created automatically via trigger
      // Wait a moment for the trigger to complete, then try to update if needed
      if (data.user) {
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Try to update the profile with the correct name and role
        // This is safe because the trigger should have created it
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: name, // Use full_name instead of name
            role,
            needs_setup: true,
          })
          .eq('id', data.user.id)

        // If update fails, it might be because profile doesn't exist yet
        // or RLS is blocking. Log but don't fail signup
        if (profileError) {
          console.warn('Profile update warning (this is usually OK):', profileError.message)
          // Try to insert if update failed (profile might not exist)
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: name, // Use full_name instead of name
              role,
              needs_setup: true,
            })
          
          if (insertError) {
            console.warn('Profile insert also failed (trigger should handle this):', insertError.message)
          }
        }
      }

      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
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
          throw new Error('Please check your email and confirm your account before logging in. If you didn\'t receive the confirmation email, you may need to disable email confirmation in Supabase settings for development.')
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

