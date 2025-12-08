import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBookings } from '../contexts/BookingContext'
import { useNotifications } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import {
  ShoppingBag, Package, TrendingUp, Calendar, DollarSign, Users,
  CheckCircle, XCircle, Clock, Bell, LayoutDashboard, Settings,
  BarChart3, FileText, Wrench, MapPin, Phone, User, LogOut, Search,
  Edit2, Plus, Download, Upload, RotateCcw, AlertTriangle, X, Check, Save, Store, Loader2
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

  // State for shops owned by this store owner
  const [ownedShops, setOwnedShops] = useState([])
  const [loadingShops, setLoadingShops] = useState(true)

  // Fetch shops owned by this store owner from Supabase
  const fetchOwnedShops = useCallback(async () => {
    if (!user?.id) return
    
    setLoadingShops(true)
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching shops:', error)
        return
      }

      if (data) {
        // Transform data to match expected format
        const transformedShops = data.map(shop => ({
          id: shop.id,
          name: shop.name || 'Unnamed Shop',
          ownerName: shop.owner_name || user?.name || 'Owner',
          ownerEmail: shop.email || user?.email || '',
          description: shop.description || '',
          address: shop.address || '',
          phone: shop.phone || '',
          email: shop.email || '',
          hours: shop.hours || '',
          services: shop.services || [],
          tin: shop.tin || '',
          image: shop.image_url || '',
          credentialsUrl: shop.credentials_url || '',
          validIdUrl: shop.valid_id_url || '',
          status: shop.status || 'pending',
          createdAt: shop.created_at,
        }))
        setOwnedShops(transformedShops)
      }
    } catch (err) {
      console.error('Error fetching shops:', err)
    } finally {
      setLoadingShops(false)
    }
  }, [user?.id, user?.name, user?.email])

  // Fetch shops on mount
  useEffect(() => {
    fetchOwnedShops()
  }, [fetchOwnedShops])

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
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
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

  // State for dashboard stats
  const [ordersCount, setOrdersCount] = useState({ pending: 0, total: 0 })
  const [totalSales, setTotalSales] = useState(0)
  const [totalQuantitySold, setTotalQuantitySold] = useState(0)

  // Fetch orders count
  useEffect(() => {
    const fetchOrdersCount = async () => {
      if (!selectedShopId) return
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status')
          .eq('shop_id', selectedShopId)

        if (!error && data) {
          setOrdersCount({
            pending: data.filter(o => o.status === 'pending').length,
            total: data.length
          })
        }
      } catch (err) {
        console.error('Error fetching orders count:', err)
      }
    }
    fetchOrdersCount()

    // Real-time subscription for orders
    const channel = supabase
      .channel('dashboard-orders-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${selectedShopId}` }, () => {
        fetchOrdersCount()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedShopId])

  // Fetch total sales and quantity from order_items
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!selectedShopId) return
      try {
        // Get shop order IDs
        const { data: shopOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('shop_id', selectedShopId)

        if (ordersError) {
          console.error('Error fetching shop orders:', ordersError)
          setTotalSales(0)
          setTotalQuantitySold(0)
          return
        }

        if (!shopOrders || shopOrders.length === 0) {
          setTotalSales(0)
          setTotalQuantitySold(0)
          return
        }

        const shopOrderIds = shopOrders.map(o => o.id)

        // Fetch order_items for this shop
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select('quantity, price')
          .in('order_id', shopOrderIds)

        if (error) {
          console.error('Error fetching order items:', error)
          setTotalSales(0)
          setTotalQuantitySold(0)
          return
        }

        if (orderItems && orderItems.length > 0) {
          const totalAmount = orderItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 0)), 0)
          const totalQty = orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
          console.log('Total sales calculated:', { totalAmount, totalQty, itemsCount: orderItems.length })
          setTotalSales(totalAmount)
          setTotalQuantitySold(totalQty)
        } else {
          setTotalSales(0)
          setTotalQuantitySold(0)
        }
      } catch (err) {
        console.error('Error fetching sales data:', err)
        setTotalSales(0)
        setTotalQuantitySold(0)
      }
    }
    fetchSalesData()

    // Real-time subscription for orders and order_items
    const channel1 = supabase
      .channel('dashboard-orders-total')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${selectedShopId}` }, () => {
        fetchSalesData()
      })
      .subscribe()

    const channel2 = supabase
      .channel('dashboard-items-total')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, () => {
        fetchSalesData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel1)
      supabase.removeChannel(channel2)
    }
  }, [selectedShopId])

  const stats = [
    {
      label: 'Total Sales',
      value: `₱${totalSales.toLocaleString()}`,
      badge: totalQuantitySold > 0 ? `${totalQuantitySold} items sold` : 'No sales yet',
      icon: TrendingUp,
      color: 'bg-blue-500',
      textColor: 'text-white'
    },
    {
      label: 'Orders',
      value: ordersCount.total.toString(),
      badge: `${ordersCount.pending} Pending`,
      icon: ShoppingBag,
      color: 'bg-green-500',
      textColor: 'text-white'
    },
    {
      label: 'Items Sold',
      value: totalQuantitySold.toString(),
      badge: 'Total quantity',
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
          selectedShopId={selectedShopId}
        />
      case 'orders':
        return <OrdersView 
          selectedShopId={selectedShopId}
          user={user}
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
        return <ProductsView 
          dashboardData={dashboardData} 
          setDashboardData={setDashboardData}
          user={user}
          ownedShops={ownedShops}
          selectedShopId={selectedShopId}
        />
      case 'analytics':
        return <AnalyticsView dashboardData={dashboardData} selectedShopId={selectedShopId} />
      case 'profile':
        return <ProfileView 
          selectedShopId={selectedShopId} 
          ownedShops={ownedShops} 
          setSelectedShopId={setSelectedShopId} 
          loadingShops={loadingShops}
          onRefresh={fetchOwnedShops}
        />
      case 'settings':
        return <SettingsView dashboardData={dashboardData} setDashboardData={setDashboardData} />
      default:
        return <DashboardView
          stats={stats}
          pendingBookings={pendingBookings}
          confirmedBookings={confirmedBookings}
          dashboardData={dashboardData}
          setDashboardData={setDashboardData}
          selectedShopId={selectedShopId}
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
              {currentView === 'profile' && ownedShops.length > 0 ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">{ownedShops[0]?.name || 'My Shop'}</h1>
                  <p className="text-sm text-gray-600 mt-1">Shop Profile • Owner: {user?.name || 'Store Owner'}</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {ownedShops.length > 0 ? ownedShops[0]?.name : 'Welcome back'}, {user?.name || 'Store Owner'}
                  </p>
                </>
              )}
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
const DashboardView = ({ stats, pendingBookings, confirmedBookings, dashboardData, setDashboardData, selectedShopId }) => {
  const salesChartRef = useRef(null)
  const [salesPeriod, setSalesPeriod] = useState(7)
  const [recentOrders, setRecentOrders] = useState([])
  const [salesData, setSalesData] = useState({ labels: [], data: [] })
  const [customerPurchases, setCustomerPurchases] = useState([])
  const [periodStats, setPeriodStats] = useState({ totalAmount: 0, totalQty: 0 })

  // Fetch real sales data from order_items
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!selectedShopId) return

      try {
        // Get date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - salesPeriod)

        // Get shop orders in date range
        const { data: shopOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at')
          .eq('shop_id', selectedShopId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        if (ordersError) {
          console.error('Error fetching shop orders for sales overview:', ordersError)
          setSalesData({ labels: [], data: [] })
          setPeriodStats({ totalAmount: 0, totalQty: 0 })
          return
        }

        if (!shopOrders || shopOrders.length === 0) {
          console.log('No shop orders in date range')
          setSalesData({ labels: [], data: [] })
          setPeriodStats({ totalAmount: 0, totalQty: 0 })
          return
        }

        const shopOrderIds = shopOrders.map(o => o.id)
        console.log('Shop order IDs:', shopOrderIds)

        // Fetch order_items for these orders
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('quantity, price, order_id, created_at')
          .in('order_id', shopOrderIds)

        if (itemsError) {
          console.error('Error fetching order items for sales overview:', itemsError)
          setSalesData({ labels: [], data: [] })
          setPeriodStats({ totalAmount: 0, totalQty: 0 })
          return
        }

        console.log('Order items fetched for sales overview:', orderItems)

        // Group by date
        const salesByDate = {}
        const qtyByDate = {}

        // Generate all dates in range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]
          salesByDate[dateKey] = 0
          qtyByDate[dateKey] = 0
        }

        // Get order dates map
        const orderDateMap = {}
        shopOrders.forEach(order => {
          orderDateMap[order.id] = new Date(order.created_at).toISOString().split('T')[0]
        })

        // Sum sales and quantities by date
        (orderItems || []).forEach(item => {
          const orderDate = orderDateMap[item.order_id]
          if (orderDate) {
            salesByDate[orderDate] = (salesByDate[orderDate] || 0) + (parseFloat(item.price || 0) * (item.quantity || 0))
            qtyByDate[orderDate] = (qtyByDate[orderDate] || 0) + (item.quantity || 0)
          }
        })

        // Convert to arrays
        const labels = []
        const data = []
        Object.keys(salesByDate).sort().forEach(date => {
          const d = new Date(date)
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
          data.push(salesByDate[date])
        })

        setSalesData({ labels, data })

        // Calculate totals for this period
        const totalSales = (orderItems || []).reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 0)), 0)
        const totalQty = (orderItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
        setPeriodStats({ totalAmount: totalSales, totalQty: totalQty })

        // Update dashboard data with totals
        setDashboardData(prev => ({
          ...prev,
          sales: { current: totalSales, previous: prev.sales.previous }
        }))

      } catch (err) {
        console.error('Error fetching sales:', err)
      }
    }

    fetchSalesData()

    // Real-time subscription
    const channel = supabase
      .channel('dashboard-sales-overview')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, () => {
        fetchSalesData()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedShopId, salesPeriod, setDashboardData])

  // Fetch recent orders for transactions
  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!selectedShopId) return

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              price,
              product_name
            )
          `)
          .eq('shop_id', selectedShopId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error fetching recent orders:', error)
          throw error
        }
        
        console.log('Recent orders fetched:', data)
        setRecentOrders(data || [])
      } catch (err) {
        console.error('Error fetching orders:', err)
        setRecentOrders([])
      }
    }

    fetchRecentOrders()

    // Real-time subscription
    const channel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${selectedShopId}` }, () => {
        fetchRecentOrders()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedShopId])

  // Fetch customer purchases from order_items
  useEffect(() => {
    const fetchCustomerPurchases = async () => {
      if (!selectedShopId) return

      try {
        // Get shop order IDs first
        const { data: shopOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id, customer_name, created_at')
          .eq('shop_id', selectedShopId)

        if (ordersError) {
          console.error('Error fetching shop orders for purchases:', ordersError)
          setCustomerPurchases([])
          return
        }

        if (!shopOrders || shopOrders.length === 0) {
          console.log('No shop orders found')
          setCustomerPurchases([])
          return
        }

        const shopOrderIds = shopOrders.map(o => o.id)
        const orderMap = {}
        shopOrders.forEach(order => {
          orderMap[order.id] = order
        })

        // Fetch order_items for these orders
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', shopOrderIds)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('Error fetching order items:', error)
          setCustomerPurchases([])
          return
        }
        
        // Transform data
        const purchases = (orderItems || []).map(item => {
          const order = orderMap[item.order_id]
          return {
            id: item.id,
            customer_name: order?.customer_name || 'Customer',
            product_name: item.product_name || 'Product',
            quantity: item.quantity || 0,
            amount: parseFloat(item.price || 0) * (item.quantity || 0),
            created_at: order?.created_at || item.created_at
          }
        })

        console.log('Customer purchases fetched:', purchases)
        setCustomerPurchases(purchases)
      } catch (err) {
        console.error('Error fetching customer purchases:', err)
        setCustomerPurchases([])
      }
    }

    fetchCustomerPurchases()

    // Real-time subscription for order_items
    const channel = supabase
      .channel('dashboard-order-items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, () => {
        fetchCustomerPurchases()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedShopId])

  useEffect(() => {
    if (!salesChartRef.current) return

    const ctx = salesChartRef.current.getContext('2d')
    const chartData = salesData.labels.length > 0 ? salesData : (dashboardData.salesHistory[salesPeriod] || dashboardData.salesHistory[7])

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
  }, [salesPeriod, salesData, dashboardData.salesHistory])


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
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500">
                  Total: <span className="font-semibold text-primary">₱{periodStats.totalAmount.toLocaleString()}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Items: <span className="font-semibold text-green-600">{periodStats.totalQty}</span>
                </span>
              </div>
            </div>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 text-purple-500 mr-2" />
            Customer Purchases
          </h2>
          <div className="h-64 overflow-y-auto">
            {customerPurchases.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No purchases yet</p>
                  <p className="text-sm text-gray-400 mt-1">Customer orders will appear here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {customerPurchases.map((purchase, index) => (
                  <div key={purchase.id || index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{purchase.customer_name || 'Customer'}</p>
                          <p className="text-xs text-gray-400">{new Date(purchase.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary">₱{parseFloat(purchase.amount).toLocaleString()}</span>
                    </div>
                    <div className="ml-10 flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{purchase.product_name}</p>
                      </div>
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">Qty: {purchase.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <ShoppingBag className="w-5 h-5 text-blue-500 mr-2" />
              Recent Orders
            </h2>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent orders</div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-600">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">₱{parseFloat(order.total_amount).toLocaleString()}</span>
                    <p className={`text-xs ${
                      order.status === 'pending' ? 'text-amber-600' : 
                      order.status === 'confirmed' ? 'text-blue-600' : 
                      order.status === 'delivered' ? 'text-green-600' : 'text-gray-600'
                    }`}>{order.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Orders View Component - Shows all orders for the shop
const OrdersView = ({ selectedShopId, user }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedShopId) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products:product_id (name, image_url, price)
            )
          `)
          .eq('shop_id', selectedShopId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (err) {
        console.error('Error fetching orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${selectedShopId}` }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedShopId])

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      console.error('Error updating order:', err)
      alert('Failed to update order status')
    }
  }

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending') return o.status === 'pending'
    if (activeTab === 'confirmed') return o.status === 'confirmed'
    if (activeTab === 'completed') return ['delivered', 'completed'].includes(o.status)
    if (activeTab === 'cancelled') return o.status === 'cancelled'
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': 
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-1 flex space-x-1">
        {[
          { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
          { id: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
          { id: 'completed', label: 'Completed', count: orders.filter(o => ['delivered', 'completed'].includes(o.status)).length },
          { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} orders</h3>
          <p className="text-gray-500">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt={item.products?.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.products?.name || 'Product'}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × ₱{parseFloat(item.price).toLocaleString()}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₱{(item.quantity * parseFloat(item.price)).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Payment: {order.payment_method}</p>
                  <p className="text-sm text-gray-500">Contact: {order.contact_number}</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    Total Items: {order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-primary">₱{parseFloat(order.total_amount).toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {order.status === 'pending' && (
                <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Order</span>
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}

              {order.status === 'confirmed' && (
                <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Picked Up / Delivered</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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
const ProductsView = ({ dashboardData, setDashboardData, user, ownedShops, selectedShopId }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showProductDetail, setShowProductDetail] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Upload form state
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    brand: '',
    quantity: 1,
    description: '',
    image: null,
    imagePreview: null
  })

  // Fetch products from Supabase - by shop_id (products table doesn't have owner_id)
  const fetchProducts = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      // Get shop_id from selected shop or first owned shop
      const shopId = selectedShopId || (ownedShops.length > 0 ? ownedShops[0].id : null)
      
      if (!shopId) {
        setAllProducts([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Products fetch error:', error)
        throw error
      }
      
      setAllProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setAllProducts([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, selectedShopId, ownedShops])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Get stock status based on percentage of original quantity
  const getStockStatus = (quantity, originalQuantity) => {
    if (quantity <= 0) return 'out'
    // If original quantity exists, use percentage calculation
    if (originalQuantity && originalQuantity > 0) {
      const percentage = (quantity / originalQuantity) * 100
      if (percentage <= 10) return 'low'
    } else {
      // Fallback: if no original quantity, use absolute threshold
      if (quantity <= 5) return 'low'
    }
    return 'in'
  }

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    const status = getStockStatus(product.quantity, product.original_quantity)
    const matchesFilter = filterStatus === 'all' || status === filterStatus
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
    { label: 'In Stock', value: allProducts.filter(p => getStockStatus(p.quantity, p.original_quantity) === 'in').length, color: 'bg-green-500' },
    { label: 'Low Stock', value: allProducts.filter(p => getStockStatus(p.quantity, p.original_quantity) === 'low').length, color: 'bg-amber-500' },
    { label: 'Out of Stock', value: allProducts.filter(p => getStockStatus(p.quantity, p.original_quantity) === 'out').length, color: 'bg-red-500' },
    { label: 'Total Parts', value: allProducts.length, color: 'bg-blue-500' },
  ]

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProductForm(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }))
    }
  }

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setProductForm(prev => ({ ...prev, [field]: value }))
  }

  // Upload product to Supabase
  const handleUploadProduct = async () => {
    if (!productForm.name || !productForm.price) {
      setError('Please fill in product name and price')
      return
    }

    setUploading(true)
    setError('')

    try {
      let imageUrl = null

      // Upload image if provided
      if (productForm.image) {
        const fileExt = productForm.image.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, productForm.image)

        if (uploadError) {
          console.error('Image upload error:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      // Get shop_id from ownedShops
      const shopId = selectedShopId || (ownedShops.length > 0 ? ownedShops[0].id : null)

      // Insert product (removed owner_id - products only use shop_id)
      const initialQuantity = parseInt(productForm.quantity) || 0
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          shop_id: shopId,
          name: productForm.name,
          price: parseFloat(productForm.price),
          brand: productForm.brand || null,
          quantity: initialQuantity,
          original_quantity: initialQuantity, // Track original quantity for stock % calculation
          description: productForm.description || null,
          image_url: imageUrl,
          status: 'active',
          ratings: 0,
          ratings_count: 0
        })

      if (insertError) throw insertError

      // Reset form and close modal
      setProductForm({
        name: '',
        price: '',
        brand: '',
        quantity: 1,
        description: '',
        image: null,
        imagePreview: null
      })
      setShowUploadModal(false)
      fetchProducts()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload product')
    } finally {
      setUploading(false)
    }
  }

  // Update product quantity
  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 0) return
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', productId)

      if (error) throw error
      
      // Update local state
      setAllProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, quantity: newQuantity } : p
      ))
      
      if (showProductDetail?.id === productId) {
        setShowProductDetail(prev => ({ ...prev, quantity: newQuantity }))
      }
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      
      setShowProductDetail(null)
      fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - with cross-platform shadows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white stats-card p-6">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <div className={`${stat.color} text-white p-3 rounded-xl`}>
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
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
        <div className="flex space-x-2 flex-wrap gap-2">
          {['all', 'in', 'low', 'out'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status === 'in' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Product</span>
        </button>
      </div>

      {/* Results Count - matching Marketplace */}
      <div className="mb-4 text-gray-600">
        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} in inventory
      </div>

      {/* Products Grid - matching Marketplace layout */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No products found</p>
          <p className="text-gray-500 text-sm mt-2">
            Click "Upload Product" to add your first product
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const status = getStockStatus(product.quantity, product.original_quantity)
            const stockInfo = {
              out: { label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
              low: { label: 'Low Stock', color: 'bg-amber-100 text-amber-800' },
              in: { label: 'In Stock', color: 'bg-green-100 text-green-800' }
            }[status]
            return (
              <div
                key={product.id}
                onClick={() => setShowProductDetail(product)}
                className="product-card cursor-pointer"
              >
                {/* Product Image - matching Marketplace aspect-square */}
                <div className="aspect-square bg-gray-100 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  {/* Stock Badge - matching Marketplace style */}
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
                    {stockInfo.label}
                  </span>
                  {/* Admin Quick Actions Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowProductDetail(product)
                      }}
                      className="p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Product Info - matching Marketplace layout */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Store className="w-3 h-3 mr-1" />
                      {product.brand}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ₱{parseFloat(product.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.quantity} units
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Product Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto modal-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload Product</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Product Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div className="relative">
                    <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                      {productForm.imagePreview ? (
                        <img src={productForm.imagePreview} alt="Preview" className="max-w-full max-h-48 object-contain" />
                      ) : (
                        <div className="text-center text-gray-400">
                          <Upload className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Click to upload image</p>
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
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., Motul Oil 10W-40"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => handleFormChange('brand', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., Motul, Michelin"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleFormChange('quantity', Math.max(0, productForm.quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleFormChange('quantity', productForm.quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="Product description..."
                  />
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">Product is always for pickup. Customers must collect their orders from your shop.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadProduct}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal - matching Marketplace styling */}
      {showProductDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-shadow">
            {/* Sticky Header - matching Marketplace */}
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setShowProductDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Product Image - matching Marketplace aspect-video */}
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
                {showProductDetail.image_url ? (
                  <img
                    src={showProductDetail.image_url}
                    alt={showProductDetail.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Product Info - matching Marketplace layout */}
              <div className="space-y-4">
                {/* Name & Price */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{showProductDetail.name}</h3>
                  <p className="text-3xl font-bold text-primary">₱{parseFloat(showProductDetail.price).toLocaleString()}</p>
                </div>

                {/* Details Grid - matching Marketplace */}
                <div className="grid grid-cols-2 gap-4">
                  {showProductDetail.brand && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Brand</p>
                      <p className="font-medium text-gray-900">{showProductDetail.brand}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">{showProductDetail.category || 'General'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Stock</p>
                    <p className={`font-medium ${
                      showProductDetail.quantity <= 0 ? 'text-red-600' : 
                      showProductDetail.quantity <= (showProductDetail.original_quantity * 0.1) ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {showProductDetail.quantity} available
                    </p>
                  </div>
                  {(showProductDetail.ratings || 0) > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Rating</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-amber-400">★</span>
                        <span className="font-medium text-gray-900">{(showProductDetail.ratings || 0).toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({showProductDetail.ratings_count || 0} reviews)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {showProductDetail.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{showProductDetail.description}</p>
                  </div>
                )}

                {/* Stock Management - Admin specific */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-800 mb-3">📦 Stock Management</label>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handleQuantityChange(showProductDetail.id, Math.max(0, showProductDetail.quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center bg-white border-2 border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-xl font-bold shadow-sm"
                    >
                      -
                    </button>
                    <span className="w-20 text-center text-2xl font-bold text-gray-900">{showProductDetail.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(showProductDetail.id, showProductDetail.quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center bg-white border-2 border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-xl font-bold shadow-sm"
                    >
                      +
                    </button>
                  </div>
                  {/* Stock Progress Bar */}
                  {showProductDetail.original_quantity > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-blue-700">Stock Level</span>
                        <span className={`font-medium ${
                          getStockStatus(showProductDetail.quantity, showProductDetail.original_quantity) === 'out' ? 'text-red-600' :
                          getStockStatus(showProductDetail.quantity, showProductDetail.original_quantity) === 'low' ? 'text-amber-600' :
                          'text-green-600'
                        }`}>
                          {Math.round((showProductDetail.quantity / showProductDetail.original_quantity) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            getStockStatus(showProductDetail.quantity, showProductDetail.original_quantity) === 'out' ? 'bg-red-500' :
                            getStockStatus(showProductDetail.quantity, showProductDetail.original_quantity) === 'low' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (showProductDetail.quantity / showProductDetail.original_quantity) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-blue-600 mt-1">Original inventory: {showProductDetail.original_quantity} units</p>
                    </div>
                  )}
                </div>

                {/* Pickup Warning - matching Marketplace */}
                <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Product is for Pickup Only</p>
                    <p className="text-sm text-amber-700">This product must be picked up at the shop location.</p>
                  </div>
                </div>

                {/* Action Buttons - matching Marketplace rounded-xl style */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => handleDeleteProduct(showProductDetail.id)}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100"
                  >
                    <X className="w-5 h-5" />
                    <span>Delete Product</span>
                  </button>
                  <button
                    onClick={() => setShowProductDetail(null)}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold bg-primary text-white hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Analytics View Component - Sales focused
const AnalyticsView = ({ dashboardData, selectedShopId }) => {
  const salesChartRef = useRef(null)
  const [salesPeriod, setSalesPeriod] = useState('30')
  const [allSales, setAllSales] = useState([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [salesData, setSalesData] = useState({ labels: [], data: [] })

  // Fetch all sales data
  useEffect(() => {
    const fetchAllSales = async () => {
      if (!selectedShopId) return

      try {
        // Get date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(salesPeriod))

        const { data: sales, error } = await supabase
          .from('sales')
          .select('*')
          .eq('shop_id', selectedShopId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        setAllSales(sales || [])
        
        // Calculate totals
        const total = (sales || []).reduce((sum, s) => sum + parseFloat(s.amount), 0)
        setTotalSales(total)
        setTotalOrders(sales?.length || 0)

        // Group by date for chart
        const salesByDate = {}
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]
          salesByDate[dateKey] = 0
        }

        (sales || []).forEach(sale => {
          const dateKey = new Date(sale.created_at).toISOString().split('T')[0]
          salesByDate[dateKey] = (salesByDate[dateKey] || 0) + parseFloat(sale.amount)
        })

        const labels = []
        const data = []
        Object.keys(salesByDate).sort().forEach(date => {
          const d = new Date(date)
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
          data.push(salesByDate[date])
        })

        setSalesData({ labels, data })
      } catch (err) {
        console.error('Error fetching sales:', err)
      }
    }

    fetchAllSales()
  }, [selectedShopId, salesPeriod])

  // Chart
  useEffect(() => {
    if (!salesChartRef.current || salesData.labels.length === 0) return

    const ctx = salesChartRef.current.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
    gradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)')
    gradient.addColorStop(1, 'rgba(30, 58, 138, 0)')

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: salesData.labels,
        datasets: [{
          label: 'Sales',
          data: salesData.data,
          backgroundColor: gradient,
          borderColor: '#1e3a8a',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#1e3a8a',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
          x: { grid: { display: false } }
        }
      }
    })

    return () => chart.destroy()
  }, [salesData])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Last {salesPeriod} days</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">₱{totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Products Sold</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Average Order</p>
          <p className="text-2xl font-bold text-gray-900">₱{totalOrders > 0 ? Math.round(totalSales / totalOrders).toLocaleString() : 0}</p>
          <p className="text-xs text-gray-500 mt-1">Per Transaction</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sales Trend</h2>
          <select
            value={salesPeriod}
            onChange={(e) => setSalesPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        <div className="h-64">
          {salesData.labels.length > 0 ? (
            <canvas ref={salesChartRef}></canvas>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No sales data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales History</h2>
        {allSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No sales recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Product</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allSales.slice(0, 20).map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{sale.customer_name || 'Customer'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sale.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{sale.quantity}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary text-right">₱{parseFloat(sale.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{new Date(sale.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Profile View Component (Shop Profile Settings)
const ProfileView = ({ selectedShopId, ownedShops, setSelectedShopId, loadingShops, onRefresh }) => {
  const [shopData, setShopData] = useState(null)
  const [shopImage, setShopImage] = useState(null)
  const [shopImagePreview, setShopImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedShopId && ownedShops.length > 0) {
      const shop = ownedShops.find(s => s.id === selectedShopId)
      if (shop) {
        setShopData(shop)
        setShopImagePreview(shop.image || null)
      }
    } else if (ownedShops.length > 0 && !selectedShopId) {
      // Auto-select first shop
      const firstShop = ownedShops[0]
      setSelectedShopId(firstShop.id)
      setShopData(firstShop)
      setShopImagePreview(firstShop.image || null)
    }
  }, [selectedShopId, ownedShops, setSelectedShopId])

  const handleImageChange = async (e) => {
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

  const handleSave = async () => {
    if (!selectedShopId || !shopData) return
    
    setSaving(true)
    setError('')
    
    try {
      let imageUrl = shopData.image

      // Upload new image if changed
      if (shopImage) {
        const fileExt = shopImage.name.split('.').pop()
        const fileName = `shop_${selectedShopId}_${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('shop-images')
          .upload(fileName, shopImage)

        if (uploadError) {
          console.error('Image upload error:', uploadError)
          // Continue without updating image
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('shop-images')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      // Update shop in database
      const { error: updateError } = await supabase
        .from('shops')
        .update({
          name: shopData.name,
          description: shopData.description,
          address: shopData.address,
          phone: shopData.phone,
          email: shopData.email,
          hours: shopData.hours,
          services: shopData.services,
          owner_name: shopData.ownerName,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedShopId)

      if (updateError) throw updateError

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
      // Refresh shop data
      if (onRefresh) onRefresh()
      
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loadingShops) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p>Loading shop data...</p>
        </div>
      </div>
    )
  }

  // No shop found
  if (!shopData || ownedShops.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">No shop found</p>
          <p className="text-sm text-gray-400">Your shop verification is pending approval or you haven't submitted one yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shop Name Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          {shopImagePreview ? (
            <img src={shopImagePreview} alt={shopData.name} className="w-20 h-20 rounded-lg object-cover border-2 border-white/30" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-white/20 flex items-center justify-center">
              <Store className="w-10 h-10 text-white/80" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold">{shopData.name || 'My Shop'}</h2>
            <p className="text-white/80 mt-1">Owned by {shopData.ownerName || 'Store Owner'}</p>
            <div className="flex items-center space-x-2 mt-2">
              {shopData.status === 'verified' ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500 text-white">
                  <Clock className="w-4 h-4 mr-1" /> Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {shopData.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center space-x-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Verification Pending</p>
            <p className="text-sm text-amber-600">Your shop is awaiting admin approval. Some features may be limited.</p>
          </div>
        </div>
      )}
      
      {shopData.status === 'verified' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">Shop Verified</p>
            <p className="text-sm text-green-600">Your shop is verified and visible to customers.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Shop Selection */}
      {ownedShops.length > 1 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Shop to Edit
          </label>
          <select
            value={selectedShopId || ''}
            onChange={(e) => setSelectedShopId(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name (Owner)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              placeholder="Enter your full name"
              value={shopData.ownerName || ''}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              value={shopData.ownerEmail || shopData.email || ''}
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
              <div className="w-full min-h-48 max-h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                {shopImagePreview ? (
                  <img src={shopImagePreview} alt="Shop preview" className="max-w-full max-h-96 object-contain" />
                ) : (
                  <div className="text-center text-gray-400 py-12">
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
