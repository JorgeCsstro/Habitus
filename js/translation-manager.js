/**
 * Translation Manager for Habitus Zone
 * Handles Azure Translator Service integration and UI translation
 */
(function() {
    'use strict';

    class HabitusTranslator {
        constructor() {
            this.currentLanguage = localStorage.getItem('userLanguage') || 'en';
            this.autoTranslateEnabled = localStorage.getItem('translationEnabled') === 'true';
            this.translationCache = new Map();
            this.isTranslating = false;
            this.config = {
                endpoint: '/php/api/translation/translate.php',  // Make sure this matches your file path
                supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
                cacheExpiry: 24 * 60 * 60 * 1000
            };
            
            this.init();
        }

        init() {
            this.loadLanguageSelector();
            this.initializeEventListeners();
            this.loadSavedTranslations();
            
            if (this.autoTranslateEnabled && this.currentLanguage !== 'en') {
                this.translatePage();
            }
            
            console.log('🌍 Habitus Translator initialized');
        }

        loadLanguageSelector() {
            const languageSelector = document.getElementById('language-selector');
            if (languageSelector) {
                languageSelector.value = this.currentLanguage;
                languageSelector.addEventListener('change', (e) => {
                    this.changeLanguage(e.target.value);
                });
            }
        }

        initializeEventListeners() {
            // Listen for dynamic content changes
            const observer = new MutationObserver((mutations) => {
                if (this.autoTranslateEnabled && this.currentLanguage !== 'en') {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            this.translateNewContent(mutation.addedNodes);
                        }
                    });
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Handle page visibility changes
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && this.autoTranslateEnabled) {
                    this.refreshTranslations();
                }
            });
        }

        async changeLanguage(newLanguage) {
            if (!this.config.supportedLanguages.includes(newLanguage)) {
                console.warn('Unsupported language:', newLanguage);
                return;
            }

            const previousLanguage = this.currentLanguage;
            this.currentLanguage = newLanguage;
            localStorage.setItem('userLanguage', newLanguage);

            // Update server preference
            await this.updateServerLanguagePreference(newLanguage);

            if (newLanguage === 'en') {
                this.restoreOriginalText();
            } else {
                await this.translatePage();
            }
        }

        async translatePage() {
            if (this.isTranslating) return;
            
            this.isTranslating = true;
            this.showTranslationProgress(true);

            try {
                const translatableElements = this.getTranslatableElements();
                const translationBatches = this.createTranslationBatches(translatableElements);

                for (const batch of translationBatches) {
                    await this.translateBatch(batch);
                    // Small delay between batches to prevent rate limiting
                    await this.delay(100);
                }

            } catch (error) {
                console.error('Translation failed:', error);
            } finally {
                this.isTranslating = false;
                this.showTranslationProgress(false);
            }
        }

        getTranslatableElements() {
            const elements = [];
            const selectors = [
                'h1, h2, h3, h4, h5, h6',
                'p',
                'span:not(.no-translate)',
                'button:not(.no-translate)',
                'label',
                'th, td',
                '[data-translate]',
                '.translatable'
            ];

            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(element => {
                    if (this.shouldTranslateElement(element)) {
                        elements.push({
                            element: element,
                            originalText: element.textContent.trim(),
                            type: this.getElementType(element)
                        });
                    }
                });
            });

            return elements;
        }

        shouldTranslateElement(element) {
            // Skip if element has no text content
            if (!element.textContent.trim()) return false;
            
            // Skip if marked as no-translate
            if (element.classList.contains('no-translate') || 
                element.hasAttribute('data-no-translate')) return false;
            
            // Skip if parent is marked as no-translate
            if (element.closest('.no-translate, [data-no-translate]')) return false;
            
            // Skip if contains only numbers, dates, or special characters
            if (/^[\d\s\-\/\.,!@#$%^&*()_+=\[\]{}|;:'"<>?`~]*$/.test(element.textContent.trim())) return false;
            
            // Skip if text is very short (less than 3 characters)
            if (element.textContent.trim().length < 3) return false;
            
            // Skip if element contains only child elements (no direct text)
            if (element.children.length > 0 && !element.textContent.trim()) return false;
            
            return true;
        }

        getElementType(element) {
            if (element.tagName.match(/^H[1-6]$/)) return 'heading';
            if (element.tagName === 'BUTTON') return 'button';
            if (element.tagName === 'LABEL') return 'label';
            if (element.hasAttribute('placeholder')) return 'placeholder';
            return 'text';
        }

        createTranslationBatches(elements, batchSize = 10) {
            const batches = [];
            for (let i = 0; i < elements.length; i += batchSize) {
                batches.push(elements.slice(i, i + batchSize));
            }
            return batches;
        }

        async translateBatch(batch) {
            const translations = await Promise.all(
                batch.map(item => this.translateText(item.originalText))
            );

            batch.forEach((item, index) => {
                if (translations[index] && translations[index] !== item.originalText) {
                    this.applyTranslation(item.element, translations[index], item.originalText);
                }
            });
        }

        async translateText(text) {
            // Check cache first
            const cacheKey = `${this.currentLanguage}:${text}`;
            const cached = this.translationCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
                return cached.translation;
            }
        
            try {
                console.log('🔄 Translating:', { text, target: this.currentLanguage, endpoint: this.config.endpoint });

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
            
                console.log('📡 Response status:', response.status, response.statusText);

                // Get response as text first to debug
                const responseText = await response.text();
                console.log('📄 Raw response:', responseText);
            
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}\nResponse: ${responseText}`);
                }
            
                // Check if response is actually JSON
                if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
                    throw new Error(`Server returned HTML instead of JSON. Response: ${responseText.substring(0, 200)}...`);
                }
            
                const result = JSON.parse(responseText);

                if (result.success && result.translatedText) {
                    // Cache the translation
                    this.translationCache.set(cacheKey, {
                        translation: result.translatedText,
                        timestamp: Date.now()
                    });

                    console.log('✅ Translation successful:', result.translatedText);
                    return result.translatedText;
                } else {
                    throw new Error(result.error || 'Translation failed');
                }

            } catch (error) {
                console.error('❌ Translation API error:', error);

                // Show user-friendly error
                if (error.message.includes('HTML instead of JSON')) {
                    console.error('🚨 Server configuration issue - check PHP endpoint');
                }

                return text; // Return original text on error
            }
        }

        applyTranslation(element, translatedText, originalText) {
            // Store original text for restoration
            if (!element.hasAttribute('data-original-text')) {
                element.setAttribute('data-original-text', originalText);
            }
            
            // Apply translation
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translatedText;
            } else {
                element.textContent = translatedText;
            }
            
            // Mark as translated
            element.classList.add('translated');
        }

        restoreOriginalText() {
            document.querySelectorAll('[data-original-text]').forEach(element => {
                const originalText = element.getAttribute('data-original-text');
                
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = originalText;
                } else {
                    element.textContent = originalText;
                }
                
                element.removeAttribute('data-original-text');
                element.classList.remove('translated');
            });
        }

        async translateNewContent(nodes) {
            const newElements = [];
            
            nodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const translatableElements = this.getTranslatableElements();
                    translatableElements.forEach(item => {
                        if (node.contains(item.element) || node === item.element) {
                            newElements.push(item);
                        }
                    });
                }
            });

            if (newElements.length > 0) {
                await this.translateBatch(newElements);
            }
        }

        toggleTranslation() {
            this.autoTranslateEnabled = !this.autoTranslateEnabled;
            localStorage.setItem('translationEnabled', this.autoTranslateEnabled.toString());
            
            if (this.autoTranslateEnabled && this.currentLanguage !== 'en') {
                this.translatePage();
            } else if (!this.autoTranslateEnabled) {
                this.restoreOriginalText();
            }
        }

        async updateServerLanguagePreference(language) {
            try {
                await fetch('/php/api/user/update_settings.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        setting: 'preferred_language',
                        value: language
                    })
                });
            } catch (error) {
                console.error('Failed to update server language preference:', error);
            }
        }

        loadSavedTranslations() {
            try {
                const saved = localStorage.getItem('translationCache');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.translationCache = new Map(parsed);
                }
            } catch (error) {
                console.error('Failed to load translation cache:', error);
                this.translationCache = new Map();
            }
        }

        saveTranslationsToCache() {
            try {
                const cacheArray = Array.from(this.translationCache.entries());
                localStorage.setItem('translationCache', JSON.stringify(cacheArray));
            } catch (error) {
                console.error('Failed to save translation cache:', error);
            }
        }

        refreshTranslations() {
            if (this.currentLanguage !== 'en') {
                this.translatePage();
            }
        }

        getLanguageName(code) {
            const names = {
                'en': 'English',
                'es': 'Español',
                'fr': 'Français',
                'de': 'Deutsch',
                'it': 'Italiano',
                'pt': 'Português',
                'ru': 'Русский',
                'zh': '中文',
                'ja': '日本語',
                'ko': '한국어'
            };
            return names[code] || code;
        }

        showTranslationProgress(show) {
            let progressIndicator = document.getElementById('translation-progress');
            
            if (show && !progressIndicator) {
                progressIndicator = document.createElement('div');
                progressIndicator.id = 'translation-progress';
                progressIndicator.innerHTML = `
                    <div class="translation-progress-content">
                        <div class="spinner"></div>
                        <span>Translating page...</span>
                    </div>
                `;
                progressIndicator.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #007bff;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                document.body.appendChild(progressIndicator);
            } else if (!show && progressIndicator) {
                progressIndicator.remove();
            }
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Cleanup method
        destroy() {
            this.saveTranslationsToCache();
            this.restoreOriginalText();
        }
    }

    // Initialize and expose globally
    window.habitusTranslator = new HabitusTranslator();
    
    // Save translations before page unload
    window.addEventListener('beforeunload', () => {
        if (window.habitusTranslator) {
            window.habitusTranslator.saveTranslationsToCache();
        }
    });

})();