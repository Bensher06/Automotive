document.addEventListener('DOMContentLoaded', () => {

    // --- Sidebar Toggle ---
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const body = document.body;

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            body.classList.toggle('sidebar-collapsed');
        });
    }

    // Update dashboard part icons dynamically using the mapping function
    const dashboardPartItems = document.querySelectorAll('.list-body .part-item');
    dashboardPartItems.forEach(item => {
        const partName = item.querySelector('.part-info h4').textContent;
        const iconElement = item.querySelector('.part-icon i');
        if (partName && iconElement) {
            const iconClass = getPartIcon(partName);
            iconElement.className = `fa-solid ${iconClass}`;
        }
    });

    // --- Search Functionality ---
    const searchInput = document.querySelector('.search-bar input');
    const partItems = document.querySelectorAll('.part-item');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            partItems.forEach(item => {
                const partName = item.querySelector('.part-info h4').textContent.toLowerCase();
                const partSku = item.querySelector('.part-info p').textContent.toLowerCase();
                if (partName.includes(searchTerm) || partSku.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = searchTerm === '' ? 'flex' : 'none';
                }
            });
        });
    }

    // --- Filter Tab Listeners ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add 'active' class to the clicked button
            button.classList.add('active');
            
            // Filter parts by category
            const filterType = button.textContent.toLowerCase();
            partItems.forEach(item => {
                if (filterType === 'all parts') {
                    item.style.display = 'flex';
                } else {
                    // Simple category matching - you can enhance this with data attributes
                    const partName = item.querySelector('.part-info h4').textContent.toLowerCase();
                    const categoryMap = {
                        'engine': ['oil', 'filter', 'spark', 'plug'],
                        'brakes': ['brake', 'pad'],
                        'tires': ['tire', 'wheel']
                    };
                    
                    const keywords = categoryMap[filterType] || [];
                    const matches = keywords.some(keyword => partName.includes(keyword));
                    item.style.display = matches ? 'flex' : 'none';
                }
            });
            console.log(`Filtering by: ${button.textContent}`);
        });
    });

    // --- Other Clickable Element Listeners ---
    const criticalAlert = document.querySelector('.critical-alert');
    if (criticalAlert) {
        criticalAlert.addEventListener('click', () => {
            alert('Showing 12 parts that need restocking...');
        });
    }

    // --- View All Modal Functionality ---
    const viewAllLink = document.querySelector('.view-all-link');
    const modalOverlay = document.getElementById('parts-modal-overlay');
    const modalClose = document.getElementById('parts-modal-close');
    const modalBody = document.getElementById('parts-modal-body');

    // Icon mapping function - returns appropriate Font Awesome icon based on product name
    function getPartIcon(productName) {
        const name = productName.toLowerCase();
        
        // Specific mappings for requested items
        const iconMap = {
            // Engine Oil Filter -> oil/filter icon
            'engine oil filter': 'fa-oil-can',
            
            // Brake Pads Front -> brake/disc icon
            'brake pads front': 'fa-circle',
            'brake pads': 'fa-circle',
            'brake': 'fa-circle',
            
            // Spark Plug Set -> spark plug/lightning/ignition icon
            'spark plug set': 'fa-bolt',
            'spark plug': 'fa-bolt',
            'spark': 'fa-bolt',
            
            // Chain & Sprocket Kit -> chain link/gear icon
            'chain & sprocket kit': 'fa-link',
            'chain': 'fa-link',
            'sprocket': 'fa-gear',
            
            // Battery 12V -> battery icon
            'battery': 'fa-car-battery',
            'battery 12v': 'fa-car-battery',
            
            // Air Filter -> air flow/wind icon
            'air filter': 'fa-wind',
            'air': 'fa-wind',
            
            // Brake Fluid -> droplet/liquid container icon
            'brake fluid': 'fa-droplet',
            'fluid': 'fa-droplet',
            
            // Additional common mappings
            'filter': 'fa-filter',
            'oil': 'fa-oil-can',
            'cable': 'fa-cable',
            'light': 'fa-lightbulb',
            'bulb': 'fa-lightbulb',
            'headlight': 'fa-lightbulb',
            'tail light': 'fa-lightbulb',
            'turn signal': 'fa-arrow-turn-right',
            'mirror': 'fa-mirror',
            'grip': 'fa-hand',
            'handlebar': 'fa-hand',
            'peg': 'fa-shoe-prints',
            'seat': 'fa-chair',
            'lever': 'fa-hand-pointer',
            'cap': 'fa-cap',
            'coolant': 'fa-flask',
            'fuel': 'fa-gas-pump',
            'gasket': 'fa-circle',
            'exhaust': 'fa-pipe',
            'valve': 'fa-circle',
            'carburetor': 'fa-circle',
            'clutch': 'fa-hand-pointer',
            'throttle': 'fa-hand-pointer',
            'radiator': 'fa-temperature-high'
        };
        
        // Check for exact matches first
        if (iconMap[name]) {
            return iconMap[name];
        }
        
        // Check for partial matches
        for (const [key, icon] of Object.entries(iconMap)) {
            if (name.includes(key)) {
                return icon;
            }
        }
        
        // Default fallback icon
        return 'fa-box';
    }

    // Sample data for all parts (extended list) - icon removed, will be determined dynamically
    const allPartsData = [
        { name: 'Engine Oil Filter', sku: 'EOL-2024-X1', status: 'in', units: 245 },
        { name: 'Brake Pads Front', sku: 'BPF-2024-R2', status: 'low', units: 8 },
        { name: 'Spark Plug Set', sku: 'SPS-2024-M4', status: 'out', units: 0 },
        { name: 'Chain & Sprocket Kit', sku: 'CSK-2024-H6', status: 'in', units: 67 },
        { name: 'Battery 12V', sku: 'BAT-2024-L8', status: 'low', units: 12 },
        { name: 'Air Filter', sku: 'AF-2024-A1', status: 'in', units: 89 },
        { name: 'Brake Fluid', sku: 'BF-2024-B2', status: 'in', units: 34 },
        { name: 'Clutch Cable', sku: 'CC-2024-C3', status: 'low', units: 5 },
        { name: 'Throttle Cable', sku: 'TC-2024-T4', status: 'in', units: 23 },
        { name: 'Headlight Bulb', sku: 'HB-2024-H5', status: 'in', units: 156 },
        { name: 'Tail Light', sku: 'TL-2024-T6', status: 'in', units: 42 },
        { name: 'Turn Signal', sku: 'TS-2024-T7', status: 'low', units: 7 },
        { name: 'Mirror Set', sku: 'MS-2024-M8', status: 'in', units: 28 },
        { name: 'Handlebar Grip', sku: 'HG-2024-H9', status: 'in', units: 91 },
        { name: 'Foot Peg', sku: 'FP-2024-F1', status: 'in', units: 45 },
        { name: 'Seat Cover', sku: 'SC-2024-S2', status: 'in', units: 19 },
        { name: 'Fork Oil', sku: 'FO-2024-F3', status: 'low', units: 6 },
        { name: 'Brake Lever', sku: 'BL-2024-B4', status: 'in', units: 31 },
        { name: 'Clutch Lever', sku: 'CL-2024-C5', status: 'in', units: 27 },
        { name: 'Radiator Cap', sku: 'RC-2024-R6', status: 'out', units: 0 },
        { name: 'Coolant', sku: 'CO-2024-C7', status: 'in', units: 58 },
        { name: 'Fuel Filter', sku: 'FF-2024-F8', status: 'in', units: 73 },
        { name: 'Carburetor Gasket', sku: 'CG-2024-C9', status: 'low', units: 4 },
        { name: 'Exhaust Gasket', sku: 'EG-2024-E1', status: 'in', units: 38 },
        { name: 'Valve Cover Gasket', sku: 'VCG-2024-V2', status: 'in', units: 52 }
    ];

    // Function to render parts in modal
    function renderPartsInModal(parts) {
        modalBody.innerHTML = '';
        
        parts.forEach(part => {
            const statusClass = part.status === 'in' ? 'stock-in' : 
                               part.status === 'low' ? 'stock-low' : 'stock-out';
            const statusText = part.status === 'in' ? 'In Stock' : 
                              part.status === 'low' ? 'Low Stock' : 'Out of Stock';
            
            // Get icon dynamically based on product name
            const iconClass = getPartIcon(part.name);
            
            const partItem = document.createElement('article');
            partItem.className = 'widget-card part-item';
            partItem.innerHTML = `
                <div class="part-icon">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="part-info">
                    <h4>${part.name}</h4>
                    <p>SKU: ${part.sku}</p>
                </div>
                <div class="part-status">
                    <span class="stock-tag ${statusClass}">${statusText}</span>
                    <p>${part.units} units</p>
                </div>
            `;
            modalBody.appendChild(partItem);
        });
    }

    // Open modal
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            renderPartsInModal(allPartsData);
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }

    // Close modal
    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Close modal when clicking overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // --- Inventory Drill-Down Modal ---
    const inventoryModalOverlay = document.getElementById('inventory-modal-overlay');
    const inventoryModalClose = document.getElementById('inventory-modal-close');
    const inventoryModalBody = document.getElementById('inventory-modal-body');
    const inventoryModalHeader = document.getElementById('inventory-modal-header');
    const inventoryModalTitle = document.getElementById('inventory-modal-title');

    // Function to filter parts based on inventory type
    function filterPartsByType(type) {
        switch(type) {
            case 'in-stock':
                return allPartsData.filter(part => part.status === 'in' && part.units > 0);
            case 'low-stock':
                return allPartsData.filter(part => part.status === 'low' || (part.units > 0 && part.units < 10));
            case 'out-of-stock':
                return allPartsData.filter(part => part.status === 'out' || part.units === 0);
            case 'total':
                return allPartsData;
            default:
                return [];
        }
    }

    // Function to get header class and title based on inventory type
    function getHeaderStyle(type) {
        const styles = {
            'in-stock': { class: 'in-stock', title: 'In Stock Items' },
            'low-stock': { class: 'low-stock', title: 'Low Stock Items' },
            'out-of-stock': { class: 'out-of-stock', title: 'Out of Stock Items' },
            'total': { class: 'total', title: 'All Parts Inventory' }
        };
        return styles[type] || { class: 'total', title: 'Inventory Details' };
    }

    // Function to render inventory items in modal
    function renderInventoryItems(parts) {
        inventoryModalBody.innerHTML = '';
        
        if (parts.length === 0) {
            inventoryModalBody.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--color-text-secondary);">
                    <i class="fa-solid fa-inbox" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p style="font-size: 1.1rem;">No items found in this category.</p>
                </div>
            `;
            return;
        }

        parts.forEach(part => {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `
                <div class="inventory-item-info">
                    <div class="inventory-item-name">${part.name}</div>
                    <div class="inventory-item-sku">SKU: ${part.sku}</div>
                </div>
                <div class="inventory-item-quantity">${part.units} units</div>
            `;
            inventoryModalBody.appendChild(item);
        });
    }

    // Function to open inventory drill-down modal
    function openInventoryModal(type) {
        const filteredParts = filterPartsByType(type);
        const headerStyle = getHeaderStyle(type);
        
        // Update header
        inventoryModalHeader.className = `inventory-modal-header ${headerStyle.class}`;
        inventoryModalTitle.textContent = headerStyle.title;
        
        // Render items
        renderInventoryItems(filteredParts);
        
        // Show modal
        inventoryModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Function to close inventory modal
    function closeInventoryModal() {
        inventoryModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Add click handlers to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const inventoryType = card.getAttribute('data-inventory-type');
            if (inventoryType) {
                openInventoryModal(inventoryType);
            }
        });
    });

    // Close modal handlers
    if (inventoryModalClose) {
        inventoryModalClose.addEventListener('click', closeInventoryModal);
    }

    if (inventoryModalOverlay) {
        inventoryModalOverlay.addEventListener('click', (e) => {
            if (e.target === inventoryModalOverlay) {
                closeInventoryModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && inventoryModalOverlay.classList.contains('active')) {
            closeInventoryModal();
        }
    });

});