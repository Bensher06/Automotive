/**
 * Booking Manager Page Functionality
 * Handles booking management with tabs and actions
 */

// Mock data for motorcycle shop bookings
const mockBookings = [
    // Pending bookings
    {
        id: 'b001',
        customerName: 'John Martinez',
        customerPhone: '+1 (555) 234-5678',
        serviceType: 'Brake Pad Replacement',
        serviceIcon: 'repair',
        date: '2024-01-15',
        time: '10:00',
        notes: 'Front brake pads making squeaking noise. Please check rotors as well.',
        status: 'pending',
        createdAt: new Date('2024-01-10T08:30:00')
    },
    {
        id: 'b002',
        customerName: 'Sarah Chen',
        customerPhone: '+1 (555) 345-6789',
        serviceType: 'Tire Change',
        serviceIcon: 'tire',
        date: '2024-01-16',
        time: '14:30',
        notes: 'Need to replace rear tire. Prefer Michelin brand if available.',
        status: 'pending',
        createdAt: new Date('2024-01-11T10:15:00')
    },
    {
        id: 'b003',
        customerName: 'Michael Rodriguez',
        customerPhone: '+1 (555) 456-7890',
        serviceType: 'Oil Change',
        serviceIcon: 'oil',
        date: '2024-01-17',
        time: '09:00',
        notes: 'Regular maintenance. Synthetic oil preferred.',
        status: 'pending',
        createdAt: new Date('2024-01-12T14:20:00')
    },
    {
        id: 'b004',
        customerName: 'Emily Johnson',
        customerPhone: '+1 (555) 567-8901',
        serviceType: 'Vehicle Inspection',
        serviceIcon: 'inspection',
        date: '2024-01-18',
        time: '11:00',
        notes: 'Annual safety inspection required for registration renewal.',
        status: 'pending',
        createdAt: new Date('2024-01-13T09:45:00')
    },
    // Confirmed bookings
    {
        id: 'b005',
        customerName: 'David Kim',
        customerPhone: '+1 (555) 678-9012',
        serviceType: 'Chain Replacement',
        serviceIcon: 'repair',
        date: '2024-01-14',
        time: '13:00',
        notes: 'Chain is loose and making noise. Need full replacement.',
        status: 'confirmed',
        createdAt: new Date('2024-01-08T16:00:00')
    },
    {
        id: 'b006',
        customerName: 'Lisa Anderson',
        customerPhone: '+1 (555) 789-0123',
        serviceType: 'Battery Replacement',
        serviceIcon: 'repair',
        date: '2024-01-15',
        time: '15:30',
        notes: 'Battery not holding charge. Need new one installed.',
        status: 'confirmed',
        createdAt: new Date('2024-01-09T11:30:00')
    },
    {
        id: 'b007',
        customerName: 'Robert Taylor',
        customerPhone: '+1 (555) 890-1234',
        serviceType: 'Suspension Tune-up',
        serviceIcon: 'maintenance',
        date: '2024-01-16',
        time: '10:00',
        notes: 'Front suspension feels soft. Please check and adjust.',
        status: 'confirmed',
        createdAt: new Date('2024-01-10T13:15:00')
    },
    {
        id: 'b008',
        customerName: 'Jennifer White',
        customerPhone: '+1 (555) 901-2345',
        serviceType: 'Spark Plug Replacement',
        serviceIcon: 'maintenance',
        date: '2024-01-17',
        time: '14:00',
        notes: 'Routine maintenance. Replace all 4 spark plugs.',
        status: 'confirmed',
        createdAt: new Date('2024-01-11T08:00:00')
    },
    // Completed bookings
    {
        id: 'b009',
        customerName: 'James Wilson',
        customerPhone: '+1 (555) 012-3456',
        serviceType: 'Brake Fluid Flush',
        serviceIcon: 'maintenance',
        date: '2024-01-05',
        time: '10:00',
        notes: 'Brake fluid change and system flush.',
        status: 'completed',
        createdAt: new Date('2024-01-01T09:00:00'),
        completedAt: new Date('2024-01-05T11:30:00')
    },
    {
        id: 'b010',
        customerName: 'Maria Garcia',
        customerPhone: '+1 (555) 123-4567',
        serviceType: 'Air Filter Replacement',
        serviceIcon: 'maintenance',
        date: '2024-01-06',
        time: '14:30',
        notes: 'Replace air filter and clean air box.',
        status: 'completed',
        createdAt: new Date('2024-01-02T10:20:00'),
        completedAt: new Date('2024-01-06T15:00:00')
    },
    {
        id: 'b011',
        customerName: 'Thomas Brown',
        customerPhone: '+1 (555) 234-5678',
        serviceType: 'Clutch Adjustment',
        serviceIcon: 'repair',
        date: '2024-01-07',
        time: '09:00',
        notes: 'Clutch feels too tight. Need adjustment.',
        status: 'completed',
        createdAt: new Date('2024-01-03T14:00:00'),
        completedAt: new Date('2024-01-07T10:15:00')
    },
    // Cancelled bookings
    {
        id: 'b012',
        customerName: 'Patricia Davis',
        customerPhone: '+1 (555) 345-6789',
        serviceType: 'Exhaust System Repair',
        serviceIcon: 'repair',
        date: '2024-01-08',
        time: '11:00',
        notes: 'Exhaust pipe has a hole. Need welding or replacement.',
        status: 'cancelled',
        createdAt: new Date('2024-01-04T12:00:00'),
        cancelledAt: new Date('2024-01-07T16:30:00')
    },
    {
        id: 'b013',
        customerName: 'Christopher Lee',
        customerPhone: '+1 (555) 456-7890',
        serviceType: 'Headlight Bulb Replacement',
        serviceIcon: 'repair',
        date: '2024-01-09',
        time: '13:00',
        notes: 'Left headlight bulb burned out.',
        status: 'cancelled',
        createdAt: new Date('2024-01-05T08:30:00'),
        cancelledAt: new Date('2024-01-08T10:00:00')
    }
];

// Storage key for bookings
const BOOKINGS_STORAGE_KEY = 'shopBookings';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize bookings (load from localStorage or use mock data)
    let bookings = loadBookings();
    if (bookings.length === 0) {
        bookings = mockBookings;
        saveBookings(bookings);
    }

    // Tab functionality
    const tabs = document.querySelectorAll('.booking-tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active panel
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById(`${targetTab}-panel`).classList.add('active');

            // Render bookings for active tab
            renderBookings(bookings, targetTab);
        });
    });

    // Initial render
    renderBookings(bookings, 'incoming');

    // Handle approve/reject actions
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-approve')) {
            const bookingId = e.target.closest('.btn-approve').dataset.id;
            approveBooking(bookingId, bookings);
        } else if (e.target.closest('.btn-reject')) {
            const bookingId = e.target.closest('.btn-reject').dataset.id;
            rejectBooking(bookingId, bookings);
        }
    });
});

function loadBookings() {
    try {
        const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Convert date strings back to Date objects
            return parsed.map(booking => ({
                ...booking,
                createdAt: booking.createdAt ? new Date(booking.createdAt) : null,
                completedAt: booking.completedAt ? new Date(booking.completedAt) : null,
                cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null
            }));
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
    return [];
}

function saveBookings(bookings) {
    try {
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    } catch (error) {
        console.error('Error saving bookings:', error);
    }
}

function renderBookings(bookings, tab) {
    let filteredBookings = [];
    const listContainer = document.getElementById(`${tab}-list`);

    // Filter bookings based on tab
    switch (tab) {
        case 'incoming':
            filteredBookings = bookings.filter(b => b.status === 'pending');
            updateIncomingBadge(filteredBookings.length);
            break;
        case 'upcoming':
            filteredBookings = bookings
                .filter(b => b.status === 'confirmed')
                .sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return dateA - dateB;
                });
            break;
        case 'history':
            filteredBookings = bookings
                .filter(b => b.status === 'completed' || b.status === 'cancelled')
                .sort((a, b) => {
                    const dateA = a.completedAt || a.cancelledAt || new Date(`${a.date}T${a.time}`);
                    const dateB = b.completedAt || b.cancelledAt || new Date(`${b.date}T${b.time}`);
                    return dateB - dateA; // Most recent first
                });
            break;
    }

    if (filteredBookings.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No bookings found</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filteredBookings.map(booking => createBookingCard(booking, tab)).join('');
}

function createBookingCard(booking, tab) {
    const dateTime = new Date(`${booking.date}T${booking.time}`);
    const formattedDate = dateTime.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
    const formattedTime = dateTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });

    let actionsHTML = '';
    if (tab === 'incoming' && booking.status === 'pending') {
        actionsHTML = `
            <div class="booking-actions">
                <button class="btn-approve" data-id="${booking.id}">
                    <i class="fas fa-check"></i>
                    Approve
                </button>
                <button class="btn-reject" data-id="${booking.id}">
                    <i class="fas fa-times"></i>
                    Reject
                </button>
            </div>
        `;
    } else {
        actionsHTML = `
            <div class="booking-actions">
                <div class="booking-date-display">
                    <div class="date">${formattedDate}</div>
                    <div class="time">${formattedTime}</div>
                </div>
            </div>
        `;
    }

    return `
        <div class="booking-item" data-id="${booking.id}">
            <div class="booking-details">
                <div class="booking-icon ${booking.serviceIcon}">
                    <i class="fas fa-wrench"></i>
                </div>
                <div class="booking-info">
                    <h4>
                        ${booking.serviceType}
                        <span class="booking-status ${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                    </h4>
                    <p class="booking-customer">
                        <i class="fas fa-user"></i> ${booking.customerName}
                    </p>
                    <p>
                        <i class="fas fa-phone"></i> ${booking.customerPhone}
                    </p>
                    ${booking.notes ? `<p style="margin-top: 8px; font-style: italic; color: var(--color-text-secondary);">${booking.notes}</p>` : ''}
                </div>
            </div>
            ${actionsHTML}
        </div>
    `;
}

function updateIncomingBadge(count) {
    const badge = document.getElementById('incoming-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function approveBooking(bookingId, bookings) {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'pending') {
        booking.status = 'confirmed';
        saveBookings(bookings);
        
        // Re-render all tabs
        const activeTab = document.querySelector('.booking-tab.active');
        const currentTab = activeTab ? activeTab.dataset.tab : 'incoming';
        renderBookings(bookings, currentTab);
        
        // Show success message
        alert(`Booking approved! ${booking.customerName}'s ${booking.serviceType} is now confirmed for ${booking.date} at ${booking.time}.`);
    }
}

function rejectBooking(bookingId, bookings) {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'pending') {
        if (confirm(`Are you sure you want to reject ${booking.customerName}'s booking for ${booking.serviceType}?`)) {
            booking.status = 'cancelled';
            booking.cancelledAt = new Date();
            saveBookings(bookings);
            
            // Re-render all tabs
            const activeTab = document.querySelector('.booking-tab.active');
            const currentTab = activeTab ? activeTab.dataset.tab : 'incoming';
            renderBookings(bookings, currentTab);
            
            alert(`Booking rejected. ${booking.customerName} has been notified.`);
        }
    }
}

