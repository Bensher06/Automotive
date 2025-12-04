import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { profileService } from '../services/profileService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Helper function to transform profile data to user format
  const transformProfileToUser = (authUser, profile) => {
    if (!authUser || !profile) return null

    return {
      id: authUser.id,
      email: authUser.email || profile.email,
      name: profile.full_name || profile.name || authUser.email?.split('@')[0] || 'User', // Use full_name from database
      phone: profile.phone,
      address: profile.address,
      role: profile.role,
      needsSetup: profile.needs_setup,
      profileImage: profile.profile_image,
      vehicle: profile.vehicle_brand || profile.vehicle_model || profile.vehicle_year
        ? {
            brand: profile.vehicle_brand,
            model: profile.vehicle_model,
            year: profile.vehicle_year,
          }
        : null,
    }
  }

  // Load user on mount and listen for auth changes
  useEffect(() => {
    let mounted = true

    // Get initial session
    const initSession = async () => {
      try {
        const sessionResult = await authService.getSession()
        if (sessionResult.success && sessionResult.session) {
          const authUser = sessionResult.session.user
          const profileResult = await profileService.getProfile(authUser.id)
          
          if (profileResult.success && mounted) {
            // If profile exists, transform it; otherwise create basic user
            if (profileResult.data) {
              const transformedUser = transformProfileToUser(authUser, profileResult.data)
              setUser(transformedUser)
            } else {
              // Profile doesn't exist yet - create basic user from auth data
              const basicUser = {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                role: authUser.user_metadata?.role || 'customer',
                needsSetup: true,
              }
              setUser(basicUser)
            }
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initSession()

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session) {
        try {
          const profileResult = await profileService.getProfile(session.user.id)
          if (profileResult.success) {
            if (profileResult.data) {
              const transformedUser = transformProfileToUser(session.user, profileResult.data)
              setUser(transformedUser)
            } else {
              // Profile doesn't exist - create basic user
              const basicUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                role: session.user.user_metadata?.role || 'customer',
                needsSetup: true,
              }
              setUser(basicUser)
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password, role = 'customer') => {
    try {
      const result = await authService.signIn(email, password)
      
      if (result.success && result.user) {
        // Try to load profile, but don't fail login if profile doesn't exist
        try {
          const profileResult = await profileService.getProfile(result.user.id)
          if (profileResult.success && profileResult.data) {
            const transformedUser = transformProfileToUser(result.user, profileResult.data)
            setUser(transformedUser)
            return { success: true, user: transformedUser }
          }
        } catch (profileError) {
          console.warn('Profile load failed, continuing with basic user:', profileError)
        }
        
        // If profile doesn't exist or failed to load, create basic user
        // Get role from user metadata if available
        const userRole = result.user.user_metadata?.role || role
        const userName = result.user.user_metadata?.name || result.user.email?.split('@')[0] || 'User'
        
        const basicUser = {
          id: result.user.id,
          email: result.user.email,
          name: userName,
          role: userRole,
          needsSetup: true,
        }
        setUser(basicUser)
        return { success: true, user: basicUser }
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  const signup = async (email, password, name, role = 'customer') => {
    try {
      const result = await authService.signUp(email, password, name, role)
      
      if (result.success && result.user) {
        // Profile is created via trigger, but we need to wait for it
        // Retry a few times to get the profile (trigger might take a moment)
        let profileResult = null
        let retries = 0
        const maxRetries = 5
        
        while (retries < maxRetries && !profileResult?.success) {
          await new Promise(resolve => setTimeout(resolve, 300)) // Wait 300ms
          profileResult = await profileService.getProfile(result.user.id)
          retries++
        }
        
        if (profileResult?.success) {
          const transformedUser = transformProfileToUser(result.user, profileResult.data)
          setUser(transformedUser)
          return { success: true, user: transformedUser }
        } else {
          // Profile might not be created yet, but signup was successful
          // User can still proceed to profile setup
          return { success: true, user: result.user }
        }
      }
      
      return result
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      if (!user) return

      const result = await profileService.updateCurrentProfile(profileData)
      
      if (result.success) {
        // Reload profile to get updated data
        const profileResult = await profileService.getCurrentProfile()
        if (profileResult.success && profileResult.data) {
          const authUserResult = await authService.getCurrentUser()
          if (authUserResult.success && authUserResult.user) {
            const transformedUser = transformProfileToUser(authUserResult.user, profileResult.data)
            setUser(transformedUser)
          }
        }
      }
      
      return result
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await authService.signOut()
      setUser(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    login,
    signup,
    updateProfile,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

