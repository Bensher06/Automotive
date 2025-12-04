/**
 * Global Avatar Manager
 * Handles profile picture synchronization across all pages
 */

const AvatarManager = {
    // Storage key for avatar URL
    AVATAR_KEY: 'userAvatarUrl',
    
    // Default avatar fallback
    DEFAULT_AVATAR: 'https://i.pravatar.cc/100?img=12',
    
    /**
     * Get the current avatar URL from storage
     * @returns {string} Avatar URL
     */
    getAvatarUrl() {
        try {
            const saved = localStorage.getItem(this.AVATAR_KEY);
            return saved || this.DEFAULT_AVATAR;
        } catch (error) {
            console.error('Error reading avatar from storage:', error);
            return this.DEFAULT_AVATAR;
        }
    },
    
    /**
     * Set the avatar URL in storage and update all avatars on the page
     * @param {string} avatarUrl - The new avatar URL
     * @param {boolean} persist - Whether to save to localStorage (default: true)
     */
    setAvatarUrl(avatarUrl, persist = true) {
        if (!avatarUrl) {
            console.warn('Avatar URL is empty');
            return;
        }
        
        try {
            if (persist) {
                localStorage.setItem(this.AVATAR_KEY, avatarUrl);
            }
            
            // Update all avatars on the current page
            this.updateAllAvatars(avatarUrl);
            
            // Dispatch custom event for cross-page communication
            window.dispatchEvent(new CustomEvent('avatarUpdated', { 
                detail: { avatarUrl } 
            }));
            
            console.log('Avatar updated successfully');
        } catch (error) {
            console.error('Error saving avatar:', error);
            throw error;
        }
    },
    
    /**
     * Update all avatar images on the current page
     * @param {string} avatarUrl - The avatar URL to set
     */
    updateAllAvatars(avatarUrl) {
        const avatars = document.querySelectorAll('.profile-avatar');
        avatars.forEach(avatar => {
            if (avatar.tagName === 'IMG') {
                avatar.src = avatarUrl;
            } else if (avatar.querySelector('img.profile-avatar')) {
                avatar.querySelector('img.profile-avatar').src = avatarUrl;
            }
        });
    },
    
    /**
     * Initialize avatars on page load
     */
    init() {
        const avatarUrl = this.getAvatarUrl();
        this.updateAllAvatars(avatarUrl);
        
        // Listen for storage changes (for cross-tab updates)
        window.addEventListener('storage', (e) => {
            if (e.key === this.AVATAR_KEY) {
                const newAvatarUrl = e.newValue || this.DEFAULT_AVATAR;
                this.updateAllAvatars(newAvatarUrl);
            }
        });
        
        // Listen for custom avatar update events (for same-tab updates)
        window.addEventListener('avatarUpdated', (e) => {
            if (e.detail && e.detail.avatarUrl) {
                this.updateAllAvatars(e.detail.avatarUrl);
            }
        });
    },
    
    /**
     * Reset avatar to default
     */
    resetAvatar() {
        this.setAvatarUrl(this.DEFAULT_AVATAR);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AvatarManager.init());
} else {
    AvatarManager.init();
}

// Make AvatarManager globally available
window.AvatarManager = AvatarManager;

