// js/theme-manager.js - FIXED VERSION (No Color Removal)

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
            
            // Apply initial theme WITHOUT forcing visual updates
            this.applyTheme(this.currentTheme, false, false);
            
            // Setup system theme watching
            this.watchSystemTheme();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Expose globally
            window.themeManager = this;
            
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
            
            // Insert as the FIRST stylesheet for proper cascade
            const firstLink = document.head.querySelector('link[rel="stylesheet"]');
            if (firstLink) {
                document.head.insertBefore(this.themeStylesheet, firstLink);
            } else {
                document.head.appendChild(this.themeStylesheet);
            }
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
            // Apply theme immediately without complex animations
            this.applyTheme(theme, animate, false);
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

            console.log(`✅ Theme successfully changed to: ${theme}`);
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

    applyTheme(theme, animated = false, force = false) {
        console.log(`🎨 Applying theme: ${theme} (animated: ${animated})`);
        
        const html = document.documentElement;
        const body = document.body;
        
        // Prevent transitions during immediate change
        if (!animated) {
            body.classList.add('theme-switching');
        }

        // Update CSS file
        const newHref = this.getThemeCSSPath(theme);
        if (this.themeStylesheet.href !== newHref) {
            console.log(`Loading theme CSS: ${newHref}`);
            this.themeStylesheet.href = newHref;
        }

        // Update data attribute
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

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const colors = {
            light: '#f9f5f0',
            dark: '#011f4b'
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

        // Simple fallback notification that doesn't interfere with theme
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
}

// CSS for theme transitions - SIMPLIFIED
const style = document.createElement('style');
style.textContent = `
    .theme-switching,
    .theme-switching * {
        transition: none !important;
        animation: none !important;
    }
    
    /* Ensure proper theme inheritance */
    html[data-theme] {
        transition: none;
    }
    
    html[data-theme] * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
`;
document.head.appendChild(style);

// FIXED: Single global declaration and initialization
let themeManager;

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

// Global access without redeclaration
if (typeof window !== 'undefined') {
    window.getThemeManager = function() {
        return window.themeManager || initializeThemeManager();
    };
}

console.log('✅ FIXED Theme Manager script loaded');