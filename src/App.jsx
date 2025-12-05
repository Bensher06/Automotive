import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { BookingProvider } from './contexts/BookingContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import EmergencyButton from './components/EmergencyButton'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Pages
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MechanicFinder from './pages/MechanicFinder'
import MechanicTracking from './pages/MechanicTracking'
import ServiceBooking from './pages/ServiceBooking'
import Dashboard from './pages/Dashboard'
import ShopDetails from './pages/ShopDetails'
import AdminDashboard from './pages/AdminDashboard'
import StoreDashboard from './pages/StoreDashboard'
import ShopVerification from './pages/ShopVerification'
import WaitingApproval from './pages/WaitingApproval'
import CustomerProfile from './pages/CustomerProfile'
import { supabase } from './lib/supabase'
import { useState, useEffect } from 'react'

// Layout wrapper for pages that need navbar/footer
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <EmergencyButton />
    </div>
  )
}

// Minimal layout for admin pages (no customer navigation, no emergency button)
const AdminLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">{children}</main>
    </div>
  )
}

// Component to check shop owner's shop status
const ShopOwnerRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [shopStatus, setShopStatus] = useState(null)
  const [shopExists, setShopExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const checkShopStatus = async () => {
      if (!user || user.role !== 'store_owner') {
        setLoading(false)
        setChecked(true)
        return
      }

      console.log('ShopOwnerRoute: Checking shop for user:', user.id, user.email)

      try {
        const { data, error } = await supabase
          .from('shops')
          .select('status')
          .eq('owner_id', user.id)
          .maybeSingle() // Use maybeSingle instead of single to avoid error when no rows

        if (error) {
          console.error('Error checking shop status:', error)
        }

        console.log('ShopOwnerRoute: Shop data:', data)

        // Check if shop exists (verification submitted)
        if (data) {
          setShopExists(true)
          setShopStatus(data.status)
          console.log('ShopOwnerRoute: Shop exists with status:', data.status)
        } else {
          setShopExists(false)
          setShopStatus(null)
          console.log('ShopOwnerRoute: No shop found for this user')
        }
      } catch (err) {
        console.error('ShopOwnerRoute Error:', err)
      } finally {
        setLoading(false)
        setChecked(true)
      }
    }

    if (!authLoading && user) {
      checkShopStatus()
    } else if (!authLoading && !user) {
      setLoading(false)
      setChecked(true)
    }
  }, [user, authLoading])

  if (authLoading || loading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // LOGIC: Check if shop owner already submitted verification
  console.log('ShopOwnerRoute: Making decision - shopExists:', shopExists, 'shopStatus:', shopStatus)
  
  // 1. No shop submitted yet → go to shop verification page
  if (!shopExists) {
    console.log('ShopOwnerRoute: Redirecting to /shop-verification')
    return <Navigate to="/shop-verification" replace />
  }

  // 2. Shop submitted but NOT verified yet → go to waiting approval page
  if (shopStatus !== 'verified') {
    console.log('ShopOwnerRoute: Redirecting to /waiting-approval')
    return <Navigate to="/waiting-approval" replace />
  }

  // 3. Shop is verified → show store dashboard
  console.log('ShopOwnerRoute: Shop verified, showing dashboard')
  return children
}

// Redirect shop owners away from profile setup - they go through shop verification flow
const ProfileSetupRedirect = () => {
  const { user } = useAuth()
  
  // Shop owners skip profile setup - redirect to store dashboard (ShopOwnerRoute handles the logic)
  if (user?.role === 'store_owner') {
    return <Navigate to="/store/dashboard" replace />
  }
  
  return (
    <div className="min-h-screen">
      <ProfileSetup />
    </div>
  )
}

// Redirect based on auth state and role
const HomeRedirect = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Shop owners skip profile setup and go directly to shop verification flow
  if (user?.role === 'store_owner') {
    return <Navigate to="/store/dashboard" replace />
  }

  // Other users need profile setup
  if (user?.needsSetup) {
    return <Navigate to="/profile-setup" replace />
  }

  // Redirect based on role
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Home />
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <BookingProvider>
              <Router>
                <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <div className="min-h-screen">
                <Login />
              </div>
            }
          />
          <Route
            path="/signup"
            element={
              <div className="min-h-screen">
                <SignUp />
              </div>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute allowSetup={true}>
                <ProfileSetupRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute allowSetup={true}>
                <ProfileSetupRedirect />
              </ProtectedRoute>
            }
          />

          {/* Layout Routes */}
          <Route
            path="/"
            element={
              <Layout>
                <HomeRedirect />
              </Layout>
            }
          />
          <Route
            path="/marketplace"
            element={
              <Layout>
                <Marketplace />
              </Layout>
            }
          />
          <Route
            path="/product/:id"
            element={
              <Layout>
                <ProductDetails />
              </Layout>
            }
          />
          <Route
            path="/shop/:id"
            element={
              <Layout>
                <ShopDetails />
              </Layout>
            }
          />
          <Route
            path="/mechanic-finder"
            element={
              <Layout>
                <MechanicFinder />
              </Layout>
            }
          />
          <Route
            path="/mechanic-tracking/:mechanicId"
            element={
              <Layout>
                <ProtectedRoute>
                  <MechanicTracking />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/service-booking"
            element={
              <Layout>
                <ProtectedRoute>
                  <ServiceBooking />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/store/dashboard"
            element={
              <AdminLayout>
                <ProtectedRoute requiredRole="store_owner" allowSetup={true}>
                  <ShopOwnerRoute>
                    <StoreDashboard />
                  </ShopOwnerRoute>
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/shop-verification"
            element={
              <ProtectedRoute requiredRole="store_owner" allowSetup={true}>
                <div className="min-h-screen">
                  <ShopVerification />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiting-approval"
            element={
              <ProtectedRoute requiredRole="store_owner" allowSetup={true}>
                <div className="min-h-screen">
                  <WaitingApproval />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <Layout>
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/cart"
            element={
              <Layout>
                <Cart />
              </Layout>
            }
          />
          <Route
            path="/checkout"
            element={
              <Layout>
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </BookingProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

