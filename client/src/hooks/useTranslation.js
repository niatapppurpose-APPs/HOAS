import { useState, useEffect, useCallback } from 'react';

export const useTranslation = (toast) => {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        // Load language from localStorage or default to 'en'
        return localStorage.getItem('selectedLanguage') || 'en';
    });

    const languages = [
        { code: 'en', name: 'English (Reset)' },
        { code: 'hi', name: 'हिंदी (Hindi)' },
        { code: 'te', name: 'தెలుగు (Telugu)' },
        { code: 'ta', name: 'தமிழ் (Tamil)' },
        { code: 'es', name: 'Español (Spanish)' },
        { code: 'fr', name: 'Français (French)' },
        { code: 'de', name: 'Deutsch (German)' },
        { code: 'it', name: 'Italiano (Italian)' },
        { code: 'pt', name: 'Português (Portuguese)' },
        { code: 'ru', name: 'Русский (Russian)' },
        { code: 'ja', name: '日本語 (Japanese)' },
        { code: 'ko', name: '한국어 (Korean)' },
        { code: 'zh', name: '中文 (Chinese)' },
        { code: 'ar', name: 'العربية (Arabic)' },
        { code: 'bn', name: 'বাংলা (Bengali)' },
    ];

    // Helper function to get all text nodes
    const getAllTextNodes = (element) => {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip script, style, and other non-visible elements
                    const parent = node.parentElement;
                    if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip elements with notranslate class
                    if (parent && parent.classList.contains('notranslate')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip empty text nodes and very short text (but be more lenient)
                    const text = node.textContent.trim();
                    if (!text || text.length < 1) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip text that looks like code, URLs, or numbers only
                    if (/^[0-9\s+. ,:;()[\]{}]+$/.test(text) ||
                        /^https?:\/\//.test(text) ||
                        /^[a-zA-Z0-9_.-]+\.[a-zA-Z]{2,}/.test(text)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while ((node = walker.nextNode()) !== null) {
            textNodes.push(node);
        }

        return textNodes;
    };

    const translatePage = useCallback(async (language, showToasts = true) => {
        if (language === 'en') {
            // Reset to English - reload the page and clear stored language
            localStorage.removeItem('selectedLanguage');
            window.location.reload();
            return;
        }

        setCurrentLanguage(language);
        // Save selected language to localStorage
        localStorage.setItem('selectedLanguage', language);

        // Show loading indicator
        if (showToasts && toast) toast.info('Starting translation...', 2000);

        try {
            const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
            if (!apiKey) {
                if (showToasts && toast) toast.error('Google Translate API key not configured');
                return;
            }

            // Multiple translation passes to catch all text
            const maxPasses = 3;
            let totalTranslated = 0;

            for (let pass = 1; pass <= maxPasses; pass++) {

                // Get all text nodes on the page
                const textNodes = getAllTextNodes(document.body);
                const textsToTranslate = textNodes
                    .map(node => ({
                        node,
                        text: node.textContent.trim()
                    }))
                    .filter(item => item.text.length > 0 && item.text.length < 500) // Avoid very long texts
                    .filter(node => !node.translated) // Skip already translated nodes
                    .filter((item, index, arr) => arr.findIndex(i => i.text === item.text) === index); // Remove duplicates

                if (textsToTranslate.length === 0) {
                    break;
                }


                // Translate texts one by one to avoid API limits
                let translatedCount = 0;
                for (const item of textsToTranslate) {
                    try {
                        const params = new URLSearchParams({
                            key: apiKey,
                            q: item.text,
                            target: language,
                            source: 'en'
                        });

                        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?${params}`, {
                            method: 'POST',
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const translatedText = data.data.translations[0].translatedText;

                            // Replace text in the specific node
                            item.node.textContent = translatedText;
                            item.node.translated = true; // Mark as translated
                            translatedCount++;
                            totalTranslated++;

                            // Update progress every 10 translations
                            if (translatedCount % 10 === 0 && showToasts && toast) {
                                toast.info(`Pass ${pass}: Translated ${translatedCount}/${textsToTranslate.length} segments...`, 1000);
                            }
                        }
                    } catch (error) {
                        console.error('Error translating segment:', item.text, error);
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                }


                // Wait a bit between passes
                if (pass < maxPasses) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (showToasts && toast) toast.success(`Page translated to ${languages.find(l => l.code === language)?.name || language}! (${totalTranslated} segments)`);
        } catch (error) {
            console.error('Translation error:', error);
            if (showToasts && toast) toast.error('Failed to translate page. Please try again.');
        }
    }, [toast]);

    // Apply translation on mount if language is not English
    useEffect(() => {
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage && savedLanguage !== 'en') {
            setTimeout(() => {
                translatePage(savedLanguage, false); // false = don't show toasts
            }, 1000); // Delay to let page fully load
        }
    }, [translatePage]);

    return {
        currentLanguage,
        languages,
        translatePage
    };
};