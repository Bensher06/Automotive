/**
 * Global Shop Settings Manager
 * Handles shop name and settings synchronization across all pages
 */

const ShopSettingsManager = {
    // Storage keys
    SHOP_NAME_KEY: 'shopName',
    SHOP_SETTINGS_KEY: 'shopSettings',
    
    // Default shop name
    DEFAULT_SHOP_NAME: 'Admin Dashboard',
    
    /**
     * Get shop name from storage
     * @returns {string} Shop name
     */
    getShopName() {
        try {
            // First try to get from shopSettings object
            const shopSettings = localStorage.getItem(this.SHOP_SETTINGS_KEY);
            if (shopSettings) {
                const settings = JSON.parse(shopSettings);
                if (settings.shopName) {
                    return settings.shopName;
                }
            }
            
            // Fallback to direct shopName key
            const saved = localStorage.getItem(this.SHOP_NAME_KEY);
            return saved || this.DEFAULT_SHOP_NAME;
        } catch (error) {
            console.error('Error reading shop name from storage:', error);
            return this.DEFAULT_SHOP_NAME;
        }
    },
    
    /**
     * Set shop name in storage and update all headers
     * @param {string} shopName - The new shop name
     * @param {boolean} persist - Whether to save to localStorage (default: true)
     */
    setShopName(shopName, persist = true) {
        if (!shopName || !shopName.trim()) {
            console.warn('Shop name is empty, using default');
            shopName = this.DEFAULT_SHOP_NAME;
        }
        
        try {
            if (persist) {
                // Save to direct key for quick access
                localStorage.setItem(this.SHOP_NAME_KEY, shopName.trim());
                
                // Also save to shopSettings object
                let shopSettings = {};
                try {
                    const existing = localStorage.getItem(this.SHOP_SETTINGS_KEY);
                    if (existing) {
                        shopSettings = JSON.parse(existing);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
                shopSettings.shopName = shopName.trim();
                localStorage.setItem(this.SHOP_SETTINGS_KEY, JSON.stringify(shopSettings));
            }
            
            // Update all headers on the current page
            this.updateAllHeaders(shopName.trim());
            
            // Dispatch custom event for cross-page communication
            window.dispatchEvent(new CustomEvent('shopNameUpdated', { 
                detail: { shopName: shopName.trim() } 
            }));
            
            console.log('Shop name updated successfully:', shopName.trim());
        } catch (error) {
            console.error('Error saving shop name:', error);
            throw error;
        }
    },
    
    /**
     * Update all header titles on the current page
     * @param {string} shopName - The shop name to set
     */
    updateAllHeaders(shopName) {
        // Update dashboard header h1 (specifically the Admin Dashboard page)
        const dashboardTitle = document.getElementById('dashboard-title');
        if (dashboardTitle) {
            dashboardTitle.textContent = shopName;
        }
        
        // Update dashboard header h1 in .dashboard-header (for Admin Dashboard page)
        const dashboardHeaders = document.querySelectorAll('.dashboard-header h1');
        dashboardHeaders.forEach(header => {
            // Only update if it's the main dashboard (not Profile, Reports, etc.)
            const isMainDashboard = header.id === 'dashboard-title' || 
                                   header.textContent === 'Admin Dashboard' ||
                                   (!header.textContent.includes('Profile') && 
                                    !header.textContent.includes('Analytics') &&
                                    !header.textContent.includes('My Profile'));
            if (isMainDashboard) {
                header.textContent = shopName;
            }
        });
    },
    
    /**
     * Initialize headers on page load
     */
    init() {
        const shopName = this.getShopName();
        this.updateAllHeaders(shopName);
        
        // Listen for storage changes (for cross-tab updates)
        window.addEventListener('storage', (e) => {
            if (e.key === this.SHOP_NAME_KEY || e.key === this.SHOP_SETTINGS_KEY) {
                const newShopName = this.getShopName();
                this.updateAllHeaders(newShopName);
            }
        });
        
        // Listen for custom shop name update events (for same-tab updates)
        window.addEventListener('shopNameUpdated', (e) => {
            if (e.detail && e.detail.shopName) {
                this.updateAllHeaders(e.detail.shopName);
            }
        });
    },
    
    /**
     * Get all shop settings
     * @returns {object} Shop settings object
     */
    getShopSettings() {
        try {
            const settings = localStorage.getItem(this.SHOP_SETTINGS_KEY);
            if (settings) {
                return JSON.parse(settings);
            }
            return {};
        } catch (error) {
            console.error('Error reading shop settings:', error);
            return {};
        }
    },
    
    /**
     * Set shop settings
     * @param {object} settings - Shop settings object
     */
    setShopSettings(settings) {
        try {
            localStorage.setItem(this.SHOP_SETTINGS_KEY, JSON.stringify(settings));
            if (settings.shopName) {
                this.setShopName(settings.shopName, false); // Don't persist twice
            }
        } catch (error) {
            console.error('Error saving shop settings:', error);
            throw error;
        }
    },
    
    /**
     * Reset shop name to default
     */
    resetShopName() {
        this.setShopName(this.DEFAULT_SHOP_NAME);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ShopSettingsManager.init());
} else {
    ShopSettingsManager.init();
}

// Make ShopSettingsManager globally available
window.ShopSettingsManager = ShopSettingsManager;

