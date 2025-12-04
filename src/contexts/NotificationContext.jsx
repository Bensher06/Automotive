import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { notificationService, calculateTimeAgo } from '../services/notificationService'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load notifications when user changes
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setNotifications([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await notificationService.getNotifications(user.id)
        if (result.success) {
          // Transform database format to frontend format
          const transformedNotifications = result.data.map(notification => ({
            id: notification.id,
            userId: notification.user_id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            read: notification.read,
            timestamp: notification.timestamp,
            time: notification.time,
          }))
          setNotifications(transformedNotifications)
        }
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Subscribe to real-time notifications
    if (user) {
      const unsubscribe = notificationService.subscribeToNotifications(user.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newNotification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            read: payload.new.read,
            timestamp: payload.new.created_at,
            time: calculateTimeAgo(payload.new.created_at),
          }
          setNotifications((prev) => [newNotification, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id
                ? {
                    ...n,
                    read: payload.new.read,
                  }
                : n
            )
          )
        } else if (payload.eventType === 'DELETE') {
          setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
        }
      })

      return () => {
        if (unsubscribe) unsubscribe()
      }
    }
  }, [user])

  // Update timeAgo strings every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => {
          const timeAgo = calculateTimeAgo(n.timestamp)
          return {
            ...n,
            time: timeAgo,
          }
        })
      )
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const addNotification = useCallback(async (notification) => {
    if (!user) return

    try {
      const result = await notificationService.createNotification(user.id, notification)
      if (result.success) {
        const transformedNotification = {
          id: result.data.id,
          userId: result.data.user_id,
          title: result.data.title,
          message: result.data.message,
          type: result.data.type,
          read: result.data.read,
          timestamp: result.data.timestamp,
          time: result.data.time,
        }
        setNotifications((prev) => [transformedNotification, ...prev])
        return transformedNotification
      }
      return null
    } catch (error) {
      console.error('Error adding notification:', error)
      return null
    }
  }, [user])

  const markAsRead = useCallback(async (id) => {
    try {
      const result = await notificationService.markAsRead(id)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      }
      return result
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error.message }
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const result = await notificationService.markAllAsRead(user.id)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        )
      }
      return result
    } catch (error) {
      console.error('Error marking all as read:', error)
      return { success: false, error: error.message }
    }
  }, [user])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const value = {
    notifications,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    unreadCount,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

