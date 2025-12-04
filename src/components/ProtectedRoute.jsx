import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, allowSetup = false, requiredRole = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user's actual role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user.role === 'store_owner') {
      return <Navigate to="/store/dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  // Check if user needs profile setup (unless this route allows setup)
  if (user.needsSetup && !allowSetup) {
    return <Navigate to="/profile-setup" replace />
  }

  return children
}

export default ProtectedRoute

