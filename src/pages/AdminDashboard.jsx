import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Shield, Users, ShoppingBag, TrendingUp, Package, AlertCircle, CheckCircle2, Clock,
  FileText, BarChart3, Bell, Settings, LayoutDashboard, Search, Download, 
  ChevronLeft, ChevronRight, X, Check, XCircle, Edit2, Key, Eye, LogOut
} from 'lucide-react'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState('dashboard')
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [selectedShops, setSelectedShops] = useState(new Set())
  
  // State management - TODO: Fetch from API
  const [state, setState] = useState({
    users: [], // TODO: Fetch from API
    shops: [], // TODO: Fetch from API
    orders: [], // TODO: Fetch from API
    activity: [], // TODO: Fetch from API
    notifications: [],
    logs: [], // TODO: Fetch from API
    listing: { users: { page: 1, size: 10 }, shops: { page: 1, size: 10 } },
  })

  // Filter states
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [shopSearch, setShopSearch] = useState('')
  const [shopFilter, setShopFilter] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [logLevel, setLogLevel] = useState('all')
  const [logType, setLogType] = useState('all')

  // Notification form state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [notifAudience, setNotifAudience] = useState('all')
  const [notifDelay, setNotifDelay] = useState('0')

  // Settings state
  const [prefs, setPrefs] = useState({
    compact: false,
    dense: false,
    notifications: false,
    autoRefresh: false,
    pageSize: 10,
    dateFormat: 'MM/DD/YYYY',
    timezone: 'UTC',
    twoFA: false,
    sessionTimeout: false,
    auditLog: true,
    emailNotif: true,
    smsNotif: false,
    newUsers: true,
    newOrders: true,
    systemAlerts: true,
  })

  // Calculate KPIs
  const kpis = {
    activeUsers: state.users.filter(u => u.status === 'active').length,
    pendingVerifications: state.shops.filter(s => s.status === 'pending').length,
    mechanicsOnline: state.users.filter(u => u.role === 'Mechanic' && u.status === 'active').length,
    ordersToday: state.orders.length,
  }

  // Calculate Analytics
  const analytics = {
    totalRevenue: state.orders.reduce((a, b) => a + b.total, 0),
    monthlyGrowth: '+12.5%',
    avgOrderValue: state.orders.length > 0 ? Math.round(state.orders.reduce((a, b) => a + b.total, 0) / state.orders.length) : 0,
    conversionRate: state.users.length > 0 ? Math.round((state.orders.filter(o => o.status === 'Paid').length / state.users.length) * 100) : 0,
  }

  // Filtered data
  const filteredUsers = state.users.filter(u => {
    const matchesSearch = (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase()))
    const matchesStatus = userFilter === 'all' || u.status === userFilter
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const filteredShops = state.shops.filter(s => {
    const matchesSearch = (s.name.toLowerCase().includes(shopSearch.toLowerCase()) || s.owner.toLowerCase().includes(shopSearch.toLowerCase()))
    const matchesStatus = shopFilter === 'all' || s.status === shopFilter
    return matchesSearch && matchesStatus
  })

  const filteredLogs = state.logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase())
    const matchesLevel = logLevel === 'all' || log.level === logLevel
    const matchesType = logType === 'all' || log.type === logType
    return matchesSearch && matchesLevel && matchesType
  })

  const pendingShops = state.shops.filter(s => s.status === 'pending')

  // Pagination
  const userPage = state.listing.users.page
  const userSize = state.listing.users.size
  const userStart = (userPage - 1) * userSize
  const paginatedUsers = filteredUsers.slice(userStart, userStart + userSize)
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / userSize))

  const shopPage = state.listing.shops.page
  const shopSize = state.listing.shops.size
  const shopStart = (shopPage - 1) * shopSize
  const paginatedShops = filteredShops.slice(shopStart, shopStart + shopSize)
  const shopTotalPages = Math.max(1, Math.ceil(filteredShops.length / shopSize))

  // Handlers
  const handleUserToggle = (userId) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleUserSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleShopToggle = (shopId) => {
    const newSelected = new Set(selectedShops)
    if (newSelected.has(shopId)) {
      newSelected.delete(shopId)
    } else {
      newSelected.add(shopId)
    }
    setSelectedShops(newSelected)
  }

  const handleShopSelectAll = (checked) => {
    if (checked) {
      setSelectedShops(new Set(paginatedShops.map(s => s.id)))
    } else {
      setSelectedShops(new Set())
    }
  }

  const handleUserStatusChange = (userId, newStatus) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, status: newStatus } : u)
    }))
  }

  const handleShopStatusChange = (shopId, newStatus) => {
    setState(prev => ({
      ...prev,
      shops: prev.shops.map(s => s.id === shopId ? { ...s, status: newStatus } : s)
    }))
  }

  const handleBulkUserActivate = () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user')
      return
    }
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => selectedUsers.has(u.id) ? { ...u, status: 'active' } : u)
    }))
    setSelectedUsers(new Set())
  }

  const handleBulkUserSuspend = () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user')
      return
    }
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => selectedUsers.has(u.id) ? { ...u, status: 'suspended' } : u)
    }))
    setSelectedUsers(new Set())
  }

  const handleBulkShopVerify = () => {
    setState(prev => ({
      ...prev,
      shops: prev.shops.map(s => selectedShops.has(s.id) ? { ...s, status: 'verified' } : s)
    }))
    setSelectedShops(new Set())
  }

  const handleBulkShopUnverify = () => {
    setState(prev => ({
      ...prev,
      shops: prev.shops.map(s => selectedShops.has(s.id) ? { ...s, status: 'pending' } : s)
    }))
    setSelectedShops(new Set())
  }

  const handleVerifyShop = (shopId) => {
    handleShopStatusChange(shopId, 'verified')
  }

  const handleRejectShop = (shopId) => {
    setState(prev => ({
      ...prev,
      shops: prev.shops.filter(s => s.id !== shopId)
    }))
  }

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      alert('Please enter both title and message')
      return
    }
    const delay = parseInt(notifDelay, 10) || 0
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        notifications: [{
          title: notifTitle,
          body: notifBody,
          audience: notifAudience,
          time: new Date().toLocaleTimeString()
        }, ...prev.notifications]
      }))
      setNotifTitle('')
      setNotifBody('')
    }, delay)
  }

  const exportToCSV = (data, headers, filename) => {
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportUsers = () => {
    exportToCSV(filteredUsers, ['name', 'role', 'status'], 'users.csv')
  }

  const handleExportShops = () => {
    exportToCSV(filteredShops, ['name', 'owner', 'status'], 'shops.csv')
  }

  const handleExportOrders = () => {
    exportToCSV(state.orders, ['id', 'customer', 'total', 'status'], 'orders.csv')
  }

  const handleExportLogs = () => {
    exportToCSV(filteredLogs, ['level', 'message', 'time', 'type'], 'logs.csv')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'shops', label: 'Shops', icon: ShoppingBag },
    { id: 'verifications', label: 'Verifications', icon: CheckCircle2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'logs', label: 'System Logs', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView kpis={kpis} activity={state.activity} pendingShops={pendingShops} />
      case 'users':
        return <UsersView
          users={paginatedUsers}
          selectedUsers={selectedUsers}
          userSearch={userSearch}
          userFilter={userFilter}
          userRoleFilter={userRoleFilter}
          userPage={userPage}
          userTotalPages={userTotalPages}
          onUserSearch={setUserSearch}
          onUserFilter={setUserFilter}
          onUserRoleFilter={setUserRoleFilter}
          onUserToggle={handleUserToggle}
          onUserSelectAll={handleUserSelectAll}
          onUserStatusChange={handleUserStatusChange}
          onBulkActivate={handleBulkUserActivate}
          onBulkSuspend={handleBulkUserSuspend}
          onExport={handleExportUsers}
          onPageChange={(page) => setState(prev => ({ ...prev, listing: { ...prev.listing, users: { ...prev.listing.users, page } } }))}
          onPageSizeChange={(size) => setState(prev => ({ ...prev, listing: { ...prev.listing, users: { ...prev.listing.users, size, page: 1 } } }))}
        />
      case 'shops':
        return <ShopsView
          shops={paginatedShops}
          selectedShops={selectedShops}
          shopSearch={shopSearch}
          shopFilter={shopFilter}
          shopPage={shopPage}
          shopTotalPages={shopTotalPages}
          onShopSearch={setShopSearch}
          onShopFilter={setShopFilter}
          onShopToggle={handleShopToggle}
          onShopSelectAll={handleShopSelectAll}
          onShopStatusChange={handleShopStatusChange}
          onBulkVerify={handleBulkShopVerify}
          onBulkUnverify={handleBulkShopUnverify}
          onExport={handleExportShops}
          onPageChange={(page) => setState(prev => ({ ...prev, listing: { ...prev.listing, shops: { ...prev.listing.shops, page } } }))}
          onPageSizeChange={(size) => setState(prev => ({ ...prev, listing: { ...prev.listing, shops: { ...prev.listing.shops, size, page: 1 } } }))}
        />
      case 'verifications':
        return <VerificationsView
          pendingShops={pendingShops}
          onVerify={handleVerifyShop}
          onReject={handleRejectShop}
        />
      case 'analytics':
        return <AnalyticsView analytics={analytics} orders={state.orders} />
      case 'logs':
        return <LogsView
          logs={filteredLogs}
          logSearch={logSearch}
          logLevel={logLevel}
          logType={logType}
          onLogSearch={setLogSearch}
          onLogLevel={setLogLevel}
          onLogType={setLogType}
          onExport={handleExportLogs}
        />
      case 'notifications':
        return <NotificationsView
          notifications={state.notifications}
          notifTitle={notifTitle}
          notifBody={notifBody}
          notifAudience={notifAudience}
          notifDelay={notifDelay}
          onNotifTitle={setNotifTitle}
          onNotifBody={setNotifBody}
          onNotifAudience={setNotifAudience}
          onNotifDelay={setNotifDelay}
          onSend={handleSendNotification}
        />
      case 'settings':
        return <SettingsView prefs={prefs} onPrefsChange={setPrefs} />
      default:
        return <DashboardView kpis={kpis} activity={state.activity} pendingShops={pendingShops} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div>
              <div className="font-bold text-gray-900">MotoZapp</div>
              <div className="text-xs text-gray-500">Admin</div>
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
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Administrator</span>
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
const DashboardView = ({ kpis, activity, pendingShops }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Active Users</div>
        <div className="text-3xl font-bold text-gray-900">{kpis.activeUsers}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Pending Verifications</div>
        <div className="text-3xl font-bold text-gray-900">{kpis.pendingVerifications}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Mechanics Online</div>
        <div className="text-3xl font-bold text-gray-900">{kpis.mechanicsOnline}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Orders Today</div>
        <div className="text-3xl font-bold text-gray-900">{kpis.ordersToday}</div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activity.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">{item.t}</div>
              <div className="text-xs text-gray-500">{item.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Queues</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-sm font-medium text-gray-900">Shops awaiting verification</div>
            <div className="text-lg font-bold text-primary">{pendingShops.length}</div>
          </div>
        </div>
      </div>
    </div>
  </>
)

// Users View Component
const UsersView = ({
  users, selectedUsers, userSearch, userFilter, userRoleFilter, userPage, userTotalPages,
  onUserSearch, onUserFilter, onUserRoleFilter, onUserToggle, onUserSelectAll,
  onUserStatusChange, onBulkActivate, onBulkSuspend, onExport, onPageChange, onPageSizeChange
}) => {
  const allSelected = users.length > 0 && users.every(u => selectedUsers.has(u.id))
  const someSelected = users.some(u => selectedUsers.has(u.id)) && !allSelected

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users"
                value={userSearch}
                onChange={(e) => onUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>
          <select
            value={userFilter}
            onChange={(e) => onUserFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-900 bg-white"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={userRoleFilter}
            onChange={(e) => onUserRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-900 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Mechanic">Mechanic</option>
            <option value="Customer">Customer</option>
            <option value="Shop Owner">Shop Owner</option>
          </select>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onBulkActivate}
            className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
          >
            Bulk Activate
          </button>
          <button
            onClick={onBulkSuspend}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
          >
            Bulk Suspend
          </button>
          <select
            value={10}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(userPage - 1)}
              disabled={userPage <= 1}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {userPage} of {userTotalPages}</span>
            <button
              onClick={() => onPageChange(userPage + 1)}
              disabled={userPage >= userTotalPages}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={(e) => onUserSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr
                key={user.id}
                className={`border-b border-gray-200 ${selectedUsers.has(user.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => onUserToggle(user.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <button className="text-primary hover:underline font-medium">{user.name}</button>
                </td>
                <td className="px-4 py-3 text-gray-700">{user.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onUserStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
                      Reset Password
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Shops View Component
const ShopsView = ({
  shops, selectedShops, shopSearch, shopFilter, shopPage, shopTotalPages,
  onShopSearch, onShopFilter, onShopToggle, onShopSelectAll, onShopStatusChange,
  onBulkVerify, onBulkUnverify, onExport, onPageChange, onPageSizeChange
}) => {
  const allSelected = shops.length > 0 && shops.every(s => selectedShops.has(s.id))
  const someSelected = shops.some(s => selectedShops.has(s.id)) && !allSelected

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shops"
                value={shopSearch}
                onChange={(e) => onShopSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-900 bg-white"
              />
            </div>
          </div>
          <select
            value={shopFilter}
            onChange={(e) => onShopFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
          <button onClick={onExport} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button onClick={onBulkVerify} className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg">
            Bulk Verify
          </button>
          <button onClick={onBulkUnverify} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">
            Bulk Unverify
          </button>
          <select
            value={10}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(shopPage - 1)}
              disabled={shopPage <= 1}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {shopPage} of {shopTotalPages}</span>
            <button
              onClick={() => onPageChange(shopPage + 1)}
              disabled={shopPage >= shopTotalPages}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={(e) => onShopSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.map(shop => (
              <tr
                key={shop.id}
                className={`border-b border-gray-200 ${selectedShops.has(shop.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedShops.has(shop.id)}
                    onChange={() => onShopToggle(shop.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <button className="text-primary hover:underline font-medium">{shop.name}</button>
                </td>
                <td className="px-4 py-3 text-gray-700">{shop.owner}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    shop.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {shop.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onShopStatusChange(shop.id, shop.status === 'verified' ? 'pending' : 'verified')}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    {shop.status === 'verified' ? 'Unverify' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Verifications View Component
const VerificationsView = ({ pendingShops, onVerify, onReject }) => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Shop Verification</h2>
    <div className="space-y-3">
      {pendingShops.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No pending verifications</div>
      ) : (
        pendingShops.map(shop => (
          <div key={shop.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-900">{shop.name} • {shop.owner}</div>
            <div className="flex space-x-2">
              <button
                onClick={() => onVerify(shop.id)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(shop.id)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)

// Analytics View Component
const AnalyticsView = ({ analytics, orders }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
        <div className="text-3xl font-bold text-gray-900">₱{analytics.totalRevenue.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Monthly Growth</div>
        <div className="text-3xl font-bold text-green-600">{analytics.monthlyGrowth}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Avg Order Value</div>
        <div className="text-3xl font-bold text-gray-900">₱{analytics.avgOrderValue.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
        <div className="text-3xl font-bold text-gray-900">{analytics.conversionRate}%</div>
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Analytics</h2>
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
        <div className="text-center">
          <div className="font-medium">Revenue & User Growth Chart Placeholder</div>
          <div className="text-sm mt-2">Line chart showing trends over time</div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h2>
        <div className="space-y-3">
          {['Direct', 'Organic Search', 'Social Media', 'Referrals', 'Paid Ads'].map((source, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-900">{source}</div>
              <div className="text-sm text-gray-500">{[45, 28, 15, 8, 4][idx]}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Retention</h2>
        <div className="space-y-3">
          {/* TODO: Fetch user retention data from API */}
          <div className="text-center py-8 text-gray-500">No retention data available</div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Shops</h2>
        <div className="space-y-3">
          {/* TODO: Fetch top performing shops from API */}
          <div className="text-center py-8 text-gray-500">No shop performance data available</div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Categories</h2>
        <div className="space-y-3">
          {/* TODO: Fetch service categories data from API */}
          <div className="text-center py-8 text-gray-500">No service category data available</div>
        </div>
      </div>
    </div>
  </>
)

// Logs View Component
const LogsView = ({ logs, logSearch, logLevel, logType, onLogSearch, onLogLevel, onLogType, onExport }) => {
  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return 'bg-red-500 text-white'
      case 'WARN': return 'bg-amber-500 text-white'
      case 'SUCCESS': return 'bg-green-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => onLogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-900 bg-white"
              />
            </div>
          </div>
          <select
            value={logLevel}
            onChange={(e) => onLogLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="all">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="SUCCESS">Success</option>
          </select>
          <select
            value={logType}
            onChange={(e) => onLogType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="all">All Types</option>
            <option value="System">System</option>
            <option value="User">User</option>
            <option value="Security">Security</option>
            <option value="API">API</option>
          </select>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">Clear Logs</button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Logs</h2>
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div key={idx} className="flex justify-between items-start p-3 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getLogColor(log.level)}`}>
                  {log.level}
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{log.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{log.time} • {log.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Notifications View Component
const NotificationsView = ({
  notifications, notifTitle, notifBody, notifAudience, notifDelay,
  onNotifTitle, onNotifBody, onNotifAudience, onNotifDelay, onSend
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Notification</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={notifTitle}
          onChange={(e) => onNotifTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-900 bg-white"
        />
        <textarea
          placeholder="Message"
          value={notifBody}
          onChange={(e) => onNotifBody(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-900 bg-white"
        />
        <div className="flex gap-2">
          <select
            value={notifAudience}
            onChange={(e) => onNotifAudience(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="all">All</option>
            <option value="customers">Customers</option>
            <option value="mechanics">Mechanics</option>
            <option value="shops">Shops</option>
          </select>
          <select
            value={notifDelay}
            onChange={(e) => onNotifDelay(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="0">Send now</option>
            <option value="3000">In 3s</option>
            <option value="5000">In 5s</option>
            <option value="10000">In 10s</option>
          </select>
          <button
            onClick={onSend}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Send
          </button>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent Notifications</h2>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notifications sent yet</div>
        ) : (
          notifications.map((notif, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">{notif.title} • {notif.audience}</div>
                <div className="text-xs text-gray-500 mt-1">{notif.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)

// Settings View Component
const SettingsView = ({ prefs, onPrefsChange }) => {
  const handlePrefChange = (key, value) => {
    onPrefsChange({ ...prefs, [key]: value })
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Preferences</h2>
          <div className="space-y-4">
            {[
              { key: 'compact', label: 'Compact tables' },
              { key: 'dense', label: 'Dense cards' },
              { key: 'notifications', label: 'Enable desktop notifications' },
              { key: 'autoRefresh', label: 'Auto-refresh data (30s)' },
            ].map(item => (
              <label key={item.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={(e) => handlePrefChange(item.key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
            <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
              Save Preferences
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Default Page Size</label>
              <select
                value={prefs.pageSize}
                onChange={(e) => handlePrefChange('pageSize', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="5">5 items</option>
                <option value="10">10 items</option>
                <option value="20">20 items</option>
                <option value="50">50 items</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Date Format</label>
              <select
                value={prefs.dateFormat}
                onChange={(e) => handlePrefChange('dateFormat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Time Zone</label>
              <select
                value={prefs.timezone}
                onChange={(e) => handlePrefChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="UTC">UTC</option>
                <option value="PST">Pacific Standard Time</option>
                <option value="EST">Eastern Standard Time</option>
                <option value="GMT">Greenwich Mean Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
          <div className="space-y-4">
            {[
              { key: 'twoFA', label: 'Enable Two-Factor Authentication' },
              { key: 'sessionTimeout', label: 'Auto-logout after 30 minutes' },
              { key: 'auditLog', label: 'Enable audit logging' },
            ].map(item => (
              <label key={item.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={(e) => handlePrefChange(item.key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
            <div className="flex space-x-2 mt-4">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">Change Password</button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">View Audit Log</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
          <div className="space-y-4">
            {[
              { key: 'emailNotif', label: 'Email notifications' },
              { key: 'smsNotif', label: 'SMS notifications' },
              { key: 'newUsers', label: 'New user registrations' },
              { key: 'newOrders', label: 'New orders' },
              { key: 'systemAlerts', label: 'System alerts' },
            ].map(item => (
              <label key={item.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={(e) => handlePrefChange(item.key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
        <div className="space-y-2">
          <div className="font-semibold text-gray-900">MotoZapp Admin Panel</div>
          <div className="text-sm text-gray-600">Version: 2.1.0</div>
          <div className="text-sm text-gray-600">Last Updated: January 2024</div>
          <div className="text-sm text-gray-600">
            System Status: <span className="text-green-600 font-medium">Operational</span>
          </div>
          <div className="flex space-x-2 mt-4">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">Check for Updates</button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">System Information</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard
