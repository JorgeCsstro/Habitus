// translation-manager.js - Complete translation management system

class HabitusTranslationManager {
    constructor() {
        this.currentLanguage = this.detectLanguage();
        this.defaultLanguage = 'en';
        this.translations = {};
        this.isEnabled = localStorage.getItem('translationEnabled') === 'true';
        this.loadingElements = new Set();
        this.translationQueue = [];
        this.isProcessingQueue = false;
        this.observer = null;
        
        this.init();
    }
    
    async init() {
        console.log('🌐 Initializing Habitus Translation Manager');
        
        // Load interface translations
        await this.loadInterfaceTranslations(this.currentLanguage);
        
        // Setup DOM observer for dynamic content
        this.setupDOMObserver();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Apply initial translations if enabled
        if (this.isEnabled) {
            await this.translateVisibleContent();
        }
        
        console.log('✅ Translation Manager initialized');
    }
    
    detectLanguage() {
        // Priority: URL param > user setting > browser > default
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang) return urlLang;
        
        const userLang = localStorage.getItem('userLanguage') || 
                        document.documentElement.getAttribute('data-user-language');
        if (userLang) return userLang;
        
        const browserLang = navigator.language.split('-')[0];
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'].includes(browserLang) 
               ? browserLang : 'en';
    }
    
    async loadInterfaceTranslations(language) {
        try {
            const response = await fetch(`../php/api/translation/interface.php?lang=${language}`);
            const data = await response.json();
            
            if (data.success) {
                this.translations[language] = data.translations;
                console.log(`📚 Loaded ${Object.keys(data.translations).length} interface translations for ${language}`);
            }
        } catch (error) {
            console.error('Failed to load interface translations:', error);
        }
    }
    
    setupDOMObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.observer = new MutationObserver((mutations) => {
            if (!this.isEnabled) return;
            
            let hasNewContent = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            hasNewContent = true;
                        }
                    });
                }
            });
            
            if (hasNewContent) {
                this.debounce(() => this.translateVisibleContent(), 500);
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    setupEventListeners() {
        // Language change events
        document.addEventListener('languageChanged', (e) => {
            this.handleLanguageChange(e.detail.language);
        });
        
        // Translation toggle events
        document.addEventListener('translationToggled', (e) => {
            this.handleTranslationToggle(e.detail.enabled);
        });
    }
    
    async handleLanguageChange(newLanguage) {
        console.log(`🔄 Language changed to: ${newLanguage}`);
        
        const oldLanguage = this.currentLanguage;
        this.currentLanguage = newLanguage;
        
        // Update UI language indicator
        this.showLanguageChangeIndicator(oldLanguage, newLanguage);
        
        // Load interface translations for new language
        await this.loadInterfaceTranslations(newLanguage);
        
        // Re-translate all content if translation is enabled
        if (this.isEnabled) {
            await this.translateVisibleContent(true);
        }
        
        // Update page language attributes
        document.documentElement.setAttribute('lang', newLanguage);
        document.documentElement.setAttribute('data-user-language', newLanguage);
        
        console.log(`✅ Language change complete: ${oldLanguage} → ${newLanguage}`);
    }
    
    async handleTranslationToggle(enabled) {
        console.log(`🔄 Translation ${enabled ? 'enabled' : 'disabled'}`);
        
        this.isEnabled = enabled;
        localStorage.setItem('translationEnabled', enabled.toString());
        
        if (enabled) {
            await this.translateVisibleContent(true);
            this.showNotification('🌐 Auto-translation enabled', 'success');
        } else {
            this.revertToOriginalContent();
            this.showNotification('🚫 Auto-translation disabled', 'info');
        }
    }
    
    async translateVisibleContent(force = false) {
        if (!this.isEnabled && !force) return;
        
        const elementsToTranslate = this.findTranslatableElements();
        console.log(`🔍 Found ${elementsToTranslate.length} elements to translate`);
        
        // Add to translation queue
        elementsToTranslate.forEach(element => {
            if (!this.loadingElements.has(element)) {
                this.translationQueue.push(element);
            }
        });
        
        // Process queue
        if (!this.isProcessingQueue) {
            await this.processTranslationQueue();
        }
    }
    
    findTranslatableElements() {
        const selectors = [
            '[data-translate]',
            '.task-title',
            '.goal-title',
            '.challenge-title',
            '.habit-name',
            '.notification-message',
            '.panel-header h2',
            '.setting-title',
            '.button-title',
            'h1, h2, h3',
            'p:not(.no-translate)',
            'label:not(.no-translate)',
            'span.translatable'
        ];
        
        const elements = [];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (this.shouldTranslateElement(element)) {
                    elements.push(element);
                }
            });
        });
        
        return elements;
    }
    
    shouldTranslateElement(element) {
        // Skip if already being translated
        if (this.loadingElements.has(element)) return false;
        
        // Skip if marked as no-translate
        if (element.classList.contains('no-translate') || 
            element.hasAttribute('translate') && element.getAttribute('translate') === 'no') {
            return false;
        }
        
        // Skip if empty or only whitespace
        const text = element.textContent.trim();
        if (!text || text.length < 2) return false;
        
        // Skip if contains only numbers or symbols
        if (/^[\d\s\W]+$/.test(text)) return false;
        
        // Skip if already translated or marked as original
        if (element.hasAttribute('data-translated') || 
            element.hasAttribute('data-original-text')) {
            return false;
        }
        
        return true;
    }
    
    async processTranslationQueue() {
        this.isProcessingQueue = true;
        
        while (this.translationQueue.length > 0) {
            const batch = this.translationQueue.splice(0, 5); // Process in batches of 5
            
            await Promise.all(batch.map(element => this.translateElement(element)));
            
            // Small delay between batches to prevent overwhelming the API
            if (this.translationQueue.length > 0) {
                await this.delay(200);
            }
        }
        
        this.isProcessingQueue = false;
    }
    
    async translateElement(element) {
        if (this.loadingElements.has(element)) return;
        
        try {
            this.loadingElements.add(element);
            
            const originalText = element.textContent.trim();
            
            // Store original text
            if (!element.hasAttribute('data-original-text')) {
                element.setAttribute('data-original-text', originalText);
            }
            
            // Show loading state
            this.showLoadingState(element);
            
            // Get translation
            const result = await this.translateText(originalText, this.currentLanguage);
            
            if (result.success && result.text !== originalText) {
                // Apply translation
                element.textContent = result.text;
                element.setAttribute('data-translated', 'true');
                element.setAttribute('data-translation-provider', result.provider || 'azure');
                
                // Add subtle animation
                element.style.transition = 'color 0.3s ease';
                element.style.color = 'var(--success-text)';
                setTimeout(() => {
                    element.style.color = '';
                }, 1000);
                
                console.log(`✅ Translated: "${originalText}" → "${result.text}"`);
            } else {
                // Translation failed or unchanged, revert to original
                element.textContent = originalText;
                console.log(`⚠️ Translation skipped: "${originalText}"`);
            }
            
        } catch (error) {
            console.error('Translation error:', error);
            // Revert to original text on error
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
            }
        } finally {
            this.hideLoadingState(element);
            this.loadingElements.delete(element);
        }
    }
    
    async translateText(text, targetLanguage, sourceLanguage = null) {
        try {
            const response = await fetch('../php/api/translation/translate.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    target_language: targetLanguage,
                    source_language: sourceLanguage
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Translation failed');
            }
            
            return data;
            
        } catch (error) {
            console.error('Translation API error:', error);
            return {
                success: false,
                text: text,
                error: error.message
            };
        }
    }
    
    showLoadingState(element) {
        element.classList.add('translating');
        
        // Add a subtle loading indicator
        const indicator = document.createElement('span');
        indicator.className = 'translation-indicator';
        indicator.innerHTML = '🌐';
        indicator.style.cssText = `
            font-size: 0.8em;
            opacity: 0.6;
            margin-left: 4px;
            animation: pulse 1s infinite;
        `;
        
        element.appendChild(indicator);
    }
    
    hideLoadingState(element) {
        element.classList.remove('translating');
        
        const indicator = element.querySelector('.translation-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showLanguageChangeIndicator(oldLang, newLang) {
        const indicator = document.createElement('div');
        indicator.className = 'language-change-indicator';
        indicator.innerHTML = `
            <div class="language-change-content">
                <span class="language-flag">${this.getLanguageFlag(newLang)}</span>
                <span class="language-text">Language changed to ${this.getLanguageName(newLang)}</span>
            </div>
        `;
        indicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--success-bg);
            color: var(--success-text);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--success-border);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px var(--shadow);
        `;
        
        document.body.appendChild(indicator);
        
        // Animate in
        setTimeout(() => {
            indicator.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            indicator.style.transform = 'translateX(400px)';
            setTimeout(() => indicator.remove(), 300);
        }, 3000);
    }
    
    revertToOriginalContent() {
        const translatedElements = document.querySelectorAll('[data-translated="true"]');
        
        translatedElements.forEach(element => {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
                element.removeAttribute('data-translated');
                element.removeAttribute('data-translation-provider');
            }
        });
        
        console.log(`🔄 Reverted ${translatedElements.length} elements to original content`);
    }
    
    getLanguageFlag(langCode) {
        const flags = {
            'en': '🇺🇸',
            'es': '🇪🇸',
            'fr': '🇫🇷',
            'de': '🇩🇪',
            'it': '🇮🇹',
            'pt': '🇵🇹',
            'ru': '🇷🇺',
            'ja': '🇯🇵',
            'ko': '🇰🇷',
            'zh': '🇨🇳'
        };
        return flags[langCode] || '🌐';
    }
    
    getLanguageName(langCode) {
        const names = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'it': 'Italiano',
            'pt': 'Português',
            'ru': 'Русский',
            'ja': '日本語',
            'ko': '한국어',
            'zh': '中文'
        };
        return names[langCode] || langCode.toUpperCase();
    }
    
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `translation-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            background: var(--${type}-bg);
            color: var(--${type}-text);
            border: 1px solid var(--${type}-border);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Utility functions
    debounce(func, wait) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(func, wait);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public API methods
    async switchLanguage(newLanguage) {
        if (newLanguage === this.currentLanguage) return;
        
        // Dispatch language change event
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: newLanguage }
        }));
    }
    
    toggleTranslation() {
        const newState = !this.isEnabled;
        
        // Dispatch translation toggle event
        document.dispatchEvent(new CustomEvent('translationToggled', {
            detail: { enabled: newState }
        }));
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    isTranslationEnabled() {
        return this.isEnabled;
    }
    
    async getUsageStats() {
        try {
            const response = await fetch('../php/api/translation/stats.php');
            return await response.json();
        } catch (error) {
            console.error('Failed to get usage stats:', error);
            return null;
        }
    }
}

// Initialize translation manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.habitusTranslator = new HabitusTranslationManager();
});

// Add CSS for translation animations
const style = document.createElement('style');
style.textContent = `
    .translating {
        opacity: 0.7;
        pointer-events: none;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }
    
    .language-change-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .translation-notification {
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);