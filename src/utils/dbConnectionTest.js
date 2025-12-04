import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Test database connection
 * Returns connection status and details
 */
export async function testDatabaseConnection() {
  const result = {
    configured: isSupabaseConfigured,
    connected: false,
    error: null,
    details: {},
  }

  if (!isSupabaseConfigured) {
    result.error = 'Supabase not configured. Missing .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    return result
  }

  try {
    // Test 1: Check if we can reach Supabase
    const { data: healthData, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (healthError) {
      // If it's a connection error, database isn't reachable
      if (healthError.message.includes('Failed to fetch') || 
          healthError.message.includes('NetworkError') ||
          healthError.code === 'PGRST116') {
        result.error = 'Cannot reach Supabase. Check your VITE_SUPABASE_URL'
        return result
      }
      // If it's a table/RLS error, connection works but schema might be missing
      if (healthError.code === '42P01' || healthError.message.includes('does not exist')) {
        result.connected = true
        result.error = 'Database connected but tables are missing. Run SUPABASE_SETUP_SQL.sql in Supabase SQL Editor'
        return result
      }
    }

    // Test 2: Try to get session (auth test)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    result.connected = true
    result.details = {
      hasSession: !!session,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
    }

    return result
  } catch (error) {
    result.error = error.message || 'Unknown connection error'
    return result
  }
}

/**
 * Get connection status (synchronous check)
 */
export function getConnectionStatus() {
  return {
    configured: isSupabaseConfigured,
    message: isSupabaseConfigured 
      ? 'Database credentials found' 
      : 'Database not configured - create .env file',
  }
}

