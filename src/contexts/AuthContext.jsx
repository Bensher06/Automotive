import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { profileService } from '../services/profileService'
import { supabase } from '../lib/supabase'

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
        // Check for admin session in localStorage first
        const storedAdmin = localStorage.getItem('motoZapp_admin')
        if (storedAdmin) {
          const adminUser = JSON.parse(storedAdmin)
          if (mounted) {
            setUser(adminUser)
            setLoading(false)
          }
          return
        }

        // Check for user session in localStorage (from profiles table login)
        const storedUser = localStorage.getItem('motoZapp_user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            // Verify user still exists in profiles table
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.id)
              .maybeSingle()
            
            if (profileData && mounted) {
              // Refresh user data from database
              const refreshedUser = {
                id: profileData.id,
                email: profileData.email || userData.email,
                name: profileData.full_name || 
                      (profileData.firstName && profileData.lastName 
                        ? `${profileData.firstName} ${profileData.middleInitial ? profileData.middleInitial + '. ' : ''}${profileData.lastName}`
                        : null) || 
                      userData.name,
                firstName: profileData.firstName,
                middleInitial: profileData.middleInitial,
                lastName: profileData.lastName,
                phone: profileData.phone,
                address: profileData.address,
                region: profileData.region,
                province: profileData.province,
                city: profileData.city,
                barangay: profileData.barangay,
                streetAddress: profileData.street_address,
                role: profileData.role || userData.role,
                needsSetup: profileData.needs_setup || false,
                profileImage: profileData.profile_image || profileData.avatar_url,
                vehicle: profileData.vehicle_brand || profileData.vehicle_model || profileData.vehicle_year
                  ? {
                      brand: profileData.vehicle_brand,
                      model: profileData.vehicle_model,
                      year: profileData.vehicle_year,
                    }
                  : null,
              }
              setUser(refreshedUser)
              localStorage.setItem('motoZapp_user', JSON.stringify(refreshedUser))
              setLoading(false)
              return
            } else {
              // User not found in database, clear session
              localStorage.removeItem('motoZapp_user')
            }
          } catch (error) {
            console.error('Error verifying stored user:', error)
            localStorage.removeItem('motoZapp_user')
          }
        }

        // Fallback: Try Supabase session (for accounts created via web signup)
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
        // Don't crash the app - just set loading to false
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Add a timeout to ensure loading state doesn't hang forever
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    initSession()

    return () => {
      clearTimeout(timeout)
    }

    // Listen for auth state changes
    let subscription = null
    try {
      const authStateResult = authService.onAuthStateChange(async (event, session) => {
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
      subscription = authStateResult?.data?.subscription
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
    }

    return () => {
      mounted = false
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from auth state:', error)
        }
      }
    }
  }, [])

  // Hardcoded admin accounts (local authentication - bypasses Supabase)
  const allowedAdminAccounts = [
    { email: 'evannfrancisco@gmail.com', password: 'francisco2005', name: 'Evann Francisco' },
    { email: 'benh19193@gmail.com', password: 'ben35hassan', name: 'Ben Hassan' },
    { email: 'chanshan04@gmail.com', password: '09354379568', name: 'Chan Shan' },
  ]

  const login = async (email, password, role = 'customer') => {
    try {
      // Special handling for admin accounts - bypass Supabase
      if (role === 'admin') {
        const adminAccount = allowedAdminAccounts.find(
          admin => admin.email === email && admin.password === password
        )
        
        if (adminAccount) {
          // Create local admin session (no Supabase needed)
          const adminUser = {
            id: `admin-${email.replace(/[^a-z0-9]/gi, '-')}`,
            email: adminAccount.email,
            name: adminAccount.name,
            role: 'admin',
            needsSetup: false,
          }
          setUser(adminUser)
          // Store in localStorage for persistence
          localStorage.setItem('motoZapp_admin', JSON.stringify(adminUser))
          return { success: true, user: adminUser }
        } else {
          return { success: false, error: 'Invalid admin credentials. Only authorized administrators can access this portal.' }
        }
      }

      // PRIMARY: Check profiles table for authentication (mobile app compatible)
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle()

        if (!profileError && profileData) {
          // Found account in profiles table - authenticate user
          const userRole = profileData.role || role
          
          // ROLE VALIDATION: Check if user is trying to login with the correct role
          if (userRole && userRole !== role) {
            const roleDisplayNames = {
              'customer': 'Rider',
              'store_owner': 'Shop Owner',
              'admin': 'Administrator'
            }
            const registeredRoleName = roleDisplayNames[userRole] || userRole
            const selectedRoleName = roleDisplayNames[role] || role
            
            return { 
              success: false, 
              error: `This account is registered as "${registeredRoleName}". Please sign in using the "${registeredRoleName}" option instead of "${selectedRoleName}".`
            }
          }

          // Create user object from profile data
          const authenticatedUser = {
            id: profileData.id,
            email: profileData.email || email,
            name: profileData.full_name || 
                  (profileData.firstName && profileData.lastName 
                    ? `${profileData.firstName} ${profileData.middleInitial ? profileData.middleInitial + '. ' : ''}${profileData.lastName}`
                    : null) || 
                  email?.split('@')[0] || 
                  'User',
            firstName: profileData.firstName,
            middleInitial: profileData.middleInitial,
            lastName: profileData.lastName,
            phone: profileData.phone,
            address: profileData.address,
            region: profileData.region,
            province: profileData.province,
            city: profileData.city,
            barangay: profileData.barangay,
            streetAddress: profileData.street_address,
            role: userRole,
            needsSetup: profileData.needs_setup || false,
            profileImage: profileData.profile_image || profileData.avatar_url,
            vehicle: profileData.vehicle_brand || profileData.vehicle_model || profileData.vehicle_year
              ? {
                  brand: profileData.vehicle_brand,
                  model: profileData.vehicle_model,
                  year: profileData.vehicle_year,
                }
              : null,
          }
          
          setUser(authenticatedUser)
          // Store session in localStorage for persistence
          localStorage.setItem('motoZapp_user', JSON.stringify(authenticatedUser))
          
          return { success: true, user: authenticatedUser }
        }
      } catch (profileAuthError) {
        console.error('Error checking profiles table:', profileAuthError)
      }

      // FALLBACK: Try Supabase Auth (for accounts created via web signup)
      const result = await authService.signIn(email, password)
      
      if (result.success && result.user) {
        // Load profile to check the registered role
        try {
          const profileResult = await profileService.getProfile(result.user.id)
          if (profileResult.success && profileResult.data) {
            const userRegisteredRole = profileResult.data.role
            
            // ROLE VALIDATION: Check if user is trying to login with the correct role
            if (userRegisteredRole && userRegisteredRole !== role) {
              // Sign out since role doesn't match
              await authService.signOut()
              
              // Provide helpful error message based on their registered role
              const roleDisplayNames = {
                'customer': 'Rider',
                'store_owner': 'Shop Owner',
                'admin': 'Administrator'
              }
              const registeredRoleName = roleDisplayNames[userRegisteredRole] || userRegisteredRole
              const selectedRoleName = roleDisplayNames[role] || role
              
              return { 
                success: false, 
                error: `This account is registered as "${registeredRoleName}". Please sign in using the "${registeredRoleName}" option instead of "${selectedRoleName}".`
              }
            }
            
            // Role matches, proceed with login
            const transformedUser = transformProfileToUser(result.user, profileResult.data)
            setUser(transformedUser)
            return { success: true, user: transformedUser }
          }
        } catch (profileError) {
          console.warn('Profile load failed, continuing with basic user:', profileError)
        }
        
        // If profile doesn't exist, check user metadata for role
        const userMetadataRole = result.user.user_metadata?.role
        
        // Validate role from metadata if available
        if (userMetadataRole && userMetadataRole !== role) {
          await authService.signOut()
          const roleDisplayNames = {
            'customer': 'Rider',
            'store_owner': 'Shop Owner',
            'admin': 'Administrator'
          }
          const registeredRoleName = roleDisplayNames[userMetadataRole] || userMetadataRole
          const selectedRoleName = roleDisplayNames[role] || role
          
          return { 
            success: false, 
            error: `This account is registered as "${registeredRoleName}". Please sign in using the "${registeredRoleName}" option instead of "${selectedRoleName}".`
          }
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
        // Account created in profiles table - create user session
        const newUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          needsSetup: true,
        }
        
        setUser(newUser)
        // Store in localStorage for persistence
        localStorage.setItem('motoZapp_user', JSON.stringify(newUser))
        
        // Email verification is disabled - proceed directly
        
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
      // Clear all session data from localStorage
      localStorage.removeItem('motoZapp_admin')
      localStorage.removeItem('motoZapp_user')
      
      // Clear Supabase session (if exists)
      await authService.signOut()
      setUser(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if Supabase fails
      localStorage.removeItem('motoZapp_admin')
      localStorage.removeItem('motoZapp_user')
      setUser(null)
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

