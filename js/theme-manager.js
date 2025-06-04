// js/theme-manager.js - FIXED Theme System

class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.isChanging = false; // Prevent infinite loops
        this.themeStylesheet = null;
        this.observers = new Set();
        
        this.init();
    }

    init() {
        console.log('🎨 Initializing FIXED theme manager...');
        
        // Get initial theme safely
        this.currentTheme = this.getInitialTheme();
        
        // Find or create theme stylesheet
        this.setupThemeStylesheet();
        
        // Apply initial theme
        this.applyTheme(this.currentTheme, false);
        
        // Setup system theme watching
        this.watchSystemTheme();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Expose globally for debugging
        window.themeManager = this;
        
        console.log(`✅ Theme manager initialized with: ${this.currentTheme}`);
    }

    getInitialTheme() {
        // Priority: PHP provided theme > localStorage > system preference > default
        if (window.initialTheme) {
            return window.initialTheme;
        }
        
        const stored = localStorage.getItem('habitus-theme');
        if (stored && ['light', 'dark'].includes(stored)) {
            return stored;
        }
        
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return systemPrefersDark ? 'dark' : 'light';
    }

    setupThemeStylesheet() {
        // Find existing theme stylesheet
        this.themeStylesheet = document.getElementById('theme-stylesheet');
        
        if (!this.themeStylesheet) {
            // Create new theme stylesheet if it doesn't exist
            this.themeStylesheet = document.createElement('link');
            this.themeStylesheet.id = 'theme-stylesheet';
            this.themeStylesheet.rel = 'stylesheet';
            
            // Insert before the last stylesheet (usually page-specific CSS)
            const lastStylesheet = document.querySelector('link[rel="stylesheet"]:last-of-type');
            if (lastStylesheet) {
                lastStylesheet.parentNode.insertBefore(this.themeStylesheet, lastStylesheet);
            } else {
                document.head.appendChild(this.themeStylesheet);
            }
        }
    }

    setTheme(theme, animate = true, saveToServer = true) {
        // Prevent infinite loops
        if (this.isChanging || theme === this.currentTheme) {
            return false;
        }

        console.log(`🎨 Changing theme from ${this.currentTheme} to ${theme}`);
        
        this.isChanging = true;

        try {
            if (animate) {
                this.animateThemeChange(() => {
                    this.applyTheme(theme, true);
                });
            } else {
                this.applyTheme(theme, false);
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
            
            // Notify observers
            this.notifyObservers(theme);

            return true;
        } catch (error) {
            console.error('❌ Error changing theme:', error);
            return false;
        } finally {
            // Always reset the changing flag
            setTimeout(() => {
                this.isChanging = false;
            }, 100);
        }
    }

    applyTheme(theme, animated = false) {
        const html = document.documentElement;
        const body = document.body;
        
        // Prevent transitions during immediate change
        if (!animated) {
            body.classList.add('theme-switching');
        }

        // Update CSS file
        const newHref = this.getThemeCSSPath(theme);
        if (this.themeStylesheet.href !== newHref) {
            this.themeStylesheet.href = newHref;
        }

        // Update data attribute for CSS targeting
        html.setAttribute('data-theme', theme);
        
        // Update body classes
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
            detail: { theme, animated }
        }));

        console.log(`✅ Theme applied: ${theme}`);
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
        body.style.transition = 'opacity 0.2s ease';
        body.style.opacity = '0.7';
        
        setTimeout(() => {
            callback();
            
            setTimeout(() => {
                body.style.opacity = '1';
                
                setTimeout(() => {
                    body.style.transition = '';
                    body.style.opacity = '';
                }, 200);
            }, 50);
        }, 100);
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
            toggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        });
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
            background: ${type === 'info' ? '#e8f4f8' : '#f9e8e5'};
            color: ${type === 'info' ? '#5d7b8a' : '#a15c5c'};
            padding: 12px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// CSS for notifications animation
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
    
    .theme-switching * {
        transition: none !important;
    }
`;
document.head.appendChild(style);

// Initialize theme manager when DOM is ready
let themeManager;

function initializeThemeManager() {
    if (!themeManager) {
        themeManager = new ThemeManager();
        window.themeManager = themeManager;
    }
    return themeManager;
}

// Auto-initialize if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeManager);
} else {
    initializeThemeManager();
}

// Export for use in other files
window.ThemeManager = ThemeManager;