// Shared handler for "x" / close buttons across pages
document.addEventListener('click', (e) => {
    const el = e.target;
    const btn = el.closest('button, a, [role="button"]');
    if (!btn) return;

    // Special handling for header settings link: Alt+click opens inline settings (if available)
    if (btn.classList.contains('settings-btn') && btn.tagName.toLowerCase() === 'a') {
        // If Alt is pressed, open inline settings panel instead of navigating
        if (e.altKey) {
            e.preventDefault();
            if (typeof window.openSettings === 'function') {
                window.openSettings();
            } else {
                // fallback: navigate in same tab if inline function not available
                window.location.href = btn.href;
            }
            return;
        }
        // Otherwise allow default behaviour (open in new tab because anchor has target)
    }

    const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
    const dataAction = btn.dataset.action;

    // Handle data-action="close-*" buttons (e.g. data-action="close-settings")
    if (dataAction && dataAction.toLowerCase().startsWith('close')) {
        e.preventDefault();
        // Call known global function if present
        try {
            if (dataAction === 'close-settings' && typeof window.closeSettings === 'function') {
                window.closeSettings();
                return;
            }
            // If there's a global function named after the action, call it
            if (typeof window[dataAction] === 'function') {
                window[dataAction]();
                return;
            }
        } catch (err) {
            console.warn('Error calling close action handler', err);
        }

        // Fallback: hide settings section if present
        const settings = document.getElementById('settings-section');
        if (settings) settings.style.display = 'none';
        return;
    }

    // Handle modal-close buttons or anything with aria-label containing "close"
    if (btn.classList.contains('modal-close') || aria.includes('close')) {
        e.preventDefault();
        if (typeof window.closeModal === 'function') {
            window.closeModal();
            return;
        }
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
        return;
    }

    // Support explicit data-close-target attribute to hide an element by selector
    const targetSelector = btn.dataset.closeTarget;
    if (targetSelector) {
        e.preventDefault();
        const target = document.querySelector(targetSelector);
        if (target) {
            target.style.display = 'none';
        }
        return;
    }
});

// Keyboard: allow Escape to close modal overlay when present
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (typeof window.closeModal === 'function') {
            try { window.closeModal(); } catch (err) { /* ignore */ }
            return;
        }
        const overlay = document.getElementById('modal-overlay');
        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        }
    }
});
