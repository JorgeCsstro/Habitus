// js/translation-manager.js
/**
 * Enhanced Translation Manager for Habitus
 * Handles Azure Translator Service integration and UI translation
 */
(function() {
    'use strict';

    class HabitusTranslator {
        constructor() {
            this.currentLanguage = localStorage.getItem('userLanguage') || window.currentUserLanguage || 'en';
            this.autoTranslateEnabled = localStorage.getItem('translationEnabled') === 'true';
            this.translationCache = new Map();
            this.isTranslating = false;
            this.config = {
                endpoint: '/php/api/translation/translate.php',
                supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
                cacheExpiry: 24 * 60 * 60 * 1000
            };
            
            this.init();
        }

        init() {
            this.initializeLanguageSelector();
            this.initializeEventListeners();
            this.loadSavedTranslations();
            
            if (this.autoTranslateEnabled && this.currentLanguage !== 'en') {
                this.translatePage();
            }
            
            console.log('🌍 Habitus Translator initialized with language:', this.currentLanguage);
        }

        initializeLanguageSelector() {
            const languageSelector = document.getElementById('language-selector');
            if (languageSelector) {
                languageSelector.value = this.currentLanguage;
                
                // Add change event listener
                languageSelector.addEventListener('change', async (e) => {
                    const newLanguage = e.target.value;
                    await this.changeLanguage(newLanguage);
                });
            }
        }

        /**
         * Change language and update database
         * @param {string} languageCode - Target language code
         */
        async changeLanguage(languageCode) {
            const languageSelector = document.getElementById('language-selector');
            if (languageSelector && languageSelector.disabled) {
                return; // Already processing
            }
        
            console.log('🌐 Changing language to:', languageCode);
        
            if (languageSelector) {
                languageSelector.disabled = true;
                languageSelector.style.opacity = '0.7';
            }
        
            try {
                // REMOVED: Duplicate API call - let settings.js handle the database update
                // The settings.js changeLanguage function already handles the API call
                
                // Update local variables
                this.currentLanguage = languageCode;
                localStorage.setItem('userLanguage', languageCode);
                
                // Auto-translate if not English
                if (languageCode !== 'en') {
                    this.autoTranslateEnabled = true;
                    localStorage.setItem('translationEnabled', 'true');
                    await this.translatePage();
                } else {
                    // Restore original text if switching to English
                    this.restoreOriginalText();
                }
                
                // REMOVED: Duplicate notification - let settings.js handle the notification
                console.log('✅ Translation manager updated for language:', languageCode);
                
            } catch (error) {
                console.error('Translation manager language change error:', error);
                
                // Reset selector to previous value
                if (languageSelector) {
                    languageSelector.value = this.currentLanguage;
                }
                
                // Only show error notification from translation manager
                this.showNotification('❌ Translation error: ' + error.message, 'error');
            } finally {
                if (languageSelector) {
                    languageSelector.disabled = false;
                    languageSelector.style.opacity = '1';
                }
            }
        }

        /**
         * Get translatable elements - only those marked for translation
         */
        getTranslatableElements() {
            const elements = [];
            
            // Method 1: Elements with translate="yes" attribute
            document.querySelectorAll('[translate="yes"]').forEach(element => {
                if (this.shouldTranslateElement(element)) {
                    elements.push({
                        element: element,
                        text: this.getElementText(element),
                        type: this.getElementType(element)
                    });
                }
            });
            
            // Method 2: Elements with class="translate"
            document.querySelectorAll('.translate').forEach(element => {
                if (this.shouldTranslateElement(element)) {
                    elements.push({
                        element: element,
                        text: this.getElementText(element),
                        type: this.getElementType(element)
                    });
                }
            });
            
            return elements;
        }

        /**
         * Check if element should be translated
         */
        shouldTranslateElement(element) {
            // Skip if already translated
            if (element.classList.contains('translated')) {
                return false;
            }
            
            // Skip if no text content
            const text = this.getElementText(element);
            if (!text || text.trim().length === 0) {
                return false;
            }
            
            // Skip if text is too short (likely not meaningful)
            if (text.trim().length < 2) {
                return false;
            }
            
            // Skip if element is hidden
            if (element.offsetParent === null) {
                return false;
            }
            
            return true;
        }

        /**
         * Get text from element based on type
         */
        getElementText(element) {
            if (element.hasAttribute('placeholder')) {
                return element.placeholder;
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                return element.value;
            } else {
                // Extract all text content from text nodes, ignoring HTML elements
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let textParts = [];
                let node;

                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text) {
                        textParts.push(text);
                    }
                }

                return textParts.join(' ').trim();
            }
        }

        /**
         * Get element type for proper handling
         */
        getElementType(element) {
            if (element.hasAttribute('placeholder')) {
                return 'placeholder';
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                return 'input';
            } else {
                return 'text';
            }
        }

        /**
         * Translate the entire page
         */
        async translatePage() {
            if (this.isTranslating || this.currentLanguage === 'en') {
                return;
            }

            this.isTranslating = true;
            this.showLoadingIndicator();

            try {
                const translatableElements = this.getTranslatableElements();
                
                if (translatableElements.length > 0) {
                    console.log(`🌍 Translating ${translatableElements.length} elements to ${this.currentLanguage}`);
                    await this.translateBatch(translatableElements);
                }
            } catch (error) {
                console.error('Translation error:', error);
                this.showNotification('Translation failed. Please try again.', 'error');
            } finally {
                this.isTranslating = false;
                this.hideLoadingIndicator();
            }
        }

        /**
         * Translate elements in batches
         */
        async translateBatch(elements) {
            const batchSize = 10; // Process 10 elements at a time
            
            for (let i = 0; i < elements.length; i += batchSize) {
                const batch = elements.slice(i, i + batchSize);
                const promises = batch.map(item => this.translateElement(item));
                
                try {
                    await Promise.all(promises);
                    // Small delay between batches to avoid overwhelming the API
                    if (i + batchSize < elements.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (error) {
                    console.error('Batch translation error:', error);
                }
            }
        }

        /**
         * Translate individual element
         */
        async translateElement(item) {
            const { element, text, type } = item;
            
            try {
                // Check cache first
                const cacheKey = `${text}_${this.currentLanguage}`;
                if (this.translationCache.has(cacheKey)) {
                    const cachedTranslation = this.translationCache.get(cacheKey);
                    this.applyTranslation(element, text, cachedTranslation, type);
                    return;
                }

                // Call translation API
                const response = await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        text: text,
                        targetLanguage: this.currentLanguage,
                        sourceLanguage: 'en'
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success && data.translatedText) {
                    // Cache the translation
                    this.translationCache.set(cacheKey, data.translatedText);
                    
                    // Apply translation
                    this.applyTranslation(element, text, data.translatedText, type);
                }
                
            } catch (error) {
                console.error('Element translation error:', error);
                // Mark as translated even if failed to avoid retrying
                element.classList.add('translated');
            }
        }

        /**
         * Apply translation to element
         */
        applyTranslation(element, originalText, translatedText, type) {
            // Store original text
            element.setAttribute('data-original-text', originalText);

            // Apply translation based on element type
            switch (type) {
                case 'placeholder':
                    element.placeholder = translatedText;
                    break;
                case 'input':
                    element.value = translatedText;
                    break;
                case 'text':
                default:
                    // Find and replace only text nodes, preserving HTML elements
                    this.replaceTextNodes(element, originalText, translatedText);
                    break;
            }

            // Mark as translated
            element.classList.add('translated');
        }

        /**
         * Replace text nodes while preserving HTML elements and their positions
         */
        replaceTextNodes(element, originalText, translatedText) {
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let textNodes = [];
            let node;

            // Collect all non-empty text nodes
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                if (text) {
                    textNodes.push({
                        node: node,
                        originalText: text
                    });
                }
            }

            if (textNodes.length === 0) return;

            // If there's only one text node, replace it directly
            if (textNodes.length === 1) {
                textNodes[0].node.textContent = translatedText;
                return;
            }

            // For multiple text nodes, find the one with the most content
            // and replace it, while clearing the others
            let mainTextNode = textNodes[0];
            let maxLength = textNodes[0].originalText.length;

            for (let i = 1; i < textNodes.length; i++) {
                if (textNodes[i].originalText.length > maxLength) {
                    maxLength = textNodes[i].originalText.length;
                    mainTextNode = textNodes[i];
                }
            }

            // Replace the main text node with translation
            mainTextNode.node.textContent = translatedText;

            // Clear other text nodes
            textNodes.forEach(textNode => {
                if (textNode !== mainTextNode) {
                    textNode.node.textContent = '';
                }
            });
        }

        /**
         * Restore original text
         */
        restoreOriginalText() {
            document.querySelectorAll('.translated').forEach(element => {
                const originalText = element.getAttribute('data-original-text');

                if (originalText) {
                    if (element.hasAttribute('placeholder')) {
                        element.placeholder = originalText;
                    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.value = originalText;
                    } else {
                        // Restore text nodes while preserving HTML
                        this.restoreTextNodes(element, originalText);
                    }

                    element.removeAttribute('data-original-text');
                    element.classList.remove('translated');
                }
            });
        }

        /**
         * Restore original text in text nodes
         */
        restoreTextNodes(element, originalText) {
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let textNodes = [];
            let node;
            
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            if (textNodes.length === 0) return;
            
            // Find the text node that currently has content (the translated one)
            let activeTextNode = null;
            for (let textNode of textNodes) {
                if (textNode.textContent.trim()) {
                    activeTextNode = textNode;
                    break;
                }
            }
            
            if (activeTextNode) {
                // Restore original text to the active node
                activeTextNode.textContent = originalText;
                
                // Clear any other text nodes
                textNodes.forEach(textNode => {
                    if (textNode !== activeTextNode && !textNode.textContent.trim()) {
                        textNode.textContent = '';
                    }
                });
            } else {
                // Fallback: restore to first text node
                textNodes[0].textContent = originalText;
            }
        }

        /**
         * Show loading indicator
         */
        showLoadingIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'translation-loading';
            indicator.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: var(--primary-color); 
                            color: white; padding: 10px 15px; border-radius: 5px; z-index: 10000; 
                            font-size: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    🌍 Translating page...
                </div>
            `;
            document.body.appendChild(indicator);
        }

        /**
         * Hide loading indicator
         */
        hideLoadingIndicator() {
            const indicator = document.getElementById('translation-loading');
            if (indicator) {
                indicator.remove();
            }
        }

        /**
         * Show notification
         */
        showNotification(message, type = 'info') {
            // Use your existing notification system
            if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }

        /**
         * Get language name
         */
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

        /**
         * Initialize event listeners for dynamic content
         */
        initializeEventListeners() {
            // Listen for dynamic content changes
            const observer = new MutationObserver((mutations) => {
                if (this.autoTranslateEnabled && this.currentLanguage !== 'en' && !this.isTranslating) {
                    let hasNewTranslatableContent = false;
                    
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check if the added node or its children have translatable elements
                                const hasTranslatable = node.querySelector?.('[translate="yes"], .translate') || 
                                                       node.hasAttribute?.('translate') || 
                                                       node.classList?.contains('translate');
                                
                                if (hasTranslatable) {
                                    hasNewTranslatableContent = true;
                                }
                            }
                        });
                    });
                    
                    if (hasNewTranslatableContent) {
                        // Debounce to avoid excessive translations
                        clearTimeout(this.translationTimeout);
                        this.translationTimeout = setTimeout(() => {
                            this.translatePage();
                        }, 500);
                    }
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        /**
         * Load saved translations from localStorage
         */
        loadSavedTranslations() {
            try {
                const saved = localStorage.getItem('translationCache');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.translationCache = new Map(parsed);
                }
            } catch (error) {
                console.error('Error loading saved translations:', error);
            }
        }

        /**
         * Save translations to localStorage
         */
        saveTranslations() {
            try {
                const serialized = JSON.stringify([...this.translationCache]);
                localStorage.setItem('translationCache', serialized);
            } catch (error) {
                console.error('Error saving translations:', error);
            }
        }
    }

    // Initialize the translator when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        window.habitusTranslator = new HabitusTranslator();
    });

    // Save translations before page unload
    window.addEventListener('beforeunload', function() {
        if (window.habitusTranslator) {
            window.habitusTranslator.saveTranslations();
        }
    });

})();