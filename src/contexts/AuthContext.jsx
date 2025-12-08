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

      // PRIMARY: Check profiles table for authentication
      // STRICT ROLE VALIDATION - Users can only login with the role they registered with
      // Query directly for the specific email + role combination to handle duplicate emails
      try {
        // Map role names: 'customer' = 'customer', 'store_owner' = 'store_owner'
        const dbRole = role === 'customer' ? 'customer' : 
                      role === 'store_owner' ? 'store_owner' : 
                      role === 'admin' ? 'admin' : role
        
        // Query directly for profile with this email AND role (handles duplicate emails)
        // Use .limit(1) first, then check if we got exactly one result
        console.log(`[LOGIN] Querying profiles table for: email=${email}, role=${dbRole}`)
        
        const { data: profilesList, error: listError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .eq('role', dbRole)
          .limit(2) // Get up to 2 to detect duplicates
        
        console.log(`[LOGIN] Query result:`, { 
          found: profilesList?.length || 0, 
          error: listError?.message || null 
        })
        
        let profileData = null
        let profileError = null
        
        if (listError) {
          console.error('[LOGIN] Query error:', listError)
          profileError = listError
        } else if (profilesList && profilesList.length === 1) {
          // Exactly one profile found - perfect
          console.log('[LOGIN] Profile found successfully')
          profileData = profilesList[0]
        } else if (profilesList && profilesList.length > 1) {
          // Multiple profiles with same email+role - data integrity issue
          console.error('[LOGIN] Multiple profiles found with same email+role')
          profileError = { message: 'Multiple profiles found with same email and role' }
        } else {
          // No profiles found - check if email exists with different role
          console.log('[LOGIN] No profile found with this email and role')
          profileData = null
          
          // Check if email exists with different role(s)
          const { data: allProfiles, error: allProfilesError } = await supabase
            .from('profiles')
            .select('role')
            .eq('email', email)
          
          if (!allProfilesError && allProfiles && allProfiles.length > 0) {
            const existingRoles = allProfiles.map(p => p.role)
            const roleDisplayNames = {
              'customer': 'Motorist',
              'store_owner': 'Shop Owner',
              'admin': 'Administrator'
            }
            
            // Email exists but with different role(s)
            const registeredRoleName = roleDisplayNames[existingRoles[0]] || existingRoles[0]
            const selectedRoleName = roleDisplayNames[role] || role
            
            return {
              success: false,
              error: `This account is registered as "${registeredRoleName}". Please sign in using the "${registeredRoleName}" option instead of "${selectedRoleName}".`
            }
          }
        }
        
        if (profileError) {
          console.log('Error querying profiles:', profileError.message)
          
          // If error is due to multiple rows, check what roles exist for this email
          if (profileError.message.includes('multiple') || profileError.message.includes('no rows')) {
            // Try to get all profiles with this email to check roles
            const { data: allProfiles, error: allProfilesError } = await supabase
              .from('profiles')
              .select('role')
              .eq('email', email)
            
            if (!allProfilesError && allProfiles && allProfiles.length > 0) {
              const existingRoles = allProfiles.map(p => p.role)
              const roleDisplayNames = {
                'customer': 'Motorist',
                'store_owner': 'Shop Owner',
                'admin': 'Administrator'
              }
              
              // If email exists but with different role(s)
              if (!existingRoles.includes(dbRole)) {
                const registeredRoleName = roleDisplayNames[existingRoles[0]] || existingRoles[0]
                const selectedRoleName = roleDisplayNames[role] || role
                
                return {
                  success: false,
                  error: `This account is registered as "${registeredRoleName}". Please sign in using the "${registeredRoleName}" option instead of "${selectedRoleName}".`
                }
              }
              
              // If role exists but query failed, there might be duplicate entries with same email+role
              // This shouldn't happen, but if it does, return error
              return {
                success: false,
                error: 'Multiple accounts found with this email and role. Please contact support.'
              }
            }
          }
          
          // For any other query error, return error (don't fall back to Supabase Auth)
          return {
            success: false,
            error: 'Unable to verify account. Please try again or contact support.'
          }
        }
        
        if (profileData) {
          console.log(`${dbRole} found in profiles table`)
          
          // Check password
          const storedPassword = profileData.password
          
          // If no password stored
          if (!storedPassword || storedPassword === '') {
            return {
              success: false,
              error: 'Your account exists but no password is set. Please contact support.'
            }
          }
          
          // Check if password matches (plain text comparison)
          if (storedPassword !== password) {
            return { 
              success: false, 
              error: 'Incorrect password. Please try again.' 
            }
          }
          
          // Password matched - authenticate user

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
            role: profileData.role || dbRole, // Use actual role from database
            needsSetup: profileData.needs_setup || false,
            profileImage: profileData.profile_image || profileData.avatar_url,
            vehicle: profileData.vehicle_brand || profileData.vehicle_model || profileData.vehicle_year
              ? {
                  brand: profileData.vehicle_brand,
                  model: profileData.vehicle_model,
                  year: profileData.vehicle_year,
                }
              : null,
            // Store owner specific fields (from profiles table)
            shopName: profileData.shop_name || null,
            shopImage: profileData.shop_image || null,
            shopDescription: profileData.shop_description || null,
            totalReviews: profileData.total_reviews || 0,
          }
          
          setUser(authenticatedUser)
          // Store session in localStorage for persistence
          localStorage.setItem('motoZapp_user', JSON.stringify(authenticatedUser))
          
          return { success: true, user: authenticatedUser }
        } else {
          // No account found with this email and role
          const roleDisplayNames = {
            'customer': 'Motorist',
            'store_owner': 'Shop Owner',
            'admin': 'Administrator'
          }
          const selectedRoleName = roleDisplayNames[role] || role
          
          return {
            success: false,
            error: `No ${selectedRoleName} account found with this email. Please sign up first or check if you registered with a different account type.`
          }
        }
      } catch (profileAuthError) {
        console.error('Error checking profiles table:', profileAuthError)
        return {
          success: false,
          error: 'Unable to connect to the server. Please try again.'
        }
      }

      // NO FALLBACK TO SUPABASE AUTH
      // All authentication must come from profiles table only
      // If profiles table query failed, return error (don't try other tables)
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


