// js/theme-manager.js - FIXED Theme System with Force Updates

class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.isChanging = false;
        this.themeStylesheet = null;
        this.observers = new Set();
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        console.log('🎨 Initializing FIXED theme manager...');
        
        try {
            // Get initial theme safely
            this.currentTheme = this.getInitialTheme();
            
            // Find or create theme stylesheet
            this.setupThemeStylesheet();
            
            // Apply initial theme immediately with force
            this.applyTheme(this.currentTheme, false, true);
            
            // Setup system theme watching
            this.watchSystemTheme();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Expose globally
            window.themeManager = this;
            
            // Force a visual update after initialization
            setTimeout(() => {
                this.forceVisualUpdate();
            }, 100);
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('themeManagerReady', {
                detail: { theme: this.currentTheme }
            }));
            
            console.log(`✅ Theme manager initialized with: ${this.currentTheme}`);
        } catch (error) {
            console.error('❌ Theme manager initialization failed:', error);
        }
    }

    getInitialTheme() {
        // Priority: PHP provided theme > localStorage > system preference > default
        if (window.initialTheme) {
            console.log('Using PHP provided theme:', window.initialTheme);
            return window.initialTheme;
        }
        
        const stored = localStorage.getItem('habitus-theme');
        if (stored && ['light', 'dark'].includes(stored)) {
            console.log('Using stored theme:', stored);
            return stored;
        }
        
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = systemPrefersDark ? 'dark' : 'light';
        console.log('Using system theme:', systemTheme);
        return systemTheme;
    }

    setupThemeStylesheet() {
        // Find existing theme stylesheet
        this.themeStylesheet = document.getElementById('theme-stylesheet');
        
        if (!this.themeStylesheet) {
            console.log('Creating new theme stylesheet');
            // Create new theme stylesheet
            this.themeStylesheet = document.createElement('link');
            this.themeStylesheet.id = 'theme-stylesheet';
            this.themeStylesheet.rel = 'stylesheet';
            
            // Insert as the LAST stylesheet for highest specificity
            document.head.appendChild(this.themeStylesheet);
        } else {
            console.log('Found existing theme stylesheet');
        }
    }

    setTheme(theme, animate = true, saveToServer = true) {
        console.log(`🎨 setTheme called: ${theme} (current: ${this.currentTheme})`);
        
        // Validate theme
        if (!['light', 'dark'].includes(theme)) {
            console.error('Invalid theme:', theme);
            return false;
        }
        
        // Prevent infinite loops and redundant changes
        if (this.isChanging || theme === this.currentTheme) {
            console.log('Theme change skipped (already changing or same theme)');
            return false;
        }

        console.log(`🎨 Changing theme from ${this.currentTheme} to ${theme}`);
        
        this.isChanging = true;

        try {
            if (animate) {
                this.animateThemeChange(() => {
                    this.applyTheme(theme, true, true);
                });
            } else {
                this.applyTheme(theme, false, true);
            }

            this.currentTheme = theme;
            
            // Save to localStorage
            localStorage.setItem('habitus-theme', theme);
            
            // Save to server if requested
            if (saveToServer) {
                this.saveThemeToServer(theme);
            }

            // Update UI elements
            this.updateThemeUI();
            
            // Force visual update
            setTimeout(() => {
                this.forceVisualUpdate();
            }, 50);
            
            // Notify observers
            this.notifyObservers(theme);

            console.log(`✅ Theme successfully changed to: ${theme}`);
            return true;
        } catch (error) {
            console.error('❌ Error changing theme:', error);
            return false;
        } finally {
            // Always reset the changing flag
            setTimeout(() => {
                this.isChanging = false;
            }, 200);
        }
    }

    applyTheme(theme, animated = false, force = false) {
        console.log(`🎨 Applying theme: ${theme} (animated: ${animated}, force: ${force})`);
        
        const html = document.documentElement;
        const body = document.body;
        
        // Prevent transitions during immediate change
        if (!animated) {
            body.classList.add('theme-switching');
        }

        // Update CSS file with cache busting
        const newHref = this.getThemeCSSPath(theme);
        if (force || this.themeStylesheet.href !== newHref) {
            console.log(`Loading theme CSS: ${newHref}`);
            // Add cache busting for force updates
            this.themeStylesheet.href = force ? `${newHref}?v=${Date.now()}` : newHref;
        }

        // FORCE update data attribute
        html.setAttribute('data-theme', theme);
        html.dataset.theme = theme; // Double ensure
        
        // FORCE update body classes
        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(`theme-${theme}`);
        
        // Update meta theme-color
        this.updateMetaThemeColor(theme);
        
        // Re-enable transitions
        if (!animated) {
            setTimeout(() => {
                body.classList.remove('theme-switching');
            }, 50);
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, animated, force }
        }));

        console.log(`✅ Theme applied: ${theme}`);
    }

    forceVisualUpdate() {
        console.log('🎨 Forcing visual update...');
        
        // Force recalculation by temporarily modifying and restoring the theme attribute
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        
        html.removeAttribute('data-theme');
        html.offsetHeight; // Force reflow
        html.setAttribute('data-theme', currentTheme);
        
        // Force re-application of styles
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            el.style.color = computedStyle.color;
            el.style.backgroundColor = computedStyle.backgroundColor;
            
            // Force redraw
            el.style.display = 'none';
            el.offsetHeight; // Force reflow
            el.style.display = '';
        });
        
        // Trigger resize event to force repaints
        window.dispatchEvent(new Event('resize'));
        
        console.log('✅ Visual update completed');
    }

    getThemeCSSPath(theme) {
        // Get the correct path based on current location
        const isInSubdirectory = window.location.pathname.includes('/pages/');
        const basePath = isInSubdirectory ? '../css/themes/' : 'css/themes/';
        return `${basePath}${theme}.css`;
    }

    animateThemeChange(callback) {
        const body = document.body;
        
        // Add fade effect
        body.style.transition = 'opacity 0.3s ease';
        body.style.opacity = '0.3';
        
        setTimeout(() => {
            callback();
            
            setTimeout(() => {
                body.style.opacity = '1';
                
                setTimeout(() => {
                    body.style.transition = '';
                    body.style.opacity = '';
                }, 300);
            }, 50);
        }, 150);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const colors = {
            light: '#f9f5f0',
            dark: '#070F2B'
        };
        
        metaThemeColor.content = colors[theme] || colors.light;
    }

    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e) => {
            // Only auto-switch if no manual preference is stored
            const hasManualPreference = localStorage.getItem('habitus-theme-manual');
            if (!hasManualPreference) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.setTheme(newTheme, true, true);
                this.showNotification(`Auto-switched to ${newTheme} theme`, 'info');
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T to toggle theme
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                const newTheme = this.toggleTheme();
                this.showNotification(`Theme toggled to ${newTheme}!`, 'info');
                
                // Mark as manual preference
                localStorage.setItem('habitus-theme-manual', 'true');
            }
        });
    }

    updateThemeUI() {
        console.log('🎨 Updating theme UI elements');
        
        // Update theme selector radio buttons
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            const input = option.querySelector('input[type="radio"]');
            if (input) {
                const isActive = input.value === this.currentTheme;
                option.classList.toggle('active', isActive);
                input.checked = isActive;
            }
        });

        // Update any theme toggle buttons
        const themeToggles = document.querySelectorAll('[data-theme-toggle]');
        themeToggles.forEach(toggle => {
            toggle.setAttribute('data-current-theme', this.currentTheme);
        });
        
        console.log('✅ Theme UI updated');
    }

    async saveThemeToServer(theme) {
        try {
            const isInSubdirectory = window.location.pathname.includes('/pages/');
            const apiPath = isInSubdirectory ? '../php/api/user/update_settings.php' : 'php/api/user/update_settings.php';
            
            const response = await fetch(apiPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    setting: 'theme',
                    value: theme
                })
            });
            
            const data = await response.json();
            if (data.success) {
                console.log('✅ Theme saved to server');
            } else {
                console.warn('⚠️ Failed to save theme to server:', data.message);
            }
        } catch (error) {
            console.warn('⚠️ Error saving theme to server:', error);
        }
    }

    getTheme() {
        return this.currentTheme;
    }

    isReady() {
        return this.isInitialized;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme, true, true);
        
        // Mark as manual preference
        localStorage.setItem('habitus-theme-manual', 'true');
        
        return newTheme;
    }

    // Observer pattern for theme changes
    addObserver(callback) {
        this.observers.add(callback);
    }

    removeObserver(callback) {
        this.observers.delete(callback);
    }

    notifyObservers(theme) {
        this.observers.forEach(callback => {
            try {
                callback(theme);
            } catch (error) {
                console.error('Observer error:', error);
            }
        });
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'info' ? 'var(--info-bg)' : 'var(--warning-bg)'};
            color: ${type === 'info' ? 'var(--info-text)' : 'var(--warning-text)'};
            padding: 12px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 12px var(--shadow);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            border-left: 4px solid ${type === 'info' ? 'var(--info-text)' : 'var(--warning-text)'};
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// CSS for notifications animation - Enhanced
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .theme-switching,
    .theme-switching * {
        transition: none !important;
        animation: none !important;
    }
    
    /* FORCE theme variable inheritance */
    html[data-theme] * {
        --theme-applied: var(--text-1, initial);
    }
`;
document.head.appendChild(style);

// FIXED: Single global declaration and initialization
let themeManager; // Only declared here

function initializeThemeManager() {
    console.log('🎨 Starting FIXED theme manager initialization...');
    
    if (!themeManager) {
        themeManager = new ThemeManager();
        window.themeManager = themeManager;
        console.log('✅ FIXED theme manager created and exposed globally');
    } else {
        console.log('✅ FIXED theme manager already exists');
    }
    return themeManager;
}

// Auto-initialize based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeManager);
} else {
    // Document already loaded, initialize immediately
    initializeThemeManager();
}

// Export for use in other files
window.ThemeManager = ThemeManager;

// FIXED: Global access without redeclaration
if (typeof window !== 'undefined') {
    window.getThemeManager = function() {
        return window.themeManager || initializeThemeManager();
    };
}

// Additional force update on visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.themeManager) {
        setTimeout(() => {
            window.themeManager.forceVisualUpdate();
        }, 100);
    }
});

console.log('✅ FIXED Theme Manager script loaded');