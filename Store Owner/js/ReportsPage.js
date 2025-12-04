// Reports Page JavaScript

// Sample data for reports
const reportsData = {
    revenue: {
        total: 125450,
        growth: 12.5,
        parts: 78450,
        labor: 47000
    },
    profit: {
        net: 43907,
        cogs: 81543
    },
    services: {
        count: 142,
        breakdown: {
            'Oil Change': 45,
            'Brake Adjustment': 32,
            'Tire Replacement': 28,
            'Chain Maintenance': 18,
            'Battery Replacement': 19
        }
    },
    channels: {
        online: 30,
        instore: 70
    },
    topParts: [
        { name: 'Motul Oil 10W-40', quantity: 125, revenue: 18750 },
        { name: 'Michelin Road 5 Tire', quantity: 48, revenue: 19200 },
        { name: 'Brake Pad Set Front', quantity: 62, revenue: 12400 },
        { name: 'Chain & Sprocket Kit', quantity: 35, revenue: 10500 },
        { name: 'Air Filter OEM', quantity: 89, revenue: 4450 }
    ],
    dailyRevenue: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        parts: [8500, 9200, 7800, 11000, 10500, 12800, 10250],
        labor: [5200, 5800, 4900, 6800, 6500, 7800, 6200]
    }
};

// Chart instances
let revenueBreakdownChart = null;
let salesChannelChart = null;

// Format currency
function formatCurrency(amount) {
    return `₱${amount.toLocaleString()}`;
}

// Initialize Revenue Breakdown Chart (Stacked Bar)
function initRevenueBreakdownChart() {
    const canvas = document.getElementById('revenueBreakdownChart');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: reportsData.dailyRevenue.labels,
            datasets: [
                {
                    label: 'Parts Sales',
                    data: reportsData.dailyRevenue.parts,
                    backgroundColor: '#4A80FF',
                    borderRadius: 4,
                },
                {
                    label: 'Labor/Service Fees',
                    data: reportsData.dailyRevenue.labor,
                    backgroundColor: '#28a745',
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 15,
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#333',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000) {
                                return (value / 1000) + 'k';
                            }
                            return value;
                        }
                    },
                    grid: {
                        drawBorder: false,
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}

// Initialize Sales Channel Chart (Donut)
function initSalesChannelChart() {
    const canvas = document.getElementById('salesChannelChart');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const onlinePercent = reportsData.channels.online;
    const instorePercent = reportsData.channels.instore;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Online Orders', 'Walk-in Customers'],
            datasets: [{
                data: [onlinePercent, instorePercent],
                backgroundColor: ['#4A80FF', '#28a745'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: (chart) => {
                const { ctx, chartArea } = chart;
                ctx.save();
                const centerX = (chartArea.left + chartArea.right) / 2;
                const centerY = (chartArea.top + chartArea.bottom) / 2;
                
                ctx.font = '700 24px Poppins';
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${onlinePercent}%`, centerX, centerY - 8);
                
                ctx.font = '500 12px Poppins';
                ctx.fillStyle = '#888';
                ctx.fillText('Online', centerX, centerY + 12);
                ctx.restore();
            }
        }],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#333',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// Populate Top Parts Table
function populateTopPartsTable() {
    const tbody = document.getElementById('top-parts-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    reportsData.topParts.forEach((part, index) => {
        const row = document.createElement('tr');
        const rank = index + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        
        row.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${rank}</span></td>
            <td><strong>${part.name}</strong></td>
            <td>${part.quantity} units</td>
            <td><strong>${formatCurrency(part.revenue)}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

// Populate Top Services Table
function populateTopServicesTable() {
    const tbody = document.getElementById('top-services-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const services = Object.entries(reportsData.services.breakdown)
        .map(([name, count]) => ({
            name,
            count,
            revenue: count * 850 // Average service price
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    services.forEach((service, index) => {
        const row = document.createElement('tr');
        const rank = index + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        
        row.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${rank}</span></td>
            <td><strong>${service.name}</strong></td>
            <td>${service.count} times</td>
            <td><strong>${formatCurrency(service.revenue)}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

// Update summary cards
function updateSummaryCards() {
    // Total Revenue
    const revenueEl = document.getElementById('total-revenue');
    if (revenueEl) revenueEl.textContent = formatCurrency(reportsData.revenue.total);
    
    const revenueBadge = document.getElementById('revenue-badge');
    if (revenueBadge) {
        revenueBadge.textContent = `+${reportsData.revenue.growth}%`;
    }

    // Net Profit
    const profitEl = document.getElementById('net-profit');
    if (profitEl) profitEl.textContent = formatCurrency(reportsData.profit.net);

    // Service Efficiency
    const serviceEl = document.getElementById('service-count');
    if (serviceEl) serviceEl.textContent = reportsData.services.count;

    // Online vs Instore
    const onlineEl = document.getElementById('online-ratio');
    if (onlineEl) onlineEl.textContent = `${reportsData.channels.online}%`;
}

// Handle date range change
function handleDateRangeChange() {
    const dateRangeSelect = document.getElementById('date-range');
    if (!dateRangeSelect) return;

    dateRangeSelect.addEventListener('change', (e) => {
        const period = e.target.value;
        console.log(`Date range changed to: ${period} days`);
        // Here you would fetch new data based on the selected period
        // For now, we'll just log it
        // In a real app, you'd update reportsData and re-render charts/tables
    });
}


// Sidebar toggle functionality
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.querySelector('.menu-toggle');

    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('active');
            }
            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            toggleSidebar();
        });
    }

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    // Setup sidebar
    setupSidebarToggle();

    // Initialize charts
    revenueBreakdownChart = initRevenueBreakdownChart();
    salesChannelChart = initSalesChannelChart();

    // Populate tables
    populateTopPartsTable();
    populateTopServicesTable();

    // Update summary cards
    updateSummaryCards();

    // Setup event handlers
    handleDateRangeChange();
});

