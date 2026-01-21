import { useState } from 'react';
import { Languages, Loader2, ArrowRight } from 'lucide-react';

const Translator = () => {
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('en');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const languages = [
        { code: 'auto', name: 'Auto-detect' },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ar', name: 'Arabic' },
        { code: 'bn', name: 'Bengali' },
        { code: 'te', name: 'Telugu' },
        { code: 'mr', name: 'Marathi' },
        { code: 'ta', name: 'Tamil' },
        { code: 'ur', name: 'Urdu' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'kn', name: 'Kannada' },
        { code: 'or', name: 'Oriya' },
        { code: 'pa', name: 'Punjabi' },
        { code: 'as', name: 'Assamese' },
        { code: 'ml', name: 'Malayalam' },
    ];

    const translateText = async () => {
        if (!inputText.trim()) {
            setError('Please enter text to translate');
            return;
        }

        setLoading(true);
        setError('');
        setTranslatedText('');

        const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
        if (!apiKey) {
            setError('Google Translate API key not configured. Please add VITE_GOOGLE_TRANSLATE_API_KEY to your environment variables.');
            setLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams({
                key: apiKey,
                q: inputText,
                target: targetLang,
            });

            if (sourceLang !== 'auto') {
                params.append('source', sourceLang);
            }

            const response = await fetch(`https://translation.googleapis.com/language/translate/v2?${params}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Translation failed: ${response.statusText}`);
            }

            const data = await response.json();
            setTranslatedText(data.data.translations[0].translatedText);
        } catch (err) {
            console.error('Translation error:', err);
            setError('Failed to translate text. Please check your API key and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <Languages className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Text Translator</h3>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Language Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Source Language</label>
                        <select
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            {languages.filter(lang => lang.code !== 'auto').map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Input Text */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text to Translate</label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter text to translate..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Translate Button */}
                <button
                    onClick={translateText}
                    disabled={loading || !inputText.trim()}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Translating...
                        </>
                    ) : (
                        <>
                            <Languages className="w-5 h-5" />
                            Translate
                        </>
                    )}
                </button>

                {/* Translated Text */}
                {translatedText && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Translated Text</label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                            <p className="text-gray-900">{translatedText}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Translator;