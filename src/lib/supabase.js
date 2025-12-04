import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Replace these with your actual Supabase project URL and anon key
// You can find these in your Supabase project settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Check if Supabase is properly configured
const isConfigured = supabaseUrl && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'

if (!isConfigured) {
  console.warn('⚠️ Supabase not configured. Please create a .env file with:')
  console.warn('   VITE_SUPABASE_URL=your_supabase_url')
  console.warn('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.warn('The app will run in demo mode without database functionality.')
}

// Create Supabase client with fallback values to prevent crashes
// Use dummy values if not configured so the client can still be created
const safeUrl = isConfigured ? supabaseUrl : 'https://placeholder.supabase.co'
const safeKey = isConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Export a flag to check if Supabase is configured
export const isSupabaseConfigured = isConfigured

