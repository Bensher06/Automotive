// Data Model
let dashboardData = {
    sales: {
        current: 24500,
        previous: 21875, // For percentage calculation
    },
    profit: {
        current: 8750,
        previous: 8101,
    },
    mechanics: {
        available: 8,
        total: 12,
    },
    products: {
        total: 156,
        categories: {
            'Oil & Filters': 45,
            'Brake Parts': 32,
            'Batteries': 28,
            'Engine Parts': 25,
            'Tires': 26,
        }
    },
    notifications: [
        {
            id: 1,
            title: 'New Client Registration',
            description: 'Ana Cruz registered a Honda Civic for full service.',
            date: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            type: 'info',
            read: false
        },
        {
            id: 2,
            title: 'Task Completed',
            description: 'Brake repair for Yamaha YZF-R3 has been marked as complete.',
            date: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            type: 'success',
            read: false
        },
        {
            id: 3,
            title: 'System Alert',
            description: 'Front brake pads stock dropped below safe levels.',
            date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            type: 'warning',
            read: false
        },
        {
            id: 4,
            title: 'New Client Registration',
            description: 'Miguel Santos created an account for periodic maintenance.',
            date: new Date(Date.now() - 32 * 60 * 60 * 1000), // 32 hours ago
            type: 'info',
            read: true
        }
    ],
    transactions: [
        { id: 1, name: 'Oil Change Service', amount: 850, date: new Date(), type: 'car-service' },
        { id: 2, name: 'Brake Repair', amount: 940, date: new Date(Date.now() - 3 * 60 * 60 * 1000), type: 'brake-repair' },
        { id: 3, name: 'Battery Replacement', amount: 1200, date: new Date(Date.now() - 24 * 60 * 60 * 1000), type: 'battery' },
        { id: 4, name: 'Engine Diagnostic', amount: 950, date: new Date(Date.now() - 24 * 60 * 60 * 1000), type: 'diagnostic' },
    ],
    salesHistory: {
    7: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [2000, 3100, 2800, 4000, 3800, 4600, 4200]
    },
    30: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: [12000, 15000, 14000, 16000]
    },
    90: {
        labels: ['Month 1', 'Month 2', 'Month 3'],
        data: [45000, 50000, 48000]
        }
    },
    settings: {
        profitMargin: 35,
        autoCalculateProfit: true,
        autoUpdateSales: true,
        defaultSalesPeriod: 7
    }
};

// Chart instances
let salesChart = null;
let productsChart = null;
// Notification dropdown elements
let notificationsDropdownEl = null;
let notificationsBackdropEl = null;
let notificationsCurrentFilter = 'all';
let notificationsOpen = false;

// Load data from localStorage if available
function loadData() {
    const saved = localStorage.getItem('dashboardData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Restore dates properly
            if (parsed.transactions) {
                parsed.transactions = parsed.transactions.map(t => ({
                    ...t,
                    date: new Date(t.date),
                    status: t.status || 'pending' // Ensure status exists, default to pending
                }));
            }
            if (parsed.notifications) {
                parsed.notifications = parsed.notifications.map(n => ({
                    ...n,
                    date: new Date(n.date)
                }));
            }
            dashboardData = { ...dashboardData, ...parsed };
        } catch (e) {
            console.warn('Failed to load saved data:', e);
        }
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
}

// Calculate percentage change
function calculatePercentage(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
}

// Format currency
function formatCurrency(amount) {
    return `₱${amount.toLocaleString()}`;
}

// Format date
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days === 0) {
        if (hours === 0) return 'Just now';
        return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (days === 1) {
        return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (days < 7) {
        return `${days} days ago`;
    }
    return date.toLocaleDateString();
}

// Relative time for notifications
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return '1d ago';
    return `${diffDay}d ago`;
}

// Update all stat cards with input values and badges
function updateStatCards() {
    // Update Sales display and badge
    const salesPercent = calculatePercentage(dashboardData.sales.current, dashboardData.sales.previous);
    const salesDisplay = document.getElementById('sales-current-display');
    const salesBadge = document.getElementById('sales-badge');
    if (salesDisplay) salesDisplay.textContent = formatCurrency(dashboardData.sales.current);
    if (salesBadge) {
    salesBadge.textContent = `${salesPercent >= 0 ? '+' : ''}${salesPercent}%`;
        salesBadge.className = `stat-badge-pill ${salesPercent >= 0 ? 'positive' : 'negative'}`;
    }

    // Update Profit display and badge
    const profitPercent = calculatePercentage(dashboardData.profit.current, dashboardData.profit.previous);
    const profitDisplay = document.getElementById('profit-current-display');
    const profitBadge = document.getElementById('profit-badge');
    if (profitDisplay) profitDisplay.textContent = formatCurrency(dashboardData.profit.current);
    if (profitBadge) {
    profitBadge.textContent = `${profitPercent >= 0 ? '+' : ''}${profitPercent}%`;
        profitBadge.className = `stat-badge-pill ${profitPercent >= 0 ? 'positive' : 'negative'}`;
    }

    // Update Products display and badge
    const productsDisplay = document.getElementById('products-display');
    const productsBadge = document.getElementById('products-badge');
    if (productsDisplay) productsDisplay.textContent = dashboardData.products.total;
    if (productsBadge) productsBadge.textContent = dashboardData.products.total;
    
    // Update sales history based on current sales
    updateSalesHistory();
    
    // Update charts
    updateSalesChart();
    updateProductsChart();
    
    // Save data
    saveData();
}

// Sync input values with data model
function syncInputsToData() {
    const salesCurrent = document.getElementById('sales-current-input');
    const salesPrevious = document.getElementById('sales-previous-input');
    const profitCurrent = document.getElementById('profit-current-input');
    const profitPrevious = document.getElementById('profit-previous-input');
    const productsTotal = document.getElementById('products-total-input');
    const profitMarginInput = document.getElementById('profit-margin-input');
    const autoCalcProfit = document.getElementById('auto-calculate-profit');
    const autoUpdateSales = document.getElementById('auto-update-sales');
    const defaultSalesPeriod = document.getElementById('default-sales-period');

    if (salesCurrent) salesCurrent.value = dashboardData.sales.current;
    if (salesPrevious) salesPrevious.value = dashboardData.sales.previous;
    if (profitCurrent) profitCurrent.value = dashboardData.profit.current;
    if (profitPrevious) profitPrevious.value = dashboardData.profit.previous;
    if (productsTotal) productsTotal.value = dashboardData.products.total;

    // These controls live on the standalone Settings page; guard them in case
    if (profitMarginInput) profitMarginInput.value = dashboardData.settings.profitMargin;
    if (autoCalcProfit) autoCalcProfit.checked = dashboardData.settings.autoCalculateProfit;
    if (autoUpdateSales) autoUpdateSales.checked = dashboardData.settings.autoUpdateSales;
    if (defaultSalesPeriod) defaultSalesPeriod.value = dashboardData.settings.defaultSalesPeriod;
}

// Update sales history to reflect current sales
function updateSalesHistory() {
    const currentPeriod = parseInt(document.getElementById('sales-period')?.value || 7);
    const history = dashboardData.salesHistory[currentPeriod];
    if (history && history.data.length > 0) {
        // Scale the last value to match current sales (keeping proportions)
        const totalHistory = history.data.reduce((a, b) => a + b, 0);
        const scale = dashboardData.sales.current / (totalHistory / history.data.length);
        history.data = history.data.map(val => Math.round(val * scale));
    }
}

// Initialize Sales Chart
function initSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradientHeight = canvas.clientHeight || 300;
    const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight);
    gradient.addColorStop(0, 'rgba(74, 128, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(74, 128, 255, 0)');

    const currentPeriod = parseInt(document.getElementById('sales-period')?.value || 7);
    const chartData = dashboardData.salesHistory[currentPeriod] || dashboardData.salesHistory[7];

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Sales',
                data: chartData.data,
                backgroundColor: gradient,
                borderColor: '#4A80FF',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4A80FF',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#333',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label(context) {
                            return `Sales: ₱${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback(value) {
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
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Update Sales Chart
function updateSalesChart() {
    if (!salesChart) return;
    
    const currentPeriod = parseInt(document.getElementById('sales-period')?.value || 7);
    const chartData = dashboardData.salesHistory[currentPeriod] || dashboardData.salesHistory[7];
    
    salesChart.data.labels = chartData.labels;
    salesChart.data.datasets[0].data = chartData.data;
    salesChart.update();
}

// Initialize Products Chart
function initProductsChart() {
    const canvas = document.getElementById('productsChart');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const categories = Object.keys(dashboardData.products.categories);
    const data = Object.values(dashboardData.products.categories);
    const colors = ['#4A80FF', '#28a745', '#ffc107', '#dc3545', '#9B51E0'];
    const total = dashboardData.products.total;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, categories.length),
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
                
                // Draw total number
                ctx.font = '700 24px Poppins';
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(total.toString(), centerX, centerY - 8);
                
                // Draw label
                ctx.font = '500 12px Poppins';
                ctx.fillStyle = '#888';
                ctx.fillText('Total', centerX, centerY + 12);
                ctx.restore();
            }
        }],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
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
                        label(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update Products Chart
function updateProductsChart() {
    if (!productsChart) return;
    
    const categories = Object.keys(dashboardData.products.categories);
    const data = Object.values(dashboardData.products.categories);
    const colors = ['#4A80FF', '#28a745', '#ffc107', '#dc3545', '#9B51E0'];
    
    productsChart.data.labels = categories;
    productsChart.data.datasets[0].data = data;
    productsChart.data.datasets[0].backgroundColor = colors.slice(0, categories.length);
    productsChart.update();
}

// Update Transactions List
function updateTransactionsList() {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    container.innerHTML = '';

    const sortedTransactions = [...dashboardData.transactions]
        .sort((a, b) => b.date - a.date)
        .slice(0, 4); // Show only 4 most recent

    sortedTransactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.dataset.id = transaction.id;
        
        // Map transaction types to icons
        const iconMap = {
            'battery-replacement': 'fas fa-car-battery',
            'body-work': 'fas fa-hammer',
            'brake-service': 'fas fa-circle-stop',
            'clutch-replacement': 'fas fa-cog',
            'custom-modification': 'fas fa-wrench',
            'detailing-wash': 'fas fa-spray-can',
            'electrical-diagnostics': 'fas fa-bolt',
            'emergency-roadside': 'fas fa-truck',
            'engine-repair': 'fas fa-tools',
            'exhaust-system': 'fas fa-pipe',
            'filter-replacement': 'fas fa-filter',
            'general-tune-up': 'fas fa-sliders-h',
            'light-bulb-replacement': 'fas fa-lightbulb',
            'oil-change': 'fas fa-oil-can',
            'radiator-cooling-system': 'fas fa-temperature-high',
            'safety-inspection': 'fas fa-clipboard-check',
            'spark-plug-replacement': 'fas fa-bolt',
            'suspension-steering': 'fas fa-compass',
            'tire-rotation-balance': 'fas fa-circle',
            'transmission': 'fas fa-cogs',
            // Legacy types for backward compatibility
            'car-service': 'fas fa-car-side',
            'brake-repair': 'fas fa-cogs',
            'battery': 'fas fa-car-battery',
            'diagnostic': 'fas fa-search-plus'
        };
        
        const iconClass = iconMap[transaction.type] || 'fas fa-receipt';

        // Get status from transaction object, default to pending if not set
        let status = transaction.status || 'pending';
        let statusText = 'Pending';
        
        if (status === 'completed') {
            statusText = 'Completed';
        } else if (status === 'canceled') {
            statusText = 'Canceled';
        } else if (status === 'in-progress') {
            statusText = 'In Progress';
        } else {
            status = 'pending';
            statusText = 'Pending';
        }
        
        // Show action buttons only for pending items
        const showActionButtons = status === 'pending';

        item.innerHTML = `
            <div class="transaction-details">
                <div class="transaction-icon ${transaction.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="transaction-info">
                    <h4>${transaction.name}<span class="transaction-status ${status}">${statusText}</span></h4>
                    <p>${formatDate(transaction.date)}</p>
                </div>
            </div>
            <div class="transaction-actions">
                <div class="transaction-amount">+${formatCurrency(transaction.amount)}</div>
                <div class="transaction-controls">
                    ${showActionButtons ? `
                        <button class="transaction-status-btn transaction-done-btn" type="button" data-id="${transaction.id}" data-action="done" aria-label="Mark as Done">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="transaction-status-btn transaction-cancel-btn" type="button" data-id="${transaction.id}" data-action="cancel" aria-label="Mark as Canceled">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="transaction-edit-btn" type="button" data-id="${transaction.id}" aria-label="Edit Transaction">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="transaction-delete-btn" type="button" data-id="${transaction.id}" aria-label="Delete Transaction">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        container.appendChild(item);
    });

    // Add event listeners
    container.querySelectorAll('.transaction-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            openEditTransactionModal(id);
        });
    });

    container.querySelectorAll('.transaction-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            deleteTransaction(id);
        });
    });
    
    // Add event listeners for status buttons (Done/Cancel)
    container.querySelectorAll('.transaction-done-btn, .transaction-cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const action = e.currentTarget.dataset.action;
            updateTransactionStatus(id, action);
        });
    });

    // Recalculate sales from transactions if enabled
    if (dashboardData.settings.autoUpdateSales) {
        recalculateSales();
    }
}

// Update transaction status
function updateTransactionStatus(id, action) {
    const transaction = dashboardData.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Don't allow status change if already completed or canceled
    if (transaction.status === 'completed' || transaction.status === 'canceled') {
        return;
    }
    
    let newStatus = 'pending';
    let statusText = 'Pending';
    
    if (action === 'done') {
        newStatus = 'completed';
        statusText = 'Completed';
    } else if (action === 'cancel') {
        newStatus = 'canceled';
        statusText = 'Canceled';
    }
    
    // Update transaction status
    transaction.status = newStatus;
    
    // Add notification
    const notification = {
        id: Date.now(),
        title: `Order ${transaction.name} has been marked as ${statusText}`,
        description: `Transaction status updated to ${statusText}.`,
        date: new Date(),
        type: action === 'done' ? 'success' : 'warning',
        read: false
    };
    
    // Add to notifications array
    if (!dashboardData.notifications) {
        dashboardData.notifications = [];
    }
    dashboardData.notifications.unshift(notification);
    
    // Update notification badge
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const unread = dashboardData.notifications.filter(n => !n.read).length;
        if (unread > 0) {
            badge.textContent = unread;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Save data and update UI
    saveData();
    updateTransactionsList();
    
    // Refresh notifications dropdown if open
    if (notificationsDropdownEl && !notificationsDropdownEl.classList.contains('hidden')) {
        renderNotifications();
    }
}

// Recalculate sales from transactions
function recalculateSales() {
    const totalSales = dashboardData.transactions.reduce((sum, t) => sum + t.amount, 0);
    dashboardData.sales.previous = dashboardData.sales.current;
    dashboardData.sales.current = totalSales || dashboardData.sales.current;
    
    // Update profit if auto-calculate is enabled
    if (dashboardData.settings.autoCalculateProfit) {
        const profitMargin = dashboardData.settings.profitMargin / 100;
        dashboardData.profit.previous = dashboardData.profit.current;
        dashboardData.profit.current = Math.round(dashboardData.sales.current * profitMargin);
    }
    
    syncInputsToData();
    updateStatCards();
}

// Delete Transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        dashboardData.transactions = dashboardData.transactions.filter(t => t.id !== id);
        updateTransactionsList();
    }
}

// Modal Functions
function openModal(title, content) {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    overlay.classList.add('active');
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
}

// Settings Functions
function openSettings() {
    // Inline settings panel was removed; fall back to dedicated Settings page
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
        settingsSection.style.display = 'block';
    syncInputsToData();
        return;
    }
    // Navigate to standalone Settings page if no inline section is present
    window.location.href = 'SettingsPage.html';
}

function closeSettings() {
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
        settingsSection.style.display = 'none';
    }
}

// Edit Products Modal
function openEditProductsModal() {
    const categories = Object.entries(dashboardData.products.categories);
    const categoriesHtml = categories.map(([name, count], index) => `
        <div class="form-group">
            <label for="product-${index}">${name}</label>
            <input type="number" id="product-${index}" value="${count}" min="0" data-name="${name}" required>
        </div>
    `).join('');
    
    const content = `
        <form id="edit-products-form">
            <div class="form-group">
                <label for="products-total-modal">Total Products</label>
                <input type="number" id="products-total-modal" value="${dashboardData.products.total}" min="0" required>
                <small>Or edit individual categories below</small>
            </div>
            <hr>
            <h3>Product Categories</h3>
            ${categoriesHtml}
            <div class="form-group">
                <label for="new-category-name">Add New Category (Name)</label>
                <input type="text" id="new-category-name" placeholder="Category name">
            </div>
            <div class="form-group">
                <label for="new-category-count">Add New Category (Count)</label>
                <input type="number" id="new-category-count" min="0" placeholder="0">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Save</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    openModal('Edit Products', content);
    
    document.getElementById('edit-products-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Update existing categories
        const newCategories = {};
        categories.forEach(([name], index) => {
            const value = parseInt(document.getElementById(`product-${index}`).value) || 0;
            if (value > 0) {
                newCategories[name] = value;
            }
        });
        
        // Add new category if provided
        const newName = document.getElementById('new-category-name').value.trim();
        const newCount = parseInt(document.getElementById('new-category-count').value) || 0;
        if (newName && newCount > 0) {
            newCategories[newName] = newCount;
        }
        
        dashboardData.products.categories = newCategories;
        
        // Update total (either from input or sum of categories)
        const totalInput = parseInt(document.getElementById('products-total-modal').value) || 0;
        const categorySum = Object.values(newCategories).reduce((a, b) => a + b, 0);
        dashboardData.products.total = totalInput > categorySum ? totalInput : categorySum;
        
        document.getElementById('products-total-input').value = dashboardData.products.total;
        updateStatCards();
        closeModal();
    });
}

// Add/Edit Transaction Modal
function openAddTransactionModal() {
    const content = `
        <form id="add-transaction-form">
            <div class="form-group">
                <label for="transaction-name">Transaction Name</label>
                <input type="text" id="transaction-name" required placeholder="e.g., Oil Change Service">
            </div>
            <div class="form-group">
                <label for="transaction-amount">Amount (₱)</label>
                <input type="number" id="transaction-amount" min="0" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="transaction-type">Type</label>
                <select id="transaction-type" required size="1" style="max-height: 240px;">
                    <option value="battery-replacement">Battery Replacement</option>
                    <option value="body-work">Body Work</option>
                    <option value="brake-service">Brake Service</option>
                    <option value="clutch-replacement">Clutch Replacement</option>
                    <option value="custom-modification">Custom Modification</option>
                    <option value="detailing-wash">Detailing/Wash</option>
                    <option value="electrical-diagnostics">Electrical Diagnostics</option>
                    <option value="emergency-roadside">Emergency Roadside</option>
                    <option value="engine-repair">Engine Repair</option>
                    <option value="exhaust-system">Exhaust System</option>
                    <option value="filter-replacement">Filter Replacement</option>
                    <option value="general-tune-up">General Tune-up</option>
                    <option value="light-bulb-replacement">Light/Bulb Replacement</option>
                    <option value="oil-change">Oil Change</option>
                    <option value="radiator-cooling-system">Radiator/Cooling System</option>
                    <option value="safety-inspection">Safety Inspection</option>
                    <option value="spark-plug-replacement">Spark Plug Replacement</option>
                    <option value="suspension-steering">Suspension & Steering</option>
                    <option value="tire-rotation-balance">Tire Rotation/Balance</option>
                    <option value="transmission">Transmission</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Add Transaction</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    openModal('Add Transaction', content);
    
    // Make select dropdown scrollable - expand to show 7 items when focused
    const typeSelect = document.getElementById('transaction-type');
    if (typeSelect) {
        typeSelect.addEventListener('focus', function() {
            this.size = 7; // Show 7 items at a time
        });
        typeSelect.addEventListener('blur', function() {
            this.size = 1; // Collapse back to single line
        });
        typeSelect.addEventListener('change', function() {
            this.size = 1; // Collapse after selection
            this.blur(); // Remove focus
        });
    }
    
    document.getElementById('add-transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newTransaction = {
            id: Date.now(),
            name: document.getElementById('transaction-name').value,
            amount: parseFloat(document.getElementById('transaction-amount').value) || 0,
            type: document.getElementById('transaction-type').value,
            date: new Date(),
            status: 'pending' // Default status for new transactions
        };
        dashboardData.transactions.push(newTransaction);
        updateTransactionsList();
        closeModal();
    });
}

function openEditTransactionModal(id) {
    const transaction = dashboardData.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    const content = `
        <form id="edit-transaction-form">
            <div class="form-group">
                <label for="transaction-name-edit">Transaction Name</label>
                <input type="text" id="transaction-name-edit" value="${transaction.name}" required>
            </div>
            <div class="form-group">
                <label for="transaction-amount-edit">Amount (₱)</label>
                <input type="number" id="transaction-amount-edit" value="${transaction.amount}" min="0" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="transaction-type-edit">Type</label>
                <select id="transaction-type-edit" required size="1" style="max-height: 240px;">
                    <option value="battery-replacement" ${transaction.type === 'battery-replacement' ? 'selected' : ''}>Battery Replacement</option>
                    <option value="body-work" ${transaction.type === 'body-work' ? 'selected' : ''}>Body Work</option>
                    <option value="brake-service" ${transaction.type === 'brake-service' ? 'selected' : ''}>Brake Service</option>
                    <option value="clutch-replacement" ${transaction.type === 'clutch-replacement' ? 'selected' : ''}>Clutch Replacement</option>
                    <option value="custom-modification" ${transaction.type === 'custom-modification' ? 'selected' : ''}>Custom Modification</option>
                    <option value="detailing-wash" ${transaction.type === 'detailing-wash' ? 'selected' : ''}>Detailing/Wash</option>
                    <option value="electrical-diagnostics" ${transaction.type === 'electrical-diagnostics' ? 'selected' : ''}>Electrical Diagnostics</option>
                    <option value="emergency-roadside" ${transaction.type === 'emergency-roadside' ? 'selected' : ''}>Emergency Roadside</option>
                    <option value="engine-repair" ${transaction.type === 'engine-repair' ? 'selected' : ''}>Engine Repair</option>
                    <option value="exhaust-system" ${transaction.type === 'exhaust-system' ? 'selected' : ''}>Exhaust System</option>
                    <option value="filter-replacement" ${transaction.type === 'filter-replacement' ? 'selected' : ''}>Filter Replacement</option>
                    <option value="general-tune-up" ${transaction.type === 'general-tune-up' ? 'selected' : ''}>General Tune-up</option>
                    <option value="light-bulb-replacement" ${transaction.type === 'light-bulb-replacement' ? 'selected' : ''}>Light/Bulb Replacement</option>
                    <option value="oil-change" ${transaction.type === 'oil-change' ? 'selected' : ''}>Oil Change</option>
                    <option value="radiator-cooling-system" ${transaction.type === 'radiator-cooling-system' ? 'selected' : ''}>Radiator/Cooling System</option>
                    <option value="safety-inspection" ${transaction.type === 'safety-inspection' ? 'selected' : ''}>Safety Inspection</option>
                    <option value="spark-plug-replacement" ${transaction.type === 'spark-plug-replacement' ? 'selected' : ''}>Spark Plug Replacement</option>
                    <option value="suspension-steering" ${transaction.type === 'suspension-steering' ? 'selected' : ''}>Suspension & Steering</option>
                    <option value="tire-rotation-balance" ${transaction.type === 'tire-rotation-balance' ? 'selected' : ''}>Tire Rotation/Balance</option>
                    <option value="transmission" ${transaction.type === 'transmission' ? 'selected' : ''}>Transmission</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Save</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    openModal('Edit Transaction', content);
    
    // Make select dropdown scrollable
    const typeSelectEdit = document.getElementById('transaction-type-edit');
    if (typeSelectEdit) {
        typeSelectEdit.addEventListener('focus', function() {
            this.size = 7; // Show 7 items at a time
        });
        typeSelectEdit.addEventListener('blur', function() {
            this.size = 1; // Collapse back to single line
        });
        typeSelectEdit.addEventListener('change', function() {
            this.size = 1; // Collapse after selection
            this.blur(); // Remove focus
        });
    }
    
    document.getElementById('edit-transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        transaction.name = document.getElementById('transaction-name-edit').value;
        transaction.amount = parseFloat(document.getElementById('transaction-amount-edit').value) || 0;
        transaction.type = document.getElementById('transaction-type-edit').value;
        updateTransactionsList();
        closeModal();
    });
}

// Make functions available globally
window.closeModal = closeModal;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Sync inputs with loaded data
    syncInputsToData();
    
    // Initialize charts
    salesChart = initSalesChart();
    productsChart = initProductsChart();
    
    // Update all UI elements
    updateStatCards();
    updateTransactionsList();
    
    // Setup inline input handlers
    setupInlineInputs();
    setupSettingsHandlers();
    setupActionButtons();
    setupModalClose();
    setupSalesPeriodSelect();
    setupDataManagement();
    setupNotifications();
});

// Notifications
function setupNotifications() {
    const bellBtn = document.querySelector('.notification-bell');
    const badge = document.querySelector('.notification-badge');

    const updateBadge = () => {
        if (!badge) return;
        const unread = dashboardData.notifications
            ? dashboardData.notifications.filter(n => !n.read).length
            : 0;
        if (unread > 0) {
            badge.textContent = unread;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    };

    updateBadge();

    if (bellBtn) {
        bellBtn.addEventListener('click', () => {
            // Toggle dropdown visibility
            if (notificationsOpen) {
                closeNotificationsDropdown();
            } else {
                openNotificationsDropdown(bellBtn, badge, updateBadge);
            }
        });
    }
}

function ensureNotificationsElements() {
    if (!notificationsDropdownEl) {
        notificationsDropdownEl = document.createElement('div');
        notificationsDropdownEl.className = 'notifications-dropdown hidden';
        notificationsDropdownEl.innerHTML = `
            <div class="notifications-dropdown-inner">
                <header class="notifications-dropdown-header">
                    <h3>Notifications</h3>
                </header>
                <div class="notifications-tabs">
                    <button type="button" class="notifications-tab active" data-filter="all">All</button>
                    <button type="button" class="notifications-tab" data-filter="unread">Unread</button>
                </div>
                <div class="notifications-groups">
                    <!-- Groups will be rendered here -->
                </div>
            </div>
        `;
        document.body.appendChild(notificationsDropdownEl);

        notificationsBackdropEl = document.createElement('div');
        notificationsBackdropEl.className = 'notifications-backdrop hidden';
        document.body.appendChild(notificationsBackdropEl);

        // Close on backdrop click
        notificationsBackdropEl.addEventListener('click', () => {
            closeNotificationsDropdown();
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && notificationsOpen) {
                closeNotificationsDropdown();
            }
        });

        // Tabs
        notificationsDropdownEl.querySelectorAll('.notifications-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                notificationsDropdownEl.querySelectorAll('.notifications-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                notificationsCurrentFilter = tab.dataset.filter || 'all';
                renderNotificationsDropdown();
            });
        });
    }
}

function openNotificationsDropdown(bellBtn, badge, updateBadge) {
    ensureNotificationsElements();

    // Mark all visible notifications as read when opening "All"
    if (dashboardData.notifications && notificationsCurrentFilter === 'all') {
        dashboardData.notifications = dashboardData.notifications.map(n => ({
            ...n,
            read: true
        }));
        saveData();
        updateBadge();
    }

    renderNotificationsDropdown();

    // Position dropdown under the bell
    const rect = bellBtn.getBoundingClientRect();
    const dropdown = notificationsDropdownEl;
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 8}px`;
    // Align right edge with bell right edge, with small offset from viewport edge
    const rightOffset = Math.max(12, window.innerWidth - rect.right - 8);
    dropdown.style.right = `${rightOffset}px`;

    dropdown.classList.remove('hidden');
    notificationsBackdropEl.classList.remove('hidden');
    notificationsOpen = true;
}

function closeNotificationsDropdown() {
    if (!notificationsDropdownEl || !notificationsBackdropEl) return;
    notificationsDropdownEl.classList.add('hidden');
    notificationsBackdropEl.classList.add('hidden');
    notificationsOpen = false;
}

function renderNotificationsDropdown() {
    if (!notificationsDropdownEl) return;
    const container = notificationsDropdownEl.querySelector('.notifications-groups');
    if (!container) return;

    let items = (dashboardData.notifications || []).slice().sort((a, b) => b.date - a.date);
    if (notificationsCurrentFilter === 'unread') {
        items = items.filter(n => !n.read);
    }

    if (items.length === 0) {
        container.innerHTML = '<p class="notifications-empty">No system activity yet.</p>';
        return;
    }

    const now = new Date();
    const fourHoursMs = 4 * 60 * 60 * 1000;
    const newItems = items.filter(n => now - n.date <= fourHoursMs);
    const earlierItems = items.filter(n => now - n.date > fourHoursMs);

    const renderGroup = (title, groupItems) => {
        if (!groupItems.length) return '';
        const listHtml = groupItems.map(n => {
            const typeIcon = n.type === 'success'
                ? '<i class="fas fa-check-circle"></i>'
                : n.type === 'warning'
                    ? '<i class="fas fa-exclamation-triangle"></i>'
                    : '<i class="fas fa-user"></i>';
            const unreadClass = n.read ? '' : ' notification-unread';
            return `
                <li class="notification-item${unreadClass}">
                    <div class="notification-avatar">
                        ${typeIcon}
                    </div>
                    <div class="notification-content">
                        <p class="notification-title">${n.title}</p>
                        <p class="notification-text">${n.description}</p>
                        <span class="notification-time">${formatRelativeTime(n.date)}</span>
                    </div>
                    ${n.read ? '' : '<span class="notification-dot"></span>'}
                </li>
            `;
        }).join('');

        return `
            <section class="notifications-group">
                <h4 class="notifications-group-title">${title}</h4>
                <ul class="notifications-list">
                    ${listHtml}
                </ul>
            </section>
        `;
    };

    container.innerHTML = `
        ${renderGroup('New', newItems)}
        ${renderGroup('Earlier', earlierItems)}
    `;
}

// Setup inline input handlers
function setupInlineInputs() {
    // Sales inputs (hidden, but still functional for data binding)
    const salesCurrentInput = document.getElementById('sales-current-input');
    if (salesCurrentInput) {
        salesCurrentInput.addEventListener('input', (e) => {
        dashboardData.sales.current = parseFloat(e.target.value) || 0;
        if (dashboardData.settings.autoCalculateProfit) {
            const profitMargin = dashboardData.settings.profitMargin / 100;
            dashboardData.profit.current = Math.round(dashboardData.sales.current * profitMargin);
                const profitInput = document.getElementById('profit-current-input');
                if (profitInput) profitInput.value = dashboardData.profit.current;
        }
        updateStatCards();
    });
    }

    const salesPreviousInput = document.getElementById('sales-previous-input');
    if (salesPreviousInput) {
        salesPreviousInput.addEventListener('input', (e) => {
        dashboardData.sales.previous = parseFloat(e.target.value) || 0;
        updateStatCards();
    });
    }

    // Profit inputs
    const profitCurrentInput = document.getElementById('profit-current-input');
    if (profitCurrentInput) {
        profitCurrentInput.addEventListener('input', (e) => {
        dashboardData.profit.current = parseFloat(e.target.value) || 0;
        updateStatCards();
    });
    }

    const profitPreviousInput = document.getElementById('profit-previous-input');
    if (profitPreviousInput) {
        profitPreviousInput.addEventListener('input', (e) => {
        dashboardData.profit.previous = parseFloat(e.target.value) || 0;
        updateStatCards();
    });
    }

    // Mechanics inputs

    // Products input
    const productsTotalInput = document.getElementById('products-total-input');
    if (productsTotalInput) {
        productsTotalInput.addEventListener('input', (e) => {
        dashboardData.products.total = parseInt(e.target.value) || 0;
        updateStatCards();
    });
    }
}

// Setup settings handlers
function setupSettingsHandlers() {
    // Settings button
    document.querySelector('[data-action="open-settings"]')?.addEventListener('click', openSettings);
    document.querySelector('[data-action="close-settings"]')?.addEventListener('click', closeSettings);

    // Profit margin
    const profitMarginInput = document.getElementById('profit-margin-input');
    if (profitMarginInput) {
        profitMarginInput.addEventListener('input', (e) => {
        dashboardData.settings.profitMargin = parseFloat(e.target.value) || 35;
        saveData();
    });
    }

    // Auto-calculate checkboxes
    const autoCalcProfit = document.getElementById('auto-calculate-profit');
    if (autoCalcProfit) {
        autoCalcProfit.addEventListener('change', (e) => {
        dashboardData.settings.autoCalculateProfit = e.target.checked;
        if (e.target.checked) {
            recalculateSales();
        }
        saveData();
    });
    }

    const autoUpdateSales = document.getElementById('auto-update-sales');
    if (autoUpdateSales) {
        autoUpdateSales.addEventListener('change', (e) => {
        dashboardData.settings.autoUpdateSales = e.target.checked;
        saveData();
    });
    }

    // Default sales period
    const defaultSalesPeriod = document.getElementById('default-sales-period');
    if (defaultSalesPeriod) {
        defaultSalesPeriod.addEventListener('change', (e) => {
        dashboardData.settings.defaultSalesPeriod = parseInt(e.target.value) || 7;
            const salesPeriodSelect = document.getElementById('sales-period');
            if (salesPeriodSelect) {
                salesPeriodSelect.value = dashboardData.settings.defaultSalesPeriod;
        updateSalesChart();
            }
        saveData();
    });
    }
}

// Global function to toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
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

function setupActionButtons() {
    // Handle all action buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            switch(action) {
                case 'add-transaction':
                    openAddTransactionModal();
                    break;
                case 'edit-products':
                    openEditProductsModal();
                    break;
                case 'open-settings':
                    // Close sidebar if open, then open settings
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar && sidebar.classList.contains('active')) {
                        toggleSidebar();
                    }
                    openSettings();
                    // Scroll to settings section
                    setTimeout(() => {
                        const settingsSection = document.getElementById('settings-section');
                        if (settingsSection) {
                            settingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                    break;
                case 'close-settings':
                    closeSettings();
                    break;
                case 'view-reports':
                    // Reports feature - could open a modal
                    alert('Reports feature coming soon!');
                    break;
            }
        });
    });

    // Handle menu toggle button to show/hide sidebar
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    // Toggle sidebar when sidebar toggle button is clicked
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    // Close sidebar when overlay is clicked
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

    // Prevent any navigation from stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Only prevent if clicking on the card itself, not on inputs
            if (!e.target.closest('input') && !e.target.closest('button')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
}

function setupModalClose() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.querySelector('.modal-close');
    
    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeModal();
        }
    });
}

function setupSalesPeriodSelect() {
    const salesPeriodSelect = document.getElementById('sales-period');
    if (!salesPeriodSelect || !salesChart) return;

    salesPeriodSelect.addEventListener('change', () => {
        updateSalesChart();
    });
}

function setupDataManagement() {
    // These controls only exist on the dedicated Settings page,
    // so we guard each one before attaching listeners.
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-data-file');
    const resetBtn = document.getElementById('reset-data-btn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(dashboardData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dashboard-data.json';
        link.click();
        URL.revokeObjectURL(url);
    });
    }

    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    dashboardData = { ...dashboardData, ...imported };
                    if (imported.transactions) {
                        dashboardData.transactions = imported.transactions.map(t => ({
                            ...t,
                            date: new Date(t.date)
                        }));
                    }
                    syncInputsToData();
                    updateStatCards();
                    updateTransactionsList();
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Error importing data: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    });
    }

    // Success modal functions
    function showSuccessModal() {
        const modal = document.getElementById('success-modal-overlay');
        if (modal) {
            modal.classList.add('active');
        }
    }

    function hideSuccessModal() {
        const modal = document.getElementById('success-modal-overlay');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Setup success modal OK button
    const successModalOkBtn = document.getElementById('success-modal-ok-btn');
    if (successModalOkBtn) {
        successModalOkBtn.addEventListener('click', () => {
            hideSuccessModal();
            window.location.reload();
        });
    }

    // Close success modal on backdrop click
    const successModalOverlay = document.getElementById('success-modal-overlay');
    if (successModalOverlay) {
        successModalOverlay.addEventListener('click', (e) => {
            if (e.target === successModalOverlay) {
                hideSuccessModal();
                window.location.reload();
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Reset Sales to 0
            dashboardData.sales.current = 0;
            dashboardData.sales.previous = 0;
            
            // Reset Profit to 0
            dashboardData.profit.current = 0;
            dashboardData.profit.previous = 0;
            
            // Clear all transactions
            dashboardData.transactions = [];
            
            // Reset sales history data to zeros
            Object.keys(dashboardData.salesHistory).forEach(period => {
                if (dashboardData.salesHistory[period] && dashboardData.salesHistory[period].data) {
                    dashboardData.salesHistory[period].data = dashboardData.salesHistory[period].data.map(() => 0);
                }
            });
            
            // Save to localStorage
            saveData();
            
            // Show success modal
            showSuccessModal();
        });
    }
}
