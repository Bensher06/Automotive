import { supabase } from '../lib/supabase'

/**
 * Notification Service
 * Handles notification operations
 */

export const calculateTimeAgo = (timestamp) => {
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

export const notificationService = {
  /**
   * Get notifications for current user
   */
  async getNotifications(userId = null) {
    try {
      let targetUserId = userId

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }
        targetUserId = user.id
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Add timeAgo to each notification
      const notifications = data.map(notification => ({
        ...notification,
        time: calculateTimeAgo(notification.created_at),
        timestamp: notification.created_at,
      }))

      return { success: true, data: notifications }
    } catch (error) {
      console.error('Get notifications error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Create a notification
   */
  async createNotification(userId, notification) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          read: false,
        })
        .select()
        .single()

      if (error) throw error

      // Add timeAgo
      const notificationWithTime = {
        ...data,
        time: calculateTimeAgo(data.created_at),
        timestamp: data.created_at,
      }

      return { success: true, data: notificationWithTime }
    } catch (error) {
      console.error('Create notification error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Mark as read error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId = null) {
    try {
      let targetUserId = userId

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }
        targetUserId = user.id
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', targetUserId)
        .eq('read', false)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Mark all as read error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Delete notification error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId = null) {
    try {
      let targetUserId = userId

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }
        targetUserId = user.id
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('read', false)

      if (error) throw error
      return { success: true, count: count || 0 }
    } catch (error) {
      console.error('Get unread count error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userId, callback) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}

