import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { bookingService } from '../services/bookingService'
import { useAuth } from './AuthContext'

const BookingContext = createContext()

export const useBookings = () => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider')
  }
  return context
}

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load bookings when user changes
  useEffect(() => {
    const loadBookings = async () => {
      if (!user) {
        setBookings([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await bookingService.getMyBookings()
        if (result.success) {
          // Transform database format to frontend format
          const transformedBookings = result.data.map(booking => ({
            id: booking.id,
            customerId: booking.customer_id,
            shopId: booking.shop_id,
            serviceType: booking.service_type,
            date: booking.date,
            time: booking.time,
            notes: booking.notes,
            vehicleBrand: booking.vehicle_brand,
            vehicleModel: booking.vehicle_model,
            vehicleYear: booking.vehicle_year,
            status: booking.status,
            createdAt: booking.created_at,
            updatedAt: booking.updated_at,
            shop: booking.shops,
            customer: booking.profiles,
          }))
          setBookings(transformedBookings)
        }
      } catch (error) {
        console.error('Error loading bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [user])

  const createBooking = useCallback(async (bookingData) => {
    try {
      const result = await bookingService.createBooking({
        shopId: bookingData.shopId,
        serviceType: bookingData.serviceType,
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes,
        vehicleBrand: bookingData.vehicleBrand,
        vehicleModel: bookingData.vehicleModel,
        vehicleYear: bookingData.vehicleYear,
      })

      if (result.success) {
        // Transform and add to local state
        const transformedBooking = {
          id: result.data.id,
          customerId: result.data.customer_id,
          shopId: result.data.shop_id,
          serviceType: result.data.service_type,
          date: result.data.date,
          time: result.data.time,
          notes: result.data.notes,
          vehicleBrand: result.data.vehicle_brand,
          vehicleModel: result.data.vehicle_model,
          vehicleYear: result.data.vehicle_year,
          status: result.data.status,
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at,
        }
        setBookings((prev) => [transformedBooking, ...prev])
        return transformedBooking
      }
      return null
    } catch (error) {
      console.error('Error creating booking:', error)
      return null
    }
  }, [])

  const updateBookingStatus = useCallback(async (bookingId, status, shopOwnerId = null) => {
    try {
      const result = await bookingService.updateBookingStatus(bookingId, status)
      if (result.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  status: result.data.status,
                  updatedAt: result.data.updated_at,
                }
              : booking
          )
        )
        return { success: true }
      }
      return result
    } catch (error) {
      console.error('Error updating booking status:', error)
      return { success: false, error: error.message }
    }
  }, [])

  const getBookingsByShop = useCallback(
    (shopId) => {
      return bookings.filter((booking) => booking.shopId === shopId)
    },
    [bookings]
  )

  const getBookingsByCustomer = useCallback(
    (customerId) => {
      return bookings.filter((booking) => booking.customerId === customerId)
    },
    [bookings]
  )

  const getPendingBookings = useCallback((shopId) => {
    return bookings.filter(
      (booking) => booking.shopId === shopId && booking.status === 'pending'
    )
  }, [bookings])

  const getConfirmedBookings = useCallback((shopId) => {
    return bookings
      .filter((booking) => booking.shopId === shopId && booking.status === 'confirmed')
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`)
        const dateB = new Date(`${b.date}T${b.time}`)
        return dateA - dateB
      })
  }, [bookings])

  const getBookingHistory = useCallback((shopId) => {
    return bookings
      .filter(
        (booking) =>
          booking.shopId === shopId &&
          (booking.status === 'completed' || booking.status === 'cancelled')
      )
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt)
        const dateB = new Date(b.updatedAt || b.createdAt)
        return dateB - dateA
      })
  }, [bookings])

  const value = {
    bookings,
    loading,
    createBooking,
    updateBookingStatus,
    getBookingsByShop,
    getBookingsByCustomer,
    getPendingBookings,
    getConfirmedBookings,
    getBookingHistory,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

