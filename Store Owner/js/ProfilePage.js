document.addEventListener('DOMContentLoaded', () => {

    // Shop Front Image state variable
    let shopFrontImage = null;

    // Avatar Upload Functionality
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarContainer = document.querySelector('.avatar-preview');

    if (avatarUpload && avatarPreview) {
        avatarContainer.addEventListener('click', () => {
            avatarUpload.click();
        });

        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const newAvatarUrl = event.target.result;
                        const previousAvatarUrl = avatarPreview.src;
                        
                        try {
                            // Update preview immediately
                            avatarPreview.src = newAvatarUrl;
                            
                            // Update global avatar state immediately
                            if (window.AvatarManager) {
                                window.AvatarManager.setAvatarUrl(newAvatarUrl, true);
                            } else {
                                // Fallback: save to localStorage directly
                                localStorage.setItem('userAvatarUrl', newAvatarUrl);
                                // Update header avatar if it exists
                                const headerAvatar = document.querySelector('.dashboard-header .profile-avatar, .main-header .profile-avatar');
                                if (headerAvatar) {
                                    headerAvatar.src = newAvatarUrl;
                                }
                            }
                            
                            console.log('Avatar updated successfully');
                        } catch (error) {
                            // Revert on error
                            console.error('Error updating avatar:', error);
                            avatarPreview.src = previousAvatarUrl;
                            alert('Failed to update avatar. Please try again.');
                        }
                    };
                    reader.onerror = () => {
                        alert('Error reading image file. Please try again.');
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert('Please select a valid image file.');
                }
            }
        });
    }

    // Shop Front Image Upload Functionality
    const shopLogoInput = document.getElementById('shop-logo-input');
    const shopLogoUploadBox = document.getElementById('shop-logo-upload-box');
    const shopLogoPlaceholder = document.getElementById('shop-logo-placeholder');
    const shopLogoPreview = document.getElementById('shop-logo-preview');

    if (shopLogoInput && shopLogoUploadBox) {
        // Click on box to trigger file input
        shopLogoUploadBox.addEventListener('click', () => {
            shopLogoInput.click();
        });

        // Handle file selection
        shopLogoInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }

            // Convert to Base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target.result;
                
                // Store in state variable
                shopFrontImage = base64String;
                
                // Hide placeholder and show preview
                if (shopLogoPlaceholder && shopLogoPreview) {
                    shopLogoPlaceholder.style.display = 'none';
                    shopLogoPreview.src = base64String;
                    shopLogoPreview.style.display = 'block';
                }
            };
            reader.onerror = () => {
                alert('Error reading the image file.');
            };
            reader.readAsDataURL(file);
        });
    }

    // Change Password Modal
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordModal = document.getElementById('password-modal-overlay');
    const passwordModalClose = document.getElementById('password-modal-close');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');
    const updatePasswordBtn = document.getElementById('update-password-btn');

    function openPasswordModal() {
        if (passwordModal) {
            passwordModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closePasswordModal() {
        if (passwordModal) {
            passwordModal.classList.remove('active');
            document.body.style.overflow = '';
            // Clear form fields
            const currentPassword = document.getElementById('current-password');
            const newPassword = document.getElementById('new-password');
            const confirmPassword = document.getElementById('confirm-password');
            if (currentPassword) currentPassword.value = '';
            if (newPassword) newPassword.value = '';
            if (confirmPassword) confirmPassword.value = '';
        }
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', openPasswordModal);
    }

    if (passwordModalClose) {
        passwordModalClose.addEventListener('click', closePasswordModal);
    }

    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', closePasswordModal);
    }

    // Close modal when clicking overlay
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                closePasswordModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && passwordModal && passwordModal.classList.contains('active')) {
            closePasswordModal();
        }
    });

    // Update Password Functionality
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', () => {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('Please fill in all fields.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('New password and confirm password do not match.');
                return;
            }

            if (newPassword.length < 8) {
                alert('New password must be at least 8 characters long.');
                return;
            }

            // Here you would typically send the data to your backend
            // For now, we'll just show a success message
            alert('Password updated successfully!');
            closePasswordModal();
        });
    }

    // Save Changes Functionality
    const saveChangesBtn = document.getElementById('save-changes-btn');

    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            // Collect all form data
            const profileData = {
                fullName: document.getElementById('full-name').value,
                email: document.getElementById('email').value,
                shopName: document.getElementById('shop-name').value,
                shopAddress: document.getElementById('shop-address').value,
                shopContact: document.getElementById('shop-contact').value,
                shopTIN: document.getElementById('shop-tin').value,
                avatar: avatarPreview ? avatarPreview.src : null,
                shopFrontImage: shopFrontImage
            };

            // Validation
            if (!profileData.fullName.trim()) {
                alert('Please enter your full name.');
                return;
            }

            if (!profileData.shopName.trim()) {
                alert('Please enter your shop name.');
                return;
            }

            if (!profileData.shopAddress.trim()) {
                alert('Please enter your shop address.');
                return;
            }

            if (!profileData.shopContact.trim()) {
                alert('Please enter your contact number.');
                return;
            }

            // Here you would typically send the data to your backend
            // For now, we'll save to localStorage and show a success message
            try {
                localStorage.setItem('profileData', JSON.stringify(profileData));
                
                // Ensure avatar is also saved to global avatar storage
                if (profileData.avatar && window.AvatarManager) {
                    window.AvatarManager.setAvatarUrl(profileData.avatar, true);
                } else if (profileData.avatar) {
                    localStorage.setItem('userAvatarUrl', profileData.avatar);
                }
                
                // Update shop name globally
                if (profileData.shopName && window.ShopSettingsManager) {
                    window.ShopSettingsManager.setShopName(profileData.shopName, true);
                } else if (profileData.shopName) {
                    localStorage.setItem('shopName', profileData.shopName);
                    // Update header on current page
                    const header = document.querySelector('.dashboard-header h1, .main-header h1');
                    if (header) {
                        header.textContent = profileData.shopName;
                    }
                }
                
                alert('Profile updated successfully!');
                
                // Optional: Show a success notification instead of alert
                // You can replace this with a toast notification component
            } catch (error) {
                console.error('Error saving profile data:', error);
                alert('An error occurred while saving. Please try again.');
            }
        });
    }

    // Load saved profile data on page load
    function loadProfileData() {
        try {
            const savedData = localStorage.getItem('profileData');
            if (savedData) {
                const profileData = JSON.parse(savedData);
                
                const fullNameInput = document.getElementById('full-name');
                const shopNameInput = document.getElementById('shop-name');
                const shopAddressInput = document.getElementById('shop-address');
                const shopContactInput = document.getElementById('shop-contact');
                const shopTINInput = document.getElementById('shop-tin');
                
                if (fullNameInput && profileData.fullName) fullNameInput.value = profileData.fullName;
                if (shopNameInput && profileData.shopName) shopNameInput.value = profileData.shopName;
                if (shopAddressInput && profileData.shopAddress) shopAddressInput.value = profileData.shopAddress;
                if (shopContactInput && profileData.shopContact) shopContactInput.value = profileData.shopContact;
                if (shopTINInput && profileData.shopTIN) shopTINInput.value = profileData.shopTIN;
                
                // Load shop front image if exists (check both new and old property names for backward compatibility)
                const savedImage = profileData.shopFrontImage || profileData.shopLogo;
                if (savedImage && shopLogoPlaceholder && shopLogoPreview) {
                    shopFrontImage = savedImage;
                    shopLogoPlaceholder.style.display = 'none';
                    shopLogoPreview.src = savedImage;
                    shopLogoPreview.style.display = 'block';
                }
            } else {
                // Try loading from ShopSettingsManager if profileData doesn't exist
                if (window.ShopSettingsManager) {
                    const shopName = window.ShopSettingsManager.getShopName();
                    const shopNameInput = document.getElementById('shop-name');
                    if (shopNameInput && shopName && shopName !== 'Admin Dashboard') {
                        shopNameInput.value = shopName;
                    }
                }
            }
            
            // Load avatar from global avatar manager
            if (window.AvatarManager) {
                const avatarUrl = window.AvatarManager.getAvatarUrl();
                if (avatarPreview) {
                    avatarPreview.src = avatarUrl;
                }
            } else if (savedData) {
                const profileData = JSON.parse(savedData);
                if (avatarPreview && profileData.avatar) {
                    avatarPreview.src = profileData.avatar;
                }
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    // Load data on page load
    loadProfileData();

});

