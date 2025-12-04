import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { BookingProvider } from './contexts/BookingContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import EmergencyButton from './components/EmergencyButton'
import ProtectedRoute from './components/ProtectedRoute'

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

  if (user?.needsSetup) {
    return <Navigate to="/profile-setup" replace />
  }

  // Redirect based on role
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (user?.role === 'store_owner') {
    return <Navigate to="/store/dashboard" replace />
  }

  return <Home />
}

function App() {
  return (
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
                <div className="min-h-screen">
                  <ProfileSetup />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute allowSetup={true}>
                <div className="min-h-screen">
                  <ProfileSetup />
                </div>
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
                <ProtectedRoute requiredRole="store_owner">
                  <StoreDashboard />
                </ProtectedRoute>
              </AdminLayout>
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
  )
}

export default App

