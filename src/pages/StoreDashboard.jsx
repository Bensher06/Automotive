import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBookings } from '../contexts/BookingContext'
import { useNotifications } from '../contexts/NotificationContext'
import {
  ShoppingBag, Package, TrendingUp, Calendar, DollarSign, Users,
  CheckCircle, XCircle, Clock, Bell, LayoutDashboard, Settings,
  BarChart3, FileText, Wrench, MapPin, Phone, User, LogOut, Search,
  Edit2, Plus, Download, Upload, RotateCcw, AlertTriangle, X, Check, Save, Store
} from 'lucide-react'
import Chart from 'chart.js/auto'

const StoreDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { getPendingBookings, getConfirmedBookings, getBookingHistory, updateBookingStatus } = useBookings()
  const { addNotification } = useNotifications()
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedShopId, setSelectedShopId] = useState(null)

  // Dashboard data state - TODO: Fetch from API
  const [dashboardData, setDashboardData] = useState({
    sales: { current: 0, previous: 0 }, // TODO: Fetch from API
    profit: { current: 0, previous: 0 }, // TODO: Fetch from API
    mechanics: { available: 0, total: 0 }, // TODO: Fetch from API
    products: { total: 0 }, // TODO: Fetch from API
    transactions: [], // TODO: Fetch from API
    salesHistory: {
      7: { labels: [], data: [] }, // TODO: Fetch from API
      30: { labels: [], data: [] }, // TODO: Fetch from API
      90: { labels: [], data: [] } // TODO: Fetch from API
    },
    settings: { profitMargin: 0, autoCalculateProfit: true, autoUpdateSales: true, defaultSalesPeriod: 7 } // TODO: Fetch from API
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('storeDashboardData')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setDashboardData(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.warn('Failed to load saved data:', e)
      }
    }
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('storeDashboardData', JSON.stringify(dashboardData))
  }, [dashboardData])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get shops owned by this store owner
  const ownedShops = [] // TODO: Fetch from API

  // Use first shop if available, or allow selection
  useEffect(() => {
    if (ownedShops.length > 0 && !selectedShopId) {
      setSelectedShopId(ownedShops[0].id)
    }
  }, [ownedShops, selectedShopId])

  const pendingBookings = selectedShopId ? getPendingBookings(selectedShopId) : []
  const confirmedBookings = selectedShopId ? getConfirmedBookings(selectedShopId) : []
  const bookingHistory = selectedShopId ? getBookingHistory(selectedShopId) : []

  const handleApproveBooking = (bookingId, booking) => {
    updateBookingStatus(bookingId, 'confirmed', user.id)
    addNotification({
      type: 'service',
      message: `Your booking for ${booking.serviceType} at ${booking.shopName} on ${booking.date} at ${booking.time} has been approved!`,
    })
    alert(`Booking approved! ${booking.customerName} has been notified.`)
  }

  const handleRejectBooking = (bookingId, booking) => {
    if (window.confirm(`Are you sure you want to reject ${booking.customerName}'s booking for ${booking.serviceType}?`)) {
      updateBookingStatus(bookingId, 'cancelled', user.id)
      addNotification({
        type: 'service',
        message: `Your booking request for ${booking.serviceType} at ${booking.shopName} on ${booking.date} at ${booking.time} has been declined.`,
      })
      alert(`Booking rejected. ${booking.customerName} has been notified.`)
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Shop Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const stats = [
    {
      label: 'Sales',
      value: `₱${dashboardData.sales.current.toLocaleString()}`,
      badge: `${calculatePercentage(dashboardData.sales.current, dashboardData.sales.previous) >= 0 ? '+' : ''}${calculatePercentage(dashboardData.sales.current, dashboardData.sales.previous)}%`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      textColor: 'text-white'
    },
    {
      label: 'Profit',
      value: `₱${dashboardData.profit.current.toLocaleString()}`,
      badge: `${calculatePercentage(dashboardData.profit.current, dashboardData.profit.previous) >= 0 ? '+' : ''}${calculatePercentage(dashboardData.profit.current, dashboardData.profit.previous)}%`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-white'
    },
    {
      label: 'Mechanics',
      value: `${dashboardData.mechanics.available}/${dashboardData.mechanics.total}`,
      badge: 'Available',
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-white'
    },
    {
      label: 'Products',
      value: dashboardData.products.total.toString(),
      icon: Package,
      color: 'bg-amber-500',
      textColor: 'text-white'
    },
  ]

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView
          stats={stats}
          pendingBookings={pendingBookings}
          confirmedBookings={confirmedBookings}
          dashboardData={dashboardData}
          setDashboardData={setDashboardData}
        />
      case 'bookings':
        return <BookingsView
          pendingBookings={pendingBookings}
          confirmedBookings={confirmedBookings}
          bookingHistory={bookingHistory}
          onApprove={handleApproveBooking}
          onReject={handleRejectBooking}
        />
      case 'products':
        return <ProductsView dashboardData={dashboardData} setDashboardData={setDashboardData} />
      case 'analytics':
        return <AnalyticsView dashboardData={dashboardData} />
      case 'profile':
        return <ProfileView selectedShopId={selectedShopId} ownedShops={ownedShops} setSelectedShopId={setSelectedShopId} />
      case 'settings':
        return <SettingsView dashboardData={dashboardData} setDashboardData={setDashboardData} />
      default:
        return <DashboardView
          stats={stats}
          pendingBookings={pendingBookings}
          confirmedBookings={confirmedBookings}
          dashboardData={dashboardData}
          setDashboardData={setDashboardData}
        />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div>
              <div className="font-bold text-gray-900">MotoZapp</div>
              <div className="text-xs text-gray-500">Store Owner</div>
            </div>
          </div>
        </div>
        <nav className="p-2">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                  currentView === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg mt-4 text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.name || 'Store Owner'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-semibold">Store Owner</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {renderView()}
        </main>
      </div>
    </div>
  )
}

// Dashboard View Component
const DashboardView = ({ stats, pendingBookings, confirmedBookings, dashboardData, setDashboardData }) => {
  const salesChartRef = useRef(null)
  const productsChartRef = useRef(null)
  const [salesPeriod, setSalesPeriod] = useState(7)

  useEffect(() => {
    if (!salesChartRef.current) return

    const ctx = salesChartRef.current.getContext('2d')
    const chartData = dashboardData.salesHistory[salesPeriod] || dashboardData.salesHistory[7]

    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
    gradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)')
    gradient.addColorStop(1, 'rgba(30, 58, 138, 0)')

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Sales',
          data: chartData.data,
          backgroundColor: gradient,
          borderColor: '#1e3a8a',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#1e3a8a',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { drawBorder: false, color: '#f0f0f0' } },
          x: { grid: { display: false } }
        }
      }
    })

    return () => chart.destroy()
  }, [salesPeriod, dashboardData.salesHistory])

  useEffect(() => {
    if (!productsChartRef.current) return

    // TODO: Fetch products distribution data from API
    const ctx = productsChartRef.current.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [], // TODO: Fetch from API
        datasets: [{
          data: [], // TODO: Fetch from API
          backgroundColor: ['#1e3a8a', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
      }
    })

    return () => chart.destroy()
  }, [])

  const formatDate = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{stat.label}</p>
                {stat.badge && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    stat.badge.includes('+') || stat.badge === 'Available'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className={`${stat.color} ${stat.textColor} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
            <select
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="h-64">
            <canvas ref={salesChartRef}></canvas>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Products Distribution</h2>
          <div className="h-64">
            <canvas ref={productsChartRef}></canvas>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 text-amber-500 mr-2" />
            Pending Bookings
          </h2>
          <div className="space-y-3">
            {pendingBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pending bookings</div>
            ) : (
              pendingBookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{booking.serviceType}</p>
                    <p className="text-xs text-gray-600">{booking.customerName} • {booking.date} at {booking.time}</p>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">Pending</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 text-blue-500 mr-2" />
              Recent Transactions
            </h2>
            <button className="text-primary hover:text-primary-dark">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {dashboardData.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent transactions</div>
            ) : (
              dashboardData.transactions.slice(0, 5).map(transaction => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.name}</p>
                    <p className="text-xs text-gray-600">{formatDate(transaction.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">₱{transaction.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Bookings View Component (unchanged from before)
const BookingsView = ({ pendingBookings, confirmedBookings, bookingHistory, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState('pending')

  const formatDateTime = (date, time) => {
    const dateTime = new Date(`${date}T${time}`)
    return {
      date: dateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: dateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-1 flex space-x-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Pending Requests</span>
            {pendingBookings.length > 0 && (
              <span className="bg-white text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingBookings.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'confirmed'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Upcoming Schedule</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>History</span>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Booking Requests</h2>
            {pendingBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No pending booking requests</p>
              </div>
            ) : (
              pendingBookings.map(booking => {
                const { date: formattedDate, time: formattedTime } = formatDateTime(booking.date, booking.time)
                return (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{booking.serviceType}</h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{booking.customerName}</span>
                              </div>
                              {booking.customerPhone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{booking.customerPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-15 space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate} at {formattedTime}</span>
                          </div>
                          {booking.notes && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <span className="font-medium">Notes: </span>
                              {booking.notes}
                            </div>
                          )}
                          {booking.vehicle && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Vehicle: </span>
                              {booking.vehicle.brand} {booking.vehicle.model} ({booking.vehicle.year})
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => onApprove(booking.id, booking)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onReject(booking.id, booking)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'confirmed' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Confirmed Bookings</h2>
            {confirmedBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No upcoming confirmed bookings</p>
              </div>
            ) : (
              confirmedBookings.map(booking => {
                const { date: formattedDate, time: formattedTime } = formatDateTime(booking.date, booking.time)
                return (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{booking.serviceType}</h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{booking.customerName}</span>
                              </div>
                              {booking.customerPhone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{booking.customerPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-15 space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate} at {formattedTime}</span>
                          </div>
                          {booking.notes && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <span className="font-medium">Notes: </span>
                              {booking.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking History</h2>
            {bookingHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No booking history</p>
              </div>
            ) : (
              bookingHistory.map(booking => {
                const { date: formattedDate, time: formattedTime } = formatDateTime(booking.date, booking.time)
                const isCompleted = booking.status === 'completed'
                const isCancelled = booking.status === 'cancelled'
                return (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isCompleted ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{booking.serviceType}</h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{booking.customerName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-15 space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate} at {formattedTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded ${
                          isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isCompleted ? 'Completed' : 'Cancelled'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Products View Component
const ProductsView = ({ dashboardData, setDashboardData }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [allProducts, setAllProducts] = useState([]) // TODO: Fetch from API

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusClass = (status) => {
    switch (status) {
      case 'in': return 'bg-green-100 text-green-700'
      case 'low': return 'bg-amber-100 text-amber-700'
      case 'out': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const stats = [
    { label: 'In Stock', value: allProducts.filter(p => p.status === 'in').length, color: 'bg-green-500' },
    { label: 'Low Stock', value: allProducts.filter(p => p.status === 'low').length, color: 'bg-amber-500' },
    { label: 'Out of Stock', value: allProducts.filter(p => p.status === 'out').length, color: 'bg-red-500' },
    { label: 'Total Parts', value: allProducts.length, color: 'bg-blue-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {allProducts.filter(p => p.status === 'low' || p.status === 'out').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-900">Critical Stock Alert</h3>
            <p className="text-sm text-amber-700">
              {allProducts.filter(p => p.status === 'low' || p.status === 'out').length} parts need immediate restocking
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search parts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('in')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'in' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setFilterStatus('low')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'low' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilterStatus('out')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'out' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Parts Inventory</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => {
              const IconComponent = product.icon
              return (
              <div key={product.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {IconComponent && <IconComponent className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(product.status)}`}>
                    {product.status === 'in' ? 'In Stock' : product.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                  </span>
                  <span className="text-gray-700">{product.units} units</span>
                  <button className="text-primary hover:text-primary-dark">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Analytics View Component (combines Profit and Reports)
const AnalyticsView = ({ dashboardData }) => {
  const revenueChartRef = useRef(null)
  const salesChannelChartRef = useRef(null)
  const profitTrendChartRef = useRef(null)
  const profitMarginChartRef = useRef(null)
  const [dateRange, setDateRange] = useState('30')
  const [profitPeriod, setProfitPeriod] = useState('7')

  useEffect(() => {
    if (!revenueChartRef.current) return

    const ctx = revenueChartRef.current.getContext('2d')
    // TODO: Fetch revenue breakdown data from API
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [], // TODO: Fetch from API
        datasets: [{
          label: 'Revenue',
          data: [], // TODO: Fetch from API
          backgroundColor: ['#1e3a8a', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })

    return () => chart.destroy()
  }, [])

  useEffect(() => {
    if (!salesChannelChartRef.current) return

    const ctx = salesChannelChartRef.current.getContext('2d')
    // TODO: Fetch sales channel data from API
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [], // TODO: Fetch from API
        datasets: [{
          data: [], // TODO: Fetch from API
          backgroundColor: ['#10b981', '#3b82f6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
      }
    })

    return () => chart.destroy()
  }, [])

  useEffect(() => {
    if (!profitTrendChartRef.current) return

    const ctx = profitTrendChartRef.current.getContext('2d')
    const chartData = dashboardData.salesHistory[profitPeriod] || dashboardData.salesHistory[7]
    const profitData = chartData.data.map(sales => sales * 0.35) // 35% profit margin

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Profit',
          data: profitData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })

    return () => chart.destroy()
  }, [profitPeriod, dashboardData.salesHistory])

  useEffect(() => {
    if (!profitMarginChartRef.current) return

    const ctx = profitMarginChartRef.current.getContext('2d')
    const margin = dashboardData.settings.profitMargin || 35

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Profit', 'Cost'],
        datasets: [{
          data: [margin, 100 - margin],
          backgroundColor: ['#10b981', '#e5e7eb'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        cutout: '75%'
      }
    })

    // Add center text
    const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2
    const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2
    ctx.save()
    ctx.font = 'bold 24px sans-serif'
    ctx.fillStyle = '#10b981'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${margin}%`, centerX, centerY)
    ctx.restore()

    return () => chart.destroy()
  }, [dashboardData.settings.profitMargin])

  return (
    <div className="space-y-6">
      {/* Summary Cards - TODO: Fetch from API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">+0%</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">₱0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Net Profit</p>
          <p className="text-2xl font-bold text-gray-900">₱0</p>
          <p className="text-xs text-gray-500 mt-1">Revenue - COGS</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Wrench className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Service Efficiency</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">Bikes/Cars Serviced</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Online vs Instore</p>
          <p className="text-2xl font-bold text-gray-900">0%</p>
          <p className="text-xs text-gray-500 mt-1">Online Orders</p>
        </div>
      </div>

      {/* Profit Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profit Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Profit Trend</h3>
              <select
                value={profitPeriod}
                onChange={(e) => setProfitPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
            <div className="h-64">
              <canvas ref={profitTrendChartRef}></canvas>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Profit Margin</h3>
            <div className="h-64 flex items-center justify-center">
              <canvas ref={profitMarginChartRef}></canvas>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">Current Margin</p>
          </div>
        </div>
        {/* TODO: Fetch profit analysis data from API */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Revenue</p>
            <p className="text-xl font-bold text-gray-900">₱0</p>
            <p className="text-xs text-green-600 mt-1">+0%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Expenses</p>
            <p className="text-xl font-bold text-gray-900">₱0</p>
            <p className="text-xs text-red-600 mt-1">-0%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Margin</p>
            <p className="text-xl font-bold text-gray-900">0%</p>
            <p className="text-xs text-green-600 mt-1">+0%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Goal</p>
            <p className="text-xl font-bold text-gray-900">0%</p>
            <p className="text-xs text-green-600 mt-1">+0%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Breakdown</h3>
          <p className="text-sm text-gray-600 mb-4">Parts Sales vs Labor/Service Fees</p>
          <div className="h-64">
            <canvas ref={revenueChartRef}></canvas>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Channel</h3>
          <p className="text-sm text-gray-600 mb-4">Online Orders vs Walk-in Customers</p>
          <div className="h-64">
            <canvas ref={salesChannelChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Moving Parts</h3>
          <p className="text-sm text-gray-600 mb-4">Best selling parts for restocking decisions</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { rank: 1, name: 'Motul Oil 10W-40', quantity: 125, revenue: 18750 },
                  { rank: 2, name: 'Michelin Road 5 Tire', quantity: 48, revenue: 19200 },
                  { rank: 3, name: 'Brake Pad Set Front', quantity: 62, revenue: 12400 },
                  { rank: 4, name: 'Chain & Sprocket Kit', quantity: 35, revenue: 10500 },
                ].map(item => (
                  <tr key={item.rank}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} units</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Services</h3>
          <p className="text-sm text-gray-600 mb-4">Most requested services</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { rank: 1, name: 'Oil Change', count: 45, revenue: 38250 },
                  { rank: 2, name: 'Brake Adjustment', count: 32, revenue: 27200 },
                  { rank: 3, name: 'Tire Replacement', count: 28, revenue: 23800 },
                  { rank: 4, name: 'Chain Maintenance', count: 18, revenue: 15300 },
                ].map(item => (
                  <tr key={item.rank}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count} times</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile View Component (Shop Profile Settings)
const ProfileView = ({ selectedShopId, ownedShops, setSelectedShopId }) => {
  const [shopData, setShopData] = useState(null)
  const [shopImage, setShopImage] = useState(null)
  const [shopImagePreview, setShopImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (selectedShopId) {
      const shop = ownedShops.find(s => s.id === selectedShopId)
      if (shop) {
        // Load shop data from localStorage - TODO: Fetch from API
        const savedShopData = localStorage.getItem(`shop_${selectedShopId}_data`)
        if (savedShopData) {
          const parsed = JSON.parse(savedShopData)
          setShopData({ ...shop, ...parsed })
          if (parsed.image) setShopImagePreview(parsed.image)
        } else {
          setShopData(shop)
          setShopImagePreview(shop.image)
        }
      }
    }
  }, [selectedShopId, ownedShops])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setShopImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setShopImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field, value) => {
    setShopData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setSaving(true)
    
    // Save to localStorage
    const dataToSave = {
      ...shopData,
      image: shopImagePreview, // Save the preview URL or base64
      updatedAt: new Date().toISOString()
    }
    
    localStorage.setItem(`shop_${selectedShopId}_data`, JSON.stringify(dataToSave))
    
    // TODO: Send to backend API
    
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!shopData) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No shop selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shop Selection */}
      {ownedShops.length > 1 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Shop to Edit
          </label>
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
          >
            {ownedShops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Personal Profile Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="Enter your full name"
              defaultValue={shopData.ownerName || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              value={shopData.ownerEmail || ''}
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Shop Settings Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Shop Settings</h2>
          <p className="text-sm text-gray-600 mt-1">This information will appear to customers when they view your shop</p>
        </div>

        <div className="space-y-6">
          {/* Shop Front Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Front Image</label>
            <div className="relative">
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                {shopImagePreview ? (
                  <img src={shopImagePreview} alt="Shop preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Store className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Upload Shop Front Image</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Click to upload a new shop front image</p>
          </div>

          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
            <input
              type="text"
              value={shopData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="e.g., Speedy Moto Fix"
            />
          </div>

          {/* Shop Description/Overview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shop Overview / Description
            </label>
            <p className="text-xs text-gray-500 mb-2">This is what customers see when they view your shop details</p>
            <textarea
              value={shopData.description || shopData.overview || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="Describe your shop, services, specialties, and what makes you unique..."
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={shopData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="Enter shop physical location"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={shopData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                placeholder="Phone number for business"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={shopData.email || shopData.contactEmail || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                placeholder="Business email"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label>
            <input
              type="text"
              value={shopData.hours || ''}
              onChange={(e) => handleInputChange('hours', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM"
            />
          </div>

          {/* Services Offered */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
            <p className="text-xs text-gray-500 mb-2">Enter services separated by commas</p>
            <input
              type="text"
              value={shopData.services ? shopData.services.join(', ') : ''}
              onChange={(e) => handleInputChange('services', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="e.g., General Repair, Maintenance, Tire Replacement, Oil Change"
            />
          </div>

          {/* TIN/Tax ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TIN/Tax ID <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={shopData.tin || shopData.taxId || ''}
              onChange={(e) => handleInputChange('tin', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="Enter TIN or Tax ID"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary-dark'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Settings View Component
const SettingsView = ({ dashboardData, setDashboardData }) => {
  const handleSettingChange = (key, value) => {
    setDashboardData(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }))
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(dashboardData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'store-dashboard-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result)
          setDashboardData(prev => ({ ...prev, ...parsed }))
          alert('Data imported successfully!')
        } catch (error) {
          alert('Error importing data: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all dashboard data to default? This cannot be undone.')) {
      setDashboardData({
        sales: { current: 0, previous: 0 },
        profit: { current: 0, previous: 0 },
        mechanics: { available: 8, total: 12 },
        products: { total: 156 },
        transactions: [],
        salesHistory: {
          7: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [0, 0, 0, 0, 0, 0, 0] },
          30: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], data: [0, 0, 0, 0] },
          90: { labels: ['Month 1', 'Month 2', 'Month 3'], data: [0, 0, 0] }
        },
        settings: { profitMargin: 35, autoCalculateProfit: true, autoUpdateSales: true, defaultSalesPeriod: 7 }
      })
      alert('Data reset to default!')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profit Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="profit-margin" className="block text-sm font-medium text-gray-700 mb-1">
              Profit Margin Percentage (%)
            </label>
            <input
              type="number"
              id="profit-margin"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              value={dashboardData.settings.profitMargin}
              onChange={(e) => handleSettingChange('profitMargin', parseFloat(e.target.value))}
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">Percentage used to calculate profit from sales.</p>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={dashboardData.settings.autoCalculateProfit}
              onChange={(e) => handleSettingChange('autoCalculateProfit', e.target.checked)}
              className="rounded text-primary"
            />
            <span className="text-sm text-gray-700">Automatically calculate profit from sales</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={dashboardData.settings.autoUpdateSales}
              onChange={(e) => handleSettingChange('autoUpdateSales', e.target.checked)}
              className="rounded text-primary"
            />
            <span className="text-sm text-gray-700">Update sales from transactions</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chart Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="default-sales-period" className="block text-sm font-medium text-gray-700 mb-1">
              Default Sales Period
            </label>
            <select
              id="default-sales-period"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              value={dashboardData.settings.defaultSalesPeriod}
              onChange={(e) => handleSettingChange('defaultSalesPeriod', parseInt(e.target.value))}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Data</span>
          </button>
          <button
            onClick={handleImportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Import Data</span>
          </button>
          <button
            onClick={handleResetData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreDashboard
